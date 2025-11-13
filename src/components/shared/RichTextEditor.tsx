import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import Heading from '@tiptap/extension-heading';
import OrderedList from '@tiptap/extension-ordered-list';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlock from '@tiptap/extension-code-block';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Code as CodeIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Palette,
  Eraser,
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string; // HTML
  onChange: (html: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      Color.configure({ types: ['textStyle'] }),
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
      StarterKit,
      Highlight,
      Link.configure({ openOnClick: true }),
      Image,
      Code.configure({
        HTMLAttributes: {
          class: 'rounded-xl px-3 py-1 bg-gray-100 dark:bg-gray-900 my-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'left',
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'pl-8',
        },
      }),

      OrderedList.configure({
        HTMLAttributes: {
          class: 'pl-8',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class:
            'bg-gray-100 dark:bg-gray-900 rounded-sm p-4 border border-gray-200 dark:border-gray-800 my-2',
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-3 outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value != null && value !== current) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  return (
    <div className="rounded-md border">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={
            editor ? !editor.can().chain().focus().toggleBold().run() : true
          }
          className={editor?.isActive('bold') ? 'bg-muted' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={
            editor ? !editor.can().chain().focus().toggleItalic().run() : true
          }
          className={editor?.isActive('italic') ? 'bg-muted' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={
            editor ? !editor.can().chain().focus().toggleStrike().run() : true
          }
          className={editor?.isActive('strike') ? 'bg-muted' : ''}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={
            editor
              ? !editor.can().chain().focus().toggleUnderline().run()
              : true
          }
          className={editor?.isActive('underline') ? 'bg-muted' : ''}
        >
          U
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleHighlight().run()}
          disabled={
            editor
              ? !editor.can().chain().focus().toggleHighlight().run()
              : true
          }
          className={editor?.isActive('highlight') ? 'bg-muted' : ''}
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          disabled={
            editor
              ? !editor.can().chain().focus().toggleHeading({ level: 1 }).run()
              : true
          }
          className={
            editor?.isActive('heading', { level: 1 }) ? 'bg-muted' : ''
          }
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          disabled={
            editor
              ? !editor.can().chain().focus().toggleHeading({ level: 2 }).run()
              : true
          }
          className={
            editor?.isActive('heading', { level: 2 }) ? 'bg-muted' : ''
          }
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          disabled={
            editor
              ? !editor.can().chain().focus().toggleHeading({ level: 3 }).run()
              : true
          }
          className={
            editor?.isActive('heading', { level: 3 }) ? 'bg-muted' : ''
          }
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          disabled={
            editor
              ? !editor.can().chain().focus().setTextAlign('left').run()
              : true
          }
          className={editor?.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          disabled={
            editor
              ? !editor.can().chain().focus().setTextAlign('center').run()
              : true
          }
          className={
            editor?.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''
          }
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          disabled={
            editor
              ? !editor.can().chain().focus().setTextAlign('right').run()
              : true
          }
          className={editor?.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={
            editor
              ? !editor.can().chain().focus().toggleBulletList().run()
              : true
          }
          className={editor?.isActive('bulletList') ? 'bg-muted' : ''}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={
            editor
              ? !editor.can().chain().focus().toggleOrderedList().run()
              : true
          }
          className={editor?.isActive('orderedList') ? 'bg-muted' : ''}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={
            editor
              ? !editor.can().chain().focus().toggleBlockquote().run()
              : true
          }
          className={editor?.isActive('blockquote') ? 'bg-muted' : ''}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          disabled={
            editor
              ? !editor.can().chain().focus().toggleCodeBlock().run()
              : true
          }
          className={editor?.isActive('codeBlock') ? 'bg-muted' : ''}
        >
          <CodeIcon className="h-4 w-4" />
        </Button>
        <Popover open={linkOpen} onOpenChange={setLinkOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <Input
                placeholder="https://"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    editor?.chain().focus().unsetLink().run();
                    setLinkOpen(false);
                  }}
                >
                  Unset
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (linkUrl.trim()) {
                      editor
                        ?.chain()
                        .focus()
                        .extendMarkRange('link')
                        .setLink({ href: linkUrl.trim() })
                        .run();
                    }
                    setLinkOpen(false);
                    setLinkUrl('');
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={imageOpen} onOpenChange={setImageOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <Input
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    if (imageUrl.trim()) {
                      editor
                        ?.chain()
                        .focus()
                        .setImage({ src: imageUrl.trim() })
                        .run();
                    }
                    setImageOpen(false);
                    setImageUrl('');
                  }}
                >
                  Insert
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="grid grid-cols-6 gap-2">
              {[
                '#111827',
                '#6b7280',
                '#ef4444',
                '#f59e0b',
                '#10b981',
                '#3b82f6',
                '#8b5cf6',
                '#ec4899',
                '#14b8a6',
                '#f97316',
                '#84cc16',
                '#64748b',
              ].map((c) => (
                <button
                  key={c}
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    editor?.chain().focus().setColor(c).run();
                    setColorOpen(false);
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={editor ? !editor.can().chain().focus().undo().run() : true}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={editor ? !editor.can().chain().focus().redo().run() : true}
        >
          <Redo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            editor?.chain().focus().unsetAllMarks().clearNodes().run()
          }
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
