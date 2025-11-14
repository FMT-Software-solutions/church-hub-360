import React from 'react';
import { DndContext, closestCenter, type DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { SlideThumbnail } from './SlideThumbnail';
import { useEditorStore } from '../../state/editorStore';

export const SlideSidebar: React.FC = () => {
  const {
    project,
    currentSlideIndex,
    setCurrentSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
  } = useEditorStore();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = project.slides.findIndex(s => s.id === active.id);
      const newIndex = project.slides.findIndex(s => s.id === over.id);
      reorderSlides(oldIndex, newIndex);
    }
  };

  return (
    <div className="w-48 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <button
        onClick={addSlide}
        className="w-full flex items-center justify-center gap-2 py-2 mb-4 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <Plus size={18} />
        Add Slide
      </button>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={project.slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {project.slides.map((slide, index) => (
            <SlideThumbnail
              key={slide.id}
              slide={slide}
              index={index}
              isActive={index === currentSlideIndex}
              onSelect={() => setCurrentSlide(index)}
              onDuplicate={() => duplicateSlide(index)}
              onDelete={() => deleteSlide(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
