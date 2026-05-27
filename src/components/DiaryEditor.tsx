"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List } from "lucide-react";
import { useEffect, useCallback } from "react";
import { countWords } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  content: string;
  onChange: (html: string, wordCount: number) => void;
};

export function DiaryEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder: "How was your day?" }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html, countWords(html));
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  const toggle = useCallback(
    (cmd: () => void) => {
      cmd();
      if (editor) {
        const html = editor.getHTML();
        onChange(html, countWords(html));
      }
    },
    [editor, onChange]
  );

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card">
      <div className="flex gap-1 border-b border-card-border p-2">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => toggle(() => editor.chain().focus().toggleBold().run())}
          label="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => toggle(() => editor.chain().focus().toggleItalic().run())}
          label="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => toggle(() => editor.chain().focus().toggleBulletList().run())}
          label="Bullet list"
        >
          <List size={18} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="min-h-[220px] px-4 py-3" />
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-lg p-2 transition",
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-background"
      )}
    >
      {children}
    </button>
  );
}
