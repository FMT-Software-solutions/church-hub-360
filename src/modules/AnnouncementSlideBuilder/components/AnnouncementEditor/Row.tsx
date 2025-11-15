import { useDraggable } from '@dnd-kit/core';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import React from 'react';
import { useEditorStore } from '../../state/editorStore';
import type { Row as RowType } from '../../utils/schema';
import { Column } from './Column';

interface RowProps {
  row: RowType;
  slideIndex: number;
  rowIndex: number;
  onRemoveRow?: () => void;
}

export const Row: React.FC<RowProps> = ({
  row,
  slideIndex,
  rowIndex,
  onRemoveRow,
}) => {
  useEditorStore();

  const gridClass =
    row.layout === 'one-column'
      ? 'grid-cols-1'
      : row.layout === 'two-columns'
      ? 'grid-cols-2'
      : 'grid-cols-3';

  const dragTitle = useDraggable({ id: `palette-${rowIndex}-title` });
  const dragParagraph = useDraggable({ id: `palette-${rowIndex}-paragraph` });
  const dragImage = useDraggable({ id: `palette-${rowIndex}-image` });
  const dragSpacer = useDraggable({ id: `palette-${rowIndex}-spacer` });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <GripVertical className="h-5 w-5 text-gray-400" /> */}
          <div className="flex items-center gap-2 ml-2">
            <div className="relative inline-block">
              <button className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                H1
              </button>
              <div
                ref={dragTitle.setNodeRef}
                {...dragTitle.listeners}
                {...dragTitle.attributes}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ background: 'transparent' }}
                aria-label="Drag Heading"
              />
            </div>
            <div className="relative inline-block">
              <button className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                T
              </button>
              <div
                ref={dragParagraph.setNodeRef}
                {...dragParagraph.listeners}
                {...dragParagraph.attributes}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ background: 'transparent' }}
                aria-label="Drag Text"
              />
            </div>
            <div className="relative inline-block">
              <button className="px-2 py-1 text-xs rounded bg-green-500 text-white">
                <ImageIcon className="h-4 w-4" />
              </button>
              <div
                ref={dragImage.setNodeRef}
                {...dragImage.listeners}
                {...dragImage.attributes}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ background: 'transparent' }}
                aria-label="Drag Image"
              />
            </div>
            <div className="relative inline-block">
              <button className="px-2 py-1 text-xs rounded bg-gray-600 text-white">
                –
              </button>
              <div
                ref={dragSpacer.setNodeRef}
                {...dragSpacer.listeners}
                {...dragSpacer.attributes}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                style={{ background: 'transparent' }}
                aria-label="Drag Spacer"
              />
            </div>
          </div>
        </div>
        {onRemoveRow && (
          <button
            onClick={onRemoveRow}
            className="h-8 w-8 p-0 flex items-center justify-center rounded hover:bg-red-50"
            title="Remove row"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        )}
      </div>

      <div className={`grid gap-6 ${gridClass}`}>
        {row.columns.map((column, columnIndex) => (
          <Column
            key={columnIndex}
            column={column}
            slideIndex={slideIndex}
            rowIndex={rowIndex}
            columnIndex={columnIndex}
          />
        ))}
      </div>
    </div>
  );
};
