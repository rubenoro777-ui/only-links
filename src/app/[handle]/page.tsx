import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfileByHandle, getCurrentUser } from "@/lib/queries";
import { canSelectTheme, DEFAULT_THEME_ID, getTheme, renderThemeSceneCss } from "@/lib/themes";
import { parseSocials, getPlatform, hrefFor } from "@/lib/socials";
import { SITE_NAME, getSiteUrl } from "@/lib/site";
import { parseUA, hashVisitorId, extractIp } from "@/lib/analytics";
import {
  effectiveSubscriptionStatus,
  readPreviewPlan,
  PREVIEW_PLAN_COOKIE,
} from "@/lib/admin";
import { sanitizeCssValue, neutralizeStyleBreakout, canonicalizeUrl } from "@/lib/utils";
import { ShareBar } from "@/components/sharebar";
import type { Link as LinkRow } from "@/lib/database.types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfileByHandle(handle);
  if (!data) return { title: "Not found" };
  const name = data.profile.display_name || `@${data.profile.handle}`;
  const description = data.profile.bio ?? `${name} on ${SITE_NAME}`;
  const images = data.profile.avatar_url ? [data.profile.avatar_url] : undefined;
  return {
    title: `${name} (@${data.profile.handle})`,
    description,
    alternates: { canonical: `/${data.profile.handle}` },
    openGraph: { type: "profile", title: name, description, url: `/${data.profile.handle}`, siteName: SITE_NAME, images },
    twitter: { card: "summary", title: name, description, images },
  };
}

function googleFontUrl(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700&display=swap`;
}

function LinkButton({ link }: { link: LinkRow }) {
  const domain = (() => { try { return new URL(link.url).hostname; } catch { return null; } })();
  const faviconSrc = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : null;
  const price = link.is_locked && link.price_cents ? `$${(link.price_cents / 100).toFixed(2)}` : null;
  const href = link.is_locked ? `/unlock/${link.id}` : `/l/${link.id}`;

  return (
    <a
      href={href}
      target={link.is_locked ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="ol-link relative flex w-full items-center gap-3 px-5 py-3 text-sm font-medium"
    >
      {/* Fixed-width left slot — favicon or lock */}
      <span className="flex size-4 shrink-0 items-center justify-center">
        {link.is_locked ? (
          <span aria-hidden="true" className="text-sm">&#x1F512;</span>
        ) : faviconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={faviconSrc} alt="" aria-hidden="true" width={16} height={16} className="size-4 rounded-sm" />
        ) : null}
      </span>

      {/* Centered title */}
      <span className="flex-1 text-center">{link.title}</span>

      {/* Fixed-width right slot — price or arrow */}
      <span className="flex size-4 shrink-0 items-center justify-center text-xs opacity-40">
        {price ? (
          <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs opacity-100 whitespace-nowrap">{price}</span>
        ) : (
          "→"
        )}
      </span>
    </a>
  );
}

export default async function PublicProfilePage({ params }: Params) {
  const { handle } = await params;
  const data = await getPublicProfileByHandle(handle);
  if (!data) notFound();

  const { profile, links, sections } = data;

  const viewer = await getCurrentUser();
  const viewerIsProfileOwner = viewer?.id === profile.id;
  const cookieStore = await cookies();
  const previewPlan = viewerIsProfileOwner
    ? readPreviewPlan(cookieStore.get(PREVIEW_PLAN_COOKIE)?.value)
    : "owner";
  const publicPlanStatus = viewerIsProfileOwner
    ? effectiveSubscriptionStatus({
        profile,
        email: viewer?.email,
        previewPlan,
      })
    : profile.subscription_status === "pro"
      ? "pro"
      : "free";

  const theme = getTheme(
    canSelectTheme({
      themeId: profile.theme,
      subscriptionStatus: publicPlanStatus,
    })
      ? profile.theme
      : DEFAULT_THEME_ID,
  );
  const showBranding = publicPlanStatus !== "pro";
  const pageUrl = `${getSiteUrl()}/${profile.handle}`;

  // Paywall-bypass prevention: a locked link hides its destination behind the
  // /unlock flow, so a social icon pointing to that same destination would leak
  // it for free. Drop any colliding social here, server-side, so the URL never
  // appears in the rendered HTML (safe against view-source / inspector).
  const lockedDestinations = new Set(
    links
      .filter((l) => l.is_locked)
      .map((l) => canonicalizeUrl(l.url))
      .filter((c): c is string => c !== null),
  );
  const socials = parseSocials(profile.socials).filter((s) => {
    if (getPlatform(s.platform)?.kind === "email") return true;
    const c = canonicalizeUrl(s.url);
    return c === null || !lockedDestinations.has(c);
  });

  const supabase = await createClient();
  try {
    const reqHeaders = await headers();
    const ua = reqHeaders.get("user-agent");
    const ip = extractIp(reqHeaders);
    const { device_type } = parseUA(ua);
    const visitor_id = await hashVisitorId(ip, ua);
    await supabase.from("page_views").insert({
      profile_id: profile.id,
      visitor_id,
      referrer: reqHeaders.get("referer"),
      country: reqHeaders.get("x-vercel-ip-country"),
      device_type,
    });
  } catch { /* Swallow logging errors */ }

  // Re-sanitize on read as well: values persisted before write-time
  // sanitization (or via any other path) must not break out of <style>.
  const customBg = sanitizeCssValue(profile.custom_bg, 200);
  const customAccent = sanitizeCssValue(profile.custom_accent, 200);
  const customText = sanitizeCssValue(profile.custom_text, 200);
  const customFont = sanitizeCssValue(profile.custom_font, 100);
  const customCss = sanitizeCssValue(profile.custom_css, 5000);
  const fontFamily = customFont ? `'${customFont}', system-ui, sans-serif` : null;

  const css = `
    .ol-page {
      background: ${customBg ?? theme.background};
      color: ${customText ?? theme.text};
      position: relative;
      overflow: hidden;
      ${fontFamily ? `font-family: ${fontFamily};` : ""}
    }
    ${renderThemeSceneCss(theme)}
    .ol-avatar { box-shadow: 0 0 0 3px ${theme.ring}; }
    .ol-muted { color: ${theme.muted}; }
    .ol-link {
      background: ${customAccent ?? theme.buttonBg};
      color: ${theme.buttonText};
      border: ${theme.buttonBorder};
      border-radius: ${theme.buttonRadius};
      box-shadow: ${theme.buttonShadow};
      ${theme.backdrop ? `backdrop-filter: ${theme.backdrop}; -webkit-backdrop-filter: ${theme.backdrop};` : ""}
      transition: transform 0.12s ease, opacity 0.12s ease;
    }
    .ol-link:hover {
      background: ${customAccent ? customAccent : theme.buttonHoverBg};
      filter: ${customAccent ? "brightness(1.08)" : "none"};
      ${theme.buttonHoverText ? `color: ${theme.buttonHoverText};` : ""}
      transform: translateY(-1px);
      opacity: 0.92;
    }
    .ol-link:active { transform: translateY(0); opacity: 1; }
    .ol-social {
      color: ${customText ?? theme.text};
      opacity: 0.65;
      transition: opacity 0.12s ease, transform 0.12s ease;
    }
    .ol-social:hover { opacity: 1; transform: translateY(-1px); }
    /* Sections */
    .ol-section { width: 100%; }
    .ol-section-summary {
      cursor: pointer; list-style: none;
      padding: 0.5rem 0.25rem;
      font-size: 0.7rem; font-weight: 600;
      letter-spacing: 0.07em; text-transform: uppercase;
      opacity: 0.5; user-select: none;
    }
    .ol-section-summary::-webkit-details-marker { display: none; }
    .ol-section-summary::before { content: "\\25B6  "; font-size: 0.55rem; }
    details[open] .ol-section-summary::before { content: "\\25BC  "; }
    .ol-section-links { padding-top: 0.5rem; display: flex; flex-direction: column; gap: 0.625rem; }
    /* Share bar */
    .ol-sharebar { opacity: 0.5; transition: opacity 0.15s ease; }
    .ol-sharebar:hover { opacity: 1; }
    .ol-share-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 9999px;
      color: inherit;
      transition: background 0.12s ease;
    }
    .ol-share-btn:hover { background: rgba(128,128,128,0.12); }
    ${customCss ?? ""}
  `;

  const unsectioned = links.filter((l) => !l.section_id);
  const sectionedMap = new Map<string, LinkRow[]>();
  for (const section of sections) {
    sectionedMap.set(section.id, links.filter((l) => l.section_id === section.id));
  }
  const hasSections = sections.some((s) => (sectionedMap.get(s.id)?.length ?? 0) > 0);

  const displayName = profile.display_name || `@${profile.handle}`;
  const initial = displayName.replace(/^@/, "").charAt(0).toUpperCase() || "?";

  return (
    <main className="ol-page flex min-h-dvh w-full flex-col items-center px-5 py-14">
      {customFont && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={googleFontUrl(customFont)} />
      )}
      <style dangerouslySetInnerHTML={{ __html: neutralizeStyleBreakout(css) }} />

      <div className="flex w-full max-w-md flex-1 flex-col items-center">
        <div className="ol-avatar size-24 overflow-hidden rounded-full">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={displayName} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center rounded-full bg-black/10 text-3xl font-semibold">
              {initial}
            </div>
          )}
        </div>

        <h1 className="mt-5 text-center text-xl font-bold tracking-tight">{displayName}</h1>
        {profile.bio && (
          <p className="ol-muted mt-2 max-w-sm text-balance text-center text-sm">{profile.bio}</p>
        )}

        {socials.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
            {socials.map((social, i) => {
              const platform = getPlatform(social.platform);
              if (!platform) return null;
              const Icon = platform.Icon;
              return (
                <a
                  key={`${social.platform}-${i}`}
                  href={hrefFor(social)}
                  target={platform.kind === "email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={platform.label}
                  className="ol-social inline-flex"
                >
                  <Icon className="size-6" />
                </a>
              );
            })}
          </div>
        )}

        <nav className="mt-8 w-full space-y-2.5">
          {links.length === 0 ? (
            <p className="ol-muted text-center text-sm">No links yet.</p>
          ) : !hasSections ? (
            links.map((link) => <LinkButton key={link.id} link={link} />)
          ) : (
            <>
              {unsectioned.map((link) => <LinkButton key={link.id} link={link} />)}
              {sections.map((section) => {
                const sectionLinks = sectionedMap.get(section.id) ?? [];
                if (sectionLinks.length === 0) return null;
                return (
                  <details key={section.id} className="ol-section" open={!section.collapsed_by_default}>
                    <summary className="ol-section-summary">{section.title}</summary>
                    <div className="ol-section-links">
                      {sectionLinks.map((link) => <LinkButton key={link.id} link={link} />)}
                    </div>
                  </details>
                );
              })}
            </>
          )}
        </nav>
      </div>

      <footer className="flex flex-col items-center gap-3 pt-10">
        <ShareBar url={pageUrl} title={`${displayName} on ${SITE_NAME}`} />
        {showBranding && (
          <Link href="/" className="ol-muted text-xs underline-offset-4 hover:underline">
            Made with {SITE_NAME}
          </Link>
        )}
      </footer>
    </main>
  );
}
