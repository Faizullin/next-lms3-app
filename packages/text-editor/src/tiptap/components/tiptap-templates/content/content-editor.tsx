"use client";

import { Editor, EditorContent, EditorContext, useEditor } from "@tiptap/react";
import * as React from "react";

// --- Tiptap Core Extensions ---
import { Highlight } from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Selection } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";
import { BubbleMenu } from "@tiptap/extension-bubble-menu";
import { FloatingMenu } from "@tiptap/extension-floating-menu";

// --- UI Primitives ---
import { Button } from "../../tiptap-ui-primitive/button";
import { Spacer } from "../../tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "../../tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
// import { ImageUploadNode } from "../../tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "../../tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "../../tiptap-node/blockquote-node/blockquote-node.scss";
import "../../tiptap-node/code-block-node/code-block-node.scss";
import "../../tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "../../tiptap-node/list-node/list-node.scss";
import "../../tiptap-node/image-node/image-node.scss";
import "../../tiptap-node/heading-node/heading-node.scss";
import "../../tiptap-node/paragraph-node/paragraph-node.scss";
import "../../tiptap-node/table-node/table-node.scss";

// --- Tiptap UI ---
import { MediaDropdown } from "../../custom/media-dropdown";
import { BlockquoteButton } from "../../tiptap-ui/blockquote-button";
import { CodeBlockButton } from "../../tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "../../tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "../../tiptap-ui/heading-dropdown-menu";
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "../../tiptap-ui/link-popover";
import { ListDropdownMenu } from "../../tiptap-ui/list-dropdown-menu";
import { MarkButton } from "../../tiptap-ui/mark-button";
import { TextAlignButton } from "../../tiptap-ui/text-align-button";
import { UndoRedoButton } from "../../tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "../../tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "../../tiptap-icons/highlighter-icon";
import { LinkIcon } from "../../tiptap-icons/link-icon";

// --- Hooks ---
import { useCursorVisibility } from "../../../hooks/use-cursor-visibility";
import { useIsMobile } from "../../../hooks/use-mobile";
import { useWindowSize } from "../../../hooks/use-window-size";

// --- Components ---
import { ThemeToggle } from "../../tiptap-templates/simple/theme-toggle";

// --- Lib ---

// --- Styles ---
import "../../tiptap-templates/content/content-editor.scss";

import VideoNodeExtension from "../../custom/video/video-node-extension";
import { cn } from "@workspace/text-editor/tiptap/lib/tiptap-utils";

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MediaDropdown text="Media" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export type ContentEditorRef = Editor;

export type ContentEditorProps = {
  initialContent?: string;
  onChange?: (content: string) => void;
  onEditor?: (
    editor: Editor | null,
    meta: {
      reason: "create" | "destroy";
    },
  ) => void;
  placeholder?: string;
  editable?: boolean;
  className?: ReturnType<typeof cn>;
  extensions?: any[];
};

export function ContentEditor({
  initialContent,
  onChange,
  onEditor,
  placeholder,
  editable = true,
  className,
  extensions = [],
}: ContentEditorProps) {
  const isMobile = useIsMobile();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main");
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const defaultExtensions = [
    StarterKit.configure({
      horizontalRule: false,
      link: {
        openOnClick: false,
        enableClickSelection: true,
      },
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Typography,
    Superscript,
    Subscript,
    Selection,
    VideoNodeExtension,
    BubbleMenu.configure({
      element: null,
    }),
    FloatingMenu.configure({
      element: null,
    }),
  ];

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        class: "content-editor",
        placeholder:
          placeholder || "Main content area, start typing to enter text.",
        "aria-label":
          placeholder || "Main content area, start typing to enter text.",
      },
    },
    extensions: [...defaultExtensions, ...extensions],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const currentContent = editor.getHTML();
        onChange(currentContent);
      }
    },
    onCreate: ({ editor }) => {
      if (onEditor) {
        onEditor(editor, { reason: "create" });
      }
    },
    onDestroy: () => {
      if (onEditor) {
        onEditor(null, { reason: "destroy" });
      }
    },
  });

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  return (
    <div className={cn("content-editor-wrapper", className)}>
      <EditorContext.Provider value={{ editor }}>
        {editable && (
          <Toolbar
            ref={toolbarRef}
            style={{
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${height - rect.y}px)`,
                  }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>
        )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="content-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}
