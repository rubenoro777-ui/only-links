"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArchiveRestore, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { reorderLinks, restoreLink, deleteLink } from "@/actions/links";
import type { Link as LinkRow, LinkSection } from "@/lib/database.types";
import { AddLinkForm } from "@/components/dashboard/add-link-form";
import { SortableLinkItem } from "@/components/dashboard/sortable-link-item";
import { Button } from "@/components/ui/button";

export function LinksManager({
  links,
  clickCounts,
  sections = [],
}: {
  links: LinkRow[];
  clickCounts: Record<string, number>;
  sections?: LinkSection[];
}) {
  const activeLinks = links.filter((l) => l.archived_at === null);
  const archivedLinks = links.filter((l) => l.archived_at !== null);

  const [items, setItems] = useState<LinkRow[]>(activeLinks);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setItems(links.filter((l) => l.archived_at === null));
  }, [links]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(() => {
      void reorderLinks(next.map((i) => i.id));
    });
  }

  const unsectioned = items.filter((l) => !l.section_id);
  const sectionedMap = new Map<string, LinkRow[]>();
  for (const section of sections) {
    sectionedMap.set(section.id, items.filter((l) => l.section_id === section.id));
  }

  return (
    <div className="space-y-4">
      <AddLinkForm />

      {items.length === 0 && archivedLinks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No links yet. Add your first one above.
        </p>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {unsectioned.length > 0 && (
                <ul className="space-y-2">
                  {unsectioned.map((link) => (
                    <SortableLinkItem
                      key={link.id}
                      link={link}
                      clicks={clickCounts[link.id] ?? 0}
                      sections={sections}
                    />
                  ))}
                </ul>
              )}

              {sections.map((section) => {
                const sectionLinks = sectionedMap.get(section.id) ?? [];
                if (sectionLinks.length === 0) return null;
                return (
                  <div key={section.id} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      {section.title}
                    </p>
                    <ul className="space-y-2">
                      {sectionLinks.map((link) => (
                        <SortableLinkItem
                          key={link.id}
                          link={link}
                          clicks={clickCounts[link.id] ?? 0}
                          sections={sections}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </SortableContext>
          </DndContext>

          {archivedLinks.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setArchivedOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {archivedOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
                Archived ({archivedLinks.length})
              </button>

              {archivedOpen && (
                <ul className="mt-2 space-y-2">
                  {archivedLinks.map((link) => (
                    <ArchivedLinkItem key={link.id} link={link} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ArchivedLinkItem({ link }: { link: LinkRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-2 opacity-60">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium line-through">{link.title}</p>
        <p className="truncate text-xs text-muted-foreground">{link.url}</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label="Restore link"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            void restoreLink(link.id);
          })
        }
      >
        <ArchiveRestore className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive hover:text-destructive"
        aria-label="Delete link"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            void deleteLink(link.id);
          })
        }
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
