import React from 'react';
import { DndContext, closestCenter, type DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Row } from './Row';
import { useEditorStore } from '../../state/editorStore';
import type { LayoutType, Block, Row as RowType } from '../../utils/schema';

export const SlideEditor: React.FC = () => {
  const { project, currentSlideIndex, reorderBlocks, addRow, removeRow } = useEditorStore() as any;
  const currentSlide = project.slides[currentSlideIndex];

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith('palette-')) {
      const parts = activeId.split('-');
      const paletteRowIndex = parseInt(parts[1]);
      const type = parts[2] as 'title' | 'paragraph' | 'image' | 'spacer';

      if (overId.startsWith('column-')) {
        const segs = overId.split('-');
        const targetSlideIdx = parseInt(segs[1]);
        const targetRowIdx = parseInt(segs[2]);
        const targetColIdx = parseInt(segs[3]);
        if (targetSlideIdx !== currentSlideIndex || targetRowIdx !== paletteRowIndex) return;
        const insertIndex = currentSlide.rows[targetRowIdx].columns[targetColIdx].items.length;
        useEditorStore.getState().addBlockAt(currentSlideIndex, targetRowIdx, targetColIdx, type, insertIndex);
        return;
      }

      for (let rIdx = 0; rIdx < currentSlide.rows.length; rIdx++) {
        for (let cIdx = 0; cIdx < currentSlide.rows[rIdx].columns.length; cIdx++) {
          const column = currentSlide.rows[rIdx].columns[cIdx];
          const overIndex = column.items.findIndex((b: Block) => b.id === overId);
          if (overIndex !== -1 && rIdx === paletteRowIndex) {
            const insertIndex = overIndex + (useEditorStore.getState().dragInsertAfter ? 1 : 0);
            useEditorStore.getState().addBlockAt(currentSlideIndex, rIdx, cIdx, type, insertIndex);
            return;
          }
        }
      }
      return;
    }

    let fromRow = -1;
    let fromCol = -1;
    let fromIndex = -1;
    for (let rIdx = 0; rIdx < currentSlide.rows.length; rIdx++) {
      for (let cIdx = 0; cIdx < currentSlide.rows[rIdx].columns.length; cIdx++) {
        const column = currentSlide.rows[rIdx].columns[cIdx];
        const idx = column.items.findIndex((b: Block) => b.id === activeId);
        if (idx !== -1) {
          fromRow = rIdx;
          fromCol = cIdx;
          fromIndex = idx;
          break;
        }
      }
      if (fromRow !== -1) break;
    }

    if (fromRow === -1) return;

    if (overId.startsWith('column-')) {
      const segs = overId.split('-');
      const targetSlideIdx = parseInt(segs[1]);
      const targetRowIdx = parseInt(segs[2]);
      const targetColIdx = parseInt(segs[3]);
      if (targetSlideIdx !== currentSlideIndex) return;
      const insertIndex = currentSlide.rows[targetRowIdx].columns[targetColIdx].items.length;
      useEditorStore.getState().moveBlock(currentSlideIndex, fromRow, fromCol, activeId, targetRowIdx, targetColIdx, insertIndex);
      return;
    }

    for (let rIdx = 0; rIdx < currentSlide.rows.length; rIdx++) {
      for (let cIdx = 0; cIdx < currentSlide.rows[rIdx].columns.length; cIdx++) {
        const column = currentSlide.rows[rIdx].columns[cIdx];
        const overIndex = column.items.findIndex((b: Block) => b.id === overId);
        if (overIndex !== -1) {
          const insertIndex = overIndex + (useEditorStore.getState().dragInsertAfter ? 1 : 0);
          if (rIdx === fromRow && cIdx === fromCol) {
            reorderBlocks(currentSlideIndex, fromRow, fromCol, fromIndex, insertIndex);
          } else {
            useEditorStore.getState().moveBlock(currentSlideIndex, fromRow, fromCol, activeId, rIdx, cIdx, insertIndex);
          }
          return;
        }
      }
    }
  };

  const addRowWithLayout = (layout: LayoutType) => addRow(currentSlideIndex, layout);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-8 space-y-6">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <div className="space-y-6">
            {currentSlide.rows.map((row: RowType, rIdx: number) => (
              <Row
                key={row.id}
                row={row}
                slideIndex={currentSlideIndex}
                rowIndex={rIdx}
                onRemoveRow={() => removeRow(currentSlideIndex, rIdx)}
              />
            ))}
          </div>
          <DragOverlay />
        </DndContext>
        <div className="pt-4">
          <div className="text-center space-y-4">
            <div>
              <p className="text-xs text-gray-500">Choose a layout to add a new row</p>
            </div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => addRowWithLayout(n === 1 ? 'one-column' : n === 2 ? 'two-columns' : 'three-columns')}
                  className="flex flex-col items-center gap-2 h-auto py-2 px-6 border rounded hover:bg-blue-50"
                >
                  <div className="flex gap-1">
                    {Array.from({ length: n }).map((_, i) => (
                      <div key={i} className="w-2 h-3 bg-current rounded-sm opacity-60" />
                    ))}
                  </div>
                  <span className="text-xs font-medium">{n} {n === 1 ? 'Column' : 'Columns'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
