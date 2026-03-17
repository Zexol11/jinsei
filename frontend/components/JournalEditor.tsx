'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react';
import { useEffect } from 'react';

interface JournalEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-zinc-800 bg-zinc-900/50 rounded-t-xl text-zinc-400">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition ${
          editor.isActive('bold') ? 'bg-zinc-800 text-white' : ''
        }`}
      >
        <Bold size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition ${
          editor.isActive('italic') ? 'bg-zinc-800 text-white' : ''
        }`}
      >
        <Italic size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition ${
          editor.isActive('strike') ? 'bg-zinc-800 text-white' : ''
        }`}
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px bg-zinc-800 my-1 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition ${
          editor.isActive('bulletList') ? 'bg-zinc-800 text-white' : ''
        }`}
      >
        <List size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-white transition ${
          editor.isActive('orderedList') ? 'bg-zinc-800 text-white' : ''
        }`}
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

export default function JournalEditor({ content, onChange, editable = true }: JournalEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[250px] p-4 sm:p-6 outline-none text-zinc-300',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep content in sync if passed from outside (e.g., initial load)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-zinc-800 bg-zinc-950 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-zinc-700 focus-within:border-transparent transition">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
