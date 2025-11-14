# Announcement Slide Builder

A full-featured, modular slide builder with drag-and-drop, multi-slide support, and JSON export.

## Features

- **Multi-slide system** with thumbnails sidebar
- **Flexible layouts** (1, 2, or 3 columns)
- **Multiple block types**:
  - Text blocks (title/paragraph) with rich formatting
  - Image blocks with resize and border controls
  - Spacer blocks for layout spacing
- **Drag-and-drop** for blocks and slides
- **Block editing panel** with full style controls
- **Live preview mode** with fullscreen and arrow key navigation
- **JSON export** for saving and loading projects

## Tech Stack

- React + TypeScript
- TailwindCSS
- dnd-kit (drag & drop)
- Slate.js (rich text editing)
- react-rnd (resize)
- Zustand (state management)
- uuid (ID generation)

## Project Structure

```
src/
  components/
    AnnouncementEditor/
      index.tsx              - Main editor wrapper
      SlideEditor.tsx        - Canvas for editing current slide
      SlideThumbnail.tsx     - Individual slide thumbnail
      SlideSidebar.tsx       - Left sidebar with slide list
      Toolbar.tsx            - Top toolbar with layout options
      Column.tsx             - Column container with block buttons
      Block.tsx              - Block renderer (text/image/spacer)
      SortableBlock.tsx      - Wrapper for draggable blocks
      BlockEditorPanel.tsx   - Right panel for block properties

    AnnouncementRenderer/
      index.tsx              - Presentation mode wrapper
      SlideView.tsx          - Individual slide renderer

  state/
    editorStore.ts           - Zustand store for editor state

  utils/
    schema.ts                - TypeScript types
    defaults.ts              - Default block/slide creators
```

## Usage

```tsx
import { AnnouncementEditor } from './components/AnnouncementEditor';
import { AnnouncementRenderer } from './components/AnnouncementRenderer';

// Editor with onChange callback
<AnnouncementEditor onChange={(project) => console.log(project)} />

// Renderer for presentation mode
<AnnouncementRenderer slides={project.slides} onClose={() => setPreview(false)} />
```

## JSON Schema

```json
{
  "slides": [
    {
      "id": "slide-1",
      "layout": "two-columns",
      "columns": [
        {
          "items": [
            {
              "id": "block-1",
              "type": "title",
              "content": "<h1>Welcome</h1>",
              "styles": {
                "fontSize": 32,
                "align": "center",
                "color": "#000000",
                "marginTop": 12,
                "marginBottom": 16,
                "bold": true
              }
            }
          ]
        }
      ]
    }
  ]
}
```
