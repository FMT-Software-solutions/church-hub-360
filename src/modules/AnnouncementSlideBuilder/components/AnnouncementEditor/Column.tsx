import React, { useRef, useState } from 'react';
import { useDroppable, useDndMonitor } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Block } from './Block';
import type { Column as ColumnType } from '../../utils/schema';
import { SortableBlock } from './SortableBlock';
import { useEditorStore } from '../../state/editorStore';

interface ColumnProps {
  column: ColumnType;
  slideIndex: number;
  rowIndex: number;
  columnIndex: number;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  slideIndex,
  rowIndex,
  columnIndex,
}) => {
  const {
    selectedBlockId,
    setSelectedBlock,
    setDragInsertAfter,
  } = useEditorStore() as any;
  const { setNodeRef } = useDroppable({
    id: `column-${slideIndex}-${rowIndex}-${columnIndex}`,
  });

  const blockRefs = useRef<Record<string, HTMLElement | null>>({});
  const [indicator, setIndicator] = useState<{
    blockId: string | null;
    position: 'before' | 'after' | 'append';
  } | null>(null);

  useDndMonitor({
    onDragOver(event) {
      const overId = event.over ? String(event.over.id) : null;
      if (!overId) {
        setIndicator(null);
        return;
      }
      if (overId === `column-${slideIndex}-${rowIndex}-${columnIndex}`) {
        setIndicator({ blockId: null, position: 'append' });
        setDragInsertAfter(true);
        return;
      }
      const el = blockRefs.current[overId];
      if (el) {
        const rect = el.getBoundingClientRect();
        const activeRect =
          (event.active as any)?.rect?.current?.translated ||
          (event.active as any)?.rect?.current?.initial ||
          (event.active as any)?.rect?.current?.offset;
        const pointerY = activeRect
          ? activeRect.top + activeRect.height / 2
          : rect.top + rect.height / 2;
        const position =
          pointerY < rect.top + rect.height / 2 ? 'before' : 'after';
        setIndicator({ blockId: overId, position });
        setDragInsertAfter(position === 'after');
      }
    },
    onDragEnd() {
      setIndicator(null);
      setDragInsertAfter(false);
    },
    onDragCancel() {
      setIndicator(null);
      setDragInsertAfter(false);
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-1 border border-gray-200 rounded p-4 bg-white"
    >
      <SortableContext
        items={column.items.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {column.items.map((block) => (
            <SortableBlock key={block.id} id={block.id}>
              {({ setNodeRef, style, listeners }) => (
                <div
                  ref={(node) => {
                    setNodeRef(node);
                    blockRefs.current[block.id] = node;
                  }}
                  style={style}
                  className="relative"
                  data-block-id={block.id}
                >
                  <div className="absolute -left-2 -top-2 z-10">
                    <button
                      className="p-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-move"
                      title="Drag"
                      {...(listeners || {})}
                    >
                      ⋮
                    </button>
                  </div>
                  {indicator &&
                    indicator.blockId === block.id &&
                    indicator.position === 'before' && (
                      <div className="absolute -top-1 left-0 right-0 h-[2px] bg-blue-400 my-1" />
                    )}
                  <Block
                    block={block}
                    slideIndex={slideIndex}
                    rowIndex={rowIndex}
                    columnIndex={columnIndex}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlock(block.id)}
                  />
                  {indicator &&
                    indicator.blockId === block.id &&
                    indicator.position === 'after' && (
                      <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-400" />
                    )}
                </div>
              )}
            </SortableBlock>
          ))}
          {indicator &&
            indicator.blockId === null &&
            indicator.position === 'append' && (
              <div className="relative">
                <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-blue-400" />
              </div>
            )}
        </div>
      </SortableContext>
    </div>
  );
};
