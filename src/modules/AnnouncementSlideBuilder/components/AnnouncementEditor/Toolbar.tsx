import React from 'react';
import { Download } from 'lucide-react';
import { useEditorStore } from '../../state/editorStore';

export const Toolbar: React.FC = () => {
  const {
    getProject,
  } = useEditorStore();


  const handleDownloadJSON = () => {
    const json = JSON.stringify(getProject(), null, 2);
    console.log('Project JSON:', json);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'announcement-slides.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Slide Builder</h1>
      </div>

      <button
        onClick={handleDownloadJSON}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        <Download size={18} />
        Download JSON
      </button>
    </div>
  );
};
