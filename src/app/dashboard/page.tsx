import { redirect } from "next/navigation";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/queries";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { LinksManager } from "@/components/dashboard/links-manager";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { SocialsManager } from "@/components/dashboard/socials-manager";
import { SectionsManager } from "@/components/dashboard/sections-manager";
import { CustomDesignForm } from "@/components/dashboard/custom-design-form";
import { CustomDomainForm } from "@/components/dashboard/custom-domain-form";
import { AnalyticsSparkline } from "@/components/dashboard/analytics-sparkline";
import { StatCard, BreakdownList } from "@/components/dashboard/analytics-cards";
import { parseSocials } from "@/lib/socials";
import { canonicalizeUrl } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Link as LinkRow, LinkSection } from "@/lib/database.types";
import {
  countBy,
  uniqueVisitorCount,
  cleanReferrer,
  clicksByDay,
} from "@/lib/analytics-helpers";
import { isConnectReady } from "@/lib/stripe-connect";
import { getPlanAccess } from "@/lib/admin-access";

export const metadata = { title: "Dashboard" };

type ClickRow = {
  link_id: string;
  visitor_id: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
  created_at: string;
};

type PageViewRow = {
  visitor_id: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");
  const access = await getPlanAccess(profile, user.email);
  const pro = access.hasProAccess;
  const payoutsReady = isConnectReady(profile);

  const supabase = await createClient();

  const analyticsCutoff = new Date();
  analyticsCutoff.setDate(analyticsCutoff.getDate() - 30);
  const cutoffIso = analyticsCutoff.toISOString();

  const [
    { data: linksRaw },
    { data: pageViewsRaw },
    { data: clickRowsRaw },
    { data: sectionsRaw },
  ] = await Promise.all([
    supabase
      .from("links")
      .select("*")
      .eq("profile_id", user.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("page_views")
      .select("visitor_id, created_at")
      .eq("profile_id", user.id)
      .gte("created_at", cutoffIso),
    supabase
      .from("click_events")
      .select(
        "link_id, visitor_id, country, device_type, browser, referrer, created_at",
      )
      .gte("created_at", cutoffIso),
    supabase
      .from("link_sections")
      .select("*")
      .eq("profile_id", user.id)
      .order("position", { ascending: true }),
  ]);

  const links: LinkRow[] = linksRaw ?? [];
  const pageViews = (pageViewsRaw ?? []) as PageViewRow[];
  const clicks = (clickRowsRaw ?? []) as ClickRow[];
  const sections: LinkSection[] = sectionsRaw ?? [];

  const lockedDestinations = links
    .filter((l) => l.is_locked)
    .map((l) => canonicalizeUrl(l.url))
    .filter((c): c is string => c !== null);

  const clickCounts: Record<string, number> = {};
  for (const row of clicks) {
    clickCounts[row.link_id] = (clickCounts[row.link_id] ?? 0) + 1;
  }

  const totalViews = pageViews.length;
  const totalClicks = clicks.length;
  const uniqueVisitors = uniqueVisitorCount([...pageViews, ...clicks]);

  const topCountries = countBy(clicks, "country");
  const topDevices = countBy(clicks, "device_type");
  const topBrowsers = countBy(clicks, "browser");
  const topReferrers = countBy(
    clicks.map((r) => ({ ...r, referrer: cleanReferrer(r.referrer) })),
    "referrer",
  );
  const hasEnrichedData =
    topCountries.length > 0 ||
    topDevices.length > 0 ||
    topBrowsers.length > 0 ||
    topReferrers.length > 0;

  const dailyClicks = clicksByDay(clicks, 30);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Page views" value={totalViews} />
        <StatCard label="Total clicks" value={totalClicks} />
        <StatCard label="Unique visitors" value={uniqueVisitors} />
        <StatCard label="Links" value={links.length} />
      </div>

      {totalClicks > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Last 30 days of click data</CardDescription>
            </div>
            {pro ? (
              <NextLink
                href="/api/analytics/export"
                prefetch={false}
                className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
              >
                Export CSV
              </NextLink>
            ) : (
              <NextLink
                href="/dashboard/billing"
                className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
              >
                Export CSV (Pro)
              </NextLink>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <AnalyticsSparkline data={dailyClicks} />
            {hasEnrichedData ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <BreakdownList title="Top countries" rows={topCountries} />
                <BreakdownList title="Devices" rows={topDevices} />
                <BreakdownList title="Browsers" rows={topBrowsers} />
                <BreakdownList title="Referrers" rows={topReferrers} />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Detailed breakdowns will appear once new clicks are recorded.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is what visitors see at the top of your page.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            userId={user.id}
            displayName={profile.display_name}
            bio={profile.bio}
            avatarUrl={profile.avatar_url}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social icons</CardTitle>
          <CardDescription>A row of icons under your name linking to your other profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          <SocialsManager
            initial={parseSocials(profile.socials)}
            lockedDestinations={lockedDestinations}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Pick a theme preset for your public page.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePicker current={profile.theme} isPro={pro} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom design</CardTitle>
          <CardDescription>
            Override colours, pick a font, or inject custom CSS on top of your theme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomDesignForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Link sections</CardTitle>
          <CardDescription>
            Group your links into collapsible sections on your public page (e.g. Work, Personal, Resources).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionsManager sections={sections} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom domain</CardTitle>
          <CardDescription>
            Point your own domain to your profile page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomDomainForm currentDomain={profile.custom_domain ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
          <CardDescription>
            Add, edit, delete, and drag to reorder. Use the section dropdown in each link&apos;s edit form to assign it to a section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinksManager
            links={links}
            clickCounts={clickCounts}
            sections={sections}
            payoutsReady={payoutsReady}
          />
        </CardContent>
      </Card>
    </div>
  );
}
