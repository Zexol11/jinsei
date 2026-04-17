'use client';

import { EditorContent, useEditor, Editor, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
  Heading1, Heading2, Heading3, 
  List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Image as ImageIcon, Loader2, Trash2
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Helper function to extract all Cloudinary Public IDs from a TipTap HTML string.
 */
export const extractPublicIds = (html: string) => {
  if (typeof document === 'undefined') return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('img[data-public-id]'))
    .map(img => img.getAttribute('data-public-id'))
    .filter((id): id is string => !!id);
};

export const extractPublicIdFromUrl = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  
  const postUpload = parts.slice(uploadIndex + 1);
  if (postUpload.length === 0) return null;
  
  const idParts = (postUpload[0].startsWith('v') && /^\d+$/.test(postUpload[0].slice(1))) 
    ? postUpload.slice(1) 
    : postUpload;

  const fileName = idParts.pop();
  if (!fileName) return null;
  const lastPart = fileName.split('.')[0];
  
  return [...idParts, lastPart].join('/');
};


function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const { src, alt, title, publicId, width } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);

  const [editorFocused, setEditorFocused] = useState(() => editor.isFocused);

  useEffect(() => {
    const onFocus = () => setEditorFocused(true);
    const onBlur  = () => setEditorFocused(false);
    editor.on('focus', onFocus);
    editor.on('blur',  onBlur);
    return () => {
      editor.off('focus', onFocus);
      editor.off('blur',  onBlur);
    };
  }, [editor]);

  const showUI = selected && editorFocused;

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = containerRef.current?.offsetWidth ?? 400;

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (ev.clientX - startX));
      updateAttributes({ width: `${newWidth}px` });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  return (
    <NodeViewWrapper
      as="div"
      className="relative inline-block my-6 max-w-full"
      style={{ width: width ?? 'auto' }}
      ref={containerRef}
      data-drag-handle
    >
      <img
        src={src}
        alt={alt || 'Journal entry image'}
        title={title ?? ''}
        data-public-id={publicId ?? undefined}
        className="rounded-xl w-full h-auto block border border-zinc-800 shadow-xl shadow-black/20 cursor-default"
        draggable={false}
      />

      {/* Resize handle — only visible when image is selected & editor is focused */}
      {showUI && (
        <>
          {/* Selection ring */}
          <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/60 pointer-events-none" />
          {/* Right drag handle */}
          <div
            onMouseDown={onResizeStart}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-12 bg-white rounded-full shadow-lg cursor-col-resize border border-zinc-300 flex items-center justify-center z-10 hover:bg-blue-100 transition-colors"
            title="Drag to resize"
          >
            {/* Grip dots */}
            <div className="flex flex-col gap-0.5">
              <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
              <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
              <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
            </div>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
}

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      publicId: {
        default: null,
        parseHTML: element => element.getAttribute('data-public-id'),
        renderHTML: attributes => {
          if (!attributes.publicId) return {};
          return { 'data-public-id': attributes.publicId };
        },
      },
      width: {
        default: null,
        parseHTML: element => element.getAttribute('data-width') || element.style.width || null,
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { 'data-width': attributes.width, style: `width: ${attributes.width}` };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});


interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
  onPublicIdsTracked?: (ids: string[]) => void;
  editable?: boolean;
}

const MenuBar = ({ editor, onImageUploaded }: { editor: Editor | null, onImageUploaded: (publicId: string) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        alert('Cloudinary environment variables are missing.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Upload failed');
      }

      const data = await res.json();

      (editor.chain().focus() as any).setImage({
        src: data.secure_url,
        publicId: data.public_id,
      }).run();

      onImageUploaded(data.public_id);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const btnStyle = (isOn: boolean): React.CSSProperties => ({
    padding: '0.375rem',
    borderRadius: '0.5rem',
    transition: 'color 0.1s, background 0.1s',
    background: isOn ? 'var(--surface-container-high)' : 'transparent',
    color: isOn ? 'var(--primary)' : 'var(--on-surface-dim)',
    cursor: 'pointer',
    border: 'none',
  });
  const sep = <div style={{ width: '1px', height: '1.25rem', background: 'var(--outline-variant)', margin: '0 4px', alignSelf: 'center' }} />;

  return (
    <div
      className="flex flex-wrap items-center gap-1 px-4 py-2 mt-4 mb-6 no-scrollbar overflow-x-auto rounded-xl"
      style={{ 
        background: 'var(--surface-container)', 
        border: '1px solid color-mix(in srgb, var(--outline-variant) 40%, transparent)' 
      }}
    >
      {/* Formatting */}
      <div className="flex gap-0.5 items-center">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}      style={btnStyle(editor.isActive('bold'))}      title="Bold"><Bold size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}    style={btnStyle(editor.isActive('italic'))}    title="Italic"><Italic size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btnStyle(editor.isActive('underline'))} title="Underline"><UnderlineIcon size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()}    style={btnStyle(editor.isActive('strike'))}    title="Strikethrough"><Strikethrough size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()}      style={btnStyle(editor.isActive('code'))}      title="Code"><Code size={15} /></button>
      </div>

      {sep}

      {/* Headings */}
      <div className="flex gap-0.5 items-center">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={btnStyle(editor.isActive('heading', { level: 1 }))} title="H1"><Heading1 size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive('heading', { level: 2 }))} title="H2"><Heading2 size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btnStyle(editor.isActive('heading', { level: 3 }))} title="H3"><Heading3 size={15} /></button>
      </div>

      {sep}

      {/* Alignment */}
      <div className="flex gap-0.5 items-center">
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()}    style={btnStyle(editor.isActive({ textAlign: 'left' }))}    title="Align Left"><AlignLeft size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()}  style={btnStyle(editor.isActive({ textAlign: 'center' }))}  title="Center"><AlignCenter size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()}   style={btnStyle(editor.isActive({ textAlign: 'right' }))}   title="Align Right"><AlignRight size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} style={btnStyle(editor.isActive({ textAlign: 'justify' }))} title="Justify"><AlignJustify size={15} /></button>
      </div>

      {sep}

      {/* Lists */}
      <div className="flex gap-0.5 items-center">
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}  style={btnStyle(editor.isActive('bulletList'))}  title="Bullet List"><List size={15} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive('orderedList'))} title="Ordered List"><ListOrdered size={15} /></button>
      </div>

      {sep}

      {/* Image upload */}
      <div className="flex gap-0.5 items-center">
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={btnStyle(false)}
          title="Upload image"
        >
          {isUploading ? <Loader2 size={15} className="animate-spin" style={{ color: 'var(--primary-dim)' }} /> : <ImageIcon size={15} />}
        </button>
      </div>
    </div>
  );
};

export default function JournalEditor({ content, onChange, onPublicIdsTracked, editable = true }: JournalEditorProps) {
  const trackedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (content) {
      const initialIds = extractPublicIds(content);
      initialIds.forEach(id => trackedIdsRef.current.add(id));
      onPublicIdsTracked?.(Array.from(trackedIdsRef.current));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewIdTracked = (id: string) => {
    trackedIdsRef.current.add(id);
    onPublicIdsTracked?.(Array.from(trackedIdsRef.current));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CustomImage.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      BubbleMenuExtension.configure({
        shouldShow: ({ editor }) => editor.isActive('image'),
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-md max-w-none min-h-[300px] py-4 outline-none leading-relaxed',
        style: [
          `color: var(--on-surface)`,
          `font-family: 'Noto Serif', serif`,
          `font-size: 1rem`,
        ].join(';'),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  return (
    <div className="relative" style={{ background: 'transparent' }}>
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor }: { editor: Editor }) => editor.isActive('image')}
        >
          <div
            className="flex rounded-xl shadow-lg overflow-hidden"
            style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)' }}
          >
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={14} />
              Remove image
            </button>
          </div>
        </BubbleMenu>
      )}
      {editable && <MenuBar editor={editor} onImageUploaded={handleNewIdTracked} />}
      <div 
        className="rounded-2xl px-5 py-6 sm:px-8 sm:py-8 transition-colors duration-300"
        style={{
          background: 'color-mix(in srgb, var(--surface-container) 60%, transparent)',
          border: '1px solid color-mix(in srgb, var(--outline-variant) 30%, transparent)'
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
