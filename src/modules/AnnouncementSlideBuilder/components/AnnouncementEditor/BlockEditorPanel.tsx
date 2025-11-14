import React from 'react';
import { useEditorStore } from '../../state/editorStore';
import type {
  Block,
  TextBlock,
  ImageBlock,
  SpacerBlock,
} from '../../utils/schema';

export const BlockEditorPanel: React.FC = () => {
  const {
    project,
    currentSlideIndex,
    selectedBlockId,
    updateBlock,
  } = useEditorStore();

  if (!selectedBlockId) {
    return (
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
        <p className="text-gray-500 text-sm">
          Select a block to edit its properties
        </p>
      </div>
    );
  }

  const currentSlide = project.slides[currentSlideIndex];
  let selectedBlock: Block | null = null;
  let blockColumnIndex = -1;
  let blockRowIndex = -1;

  for (let r = 0; r < currentSlide.rows.length; r++) {
    for (let c = 0; c < currentSlide.rows[r].columns.length; c++) {
      const block = currentSlide.rows[r].columns[c].items.find((b) => b.id === selectedBlockId);
      if (block) {
        selectedBlock = block;
        blockRowIndex = r;
        blockColumnIndex = c;
        break;
      }
    }
    if (selectedBlock) break;
  }

  if (!selectedBlock || blockColumnIndex === -1) {
    return (
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
        <p className="text-gray-500 text-sm">Block not found</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<Block>) => {
    updateBlock(currentSlideIndex, blockRowIndex, blockColumnIndex, selectedBlockId, updates);
  };

  if (selectedBlock.type === 'title' || selectedBlock.type === 'paragraph') {
    return (
      <TextBlockEditor
        block={selectedBlock as TextBlock}
        onUpdate={handleUpdate}
      />
    );
  }

  if (selectedBlock.type === 'image') {
    return (
      <ImageBlockEditor
        block={selectedBlock as ImageBlock}
        onUpdate={handleUpdate}
      />
    );
  }

  if (selectedBlock.type === 'spacer') {
    return (
      <SpacerBlockEditor
        block={selectedBlock as SpacerBlock}
        onUpdate={handleUpdate}
      />
    );
  }

  return null;
};

const TextBlockEditor: React.FC<{
  block: TextBlock;
  onUpdate: (updates: Partial<Block>) => void;
}> = ({ block, onUpdate }) => {
  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Text Block Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Font Size</label>
          <input
            type="number"
            value={block.styles.fontSize}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, fontSize: parseInt(e.target.value) },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Text Color</label>
          <input
            type="color"
            value={block.styles.color}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, color: e.target.value },
              })
            }
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alignment</label>
          <select
            value={block.styles.align}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, align: e.target.value as any },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={block.styles.bold || false}
              onChange={(e) =>
                onUpdate({
                  styles: { ...block.styles, bold: e.target.checked },
                })
              }
            />
            <span className="text-sm font-medium">Bold</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={block.styles.italic || false}
              onChange={(e) =>
                onUpdate({
                  styles: { ...block.styles, italic: e.target.checked },
                })
              }
            />
            <span className="text-sm font-medium">Italic</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={block.styles.underline || false}
              onChange={(e) =>
                onUpdate({
                  styles: { ...block.styles, underline: e.target.checked },
                })
              }
            />
            <span className="text-sm font-medium">Underline</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Margin Top (px)
          </label>
          <input
            type="number"
            value={block.styles.marginTop}
            onChange={(e) =>
              onUpdate({
                styles: {
                  ...block.styles,
                  marginTop: parseInt(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Margin Bottom (px)
          </label>
          <input
            type="number"
            value={block.styles.marginBottom}
            onChange={(e) =>
              onUpdate({
                styles: {
                  ...block.styles,
                  marginBottom: parseInt(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Background Color
          </label>
          <input
            type="color"
            value={block.styles.backgroundColor || '#ffffff'}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, backgroundColor: e.target.value },
              })
            }
            className="w-full h-10 border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
};

const ImageBlockEditor: React.FC<{
  block: ImageBlock;
  onUpdate: (updates: Partial<Block>) => void;
}> = ({ block, onUpdate }) => {
  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Image Block Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="text"
            value={block.src}
            onChange={(e) => onUpdate({ src: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Width (px)</label>
          <input
            type="number"
            value={block.styles.width}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, width: parseInt(e.target.value) },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Height (px)</label>
          <input
            type="number"
            value={block.styles.height}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, height: parseInt(e.target.value) },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Border Radius (px)
          </label>
          <input
            type="number"
            value={block.styles.borderRadius}
            onChange={(e) =>
              onUpdate({
                styles: {
                  ...block.styles,
                  borderRadius: parseInt(e.target.value),
                },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
};

const SpacerBlockEditor: React.FC<{
  block: SpacerBlock;
  onUpdate: (updates: Partial<Block>) => void;
}> = ({ block, onUpdate }) => {
  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Spacer Block Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Height (px)</label>
          <input
            type="number"
            value={block.styles.height}
            onChange={(e) =>
              onUpdate({
                styles: { ...block.styles, height: parseInt(e.target.value) },
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>
      </div>
    </div>
  );
};
