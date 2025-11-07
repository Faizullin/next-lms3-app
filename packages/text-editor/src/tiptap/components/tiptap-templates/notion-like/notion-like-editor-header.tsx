"use client";

import { ThemeToggle } from "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor-theme-toggle";

// --- Tiptap UI ---
import { UndoRedoButton } from "@workspace/text-editor/tiptap/components/tiptap-ui/undo-redo-button";

// --- UI Primitives ---
import { Spacer } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/spacer";
import { Separator } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/separator";
import { ButtonGroup } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";

// --- Styles ---
import "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor-header.scss";

import { CollaborationUsers } from "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor-collaboration-users";

export function NotionEditorHeader() {
  return (
    <header className="notion-like-editor-header">
      <Spacer />
      <div className="notion-like-editor-header-actions">
        <ButtonGroup orientation="horizontal">
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ButtonGroup>

        <Separator />

        <ThemeToggle />

        <Separator />

        <CollaborationUsers />
      </div>
    </header>
  );
}
