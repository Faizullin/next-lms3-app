"use client";

import {
  AnyExtension,
  Editor,
  EditorContent,
  EditorContext,
  useEditor,
} from "@tiptap/react";
import * as React from "react";

// --- Tiptap Core Extensions ---
import { Highlight } from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Placeholder, Selection } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";

// --- UI Primitives ---

// --- Tiptap Node ---
// import { ImageUploadNode } from "../../tiptap-node/image-upload-node/image-upload-node-extension"
import "../../tiptap-node/blockquote-node/blockquote-node.scss";
import "../../tiptap-node/code-block-node/code-block-node.scss";
import "../../tiptap-node/heading-node/heading-node.scss";
import { HorizontalRule } from "../../tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "../../tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "../../tiptap-node/image-node/image-node.scss";
import "../../tiptap-node/list-node/list-node.scss";
import "../../tiptap-node/paragraph-node/paragraph-node.scss";
// import "../../tiptap-node/table-node/table-node.scss"

// --- Tiptap UI ---
import {
  SlashDropdownMenu,
  SlashMenuConfig,
} from "../../tiptap-ui/slash-dropdown-menu";

// --- Icons ---

// --- Components ---

// --- Styles ---
import "@workspace/text-editor/tiptap/components/tiptap-ui/paste-modal/paste-modal.scss";
import "./notion-content-editor.scss";

import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
import Mathematics from "@tiptap/extension-mathematics";
import Paragraph from "@tiptap/extension-paragraph";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import UniqueID from "@tiptap/extension-unique-id";
import Youtube from "@tiptap/extension-youtube";
import { TableHoverControls } from "@workspace/text-editor/tiptap/components/tiptap-ui/table-hover-controls/table-hover-controls";
import {
  AiProvider,
  useAi,
} from "@workspace/text-editor/tiptap/contexts/ai-context";
import { AppProvider } from "@workspace/text-editor/tiptap/contexts/app-context";
import { useCollab } from "@workspace/text-editor/tiptap/contexts/collab-context";
import useUiEditorState from "@workspace/text-editor/tiptap/hooks/use-ui-editor-state";
import { cn } from "@workspace/text-editor/tiptap/lib/tiptap-utils";
import { UiState } from "../../tiptap-extension/ui-state-extension";
import { AiMenu } from "../../tiptap-ui/ai-menu";
import { CodeBlockLanguageDropdown } from "../../tiptap-ui/code-block-language-dropdown/CodeBlockLanguageDropdown";
import { DragContextMenu } from "../../tiptap-ui/drag-context-menu";
import { EmojiDropdownMenu } from "../../tiptap-ui/emoji-dropdown-menu";
import { MathInputModal, useMathModal } from "../../tiptap-ui/math-input-modal";
import { PasteModal } from "../../tiptap-ui/paste-modal/paste-modal";
import { TapIndent } from "../../tiptap-ui/tap-indent/tap-indent";
import { LoadingSpinner } from "../notion-like/notion-like-editor";
import { MobileToolbar } from "../notion-like/notion-like-editor-mobile-toolbar";
import { NotionToolbarFloating } from "../notion-like/notion-like-editor-toolbar-floating";

import { Image } from "@tiptap/extension-image";
import {
  MediaBrowserNiceDialog,
  NiceModal,
} from "@workspace/components-library";
import VideoNodeExtension from "../../custom/video/video-node-extension";
import { ImageIcon } from "../../tiptap-icons/image-icon";
import { VideoIcon } from "../../tiptap-icons/video-icon";

interface EditorProviderProps {
  placeholder?: string;
  aiToken?: string | null;
  className?: ReturnType<typeof cn>;
  editable?: boolean;
  onChange?: (content: string) => void;
  onEditor?: (
    editor: Editor | null,
    meta: { reason: "create" | "destroy" },
  ) => void;
  extraExtensions?: AnyExtension[];
  extraSlashMenuConfig?: SlashMenuConfig;
}

function EditorProvider(props: EditorProviderProps) {
  const { placeholder = "Start writing...", editable = true } = props;

  const extensions = React.useMemo(() => {
    return [
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
        emojis: gitHubEmojis.filter(
          (emoji) => !emoji.name.includes("regional"),
        ),
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
      // ImageUploadNode.configure({
      //   accept: "image/*",
      //   maxSize: MAX_FILE_SIZE,
      //   limit: 3,
      //   upload: handleImageUpload,
      //   onError: (error) => console.error("Upload failed:", error),
      // }),
      UniqueID,
      Typography,
      UiState,
      Paragraph,
      // CodeBlockLowlight.configure({
      //   lowlight,
      //   defaultLanguage: 'javascript',
      // }),
      TapIndent,
      TableKit.configure({
        table: { resizable: true },
      }),
      Youtube,
      Image,
      VideoNodeExtension,
      ...(props.extraExtensions || []),
    ];
  }, [placeholder, props.extraExtensions]);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: "notion-content-editor",
      },
      // handlePaste(view, event) {
      //   const clipboardData = event.clipboardData
      //   if (!clipboardData) return false

      //   const imageFiles: File[] = []

      //   // Prefer files if available
      //   if (clipboardData.files && clipboardData.files.length > 0) {
      //     for (let i = 0; i < clipboardData.files.length; i++) {
      //       const file = clipboardData.files[i]
      //       if (file && file.type?.startsWith("image/")) {
      //         imageFiles.push(file)
      //       }
      //     }
      //   } else if (clipboardData.items && clipboardData.items.length > 0) {
      //     for (let i = 0; i < clipboardData.items.length; i++) {
      //       const item = clipboardData.items[i]
      //       if (item === undefined) {
      //         throw new Error("item is undefined")
      //       }
      //       if (item.kind === "file") {
      //         const file = item.getAsFile()
      //         if (file && file.type?.startsWith("image/")) {
      //           imageFiles.push(file)
      //         }
      //       }
      //     }
      //   }

      //   if (imageFiles.length === 0) {
      //     return false
      //   }

      //   // We will handle the paste ourselves
      //   event.preventDefault()

      //   imageFiles.forEach(async (file) => {
      //     try {
      //       const url = await handleImageUpload(file)
      //       const { state } = view
      //       if (!state.schema.nodes.image) {
      //         throw new Error("image node is undefined")
      //       }
      //       const imageNode = state.schema.nodes.image.create({
      //         src: url,
      //         alt: file.name?.replace(/\.[^/.]+$/, "") || "image",
      //         title: file.name || "image",
      //       })
      //       const tr = state.tr.replaceSelectionWith(imageNode).scrollIntoView()
      //       view.dispatch(tr)
      //     } catch (error) {
      //       console.error("Paste image upload failed:", error)
      //     }
      //   })

      //   return true
      // },
    },
    extensions,
    editable: editable,
    onUpdate: ({ editor }) => {
      if (props.onChange) {
        const currentContent = editor.getHTML();
        props.onChange(currentContent);
      }
    },
    onCreate: ({ editor }) => {
      if (props.onEditor) {
        props.onEditor(editor, { reason: "create" });
      }
    },
    onDestroy: () => {
      if (props.onEditor) {
        props.onEditor(null, { reason: "destroy" });
      }
    },
  });

  if (!editor) {
    return <LoadingSpinner />;
  }

  return (
    <div className={cn("notion-content-editor-wrapper", props.className)}>
      <EditorContext.Provider value={{ editor }}>
        <EditorContentArea extraSlashMenuConfig={props.extraSlashMenuConfig} />
      </EditorContext.Provider>
    </div>
  );
}

interface NotionContentEditorProps {
  // room: string
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
  extraExtensions?: AnyExtension[];
  extraSlashMenuConfig?: SlashMenuConfig;
}

/**
 * Full editor with all necessary providers, ready to use with just a room ID
 */
export function NotionContentEditor(props: NotionContentEditorProps) {
  return (
    // <UserProvider>
    <AppProvider>
      {/* //     <CollabProvider room={room}> */}
      <AiProvider>
        <NotionEditorContent {...props} />
      </AiProvider>
      {/* //     </CollabProvider> */}
    </AppProvider>
    // </UserProvider>
  );
}

/**
 * Internal component that handles the editor loading state
 */
function NotionEditorContent(props: NotionContentEditorProps) {
  const { provider, hasCollab } = useCollab();
  const { aiToken, hasAi } = useAi();

  // Show loading only if collab or AI features are enabled but tokens are still loading
  if ((hasCollab && !provider) || (hasAi && !aiToken)) {
    return <LoadingSpinner />;
  }

  return <EditorProvider aiToken={aiToken} {...props} />;
}

/**
 * EditorContent component that renders the actual editor
 */
function EditorContentArea(props: { extraSlashMenuConfig?: SlashMenuConfig }) {
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

  // // 에디터 내용을 JSON으로 추출하는 함수
  // const getDocumentAsJson = React.useCallback(() => {
  //   if (!editor) return

  //   try {
  //     // 에디터의 JSON 내용 가져오기
  //     const jsonContent = editor.getJSON()

  //     return jsonContent;

  //   } catch (error) {
  //     console.error('에디터 내용 추출 중 오류 발생:', error)
  //   }
  // }, [editor])

  // // JSON 데이터로 에디터 내용을 설정하는 함수
  // const setEditorJsonData = React.useCallback((data: Record<string, unknown>) => {
  //   if (!editor) {
  //     console.error('에디터가 초기화되지 않았습니다.')
  //     return
  //   }

  //   try {
  //     // JSON 데이터를 에디터에 설정
  //     editor.commands.setContent(data)
  //   } catch (error) {
  //     console.error('에디터 내용 설정 중 오류 발생:', error)
  //   }
  // }, [editor])
  // // JSON 데이터로 에디터 내용을 설정하는 함수
  // const setEditorJsonDataRead = React.useCallback((data: Record<string, unknown>) => {
  //   if (!editor) {
  //     console.error('에디터가 초기화되지 않았습니다.')
  //     return
  //   }

  //   try {
  //     // JSON 데이터를 에디터에 설정
  //     editor.commands.setContent(data)
  //     editor.setEditable(false)
  //   } catch (error) {
  //     console.error('에디터 내용 설정 중 오류 발생:', error)
  //   }
  // }, [editor])

  // // 부모 윈도우로 데이터를 전송하는 함수
  // const sendToParent = React.useCallback(
  //   (type: string, data: Record<string, unknown>) => {
  //     if (window.parent && window.parent !== window) {
  //       console.log('DEBUG - sendToParent', data)
  //       window.parent.postMessage(
  //         {
  //           type: 'EDITOR_JSON_DATA',
  //           data,
  //           source: 'notion-like-editor',
  //           payload: data,
  //         },
  //         '*'
  //       )
  //     }
  //   },
  //   []
  // )

  // // 부모로부터 메시지를 받는 리스너
  // React.useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     console.log(event)
  //     if (event.data && event.data.type) {
  //       switch (event.data.type) {
  //         case 'EDITOR_JSON_DATA':
  //           // 부모가 현재 문서 내용을 요청할 때
  //           const jsonData = getDocumentAsJson();
  //           if (jsonData) {
  //             sendToParent('documentData', jsonData);
  //           }
  //           break;
  //         case 'SET_EDITOR_JSON_DATA':
  //           const data = event.data.data;
  //           console.log('DEBUG - SET_EDITOR_JSON_DATA', data)
  //           setEditorJsonData(data);
  //           break;
  //         case 'SET_EDITOR_JSON_DATA_READ':
  //           const dataRead = event.data.data;
  //           console.log('DEBUG - SET_EDITOR_JSON_DATA_FROM_PARENT', dataRead)
  //           setEditorJsonDataRead(dataRead);
  //           break;
  //         case 'change-color': {
  //           const isDark = event.data.color === 'dark'
  //           document.body.classList.toggle('code-dark', isDark)
  //           console.log(isDark)
  //           break;
  //         }
  //       }
  //     }
  //   };

  //   window.addEventListener('message', handleMessage);
  //   return () => window.removeEventListener('message', handleMessage);
  // }, [getDocumentAsJson, setEditorJsonData, setEditorJsonDataRead, sendToParent]);

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

  const slashMenuConfig = React.useMemo(() => {
    return {
      ...(props.extraSlashMenuConfig || {}),
    };
  }, [props.extraSlashMenuConfig]);

  if (!editor) {
    return null;
  }

  return (
    <>
      {modalProps && <MathInputModal {...modalProps} />}
      {/* <Toolbar
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
          <NotionMainToolbarContent
            onHighlighterClick={() => setMobileView("highlighter")}
            onLinkClick={() => setMobileView("link")}
            isMobile={isMobile}
            editor={editor}
          />
        ) : (
          <NotionMobileToolbarContent
            type={mobileView === "highlighter" ? "highlighter" : "link"}
            onBack={() => setMobileView("main")}
          />
        )}
      </Toolbar> */}
      <EditorContent
        editor={editor}
        role="presentation"
        className="notion-content-editor-content"
        style={{
          cursor: editor.view.dragging ? "grabbing" : "auto",
        }}
        spellCheck={false}
      >
        <MobileToolbar />
        <DragContextMenu />
        <AiMenu />
        <EmojiDropdownMenu />
        <SlashDropdownMenu config={slashMenuConfig} />
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
