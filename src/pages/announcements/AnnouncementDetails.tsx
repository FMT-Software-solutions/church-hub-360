import { useParams } from 'react-router-dom';
import { useAnnouncement, useAnnouncementSlides, useCreateSlide, useUpdateSlide, useDeleteSlide, useReorderSlides } from '@/hooks/announcements/useAnnouncements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Trash2, GripVertical } from 'lucide-react';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function AnnouncementDetails() {
  const { announcementId } = useParams();
  const aQuery = useAnnouncement(announcementId || '');
  const slidesQuery = useAnnouncementSlides(announcementId || '');
  const createSlide = useCreateSlide();
  const updateSlide = useUpdateSlide();
  const deleteSlide = useDeleteSlide();
  const reorderSlides = useReorderSlides();

  const [mode, setMode] = useState<'list' | 'presentation'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const slides = useMemo(() => slidesQuery.data || [], [slidesQuery.data]);

  React.useEffect(() => {
    if (!autoPlay || mode !== 'presentation') return;
    const id = setInterval(() => setCurrentIndex((i) => (i + 1) % Math.max(slides.length, 1)), 5000);
    return () => clearInterval(id);
  }, [autoPlay, mode, slides.length]);

  const validateSlide = (s: { title?: string; content_html?: string }) => {
    if (!s.title && !s.content_html) return 'Slide must have a title or body';
    return null;
  };

  const addSlide = async () => {
    if (!announcementId) return;
    const pos = slides.length + 1;
    try {
      const created = await createSlide.mutateAsync({ announcement_id: announcementId, position: pos, title: 'New Slide', content_html: '' });
      setEditing({ id: created.id, title: created.title || '', content_html: created.content_html || '' });
    } catch {}
  };

  const [editing, setEditing] = useState<{ id: string; title?: string; content_html?: string } | null>(null);
  const isLocalEdit = editing?.id === '__local__';
  const unsavedChanges = useMemo(() => {
    if (!editing) return false;
    if (isLocalEdit) return true;
    const s = slides.find((x) => x.id === editing.id);
    if (!s) return true;
    const et = editing.title || '';
    const st = s.title || '';
    const eb = editing.content_html || '';
    const sb = s.content_html || '';
    return et !== st || eb !== sb;
  }, [editing, isLocalEdit, slides]);
  const startEdit = (slideId: string) => {
    const s = slides.find((x) => x.id === slideId);
    if (!s) return;
    setEditing({ id: s.id, title: s.title || '', content_html: s.content_html || '' });
  };
  const saveEdit = async () => {
    if (!editing) return;
    const err = validateSlide({ title: editing.title, content_html: editing.content_html });
    if (err) return;
    try {
      if (isLocalEdit) {
        if (!announcementId) return;
        const pos = Math.max(slides.length, 0) + 1;
        const created = await createSlide.mutateAsync({ announcement_id: announcementId, position: pos, title: editing.title || '', content_html: editing.content_html || '' });
        setEditing({ id: created.id, title: created.title || '', content_html: created.content_html || '' });
      } else {
        await updateSlide.mutateAsync({ id: editing.id, updates: { title: editing.title, content_html: editing.content_html } });
        setEditing(null);
      }
    } catch {}
  };

  React.useEffect(() => {
    if (mode !== 'list') return;
    if (editing && (editing.id === '__local__' || slides.find((s) => s.id === editing.id))) return;
    if (slides.length > 0) {
      startEdit(slides[0].id);
    } else {
      setEditing({ id: '__local__', title: 'New Slide', content_html: '' });
    }
  }, [mode, slides.length]);

  React.useEffect(() => {
    if (mode !== 'list') return;
    if (!editing && slides.length > 0) startEdit(slides[0].id);
  }, [slidesQuery.data]);

  const onReorder = async (orderedIds: string[]) => {
    if (!announcementId) return;
    try {
      await reorderSlides.mutateAsync({ announcement_id: announcementId, orderedIds });
    } catch {}
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => history.back()}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold">{aQuery.data?.title || 'Announcement'}</h1>
        <div className="ml-auto flex gap-2">
          <Button variant={mode === 'list' ? 'default' : 'outline'} onClick={() => setMode('list')}>List</Button>
          <Button variant={mode === 'presentation' ? 'default' : 'outline'} onClick={() => setMode('presentation')}>Presentation</Button>
        </div>
      </div>

      {mode === 'list' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Slides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-3"><Button onClick={addSlide}>Add Slide</Button></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
                    if (!over || active.id === over.id) return;
                    const ids = slides.map((s) => s.id);
                    const oldIndex = ids.indexOf(String(active.id));
                    const newIndex = ids.indexOf(String(over.id));
                    const reordered = arrayMove(ids, oldIndex, newIndex);
                    onReorder(reordered);
                  }}>
                    <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {slides.map((s, idx) => (
                          <Thumbnail key={s.id} id={s.id} index={idx} selected={editing?.id === s.id} onSelect={() => startEdit(s.id)} title={s.title || ''} html={s.content_html || ''} onDelete={async () => { await deleteSlide.mutateAsync({ id: s.id }); }} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
                <div className="md:col-span-3">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <Label>Slide Title</Label>
                        <Input value={editing.title || ''} onChange={(e) => setEditing((prev) => prev ? { ...prev, title: e.target.value } : prev)} />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <RichTextEditor value={editing.content_html || ''} onChange={(html) => setEditing((prev) => prev ? { ...prev, content_html: html } : prev)} />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        {unsavedChanges && (
                          <div className="flex items-center text-xs text-muted-foreground mr-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-2" />
                            Unsaved changes
                          </div>
                        )}
                        <Button onClick={saveEdit} disabled={updateSlide.isPending || createSlide.isPending}>{(updateSlide.isPending || createSlide.isPending) ? 'Saving…' : 'Save'}</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border p-6 text-muted-foreground">Select a slide to edit</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {mode === 'presentation' && (
        <div className="fixed inset-0 bg-background z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode('list')}><ArrowLeft className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAutoPlay((v) => !v)}>{autoPlay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</Button>
              <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(i-1,0))}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.min(i+1, slides.length-1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="h-[calc(100vh-120px)] flex items-center justify-center">
            {slides.length > 0 ? (
              <div className="w-full max-w-6xl aspect-[16/9] rounded-lg border bg-card p-10 overflow-hidden">
                <div className="h-full w-full flex flex-col">
                  <div className="flex-1 overflow-auto prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: slides[currentIndex]?.content_html || '' }} />
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No slides</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Thumbnail({ id, index, selected, onSelect, title, html, onDelete }: { id: string; index: number; selected?: boolean; onSelect: () => void; title: string; html: string; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  return (
    <div ref={setNodeRef} style={style} className={`rounded-md border ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab"
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <div className="text-xs text-muted-foreground">{index + 1}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="w-full aspect-[16/9] bg-card">
          <div className="h-full w-full p-3 overflow-hidden">
            {title && <div className="text-sm font-semibold mb-2 truncate">{title}</div>}
            <div className="prose prose-xs dark:prose-invert max-w-none line-clamp-4" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      </button>
    </div>
  );
}
