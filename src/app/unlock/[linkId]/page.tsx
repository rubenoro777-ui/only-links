import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UnlockPageInner } from "./unlock-inner";

interface Props {
  params: Promise<{ linkId: string }>;
}

export default function UnlockPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <UnlockPageInner params={params} />
    </Suspense>
  );
}
