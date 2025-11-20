import { SlideEditor as BuilderSlideEditor } from '@/modules/AnnouncementSlideBuilder/components/AnnouncementEditor/SlideEditor';
import { SlideSidebar } from '@/modules/AnnouncementSlideBuilder/components/AnnouncementEditor/SlideSidebar';
import { BlockToolbar } from '@/modules/AnnouncementSlideBuilder/components/AnnouncementEditor/BlockToolbar';
import { AnnouncementRenderer } from '@/modules/AnnouncementSlideBuilder/components/AnnouncementRenderer';
import { SlideView } from '@/modules/AnnouncementSlideBuilder/components/AnnouncementRenderer/SlideView';
import { useEditorStore } from '@/modules/AnnouncementSlideBuilder/state/editorStore';
import {
  createDefaultRow,
  createDefaultTextBlock,
  createDefaultSlide,
} from '@/modules/AnnouncementSlideBuilder/utils/defaults';
import type { Slide as BuilderSlide } from '@/modules/AnnouncementSlideBuilder/utils/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useAnnouncement,
  useUpdateAnnouncement,
} from '@/hooks/announcements/useAnnouncements';
import type { SlideDraft } from '@/types';
import { toPng } from 'html-to-image';
import { ArrowLeft, Download } from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { SingleBranchSelector } from '@/components/shared/BranchSelector';

export default function AnnouncementDetails() {
  const { announcementId } = useParams();
  const aQuery = useAnnouncement(announcementId || '');
  const updateAnnouncement = useUpdateAnnouncement();

  const [mode, setMode] = useState<'list' | 'presentation'>('list');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedJSONRef = useRef<string>('');
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [storeReady, setStoreReady] = useState(false);

  const projectSlides = useEditorStore((s) => s.project.slides);

  const toModuleSlides = (legacy: SlideDraft[]): BuilderSlide[] => {
    return legacy.map((s) => {
      const row = createDefaultRow('one-column');
      const items: any[] = [];
      if (s.title && s.title.trim().length) {
        const h = createDefaultTextBlock('title');
        h.content = `<h1>${s.title}</h1>`;
        items.push(h);
      }
      if (s.content_html && s.content_html.trim().length) {
        const p = createDefaultTextBlock('paragraph');
        p.content = s.content_html || '<p></p>';
        items.push(p);
      }
      row.columns[0].items = items as any;
      return { id: s.id, rows: [row] } as BuilderSlide;
    });
  };

  useEffect(() => {
    const raw = aQuery.data?.slides as unknown;
    if (typeof raw === 'undefined') return;
    let arr: any[] = [];
    if (Array.isArray(raw)) {
      arr = raw as any[];
    } else if (typeof raw === 'string') {
      const str = raw.trim();
      if (str.length > 0) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) arr = parsed;
        } catch {}
      }
    }
    let nextSlides: BuilderSlide[] = [];
    if (
      arr.length > 0 &&
      arr[0] &&
      typeof arr[0] === 'object' &&
      'rows' in (arr[0] as any)
    ) {
      nextSlides = arr as BuilderSlide[];
    } else {
      const legacyArr = (arr || []) as SlideDraft[];
      if (legacyArr.length === 0) {
        nextSlides = [createDefaultSlide()];
      } else {
        nextSlides = toModuleSlides(legacyArr);
      }
    }
    useEditorStore.setState({
      project: { slides: nextSlides },
      currentSlideIndex: 0,
      selectedBlockId: null,
    });
    lastSavedJSONRef.current = JSON.stringify(nextSlides);
    setHasUnsavedChanges(false);
    setStoreReady(true);
  }, [aQuery.data?.slides]);

  useEffect(() => {
    const json = JSON.stringify(projectSlides);
    setHasUnsavedChanges(json !== lastSavedJSONRef.current);
  }, [projectSlides]);

  const slides = useMemo(() => projectSlides, [projectSlides]);

  const saveAllSlides = async () => {
    if (!announcementId) return;
    try {
      const slidesJson = JSON.stringify(
        useEditorStore.getState().project.slides
      );
      await updateAnnouncement.mutateAsync({
        id: announcementId,
        updates: { slides: slidesJson },
      });
      lastSavedJSONRef.current = slidesJson;
      setHasUnsavedChanges(false);
    } catch {}
  };
  const downloadSlidesAsImages = async () => {
    const container = previewContainerRef.current;
    if (!container) return;
    for (let i = 0; i < slides.length; i++) {
      const holder = document.createElement('div');
      holder.style.width = '1280px';
      holder.style.height = '720px';
      holder.style.position = 'absolute';
      holder.style.left = '-9999px';
      container.appendChild(holder);
      const root = (await import('react-dom/client')).createRoot(holder);
      root.render(
        React.createElement(
          'div',
          { className: 'w-full h-full bg-white' },
          React.createElement(SlideView, { slide: slides[i] })
        )
      );
      await new Promise((r) => setTimeout(r, 300));
      const url = await toPng(holder as HTMLElement, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `slide-${i + 1}.png`;
      a.click();
      root.unmount();
      container.removeChild(holder);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {aQuery.data?.title || 'Announcement'}
        </h1>
        <div className="ml-auto flex gap-4 items-end">
          <div className="w-[280px]">
            <Label>Branch</Label>
            <SingleBranchSelector
              value={aQuery.data?.branch_id || undefined}
              onValueChange={async (v) => {
                if (!announcementId) return;
                try {
                  await updateAnnouncement.mutateAsync({
                    id: announcementId,
                    updates: { branch_id: v || null },
                  });
                } catch {}
              }}
              placeholder="All branches"
              allowClear
            />
          </div>
          <Button
            variant={mode === 'list' ? 'default' : 'outline'}
            onClick={() => setMode('list')}
          >
            Editor
          </Button>
          <Button
            variant={mode === 'presentation' ? 'default' : 'outline'}
            onClick={() => setMode('presentation')}
          >
            Presentation
          </Button>
        </div>
      </div>

      {mode === 'list' &&
        (storeReady ? (
          <div className="space-y-4">
            <p className="text-lg font-semibold pl-12 pr-2">
              Manage Announcement Slides
            </p>
            <Card className="p-0">
              <CardContent className="p-0">
                <div className="flex min-h-[560px]">
                  <div className="min-h-0 w-[200px]">
                    <SlideSidebar />
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="">
                      <BlockToolbar />
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto">
                      <BuilderSlideEditor />
                    </div>
                  </div>
                </div>
                <div className="border-t p-4 flex justify-between items-center">
                  {hasUnsavedChanges && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-destructive mr-2" />
                      Unsaved changes
                    </div>
                  )}
                  <Button
                    onClick={downloadSlidesAsImages}
                    variant="outline"
                    disabled={slides.length === 0}
                    className="ml-auto mr-2 hidden"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Images
                  </Button>
                  <Button
                    onClick={saveAllSlides}
                    disabled={
                      updateAnnouncement.isPending || !hasUnsavedChanges
                    }
                    className="ml-auto"
                  >
                    {updateAnnouncement.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* <div ref={previewContainerRef} /> */}
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-0">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">
                  Loading slides…
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

      {mode === 'presentation' && storeReady && (
        <div ref={previewContainerRef}>
          <AnnouncementRenderer
            slides={slides as BuilderSlide[]}
            onClose={() => setMode('list')}
          />
        </div>
      )}
    </div>
  );
}
