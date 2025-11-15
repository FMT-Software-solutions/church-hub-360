import React, { useMemo, useCallback } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, type Descendant } from 'slate';
import { withHistory } from 'slate-history';
import { Rnd } from 'react-rnd';
import { Trash2 } from 'lucide-react';
import type { Block as BlockType, TextBlock, ImageBlock, SpacerBlock } from '../../utils/schema';
import { useEditorStore } from '../../state/editorStore';

interface BlockProps {
  block: BlockType;
  slideIndex: number;
  rowIndex: number;
  columnIndex: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const Block: React.FC<BlockProps> = ({ block, slideIndex, rowIndex, columnIndex, isSelected, onSelect }) => {
  const {  deleteBlock } = useEditorStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(slideIndex, rowIndex, columnIndex, block.id);
  };

  if (block.type === 'title' || block.type === 'paragraph') {
    return <TextBlockComponent
      block={block as TextBlock}
      slideIndex={slideIndex}
      rowIndex={rowIndex}
      columnIndex={columnIndex}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={handleDelete}
    />;
  }

  if (block.type === 'image') {
    return <ImageBlockComponent
      block={block as ImageBlock}
      slideIndex={slideIndex}
      rowIndex={rowIndex}
      columnIndex={columnIndex}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={handleDelete}
    />;
  }

  if (block.type === 'spacer') {
    return <SpacerBlockComponent
      block={block as SpacerBlock}
      slideIndex={slideIndex}
      rowIndex={rowIndex}
      columnIndex={columnIndex}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={handleDelete}
    />;
  }

  return null;
};

const TextBlockComponent: React.FC<{
  block: TextBlock;
  slideIndex: number;
  rowIndex: number;
  columnIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ block, slideIndex, rowIndex, columnIndex, isSelected, onSelect, onDelete }) => {
  const { updateBlock } = useEditorStore();

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const initialValue: Descendant[] = useMemo(() => {
    try {
      const parsed = new DOMParser().parseFromString(block.content, 'text/html');
      const text = parsed.body.textContent || 'New text';
      return [{ type: 'paragraph', children: [{ text }] } as any];
    } catch {
      return [{ type: 'paragraph', children: [{ text: 'New text' }] } as any];
    }
  }, [block.id]);

  const handleChange = useCallback((value: Descendant[]) => {
    const text = value.map((n: any) => n.children.map((c: any) => c.text).join('')).join('\n');
    const tag = block.type === 'title' ? 'h1' : 'p';
    updateBlock(slideIndex, rowIndex, columnIndex, block.id, {
      content: `<${tag}>${text}</${tag}>`,
    });
  }, [block.id, block.type, slideIndex, rowIndex, columnIndex, updateBlock]);

  const textStyle = {
    fontSize: `${block.styles.fontSize}px`,
    textAlign: block.styles.align,
    color: block.styles.color,
    marginTop: `${block.styles.marginTop}px`,
    marginBottom: `${block.styles.marginBottom}px`,
    backgroundColor: block.styles.backgroundColor || 'transparent',
    fontWeight: block.styles.bold ? 'bold' : 'normal',
    fontStyle: block.styles.italic ? 'italic' : 'normal',
    textDecoration: block.styles.underline ? 'underline' : 'none',
  };

  return (
    <div
      className={`relative px-4 py-2 rounded transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-gray-300'
      }`}
      onClick={onSelect}
    >
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <Editable
          style={textStyle as any}
          placeholder={block.type === 'title' ? 'Enter title...' : 'Enter text...'}
          className="outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      </Slate>
      {isSelected && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const ImageBlockComponent: React.FC<{
  block: ImageBlock;
  slideIndex: number;
  rowIndex: number;
  columnIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ block, slideIndex, rowIndex, columnIndex, isSelected, onSelect, onDelete }) => {
  const { updateBlock } = useEditorStore();

  const handleResize = (_e: any, _direction: any, ref: HTMLElement) => {
    updateBlock(slideIndex, rowIndex, columnIndex, block.id, {
      styles: {
        ...block.styles,
        width: parseInt(ref.style.width),
        height: parseInt(ref.style.height),
      },
    });
  };

  return (
    <div className="relative my-4" onClick={onSelect} style={{ minHeight: block.styles.height }}>
      <Rnd
        size={{ width: block.styles.width, height: block.styles.height }}
        onResizeStop={handleResize}
        disableDragging
        minWidth={100}
        minHeight={100}
        bounds="parent"
        style={{ position: 'relative', maxWidth: '100%' }}
        className={isSelected ? 'ring-2 ring-primary' : ''}
      >
        <img
          src={block.src}
          alt="Content"
          className="w-full h-full object-cover"
          style={{ borderRadius: `${block.styles.borderRadius}px` }}
        />
      </Rnd>
      {isSelected && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 z-10"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const SpacerBlockComponent: React.FC<{
  block: SpacerBlock;
  slideIndex: number;
  rowIndex: number;
  columnIndex: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ block, isSelected, onSelect, onDelete }) => {
  return (
    <div
      className={`relative cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary bg-gray-100' : 'hover:ring-1 hover:ring-gray-300 bg-gray-50'
      }`}
      style={{ height: `${block.styles.height}px` }}
      onClick={onSelect}
    >
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
        Spacer ({block.styles.height}px)
      </div>
      {isSelected && (
        <button
          onClick={onDelete}
          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
