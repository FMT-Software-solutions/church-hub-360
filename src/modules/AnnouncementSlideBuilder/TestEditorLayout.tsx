import { useState } from 'react';
import { Eye } from 'lucide-react';
import { AnnouncementEditor } from './components/AnnouncementEditor';
import { AnnouncementRenderer } from './components/AnnouncementRenderer';
import { useEditorStore } from './state/editorStore';

export function TestAnnouncementEditorLayout() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { project } = useEditorStore();

  return (
    <div className="relative">
      {!isPreviewMode ? (
        <>
          <AnnouncementEditor
            onChange={(updatedProject) => {
              console.log('Project updated:', updatedProject);
            }}
          />
          <button
            onClick={() => setIsPreviewMode(true)}
            className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 z-50"
          >
            <Eye size={20} />
            Preview
          </button>
        </>
      ) : (
        <AnnouncementRenderer
          slides={project.slides}
          onClose={() => setIsPreviewMode(false)}
        />
      )}
    </div>
  );
}
