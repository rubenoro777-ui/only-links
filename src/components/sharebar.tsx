"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Check, Wifi } from "lucide-react";

interface Props {
  url: string;
  title: string;
}

type NfcState = "idle" | "writing" | "success" | "error" | "unsupported";

export function ShareBar({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcState, setNfcState] = useState<NfcState>("idle");
  // Use the actual browser URL so Vercel preview deployment URLs don't bleed through
  const [shareUrl, setShareUrl] = useState(url);

  useEffect(() => {
    setNfcSupported("NDEFReader" in window);
    // Strip query/hash — keep only origin + pathname so the share link is clean
    setShareUrl(`${window.location.origin}${window.location.pathname}`);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title, url: shareUrl }); } catch { /* cancelled */ }
    } else {
      await copyLink();
    }
  }

  async function writeNfc() {
    if (!("NDEFReader" in window)) return;
    setNfcState("writing");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      // @ts-expect-error — Web NFC API not yet in TS lib
      const ndef = new NDEFReader();
      await ndef.write(
        { records: [{ recordType: "url", data: shareUrl }] },
        { signal: controller.signal },
      );
      clearTimeout(timeout);
      setNfcState("success");
      setTimeout(() => setNfcState("idle"), 2500);
    } catch {
      clearTimeout(timeout);
      setNfcState("error");
      setTimeout(() => setNfcState("idle"), 2500);
    }
  }

  const nfcLabel =
    nfcState === "writing" ? "Hold near tag…" :
    nfcState === "success" ? "Written!" :
    nfcState === "error"   ? "Failed — try again" :
    "Write to NFC tag";

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* NFC status message */}
      {nfcState !== "idle" && (
        <p className="text-xs opacity-60">{nfcLabel}</p>
      )}

      <div className="ol-sharebar flex items-center gap-1">
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? "Copied!" : "Copy link"}
          title={copied ? "Copied!" : "Copy link"}
          className="ol-share-btn"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>

        <button
          type="button"
          onClick={share}
          aria-label="Share"
          title="Share"
          className="ol-share-btn"
        >
          <Share2 className="size-3.5" />
        </button>

        {nfcSupported && (
          <button
            type="button"
            onClick={writeNfc}
            disabled={nfcState === "writing"}
            aria-label={nfcLabel}
            title={nfcLabel}
            className="ol-share-btn"
          >
            <Wifi className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
