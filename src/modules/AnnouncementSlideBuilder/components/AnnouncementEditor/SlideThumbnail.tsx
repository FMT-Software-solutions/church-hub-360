import React, { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, Trash2 } from 'lucide-react';
import { type Slide, type Block, type TextBlock, type ImageBlock, type SpacerBlock } from '../../utils/schema';

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({
  slide,
  index,
  isActive,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const w = el.clientWidth;
    const base = 1024;
    setScale(Math.max(0.15, Math.min(0.6, w / base)));
  }, []);

  const renderBlock = (block: Block) => {
    if (block.type === 'title' || block.type === 'paragraph') {
      const tb = block as TextBlock;
      let text = '';
      try {
        const parsed = new DOMParser().parseFromString(tb.content, 'text/html');
        text = parsed.body.textContent || '';
      } catch {
        text = tb.content;
      }
      const fs = Math.max(10, Math.round(tb.styles.fontSize * scale));
      const mt = Math.round(tb.styles.marginTop * scale);
      const mb = Math.round(tb.styles.marginBottom * scale);
      const style: React.CSSProperties = {
        fontSize: fs,
        textAlign: tb.styles.align,
        color: tb.styles.color,
        marginTop: mt,
        marginBottom: mb,
        backgroundColor: tb.styles.backgroundColor || 'transparent',
        fontWeight: tb.styles.bold ? 'bold' : 'normal',
        fontStyle: tb.styles.italic ? 'italic' : 'normal',
        textDecoration: tb.styles.underline ? 'underline' : 'none',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
      return <div style={style}>{text || (tb.type === 'title' ? 'Title' : 'Text')}</div>;
    }
    if (block.type === 'image') {
      const ib = block as ImageBlock;
      const w = Math.round(ib.styles.width * scale);
      const h = Math.round(ib.styles.height * scale);
      const r = Math.round(ib.styles.borderRadius * scale);
      return (
        <div style={{ marginTop: 8 * scale, marginBottom: 8 * scale }}>
          <img src={ib.src} alt="" style={{ width: w, height: h, borderRadius: r, objectFit: 'cover' }} />
        </div>
      );
    }
    const sb = block as SpacerBlock;
    return <div style={{ height: Math.round(sb.styles.height * scale) }} />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative mb-3 cursor-pointer group ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold z-10">
        {index + 1}
      </div>

      <div ref={previewRef} className="border-2 border-gray-300 rounded bg-white p-2 aspect-video overflow-hidden">
        <div className="w-full h-full" style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col gap-2 w-full h-full">
            {slide.rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className={`grid ${row.layout === 'one-column' ? 'grid-cols-1' : row.layout === 'two-columns' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}
              >
                {row.columns.map((column, cIdx) => (
                  <div key={cIdx} className="flex-1">
                    {column.items.map((block) => (
                      <div key={block.id} className="my-1">{renderBlock(block)}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          title="Duplicate"
        >
          <Copy size={12} />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
