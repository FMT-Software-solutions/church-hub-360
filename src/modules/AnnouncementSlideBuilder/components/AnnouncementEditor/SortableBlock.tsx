import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
interface SortableBlockRenderProps {
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
  isDragging: boolean;
  listeners?: Record<string, any>;
}

interface SortableBlockProps {
  id: string;
  children: (props: SortableBlockRenderProps) => React.ReactNode;
}

export const SortableBlock: React.FC<SortableBlockProps> = ({
  id,
  children,
}) => {
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return <>{children({ setNodeRef, style, isDragging, listeners })}</>;
};
