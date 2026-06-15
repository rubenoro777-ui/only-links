import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

export default function HandleNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold">This page isn&apos;t taken yet</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        There&apos;s no {SITE_NAME} page at this handle. Want to claim it?
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/signup">Claim a handle</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
