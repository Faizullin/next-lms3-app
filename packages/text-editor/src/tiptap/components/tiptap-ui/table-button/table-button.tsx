import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import { TableIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/table-icon";
import "./table-button.scss";

interface TableButtonProps {
  editor: Editor | null;
}

export const TableButton: React.FC<TableButtonProps> = ({ editor }) => {
  if (!editor) return null;

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <Button
      onClick={insertTable}
      disabled={!editor.can().insertTable()}
      className={editor.isActive("table") ? "is-active" : ""}
      title="Insert table"
    >
      <TableIcon />
    </Button>
  );
};
