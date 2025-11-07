"use client";

import { type Editor } from "@tiptap/react";
import { forwardRef } from "react";

// --- Hooks ---
import { useTiptapEditor } from "@workspace/text-editor/tiptap/hooks/use-tiptap-editor";

// --- Lib ---
import { parseShortcutKeys } from "@workspace/text-editor/tiptap/lib/tiptap-utils";

// --- Icons ---

// --- UI Primitives ---
import { Badge } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/badge";
import type { ButtonProps } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/dropdown-menu";

// --- Media Browser ---
import {
  MediaBrowserNiceDialog,
  NiceModal,
} from "@workspace/components-library";
import {
  Card,
  CardBody,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/card";
import { useCallback, useEffect, useState } from "react";
import { FileTextIcon } from "../tiptap-icons/file-text-icon";
import { ImagePlusIcon } from "../tiptap-icons/image-plus-icon";
import { VideoIcon } from "../tiptap-icons/video-icon";

interface MediaDropdownProps extends Omit<ButtonProps, "type"> {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean;
  /**
   * Whether to hide the button when media insertion is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
}

const MEDIA_DROPDOWN_SHORTCUT_KEY = "mod+shift+m";

/**
 * Determines if media can be inserted in the current editor state
 */
function canInsertMedia(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  return true; // Always allow media insertion
}

/**
 * Determines if any media is currently active/selected
 */
function isMediaActive(editor: Editor | null): boolean {
  if (!editor) return false;
  return editor.isActive("image") || editor.isActive("video");
}

/**
 * Determines if the media dropdown button should be shown
 */
function shouldShowMediaDropdown(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = props;

  if (hideWhenUnavailable) {
    return canInsertMedia(editor);
  }

  return true;
}

function MediaDropdownShortcutBadge({
  shortcutKeys = MEDIA_DROPDOWN_SHORTCUT_KEY,
}: {
  shortcutKeys?: string;
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

/**
 * Dropdown component for inserting media in a Tiptap editor.
 */
export const MediaDropdown = forwardRef<HTMLButtonElement, MediaDropdownProps>(
  (
    {
      text,
      hideWhenUnavailable = false,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor();
    const [isOpen, setIsOpen] = useState(false);
    const [isVisible, setIsVisible] = useState<boolean>(true);
    const label = "Insert media";
    const shortcutKeys = MEDIA_DROPDOWN_SHORTCUT_KEY;
    const Icon = ImagePlusIcon;
    const canInsert = canInsertMedia(editor);
    const isActive = isMediaActive(editor);

    useEffect(() => {
      if (!editor) return;
      const handleSelectionUpdate = () => {
        setIsVisible(shouldShowMediaDropdown({ editor, hideWhenUnavailable }));
      };
      handleSelectionUpdate();
      editor.on("selectionUpdate", handleSelectionUpdate);
      return () => {
        editor.off("selectionUpdate", handleSelectionUpdate);
      };
    }, [editor, hideWhenUnavailable]);

    const openMediaDialog = useCallback(
      async (fileType: string) => {
        try {
          const result = await NiceModal.show(MediaBrowserNiceDialog, {
            selectMode: true,
            selectedMedia: null,
            initialFileType: fileType,
          });
          if (result.reason === "submit") {
            if (editor && result.data.mimeType.startsWith("image/")) {
              editor
                .chain()
                .focus()
                .setImage({
                  src: result.data.url,
                  alt: result.data.caption || result.data.originalFileName,
                  title: result.data.caption || result.data.originalFileName,
                })
                .run();
            } else if (editor && result.data.mimeType.startsWith("video/")) {
              editor
                .chain()
                .focus()
                .setVideo({
                  src: result.data.url,
                  alt: result.data.caption || result.data.originalFileName,
                  title: result.data.caption || result.data.originalFileName,
                })
                .run();
            } else {
              alert("Unsupported media type");
            }
          }
          return result;
        } catch (error) {
          console.error("Failed to open media dialog:", error);
          return null;
        }
      },
      [editor],
    );

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!canInsert) return;
        setIsOpen(open);
      },
      [canInsert],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={isActive ? "on" : "off"}
            role="button"
            tabIndex={-1}
            disabled={!canInsert}
            data-disabled={!canInsert}
            aria-label={label}
            aria-pressed={isActive}
            tooltip={label}
            {...buttonProps}
            ref={ref}
          >
            {children ?? (
              <>
                <Icon className="tiptap-button-icon" />
                {text && <span className="tiptap-button-text">{text}</span>}
                {showShortcut && (
                  <MediaDropdownShortcutBadge shortcutKeys={shortcutKeys} />
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-48">
          <Card>
            <CardBody className="p-2">
              <div className="space-y-1">
                {/* Media Type Options - Smaller */}
                <Button
                  data-style="ghost"
                  className="w-full justify-start text-sm py-1.5"
                  onClick={async () => {
                    await openMediaDialog("image/");
                    setIsOpen(false);
                  }}
                >
                  <ImagePlusIcon className="mr-2 h-3.5 w-3.5" />
                  Image
                </Button>
                <Button
                  data-style="ghost"
                  className="w-full justify-start text-sm py-1.5"
                  onClick={async () => {
                    await openMediaDialog("video/");
                    setIsOpen(false);
                  }}
                >
                  <VideoIcon className="mr-2 h-3.5 w-3.5" />
                  Video
                </Button>
                <Button
                  data-style="ghost"
                  className="w-full justify-start text-sm py-1.5"
                  onClick={async () => {
                    await openMediaDialog("audio/");
                    setIsOpen(false);
                  }}
                >
                  <FileTextIcon className="mr-2 h-3.5 w-3.5" />
                  Audio
                </Button>
                <Button
                  data-style="ghost"
                  className="w-full justify-start text-sm py-1.5"
                  onClick={async () => {
                    await openMediaDialog("application/pdf");
                    setIsOpen(false);
                  }}
                >
                  <FileTextIcon className="mr-2 h-3.5 w-3.5" />
                  PDF
                </Button>
              </div>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

MediaDropdown.displayName = "MediaDropdown";
