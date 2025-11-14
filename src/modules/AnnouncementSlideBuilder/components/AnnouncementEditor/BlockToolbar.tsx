import React from 'react';
import { useEditorStore } from '../../state/editorStore';
import type { Block, TextBlock, ImageBlock, SpacerBlock } from '../../utils/schema';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Type as TypeIcon, PaintBucket } from 'lucide-react';

export const BlockToolbar: React.FC = () => {
  const { project, currentSlideIndex, selectedBlockId, updateBlock } = useEditorStore();

  const slide = project.slides[currentSlideIndex];
  let block: Block | null = null;
  let rowIndex = -1;
  let columnIndex = -1;

  for (let r = 0; r < slide.rows.length; r++) {
    for (let c = 0; c < slide.rows[r].columns.length; c++) {
      const found = slide.rows[r].columns[c].items.find((b) => b.id === selectedBlockId);
      if (found) {
        block = found;
        rowIndex = r;
        columnIndex = c;
        break;
      }
    }
    if (block) break;
  }

  const isDisabled = !block || rowIndex === -1 || columnIndex === -1;

  const onUpdate = (updates: Partial<Block>) => {
    if (isDisabled || !block) return;
    updateBlock(currentSlideIndex, rowIndex, columnIndex, block.id, updates);
  };

  if (!isDisabled && (block!.type === 'title' || block!.type === 'paragraph')) {
    const tb = block as TextBlock;
    return (
      <div className="border-b bg-white px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-2 pr-4 border-r">
          <TypeIcon className="h-4 w-4 text-gray-600" />
          <input
            type="number"
            value={tb.styles.fontSize}
            onChange={(e) => onUpdate({ styles: { ...tb.styles, fontSize: parseInt(e.target.value) } })}
            className="w-16 px-2 py-1 border rounded"
          />
          <button
            className={`p-2 rounded ${tb.styles.bold ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => onUpdate({ styles: { ...tb.styles, bold: !tb.styles.bold } })}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded ${tb.styles.italic ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => onUpdate({ styles: { ...tb.styles, italic: !tb.styles.italic } })}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded ${tb.styles.underline ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => onUpdate({ styles: { ...tb.styles, underline: !tb.styles.underline } })}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r">
          <button
            className={`p-2 rounded ${tb.styles.align === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => onUpdate({ styles: { ...tb.styles, align: 'left' } })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded ${tb.styles.align === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => onUpdate({ styles: { ...tb.styles, align: 'center' } })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded ${tb.styles.align === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            onClick={() => onUpdate({ styles: { ...tb.styles, align: 'right' } })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-4 border-r">
          <PaintBucket className="h-4 w-4 text-gray-600" />
          <input
            type="color"
            value={tb.styles.color}
            onChange={(e) => onUpdate({ styles: { ...tb.styles, color: e.target.value } })}
            className="h-8 w-8 border rounded"
          />
          <input
            type="color"
            value={tb.styles.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdate({ styles: { ...tb.styles, backgroundColor: e.target.value } })}
            className="h-8 w-8 border rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Top</span>
          <input
            type="number"
            value={tb.styles.marginTop}
            onChange={(e) => onUpdate({ styles: { ...tb.styles, marginTop: parseInt(e.target.value) } })}
            className="w-16 px-2 py-1 border rounded"
          />
          <span className="text-xs text-gray-600">Bottom</span>
          <input
            type="number"
            value={tb.styles.marginBottom}
            onChange={(e) => onUpdate({ styles: { ...tb.styles, marginBottom: parseInt(e.target.value) } })}
            className="w-16 px-2 py-1 border rounded"
          />
        </div>
      </div>
    );
  }

  if (!isDisabled && block!.type === 'image') {
    const ib = block as ImageBlock;
    return (
      <div className="border-b bg-white px-4 py-2 flex items-center gap-3">
        <ImageIcon className="h-4 w-4 text-gray-600" />
        <input
          type="text"
          value={ib.src}
          onChange={(e) => onUpdate({ src: e.target.value })}
          placeholder="Image URL"
          className="w-64 px-2 py-1 border rounded"
        />
        <span className="text-xs text-gray-600">W</span>
        <input
          type="number"
          value={ib.styles.width}
          onChange={(e) => onUpdate({ styles: { ...ib.styles, width: parseInt(e.target.value) } })}
          className="w-20 px-2 py-1 border rounded"
        />
        <span className="text-xs text-gray-600">H</span>
        <input
          type="number"
          value={ib.styles.height}
          onChange={(e) => onUpdate({ styles: { ...ib.styles, height: parseInt(e.target.value) } })}
          className="w-20 px-2 py-1 border rounded"
        />
        <span className="text-xs text-gray-600">Radius</span>
        <input
          type="number"
          value={ib.styles.borderRadius}
          onChange={(e) => onUpdate({ styles: { ...ib.styles, borderRadius: parseInt(e.target.value) } })}
          className="w-20 px-2 py-1 border rounded"
        />
      </div>
    );
  }

  if (!isDisabled && block!.type === 'spacer') {
    const sb = block as SpacerBlock;
    return (
      <div className="border-b bg-white px-4 py-2 flex items-center gap-3">
        <span className="inline-flex items-center gap-2 text-gray-700"><TypeIcon className="h-4 w-4" />Spacer</span>
        <span className="text-xs text-gray-600">Height</span>
        <input
          type="number"
          value={sb.styles.height}
          onChange={(e) => onUpdate({ styles: { ...sb.styles, height: parseInt(e.target.value) } })}
          className="w-24 px-2 py-1 border rounded"
        />
      </div>
    );
  }

  const defaultStyles = { fontSize: 16, align: 'left' as const, color: '#000000', marginTop: 12, marginBottom: 16, bold: false, italic: false, underline: false };
  return (
    <div className="border-b bg-white px-4 py-2 flex items-center gap-2 opacity-50">
      <div className="flex items-center gap-2 pr-4 border-r">
        <TypeIcon className="h-4 w-4 text-gray-600" />
        <input type="number" value={defaultStyles.fontSize} disabled className="w-16 px-2 py-1 border rounded" />
        <button className="p-2 rounded bg-gray-100" disabled title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button className="p-2 rounded bg-gray-100" disabled title="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button className="p-2 rounded bg-gray-100" disabled title="Underline">
          <Underline className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 pr-4 border-r">
        <button className="p-2 rounded bg-gray-100" disabled title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </button>
        <button className="p-2 rounded bg-gray-100" disabled title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </button>
        <button className="p-2 rounded bg-gray-100" disabled title="Align Right">
          <AlignRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 pr-4 border-r">
        <PaintBucket className="h-4 w-4 text-gray-600" />
        <input type="color" value={defaultStyles.color} disabled className="h-8 w-8 border rounded" />
        <input type="color" value="#ffffff" disabled className="h-8 w-8 border rounded" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Top</span>
        <input type="number" value={defaultStyles.marginTop} disabled className="w-16 px-2 py-1 border rounded" />
        <span className="text-xs text-gray-600">Bottom</span>
        <input type="number" value={defaultStyles.marginBottom} disabled className="w-16 px-2 py-1 border rounded" />
      </div>
    </div>
  );
};