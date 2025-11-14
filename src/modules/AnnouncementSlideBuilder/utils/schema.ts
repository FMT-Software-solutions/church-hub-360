export type BlockType = 'title' | 'paragraph' | 'image' | 'spacer';

export type LayoutType = 'one-column' | 'two-columns' | 'three-columns';

export interface TextStyles {
  fontSize: number;
  align: 'left' | 'center' | 'right';
  color: string;
  marginTop: number;
  marginBottom: number;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ImageStyles {
  width: number;
  height: number;
  borderRadius: number;
}

export interface SpacerStyles {
  height: number;
}

export interface TextBlock {
  id: string;
  type: 'title' | 'paragraph';
  content: string;
  styles: TextStyles;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  src: string;
  styles: ImageStyles;
}

export interface SpacerBlock {
  id: string;
  type: 'spacer';
  styles: SpacerStyles;
}

export type Block = TextBlock | ImageBlock | SpacerBlock;

export interface Column {
  items: Block[];
}

export interface Row {
  id: string;
  layout: LayoutType;
  columns: Column[];
}

export interface Slide {
  id: string;
  rows: Row[];
}

export interface Project {
  slides: Slide[];
}
