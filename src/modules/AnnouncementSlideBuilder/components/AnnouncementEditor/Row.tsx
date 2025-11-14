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
            <div
              ref={dragTitle.setNodeRef}
              style={{
                transform: dragTitle.transform
                  ? `translate3d(${dragTitle.transform.x}px, ${dragTitle.transform.y}px, 0)`
                  : undefined,
              }}
              {...dragTitle.listeners}
              {...dragTitle.attributes}
              className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-grab active:cursor-grabbing"
              title="Drag Heading"
            >
              H1
            </div>
            <div
              ref={dragParagraph.setNodeRef}
              style={{
                transform: dragParagraph.transform
                  ? `translate3d(${dragParagraph.transform.x}px, ${dragParagraph.transform.y}px, 0)`
                  : undefined,
              }}
              {...dragParagraph.listeners}
              {...dragParagraph.attributes}
              className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 cursor-grab active:cursor-grabbing"
              title="Drag Text"
            >
              T
            </div>
            <div
              ref={dragImage.setNodeRef}
              style={{
                transform: dragImage.transform
                  ? `translate3d(${dragImage.transform.x}px, ${dragImage.transform.y}px, 0)`
                  : undefined,
              }}
              {...dragImage.listeners}
              {...dragImage.attributes}
              className="px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 cursor-grab active:cursor-grabbing"
              title="Drag Image"
            >
              <ImageIcon className="h-4 w-4" />
            </div>
            <div
              ref={dragSpacer.setNodeRef}
              style={{
                transform: dragSpacer.transform
                  ? `translate3d(${dragSpacer.transform.x}px, ${dragSpacer.transform.y}px, 0)`
                  : undefined,
              }}
              {...dragSpacer.listeners}
              {...dragSpacer.attributes}
              className="px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700 cursor-grab active:cursor-grabbing"
              title="Drag Spacer"
            >
              –
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
