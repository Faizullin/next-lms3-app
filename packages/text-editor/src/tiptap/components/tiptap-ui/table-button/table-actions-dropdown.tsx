import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/popover";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/toolbar";

interface TableActionsDropdownProps {
  editor?: Editor | null;
}

export const TableActionsDropdown: React.FC<TableActionsDropdownProps> = ({
  editor,
}) => {
  if (!editor) return null;
  const isInTable = editor.isActive("table");

  const addRowBefore = () => editor.chain().focus().addRowBefore().run();
  const addRowAfter = () => editor.chain().focus().addRowAfter().run();

  const addColumnBefore = () => editor.chain().focus().addColumnBefore().run();
  const addColumnAfter = () => editor.chain().focus().addColumnAfter().run();

  const mergeCells = () => editor.chain().focus().mergeCells().run();
  const splitCell = () => editor.chain().focus().splitCell().run();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          disabled={!isInTable}
          title="테이블 조작"
        >
          테이블 조작
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        alignOffset={4}
        sideOffset={4}
        asChild
      >
        <Toolbar variant="floating" tabIndex={0}>
          <ToolbarGroup>
            <Button
              onClick={addRowBefore}
              disabled={!editor.can().addRowBefore()}
              title="행 추가(위)"
            >
              행 ↑
            </Button>
            <Button
              onClick={addRowAfter}
              disabled={!editor.can().addRowAfter()}
              title="행 추가(아래)"
            >
              행 ↓
            </Button>
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <Button
              onClick={addColumnBefore}
              disabled={!editor.can().addColumnBefore()}
              title="열 추가(왼쪽)"
            >
              열 ←
            </Button>
            <Button
              onClick={addColumnAfter}
              disabled={!editor.can().addColumnAfter()}
              title="열 추가(오른쪽)"
            >
              열 →
            </Button>
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <Button
              onClick={mergeCells}
              disabled={!editor.can().mergeCells()}
              title="셀 병합"
            >
              셀 병합
            </Button>
            <Button
              onClick={splitCell}
              disabled={!editor.can().splitCell()}
              title="셀 분할"
            >
              셀 분할
            </Button>
          </ToolbarGroup>
        </Toolbar>
      </PopoverContent>
    </Popover>
  );
};
