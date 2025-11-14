import { create } from 'zustand';
import { createDefaultImageBlock, createDefaultSlide, createDefaultSpacerBlock, createDefaultTextBlock, createDefaultRow } from '../utils/defaults';
import type { Block, LayoutType, Project, TextBlock, ImageBlock, SpacerBlock } from '../utils/schema';

interface EditorState {
  project: Project;
  currentSlideIndex: number;
  selectedBlockId: string | null;
  dragInsertAfter: boolean;

  setCurrentSlide: (index: number) => void;
  setSelectedBlock: (blockId: string | null) => void;
  setDragInsertAfter: (after: boolean) => void;

  addSlide: () => void;
  duplicateSlide: (index: number) => void;
  deleteSlide: (index: number) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;

  addRow: (slideIndex: number, layout: LayoutType) => void;
  removeRow: (slideIndex: number, rowIndex: number) => void;
  updateRowLayout: (slideIndex: number, rowIndex: number, layout: LayoutType) => void;

  addBlock: (slideIndex: number, rowIndex: number, columnIndex: number, blockType: 'title' | 'paragraph' | 'image' | 'spacer') => void;
  addBlockAt: (slideIndex: number, rowIndex: number, columnIndex: number, blockType: 'title' | 'paragraph' | 'image' | 'spacer', insertIndex: number) => void;
  updateBlock: (slideIndex: number, rowIndex: number, columnIndex: number, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (slideIndex: number, rowIndex: number, columnIndex: number, blockId: string) => void;
  reorderBlocks: (slideIndex: number, rowIndex: number, columnIndex: number, fromIndex: number, toIndex: number) => void;
  moveBlock: (slideIndex: number, fromRowIndex: number, fromColumnIndex: number, blockId: string, toRowIndex: number, toColumnIndex: number, toIndex: number) => void;

  getProject: () => Project;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: {
    slides: [createDefaultSlide()],
  },
  currentSlideIndex: 0,
  selectedBlockId: null,
  dragInsertAfter: false,

  setCurrentSlide: (index) => set({ currentSlideIndex: index, selectedBlockId: null }),

  setSelectedBlock: (blockId) => set({ selectedBlockId: blockId }),
  setDragInsertAfter: (after) => set({ dragInsertAfter: after }),

  addSlide: () => set((state) => ({
    project: {
      slides: [...state.project.slides, createDefaultSlide()],
    },
    currentSlideIndex: state.project.slides.length,
  })),

  duplicateSlide: (index) => set((state) => {
    const slideToDuplicate = state.project.slides[index];
    const newSlide = JSON.parse(JSON.stringify(slideToDuplicate));
    newSlide.id = `slide-${Date.now()}`;

    const newSlides = [...state.project.slides];
    newSlides.splice(index + 1, 0, newSlide);

    return {
      project: { slides: newSlides },
      currentSlideIndex: index + 1,
    };
  }),

  deleteSlide: (index) => set((state) => {
    if (state.project.slides.length === 1) return state;

    const newSlides = state.project.slides.filter((_, i) => i !== index);
    const newCurrentIndex = Math.min(state.currentSlideIndex, newSlides.length - 1);

    return {
      project: { slides: newSlides },
      currentSlideIndex: newCurrentIndex,
    };
  }),

  reorderSlides: (fromIndex, toIndex) => set((state) => {
    const newSlides = [...state.project.slides];
    const [movedSlide] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, movedSlide);

    return {
      project: { slides: newSlides },
      currentSlideIndex: toIndex,
    };
  }),

  addRow: (slideIndex, layout) => set((state) => {
    const newSlides = [...state.project.slides];
    const slide = newSlides[slideIndex];
    slide.rows = [...slide.rows, createDefaultRow(layout)];
    return { project: { slides: newSlides } };
  }),

  removeRow: (slideIndex, rowIndex) => set((state) => {
    const newSlides = [...state.project.slides];
    const slide = newSlides[slideIndex];
    slide.rows = slide.rows.filter((_, i) => i !== rowIndex);
    return { project: { slides: newSlides } };
  }),

  updateRowLayout: (slideIndex, rowIndex, layout) => set((state) => {
    const newSlides = [...state.project.slides];
    const slide = newSlides[slideIndex];
    const row = slide.rows[rowIndex];

    const columnCount = layout === 'one-column' ? 1 : layout === 'two-columns' ? 2 : 3;
    const currentColumnCount = row.columns.length;

    if (columnCount > currentColumnCount) {
      const additionalColumns = Array.from({ length: columnCount - currentColumnCount }, () => ({ items: [] }));
      row.columns = [...row.columns, ...additionalColumns];
    } else if (columnCount < currentColumnCount) {
      row.columns = row.columns.slice(0, columnCount);
    }

    row.layout = layout;
    return { project: { slides: newSlides } };
  }),

  addBlock: (slideIndex, rowIndex, columnIndex, blockType) => set((state) => {
    const newSlides = [...state.project.slides];
    const column = newSlides[slideIndex].rows[rowIndex].columns[columnIndex];

    let newBlock: Block;
    switch (blockType) {
      case 'title':
      case 'paragraph':
        newBlock = createDefaultTextBlock(blockType);
        break;
      case 'image':
        newBlock = createDefaultImageBlock();
        break;
      case 'spacer':
        newBlock = createDefaultSpacerBlock();
        break;
    }

    column.items.push(newBlock);

    return { project: { slides: newSlides }, selectedBlockId: newBlock.id };
  }),

  addBlockAt: (slideIndex, rowIndex, columnIndex, blockType, insertIndex) => set((state) => {
    const newSlides = [...state.project.slides];
    const column = newSlides[slideIndex].rows[rowIndex].columns[columnIndex];

    let newBlock: Block;
    switch (blockType) {
      case 'title':
      case 'paragraph':
        newBlock = createDefaultTextBlock(blockType);
        break;
      case 'image':
        newBlock = createDefaultImageBlock();
        break;
      case 'spacer':
        newBlock = createDefaultSpacerBlock();
        break;
    }

    const idx = Math.max(0, Math.min(insertIndex, column.items.length));
    column.items.splice(idx, 0, newBlock);

    return { project: { slides: newSlides }, selectedBlockId: newBlock.id };
  }),

  updateBlock: (slideIndex, rowIndex, columnIndex, blockId, updates) => set((state) => {
    const newSlides = [...state.project.slides];
    const column = newSlides[slideIndex].rows[rowIndex].columns[columnIndex];
    const blockIndex = column.items.findIndex((b) => b.id === blockId);

    if (blockIndex !== -1) {
      const current = column.items[blockIndex];
      if (current.type === 'title' || current.type === 'paragraph') {
        column.items[blockIndex] = { ...(current as TextBlock), ...(updates as Partial<TextBlock>) };
      } else if (current.type === 'image') {
        column.items[blockIndex] = { ...(current as ImageBlock), ...(updates as Partial<ImageBlock>) };
      } else if (current.type === 'spacer') {
        column.items[blockIndex] = { ...(current as SpacerBlock), ...(updates as Partial<SpacerBlock>) };
      }
    }

    return { project: { slides: newSlides } };
  }),

  deleteBlock: (slideIndex, rowIndex, columnIndex, blockId) => set((state) => {
    const newSlides = [...state.project.slides];
    const column = newSlides[slideIndex].rows[rowIndex].columns[columnIndex];
    column.items = column.items.filter((b) => b.id !== blockId);

    return { project: { slides: newSlides }, selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId };
  }),

  reorderBlocks: (slideIndex, rowIndex, columnIndex, fromIndex, toIndex) => set((state) => {
    const newSlides = [...state.project.slides];
    const column = newSlides[slideIndex].rows[rowIndex].columns[columnIndex];
    const [movedBlock] = column.items.splice(fromIndex, 1);
    column.items.splice(toIndex, 0, movedBlock);

    return { project: { slides: newSlides } };
  }),

  moveBlock: (slideIndex, fromRowIndex, fromColumnIndex, blockId, toRowIndex, toColumnIndex, toIndex) => set((state) => {
    const newSlides = [...state.project.slides];
    const fromColumn = newSlides[slideIndex].rows[fromRowIndex].columns[fromColumnIndex];
    const fromIdx = fromColumn.items.findIndex((b) => b.id === blockId);
    if (fromIdx === -1) return state;
    const [moved] = fromColumn.items.splice(fromIdx, 1);
    const toColumn = newSlides[slideIndex].rows[toRowIndex].columns[toColumnIndex];
    const insertIdx = Math.max(0, Math.min(toIndex, toColumn.items.length));
    toColumn.items.splice(insertIdx, 0, moved);

    return { project: { slides: newSlides }, selectedBlockId: moved.id };
  }),

  getProject: () => get().project,
}));
