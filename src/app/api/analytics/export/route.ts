import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import { getPlanAccess } from "@/lib/admin-access";

function csvEscape(value: string | null | undefined): string {
  const str = String(value ?? "");
  // Wrap in quotes and escape any existing quotes
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const access = await getPlanAccess(profile, user.email);
  if (!access.hasProAccess) {
    return NextResponse.json(
      { error: "CSV export is available on the Pro plan." },
      { status: 403 },
    );
  }

  // Get all user's links (active + archived)
  const { data: linksRaw } = await supabase
    .from("links")
    .select("id, title, url")
    .eq("profile_id", user.id);

  const links = linksRaw ?? [];
  const linkIds = links.map((l) => l.id);
  const linkMap = new Map(
    links.map((l) => [l.id, { title: l.title as string, url: l.url as string }]),
  );

  const HEADERS = ["date", "link_title", "link_url", "country", "device_type", "browser", "referrer", "visitor_id"];

  if (linkIds.length === 0) {
    const csv = HEADERS.join(",") + "\n";
    return csvResponse(csv);
  }

  const { data: clicksRaw } = await supabase
    .from("click_events")
    .select("link_id, created_at, country, device_type, browser, referrer, visitor_id")
    .in("link_id", linkIds)
    .order("created_at", { ascending: false });

  const clicks = clicksRaw ?? [];

  const rows = clicks.map((c) => {
    const link = linkMap.get(c.link_id as string);
    return [
      csvEscape(c.created_at as string),
      csvEscape(link?.title),
      csvEscape(link?.url),
      csvEscape(c.country as string | null),
      csvEscape(c.device_type as string | null),
      csvEscape(c.browser as string | null),
      csvEscape(c.referrer as string | null),
      csvEscape(c.visitor_id as string | null),
    ].join(",");
  });

  const csv = [HEADERS.join(","), ...rows].join("\n");
  return csvResponse(csv);
}

function csvResponse(csv: string) {
  const date = new Date().toISOString().slice(0, 10);
  // Prepend UTF-8 BOM so Excel opens it correctly
  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
