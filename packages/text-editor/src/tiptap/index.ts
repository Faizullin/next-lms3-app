// TipTap Editor - Manual exports

// === COMPONENTS ===

// Templates
export * from "./components/tiptap-templates/simple/simple-editor";
export * from "./components/tiptap-templates/content/content-editor";
export * from "./components/tiptap-templates/notion-content/notion-content-editor";
export * from "./components/tiptap-templates/notion-like/notion-like-editor";
export * from "./components/tiptap-templates/simple/theme-toggle";

// UI Components
export {
  BlockquoteButton,
  useBlockquote,
} from "./components/tiptap-ui/blockquote-button";
export {
  CodeBlockButton,
  useCodeBlock,
} from "./components/tiptap-ui/code-block-button";
export {
  ColorHighlightButton,
  useColorHighlight,
} from "./components/tiptap-ui/color-highlight-button";
export { ColorHighlightPopover } from "./components/tiptap-ui/color-highlight-popover";
export {
  HeadingButton,
  useHeading,
} from "./components/tiptap-ui/heading-button";
export {
  HeadingDropdownMenu,
  useHeadingDropdownMenu,
} from "./components/tiptap-ui/heading-dropdown-menu";
export {
  ImageUploadButton,
  useImageUpload,
} from "./components/tiptap-ui/image-upload-button";
export {
  LinkPopover,
  useLinkPopover,
} from "./components/tiptap-ui/link-popover";
export { ListButton, useList } from "./components/tiptap-ui/list-button";
export { ListDropdownMenu } from "./components/tiptap-ui/list-dropdown-menu";
export { useListDropdownMenu } from "./components/tiptap-ui/list-dropdown-menu/use-list-dropdown-menu";
export { MarkButton, useMark } from "./components/tiptap-ui/mark-button";
export {
  TextAlignButton,
  useTextAlign,
} from "./components/tiptap-ui/text-align-button";
export {
  UndoRedoButton,
  useUndoRedo,
} from "./components/tiptap-ui/undo-redo-button";

// UI Primitives
export * from "./components/tiptap-ui-primitive/badge";
export * from "./components/tiptap-ui-primitive/button";
export * from "./components/tiptap-ui-primitive/card";
export * from "./components/tiptap-ui-primitive/dropdown-menu";
export * from "./components/tiptap-ui-primitive/input";
export * from "./components/tiptap-ui-primitive/popover";
export * from "./components/tiptap-ui-primitive/separator";
export * from "./components/tiptap-ui-primitive/spacer";
export * from "./components/tiptap-ui-primitive/toolbar";
export * from "./components/tiptap-ui-primitive/tooltip";

// Icons
export { AlignCenterIcon } from "./components/tiptap-icons/align-center-icon";
export { AlignJustifyIcon } from "./components/tiptap-icons/align-justify-icon";
export { AlignLeftIcon } from "./components/tiptap-icons/align-left-icon";
export { AlignRightIcon } from "./components/tiptap-icons/align-right-icon";
export { ArrowLeftIcon } from "./components/tiptap-icons/arrow-left-icon";
export { BanIcon } from "./components/tiptap-icons/ban-icon";
export { BlockquoteIcon } from "./components/tiptap-icons/blockquote-icon";
export { BoldIcon } from "./components/tiptap-icons/bold-icon";
export { ChevronDownIcon } from "./components/tiptap-icons/chevron-down-icon";
export { CloseIcon } from "./components/tiptap-icons/close-icon";
export { CodeBlockIcon } from "./components/tiptap-icons/code-block-icon";
export { Code2Icon } from "./components/tiptap-icons/code2-icon";
export { CornerDownLeftIcon } from "./components/tiptap-icons/corner-down-left-icon";
export { ExternalLinkIcon } from "./components/tiptap-icons/external-link-icon";
export { HeadingFiveIcon } from "./components/tiptap-icons/heading-five-icon";
export { HeadingFourIcon } from "./components/tiptap-icons/heading-four-icon";
export { HeadingIcon } from "./components/tiptap-icons/heading-icon";
export { HeadingOneIcon } from "./components/tiptap-icons/heading-one-icon";
export { HeadingSixIcon } from "./components/tiptap-icons/heading-six-icon";
export { HeadingThreeIcon } from "./components/tiptap-icons/heading-three-icon";
export { HeadingTwoIcon } from "./components/tiptap-icons/heading-two-icon";
export { HighlighterIcon } from "./components/tiptap-icons/highlighter-icon";
export { ImagePlusIcon } from "./components/tiptap-icons/image-plus-icon";
export { ItalicIcon } from "./components/tiptap-icons/italic-icon";
export { LinkIcon } from "./components/tiptap-icons/link-icon";
export { VideoIcon } from "./components/tiptap-icons/video-icon";
export { ListIcon } from "./components/tiptap-icons/list-icon";
export { ListOrderedIcon } from "./components/tiptap-icons/list-ordered-icon";
export { ListTodoIcon } from "./components/tiptap-icons/list-todo-icon";
export { MoonStarIcon } from "./components/tiptap-icons/moon-star-icon";
export { Redo2Icon } from "./components/tiptap-icons/redo2-icon";
export { StrikeIcon } from "./components/tiptap-icons/strike-icon";
export { SubscriptIcon } from "./components/tiptap-icons/subscript-icon";
export { SunIcon } from "./components/tiptap-icons/sun-icon";
export { SuperscriptIcon } from "./components/tiptap-icons/superscript-icon";
export { TrashIcon } from "./components/tiptap-icons/trash-icon";
export { UnderlineIcon } from "./components/tiptap-icons/underline-icon";
export { Undo2Icon } from "./components/tiptap-icons/undo2-icon";
export { ImageIcon } from "./components/tiptap-icons/image-icon";

// MY
export { SparklesIcon } from "./components/tiptap-icons/sparkles-icon";
export { Wand2Icon } from "./components/tiptap-icons/wand2-icon";
export { FileTextIcon } from "./components/tiptap-icons/file-text-icon";
export { ExpandIcon } from "./components/tiptap-icons/expand-icon";
export { LanguagesIcon } from "./components/tiptap-icons/languages-icon";
export { CheckCircleIcon } from "./components/tiptap-icons/check-circle-icon";
export { SettingsIcon } from "./components/tiptap-icons/settings-icon";
// ENDMY

// Node Extensions
export { default as ImageUploadNodeExtension } from "./components/tiptap-node/image-upload-node/image-upload-node-extension";
export * from "./components/tiptap-node/image-upload-node";

// === HOOKS ===
export * from "@workspace/text-editor/tiptap/hooks/use-composed-ref";
export * from "@workspace/text-editor/tiptap/hooks/use-cursor-visibility";
export * from "@workspace/text-editor/tiptap/hooks/use-element-rect";
export * from "@workspace/text-editor/tiptap/hooks/use-menu-navigation";
export * from "@workspace/text-editor/tiptap/hooks/use-mobile";
export * from "@workspace/text-editor/tiptap/hooks/use-scrolling";
export * from "@workspace/text-editor/tiptap/hooks/use-throttled-callback";
export * from "@workspace/text-editor/tiptap/hooks/use-tiptap-editor";
export * from "@workspace/text-editor/tiptap/hooks/use-unmount";
export * from "@workspace/text-editor/tiptap/hooks/use-window-size";

// === UTILITIES ===
export * from "@workspace/text-editor/tiptap/lib/tiptap-utils";
export * from "@workspace/text-editor/tiptap/utils/ai-api-template";

// === AI COMPONENTS ===
export { NotionEditor } from "@workspace/text-editor/tiptap/components/tiptap-templates/notion-like/notion-like-editor";

// === AI TYPES ===
export * from "@workspace/text-editor/tiptap/types/ai-types";

// === CUSTOM COMPONENTS ===
export * from "@workspace/text-editor/tiptap/components/custom/media-dropdown";
