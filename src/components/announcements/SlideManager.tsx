import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Trash2, GripVertical, Plus } from 'lucide-react';

export interface SlideDraft {
  id: string;
  title?: string;
  content_html?: string;
}

function SortableItem({ slide, onChange, onDelete }: { slide: SlideDraft; onChange: (s: SlideDraft) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="rounded-md border p-3 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <button className="cursor-grab" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-sm">Drag to reorder</span>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div>
          <Label>Slide Title</Label>
          <Input value={slide.title || ''} onChange={(e) => onChange({ ...slide, title: e.target.value })} />
        </div>
        <div />
        <div className="md:col-span-2">
          <Label>Content</Label>
          <RichTextEditor value={slide.content_html || ''} onChange={(html) => onChange({ ...slide, content_html: html })} />
        </div>
      </div>
    </div>
  );
}

export default function SlideManager({ value, onChange, max = 10 }: { value: SlideDraft[]; onChange: (v: SlideDraft[]) => void; max?: number }) {
  const slides = value;
  const add = () => {
    if (slides.length >= max) return;
    const id = crypto.randomUUID();
    onChange([...slides, { id, title: '', content_html: '' }]);
  };
  const remove = (id: string) => onChange(slides.filter((s) => s.id !== id));
  const update = (id: string, patch: SlideDraft) => onChange(slides.map((s) => (s.id === id ? patch : s)));
  const ids = slides.map((s) => s.id);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Slides ({slides.length}/{max})</Label>
        <Button onClick={add} disabled={slides.length >= max}><Plus className="h-4 w-4 mr-2" />Add Slide</Button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        const reordered = arrayMove(slides, oldIndex, newIndex);
        onChange(reordered);
      }}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {slides.map((s) => (
              <SortableItem key={s.id} slide={s} onChange={(next) => update(s.id, next)} onDelete={() => remove(s.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

