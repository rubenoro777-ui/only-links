"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, BarChart3, Archive, Lock, Unlock } from "lucide-react";
import { deleteLink, updateLink, archiveLink, setLinkLocked } from "@/actions/links";
import { initialActionState } from "@/actions/types";
import {
  ACCESS_TTL_OPTIONS,
  DEFAULT_ACCESS_TTL_MINUTES,
} from "@/lib/access-grants";
import type { Link as LinkRow, LinkSection } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export function SortableLinkItem({
  link,
  clicks,
  sections = [],
}: {
  link: LinkRow;
  clicks: number;
  sections?: LinkSection[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id });
  const [editing, setEditing] = useState(false);
  const [openToLock, setOpenToLock] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(updateLink, initialActionState);

  useEffect(() => {
    if (state.success) {
      setEditing(false);
      setOpenToLock(false);
    }
  }, [state]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-background"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{link.title}</p>
          <p className="truncate text-xs text-muted-foreground">{link.url}</p>
        </div>

        <Link
          href={`/dashboard/links/${link.id}`}
          className="hidden sm:flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors tabular-nums"
          title="View link analytics"
        >
          <BarChart3 className="size-3.5" />
          {clicks}
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Edit link"
          onClick={() => setEditing((v) => !v)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`hidden sm:flex size-8 ${link.is_locked ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
          aria-label={link.is_locked ? "Unlock link" : "Lock link (set a price)"}
          disabled={isPending}
          onClick={() => {
            if (link.is_locked) {
              // Unlocking — remove paywall immediately
              startTransition(() => { void setLinkLocked(link.id, false, null); });
            } else {
              // Locking — open edit form pre-focused on lock settings
              setOpenToLock(true);
              setEditing(true);
            }
          }}
          title={link.is_locked ? `Locked · $${((link.price_cents ?? 0) / 100).toFixed(2)} — click to unlock` : "Lock this link (opens settings to set price)"}
        >
          {link.is_locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
          aria-label="Archive link"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              void archiveLink(link.id);
            })
          }
        >
          <Archive className="size-4" />
        </Button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={() => {
                setConfirmDelete(false);
                startTransition(() => { void deleteLink(link.id); });
              }}
            >
              Delete
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            aria-label="Delete link"
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      {editing && (
        <form action={formAction} className="space-y-2 border-t p-3">
          <input type="hidden" name="id" value={link.id} />
          <Input
            name="title"
            defaultValue={link.title}
            placeholder="Title"
            required
          />
          <Input
            name="url"
            defaultValue={link.url}
            placeholder="example.com"
            inputMode="url"
            required
          />
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 px-3 py-2">
            <input
              type="checkbox"
              id={`lock-${link.id}`}
              name="is_locked"
              defaultChecked={link.is_locked || openToLock}
              className="size-4 rounded accent-amber-500"
            />
            <Label htmlFor={`lock-${link.id}`} className="text-sm font-medium">
              🔒 Lock this link (charge to unlock)
            </Label>
          </div>
          <Input
            name="price_cents_dollars"
            type="number"
            min="0.50"
            step="0.01"
            defaultValue={link.price_cents ? (link.price_cents / 100).toFixed(2) : ""}
            placeholder="Price in USD (e.g. 4.99)"
            inputMode="decimal"
          />
          <div className="space-y-1.5">
            <Label
              htmlFor={`access-ttl-${link.id}`}
              className="text-xs text-muted-foreground"
            >
              Private access link expires after payment
            </Label>
            <select
              id={`access-ttl-${link.id}`}
              name="access_ttl_minutes"
              defaultValue={String(
                link.access_ttl_minutes ?? DEFAULT_ACCESS_TTL_MINUTES,
              )}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {ACCESS_TTL_OPTIONS.map((option) => (
                <option key={option.minutes} value={option.minutes}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {sections.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor={`section-${link.id}`} className="text-xs text-muted-foreground">
                Section
              </Label>
              <select
                id={`section-${link.id}`}
                name="section_id"
                defaultValue={link.section_id ?? ""}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">No section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          <div className="flex gap-2">
            <SubmitButton size="sm">Save</SubmitButton>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setEditing(false); setOpenToLock(false); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
