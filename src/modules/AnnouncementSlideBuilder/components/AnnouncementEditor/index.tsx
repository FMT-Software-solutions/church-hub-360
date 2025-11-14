import React, { useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { SlideSidebar } from './SlideSidebar';
import { SlideEditor } from './SlideEditor';
import { BlockToolbar } from './BlockToolbar';
import { useEditorStore } from '../../state/editorStore';
import { type Project } from '../../utils/schema';

interface AnnouncementEditorProps {
  onChange?: (project: Project) => void;
}

export const AnnouncementEditor: React.FC<AnnouncementEditorProps> = ({ onChange }) => {
  const { project } = useEditorStore();

  useEffect(() => {
    if (onChange) {
      onChange(project);
    }
  }, [project, onChange]);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <BlockToolbar />
      <div className="flex-1 flex overflow-hidden">
        <SlideSidebar />
        <SlideEditor />
      </div>
    </div>
  );
};
