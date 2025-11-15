import { useAnnouncementPublic } from '@/hooks/announcements/useAnnouncements';
import { AnnouncementRenderer } from '@/modules/AnnouncementSlideBuilder/components/AnnouncementRenderer';
import { createDefaultRow, createDefaultSlide, createDefaultTextBlock } from '@/modules/AnnouncementSlideBuilder/utils/defaults';
import type { Slide as BuilderSlide } from '@/modules/AnnouncementSlideBuilder/utils/schema';
import React from 'react';
import { useParams } from 'react-router-dom';

export default function AnnouncementPresent() {
  const { announcementId = '' } = useParams();
;
  const { data, isLoading, error } = useAnnouncementPublic(announcementId);

  const toModuleSlides = (legacy: any[]): BuilderSlide[] => {
    return legacy.map((s: any) => {
      const row = createDefaultRow('one-column');
      const items: any[] = [];
      if (s.title && String(s.title).trim().length) {
        const h = createDefaultTextBlock('title');
        h.content = `<h1>${s.title}</h1>`;
        items.push(h);
      }
      if (s.content_html && String(s.content_html).trim().length) {
        const p = createDefaultTextBlock('paragraph');
        p.content = s.content_html || '<p></p>';
        items.push(p);
      }
      row.columns[0].items = items as any;
      return { id: s.id, rows: [row] } as BuilderSlide;
    });
  };

  const slides: BuilderSlide[] = React.useMemo(() => {
    try {
      const arr = JSON.parse(data?.slides || '[]');
      if (Array.isArray(arr) && arr.length > 0 && arr[0] && typeof arr[0] === 'object' && 'rows' in (arr[0] as any)) {
        return arr as BuilderSlide[];
      }
      const legacyArr = Array.isArray(arr) ? arr : [];
      if (legacyArr.length === 0) return [createDefaultSlide()];
      return toModuleSlides(legacyArr);
    } catch {
      return [createDefaultSlide()];
    }
  }, [data?.slides]);

  if (isLoading) {
    return <div className="fixed inset-0 flex items-center justify-center">Loading…</div>;
  }
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center text-destructive">
        Failed to load announcement
      </div>
    );
  }

  return <AnnouncementRenderer slides={slides}  />;
}