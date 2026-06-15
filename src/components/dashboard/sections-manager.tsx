"use client";

import { useActionState, useState, useTransition } from "react";
import {
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  createSection,
  renameSection,
  deleteSection,
  reorderSections,
  setSectionCollapsed,
} from "@/actions/sections";
import { initialActionState } from "@/actions/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import type { LinkSection } from "@/lib/database.types";

export function SectionsManager({ sections: initial }: { sections: LinkSection[] }) {
  const [sections, setSections] = useState(initial);
  const [state, formAction] = useActionState(createSection, initialActionState);
  const [, startTransition] = useTransition();

  // Keep local state in sync when server re-renders update prop
  // (React will reconcile via key on re-render)

  function move(index: number, dir: -1 | 1) {
    const next = [...sections];
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setSections(next);
    startTransition(() => {
      void reorderSections(next.map((s) => s.id));
    });
  }

  return (
    <div className="space-y-4">
      {/* Add section form */}
      <form action={formAction} className="flex gap-2">
        <Input name="title" placeholder="Section name (e.g. Work, Personal)" required />
        <SubmitButton size="sm">Add</SubmitButton>
      </form>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No sections yet. Add one above to start grouping your links.
        </p>
      ) : (
        <ul className="space-y-2">
          {sections.map((section, index) => (
            <SectionRow
              key={section.id}
              section={section}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
              onMoveUp={() => move(index, -1)}
              onMoveDown={() => move(index, 1)}
              onDelete={() => {
                setSections((prev) => prev.filter((s) => s.id !== section.id));
                startTransition(() => {
                  void deleteSection(section.id);
                });
              }}
              onToggleCollapsed={(collapsed) => {
                setSections((prev) =>
                  prev.map((s) =>
                    s.id === section.id ? { ...s, collapsed_by_default: collapsed } : s
                  )
                );
                startTransition(() => {
                  void setSectionCollapsed(section.id, collapsed);
                });
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionRow({
  section,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  onToggleCollapsed,
}: {
  section: LinkSection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onToggleCollapsed: (v: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.title);
  const [isPending, startTransition] = useTransition();

  function save() {
    if (!draft.trim() || draft.trim() === section.title) {
      setEditing(false);
      return;
    }
    startTransition(() => {
      void renameSection(section.id, draft.trim());
    });
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border bg-background p-2">
      {/* Reorder buttons */}
      <div className="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Move section up"
          disabled={isFirst || isPending}
          onClick={onMoveUp}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          aria-label="Move section down"
          disabled={isLast || isPending}
          onClick={onMoveDown}
        >
          <ChevronDown className="size-3.5" />
        </Button>
      </div>

      {/* Title (editable) */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") { setDraft(section.title); setEditing(false); }
              }}
            />
            <Button type="button" variant="ghost" size="icon" className="size-7" onClick={save}>
              <Check className="size-3.5 text-green-600" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => { setDraft(section.title); setEditing(false); }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <p className="truncate text-sm font-medium">{section.title}</p>
        )}
      </div>

      {/* Collapsed-by-default toggle */}
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          className="size-3.5 rounded"
          checked={section.collapsed_by_default}
          onChange={(e) => onToggleCollapsed(e.target.checked)}
        />
        Start collapsed
      </label>

      {/* Edit / Delete */}
      {!editing && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Rename section"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        aria-label="Delete section"
        disabled={isPending}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
