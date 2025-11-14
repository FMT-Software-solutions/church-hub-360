import { v4 as uuidv4 } from 'uuid';
import type { Slide, TextBlock, ImageBlock, SpacerBlock, LayoutType, Row } from './schema';

export const createDefaultTextBlock = (type: 'title' | 'paragraph'): TextBlock => ({
  id: uuidv4(),
  type,
  content: type === 'title' ? '<h1>New Title</h1>' : '<p>New paragraph</p>',
  styles: {
    fontSize: type === 'title' ? 32 : 16,
    align: 'left',
    color: '#000000',
    marginTop: 12,
    marginBottom: 16,
  },
});

export const createDefaultImageBlock = (): ImageBlock => ({
  id: uuidv4(),
  type: 'image',
  src: 'https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=400',
  styles: {
    width: 300,
    height: 200,
    borderRadius: 8,
  },
});

export const createDefaultSpacerBlock = (): SpacerBlock => ({
  id: uuidv4(),
  type: 'spacer',
  styles: {
    height: 40,
  },
});

export const createDefaultRow = (layout: LayoutType = 'one-column'): Row => {
  const columnCount = layout === 'one-column' ? 1 : layout === 'two-columns' ? 2 : 3;
  const columns = Array.from({ length: columnCount }, () => ({ items: [] }));
  return {
    id: uuidv4(),
    layout,
    columns,
  };
};

export const createDefaultSlide = (layout: LayoutType = 'one-column'): Slide => {
  return {
    id: uuidv4(),
    rows: [createDefaultRow(layout)],
  };
};
