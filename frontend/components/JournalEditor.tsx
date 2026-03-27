'use client';

import { EditorContent, useEditor, Editor } from '@tiptap/react';
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
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

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

// Extend the Image extension to support the data-public-id attribute
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      publicId: {
        default: null,
        parseHTML: element => element.getAttribute('data-public-id'),
        renderHTML: attributes => {
          if (!attributes.publicId) return {};
          return {
            'data-public-id': attributes.publicId,
          }
        },
      },
    }
  },
})

interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
  onPublicIdsTracked?: (ids: string[]) => void;
  editable?: boolean;
}

const MenuBar = ({ editor, onImageUploaded }: { editor: Editor | null, onImageUploaded: (publicId: string) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        alert('Cloudinary environment variables are missing.');
        setIsUploading(false);
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
        console.error('Cloudinary API Error:', errorData);
        throw new Error(errorData?.error?.message || 'Upload failed');
      }

      const data = await res.json();
      
      // Insert the image into the editor with its publicId
      (editor.chain().focus() as any).setImage({ 
        src: data.secure_url, 
        publicId: data.public_id 
      }).run();

      // Notify the component that a new ID has entered the session
      onImageUploaded(data.public_id);
      
    } catch (err) {
      console.error('Image upload failed:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to upload image: ${msg}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const activeBtnClass = "bg-zinc-800 text-white";
  const normalBtnClass = "text-zinc-400 hover:bg-zinc-800 hover:text-white";

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50 rounded-t-xl overflow-x-auto no-scrollbar">
      {/* Basic Text Formatting */}
      <div className="flex gap-1 items-center px-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('bold') ? activeBtnClass : normalBtnClass}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('italic') ? activeBtnClass : normalBtnClass}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('underline') ? activeBtnClass : normalBtnClass}`}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('strike') ? activeBtnClass : normalBtnClass}`}
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('code') ? activeBtnClass : normalBtnClass}`}
          title="Code"
        >
          <Code size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-800 my-auto mx-1 shrink-0" />

      {/* Headings */}
      <div className="flex gap-1 items-center px-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('heading', { level: 1 }) ? activeBtnClass : normalBtnClass}`}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('heading', { level: 2 }) ? activeBtnClass : normalBtnClass}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('heading', { level: 3 }) ? activeBtnClass : normalBtnClass}`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-800 my-auto mx-1 shrink-0" />

      {/* Alignment */}
      <div className="flex gap-1 items-center px-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'left' }) ? activeBtnClass : normalBtnClass}`}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'center' }) ? activeBtnClass : normalBtnClass}`}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'right' }) ? activeBtnClass : normalBtnClass}`}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive({ textAlign: 'justify' }) ? activeBtnClass : normalBtnClass}`}
          title="Justify"
        >
          <AlignJustify size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-800 my-auto mx-1 shrink-0" />

      {/* Lists */}
      <div className="flex gap-1 items-center px-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('bulletList') ? activeBtnClass : normalBtnClass}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg transition ${editor.isActive('orderedList') ? activeBtnClass : normalBtnClass}`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>

      <div className="w-px h-6 bg-zinc-800 my-auto mx-1 shrink-0" />

      {/* Cloudinary Image Upload */}
      <div className="flex gap-1 items-center px-1">
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`p-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${normalBtnClass}`}
          title="Upload image"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin text-blue-400" /> : <ImageIcon size={16} />}
        </button>
      </div>
    </div>
  );
};

export default function JournalEditor({ content, onChange, onPublicIdsTracked, editable = true }: JournalEditorProps) {
  const trackedIdsRef = useRef<Set<string>>(new Set());

  // On mount, track initial IDs
  useEffect(() => {
    if (content) {
      const initialIds = extractPublicIds(content);
      initialIds.forEach(id => trackedIdsRef.current.add(id));
      onPublicIdsTracked?.(Array.from(trackedIdsRef.current));
    }
  }, []); // Only on mount

  const handleNewIdTracked = (id: string) => {
    trackedIdsRef.current.add(id);
    onPublicIdsTracked?.(Array.from(trackedIdsRef.current));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full h-auto max-h-[500px] object-cover border border-zinc-800 shadow-xl shadow-black/20 my-6 cursor-pointer',
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
        class: 'prose prose-invert max-w-none min-h-[350px] p-4 sm:p-6 outline-none text-zinc-300 prose-headings:text-zinc-100 prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-code:text-blue-400 prose-code:bg-zinc-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep content in sync if passed from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-zinc-700 focus-within:border-transparent transition relative">
      {editor && (
        <BubbleMenu 
          editor={editor} 
          shouldShow={({ editor }: { editor: Editor }) => editor.isActive('image')}
        >
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl shadow-black/40 overflow-hidden">
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              Remove image
            </button>
          </div>
        </BubbleMenu>
      )}
      {editable && <MenuBar editor={editor} onImageUploaded={handleNewIdTracked} />}
      <EditorContent editor={editor} />
    </div>
  );
}
