import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import { AnalyticsSparkline } from "@/components/dashboard/analytics-sparkline";
import { StatCard, BreakdownList } from "@/components/dashboard/analytics-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  countBy,
  cleanReferrer,
  clicksByDay,
  uniqueVisitorCount,
} from "@/lib/analytics-helpers";

type ClickRow = {
  visitor_id: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  referrer: string | null;
  created_at: string;
};

export const metadata = { title: "Link Analytics" };

export default async function LinkAnalyticsPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Fetch the link — RLS ensures it belongs to this user
  const { data: link } = await supabase
    .from("links")
    .select("id, title, url, profile_id")
    .eq("id", linkId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!link) notFound();

  const { data: clickRowsRaw } = await supabase
    .from("click_events")
    .select("visitor_id, country, device_type, browser, referrer, created_at")
    .eq("link_id", linkId);

  const clicks = (clickRowsRaw ?? []) as ClickRow[];

  const totalClicks = clicks.length;
  const uniqueVisitors = uniqueVisitorCount(clicks);
  const dailyClicks = clicksByDay(clicks, 30);

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

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {/* Link header */}
      <div>
        <h1 className="text-xl font-semibold truncate">{link.title}</h1>
        <p className="text-sm text-muted-foreground truncate">{link.url}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total clicks" value={totalClicks} />
        <StatCard label="Unique visitors" value={uniqueVisitors} />
        <StatCard label="Last 30 days" value={clicksByDay(clicks, 30).reduce((s, d) => s + d.count, 0)} />
      </div>

      {totalClicks > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Click activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
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
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No clicks yet. Share your link to start collecting data.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
