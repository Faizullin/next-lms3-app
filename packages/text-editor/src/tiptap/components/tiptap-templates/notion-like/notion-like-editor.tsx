"use client";

import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
// Collaboration imports removed for standalone mode

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { Placeholder, Selection } from "@tiptap/extensions";
// Collaboration extensions removed for standalone mode
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Mathematics } from "@tiptap/extension-mathematics";
import { UniqueID } from "@tiptap/extension-unique-id";
import { Emoji, gitHubEmojis } from "@tiptap/extension-emoji";

// --- Hooks ---
import { useUiEditorState } from "@workspace/text-editor/tiptap/hooks/use-ui-editor-state";

// --- Custom Extensions ---
import { HorizontalRule } from "@workspace/text-editor/tiptap/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import { UiState } from "@workspace/text-editor/tiptap/components/tiptap-extension/ui-state-extension";

// --- Tiptap Node ---
import { ImageUploadNode } from "@workspace/text-editor/tiptap/components/tiptap-node/image-upload-node/image-upload-node-extension";
import "@workspace/text-editor/tiptap/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@workspace/text-editor/tiptap/components/tiptap-node/code-block-node/code-block-node.scss";
import "@workspace/text-editor/tiptap/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@workspace/text-editor/tiptap/components/tiptap-node/list-node/list-node.scss";
import "@workspace/text-editor/tiptap/components/tiptap-node/image-node/image-node.scss";
import "@workspace/text-editor/tiptap/components/tiptap-node/heading-node/heading-node.scss";
import "@workspace/text-editor/tiptap/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { EmojiDropdownMenu } from "@workspace/text-editor/tiptap/components/tiptap-ui/emoji-dropdown-menu";
import { SlashDropdownMenu } from "@workspace/text-editor/tiptap/components/tiptap-ui/slash-dropdown-menu";
import { DragContextMenu } from "@workspace/text-editor/tiptap/components/tiptap-ui/drag-context-menu";
import { AiMenu } from "@workspace/text-editor/tiptap/components/tiptap-ui/ai-menu";
import {
  useMathModal,
  MathInputModal,
} from "@workspace/text-editor/tiptap/components/tiptap-ui/math-input-modal";
import { PasteModal } from "@workspace/text-editor/tiptap/components/tiptap-ui/paste-modal/paste-modal";

// --- Contexts ---
import { AppProvider } from "@workspace/text-editor/tiptap/contexts/app-context";
import { UserProvider } from "@workspace/text-editor/tiptap/contexts/user-context";
import {
  CollabProvider,
  useCollab,
} from "@workspace/text-editor/tiptap/contexts/collab-context";
import {
  AiProvider,
  useAi,
} from "@workspace/text-editor/tiptap/contexts/ai-context";

// --- Lib ---
import {
  handleImageUpload,
  MAX_FILE_SIZE,
} from "@workspace/text-editor/tiptap/lib/tiptap-utils";
import Paragraph from "@tiptap/extension-paragraph";
import { CodeBlockLanguageDropdown } from "@workspace/text-editor/tiptap/components/tiptap-ui/code-block-language-dropdown/CodeBlockLanguageDropdown";
import { TableKit } from "@tiptap/extension-table";

// --- Styles ---
import "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor.scss";
import "@workspace/text-editor/tiptap/components/tiptap-ui/paste-modal/paste-modal.scss";

// --- Content ---
import { MobileToolbar } from "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor-mobile-toolbar";
import { NotionToolbarFloating } from "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor-toolbar-floating";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import "highlight.js/styles/stackoverflow-dark.min.css";
import Youtube from "@tiptap/extension-youtube";

// 해당 부분에서 필요한 언어를 import 하여 lowlight에 적용할 수 있습니다.
import html from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import cpp from "highlight.js/lib/languages/cpp";
import json from "highlight.js/lib/languages/json";
import java from "highlight.js/lib/languages/java";
import c from "highlight.js/lib/languages/c";
import csharp from "highlight.js/lib/languages/csharp";
import sql from "highlight.js/lib/languages/sql";
import bash from "highlight.js/lib/languages/bash";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import scss from "highlight.js/lib/languages/scss";
import less from "highlight.js/lib/languages/less";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import swift from "highlight.js/lib/languages/swift";
import kotlin from "highlight.js/lib/languages/kotlin";
import { TapIndent } from "@workspace/text-editor/tiptap/components/tiptap-ui/tap-indent/tap-indent";
import { TableHoverControls } from "@workspace/text-editor/tiptap/components/tiptap-ui/table-hover-controls/table-hover-controls";

// removed unused React hooks imports

const lowlight = createLowlight();
lowlight.register("css", css);
lowlight.register("js", js);
lowlight.register("javascript", js);
lowlight.register("jsx", js);
lowlight.register("ts", ts);
lowlight.register("tsx", ts);
lowlight.register("typescript", ts);
lowlight.register("json", json);
lowlight.register("html", html);
lowlight.register("xml", html);
lowlight.register("python", python);
lowlight.register("cpp", cpp);
lowlight.register("c", c);
lowlight.register("java", java);
lowlight.register("csharp", csharp);
lowlight.register("sql", sql);
lowlight.register("bash", bash);
lowlight.register("markdown", markdown);
lowlight.register("php", php);
lowlight.register("ruby", ruby);
lowlight.register("scss", scss);
lowlight.register("less", less);
lowlight.register("go", go);
lowlight.register("rust", rust);
lowlight.register("swift", swift);
lowlight.register("kotlin", kotlin);

export interface NotionEditorProps {
  room: string;
  placeholder?: string;
}

export interface EditorProviderProps {
  placeholder?: string;
  aiToken?: string | null;
}

/**
 * Loading spinner component shown while connecting to the notion server
 */
export function LoadingSpinner({ text = "Connecting..." }: { text?: string }) {
  return (
    <div className="spinner-container">
      <div className="spinner-content">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="spinner-loading-text">{text}</div>
      </div>
    </div>
  );
}

/**
 * EditorContent component that renders the actual editor
 */
function EditorContentArea() {
  const { editor } = React.useContext(EditorContext)!;
  const {
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    aiGenerationHasMessage,
  } = useUiEditorState(editor);

  // 수식 모달 훅 사용
  const { modalProps } = useMathModal();

  // 붙여넣기 모달 상태
  const [pasteModalState, setPasteModalState] = React.useState({
    isOpen: false,
    content: "",
    position: null as { x: number; y: number } | null,
  });

  // 붙여넣기 모달 이벤트 리스너
  React.useEffect(() => {
    const handleShowPasteModal = (event: CustomEvent) => {
      const { content, position } = event.detail;
      setPasteModalState({
        isOpen: true,
        content,
        position,
      });
    };

    window.addEventListener(
      "show-paste-modal",
      handleShowPasteModal as EventListener,
    );

    return () => {
      window.removeEventListener(
        "show-paste-modal",
        handleShowPasteModal as EventListener,
      );
    };
  }, []);

  const handlePasteModalClose = React.useCallback(() => {
    setPasteModalState({
      isOpen: false,
      content: "",
      position: null,
    });
  }, []);

  // Selection based effect to handle AI generation acceptance
  React.useEffect(() => {
    if (!editor) return;

    if (
      !aiGenerationIsLoading &&
      aiGenerationIsSelection &&
      aiGenerationHasMessage
    ) {
      editor.commands.resetUiState();
      editor.commands.setCodeBlock();
      editor.commands.toggleCodeBlock();
    }
  }, [
    aiGenerationHasMessage,
    aiGenerationIsLoading,
    aiGenerationIsSelection,
    editor,
  ]);

  // 에디터 내용을 JSON으로 추출하는 함수
  const getDocumentAsJson = React.useCallback(() => {
    if (!editor) return;

    try {
      // 에디터의 JSON 내용 가져오기
      const jsonContent = editor.getJSON();

      return jsonContent;
    } catch (error) {
      console.error("에디터 내용 추출 중 오류 발생:", error);
    }
  }, [editor]);

  // JSON 데이터로 에디터 내용을 설정하는 함수
  const setEditorJsonData = React.useCallback(
    (data: Record<string, unknown>) => {
      if (!editor) {
        console.error("에디터가 초기화되지 않았습니다.");
        return;
      }

      try {
        // JSON 데이터를 에디터에 설정
        editor.commands.setContent(data);
      } catch (error) {
        console.error("에디터 내용 설정 중 오류 발생:", error);
      }
    },
    [editor],
  );
  // JSON 데이터로 에디터 내용을 설정하는 함수
  const setEditorJsonDataRead = React.useCallback(
    (data: Record<string, unknown>) => {
      if (!editor) {
        console.error("에디터가 초기화되지 않았습니다.");
        return;
      }

      try {
        // JSON 데이터를 에디터에 설정
        editor.commands.setContent(data);
        editor.setEditable(false);
      } catch (error) {
        console.error("에디터 내용 설정 중 오류 발생:", error);
      }
    },
    [editor],
  );

  // 부모 윈도우로 데이터를 전송하는 함수
  const sendToParent = React.useCallback(
    (type: string, data: Record<string, unknown>) => {
      if (window.parent && window.parent !== window) {
        console.log("DEBUG - sendToParent", data);
        window.parent.postMessage(
          {
            type: "EDITOR_JSON_DATA",
            data,
            source: "notion-like-editor",
            payload: data,
          },
          "*",
        );
      }
    },
    [],
  );

  // 부모로부터 메시지를 받는 리스너
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log(event);
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case "EDITOR_JSON_DATA":
            // 부모가 현재 문서 내용을 요청할 때
            const jsonData = getDocumentAsJson();
            if (jsonData) {
              sendToParent("documentData", jsonData);
            }
            break;
          case "SET_EDITOR_JSON_DATA":
            const data = event.data.data;
            console.log("DEBUG - SET_EDITOR_JSON_DATA", data);
            setEditorJsonData(data);
            break;
          case "SET_EDITOR_JSON_DATA_READ":
            const dataRead = event.data.data;
            console.log("DEBUG - SET_EDITOR_JSON_DATA_FROM_PARENT", dataRead);
            setEditorJsonDataRead(dataRead);
            break;
          case "change-color": {
            const isDark = event.data.color === "dark";
            document.body.classList.toggle("code-dark", isDark);
            console.log(isDark);
            break;
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    getDocumentAsJson,
    setEditorJsonData,
    setEditorJsonDataRead,
    sendToParent,
  ]);

  // iframe 프로젝트 코드 안에서
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // 또는 부모에게 알릴 수도 있음
        window.parent.postMessage({ type: "SAVE_PRESSED" }, "*");
      }
      window.parent.postMessage({ type: "IFRAME_KEYDOWN" }, "*");
    };

    document.addEventListener("keydown", handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <>
      {modalProps && <MathInputModal {...modalProps} />}
      <EditorContent
        editor={editor}
        role="presentation"
        className="notion-like-editor-content"
        style={{
          cursor: editor.view.dragging ? "grabbing" : "auto",
        }}
        spellCheck={false}
      >
        <MobileToolbar />
        <DragContextMenu />
        <AiMenu />
        <EmojiDropdownMenu />
        <SlashDropdownMenu />
        <NotionToolbarFloating />
        <CodeBlockLanguageDropdown editor={editor} />
        <TableHoverControls editor={editor} />
      </EditorContent>

      {/* 붙여넣기 모달 */}
      <PasteModal
        editor={editor}
        isOpen={pasteModalState.isOpen}
        onClose={handlePasteModalClose}
        pastedContent={pasteModalState.content}
        position={pasteModalState.position}
      />
    </>
  );
}

/**
 * Component that creates and provides the editor instance
 */
function EditorProvider(props: EditorProviderProps) {
  const { placeholder = "Start writing..." } = props;

  // Build extensions conditionally
  const extensions = [
    StarterKit.configure({
      horizontalRule: false,
      dropcursor: {
        width: 2,
      },
      link: { openOnClick: false },
    }),
    HorizontalRule,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({
      placeholder,
      emptyNodeClass: "is-empty with-slash",
    }),
    Emoji.configure({
      emojis: gitHubEmojis.filter((emoji) => !emoji.name.includes("regional")),
      forceFallbackImages: true,
    }),
    Mathematics.configure({
      inlineOptions: {
        onClick: (node, pos) => {
          if (!editor) return;
          const latex = prompt("수식을 수정하세요:", node.attrs.latex);
          if (latex !== null) {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateInlineMath({ latex })
              .focus()
              .run();
          }
        },
      },
      blockOptions: {
        onClick: (node, pos) => {
          if (!editor) return;
          const latex = prompt("수식을 수정하세요:", node.attrs.latex);
          if (latex !== null) {
            editor
              .chain()
              .setNodeSelection(pos)
              .updateBlockMath({ latex })
              .focus()
              .run();
          }
        },
      },
      katexOptions: {
        throwOnError: false,
        macros: {
          "\\R": "\\mathbb{R}",
          "\\N": "\\mathbb{N}",
          "\\Z": "\\mathbb{Z}",
          "\\Q": "\\mathbb{Q}",
          "\\C": "\\mathbb{C}",
        },
      },
    }),
    Superscript,
    Subscript,
    Color,
    TextStyle,
    TaskList,
    TaskItem.configure({ nested: true }),
    Highlight.configure({ multicolor: true }),
    Selection,
    Image,
    ImageUploadNode.configure({
      accept: "image/*",
      maxSize: MAX_FILE_SIZE,
      limit: 3,
      upload: handleImageUpload,
      onError: (error) => console.error("Upload failed:", error),
    }),
    UniqueID,
    Typography,
    UiState,
    Paragraph,
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: "javascript",
    }),
    TapIndent,
    TableKit.configure({
      table: { resizable: true },
    }),
    Youtube,
  ];

  // No collaboration extensions for standalone mode

  // AI extension removed for standalone mode

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: "notion-like-editor",
      },
      handlePaste(view, event) {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        const imageFiles: File[] = [];

        // Prefer files if available
        if (clipboardData.files && clipboardData.files.length > 0) {
          for (let i = 0; i < clipboardData.files.length; i++) {
            const file = clipboardData.files[i];
            if (file && file.type?.startsWith("image/")) {
              imageFiles.push(file);
            }
          }
        } else if (clipboardData.items && clipboardData.items.length > 0) {
          for (let i = 0; i < clipboardData.items.length; i++) {
            const item = clipboardData.items[i];
            if (item === undefined) {
              throw new Error("item is undefined");
            }
            if (item.kind === "file") {
              const file = item.getAsFile();
              if (file && file.type?.startsWith("image/")) {
                imageFiles.push(file);
              }
            }
          }
        }

        if (imageFiles.length === 0) {
          return false;
        }

        // We will handle the paste ourselves
        event.preventDefault();

        imageFiles.forEach(async (file) => {
          try {
            const url = await handleImageUpload(file);
            const { state } = view;
            if (!state.schema.nodes.image) {
              throw new Error("image node is undefined");
            }
            const imageNode = state.schema.nodes.image.create({
              src: url,
              alt: file.name?.replace(/\.[^/.]+$/, "") || "image",
              title: file.name || "image",
            });
            const tr = state.tr
              .replaceSelectionWith(imageNode)
              .scrollIntoView();
            view.dispatch(tr);
          } catch (error) {
            console.error("Paste image upload failed:", error);
          }
        });

        return true;
      },
    },
    extensions,
  });
  // removed unused addRow helper

  if (!editor) {
    return <LoadingSpinner />;
  }

  return (
    <div className="notion-like-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <EditorContentArea />
      </EditorContext.Provider>
    </div>
  );
}

/**
 * Full editor with all necessary providers, ready to use with just a room ID
 */
export function NotionEditor({
  room,
  placeholder = "Start writing...",
}: NotionEditorProps) {
  return (
    <UserProvider>
      <AppProvider>
        <CollabProvider room={room}>
          <AiProvider>
            <NotionEditorContent placeholder={placeholder} />
          </AiProvider>
        </CollabProvider>
      </AppProvider>
    </UserProvider>
  );
}

/**
 * Internal component that handles the editor loading state
 */
export function NotionEditorContent({ placeholder }: { placeholder?: string }) {
  const { provider, hasCollab } = useCollab();
  const { aiToken, hasAi } = useAi();

  // Show loading only if collab or AI features are enabled but tokens are still loading
  if ((hasCollab && !provider) || (hasAi && !aiToken)) {
    return <LoadingSpinner />;
  }

  return <EditorProvider placeholder={placeholder} aiToken={aiToken} />;
}
