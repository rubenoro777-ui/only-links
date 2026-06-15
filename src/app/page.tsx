import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-bold tracking-tight">{SITE_NAME}</span>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-16 text-center sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="size-1.5 rounded-full bg-green-500" />
          Free to start — no credit card required
        </div>

        <h1 className="text-balance text-5xl font-extrabold tracking-tight sm:text-7xl leading-[1.05]">
          One link.<br />
          <span className="text-muted-foreground">Everything you do.</span>
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-balance text-lg text-muted-foreground">
          {SITE_NAME} gives you a beautiful, fast link-in-bio page with analytics,
          custom design, and smart link sections — all in one place.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="text-base px-8">
            <Link href={user ? "/dashboard" : "/signup"}>
              {user ? "Go to dashboard" : "Claim your handle — it's free"}
            </Link>
          </Button>
          {!user && (
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-12">
            Everything you need
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="✦"
              title="Beautiful public page"
              body="Your links, your brand. Choose from curated themes, customise colours and fonts, and inject custom CSS for full control."
            />
            <FeatureCard
              icon="◈"
              title="Link sections"
              body="Group links into collapsible sections — Work, Personal, Resources, whatever fits your world. Visitors expand only what they need."
            />
            <FeatureCard
              icon="◎"
              title="Built-in analytics"
              body="See total clicks, unique visitors, top countries, devices, browsers, and referrers. Drill down into any single link."
            />
            <FeatureCard
              icon="↗"
              title="Share everywhere"
              body="Copy your link, trigger the native share sheet, or tap your phone to an NFC tag. Getting your page out there should be instant."
            />
            <FeatureCard
              icon="⬡"
              title="Monetise your links"
              body="Lock any link behind a one-time payment. Fans pay, get access. You keep the revenue."
            />
            <FeatureCard
              icon="⌘"
              title="Export your data"
              body="Download all your click data as a CSV whenever you like. Your data stays yours."
            />
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="border-t">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to share your world?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Claim your handle in seconds. Free forever for the essentials.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="text-base px-10">
              <Link href={user ? "/dashboard" : "/signup"}>
                {user ? "Back to dashboard" : "Get started free"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE_NAME}</span>
          <nav className="flex gap-5">
            <Link href="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-background p-6">
      <div className="mb-3 text-2xl" aria-hidden="true">{icon}</div>
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
