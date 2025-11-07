import { Editor } from "@tiptap/react";
import { useTiptapEditor } from "@workspace/text-editor/tiptap/hooks/use-tiptap-editor";
import React, { useState } from "react";
import { cn } from "../../../lib/tiptap-utils";
import { SettingsIcon } from "../../tiptap-icons/settings-icon";
import { Button } from "../../tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../tiptap-ui-primitive/popover";
import "./image-controls.scss";

export interface ImageControlsProps {
  className?: string;
  editor: Editor | null;
}

export const ImageControls: React.FC<ImageControlsProps> = ({
  className,
  editor: providedEditor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { editor } = useTiptapEditor(providedEditor);

  const handleWidthChange = (width: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && node.type.name === "image") {
      editor.chain().focus().updateAttributes("image", { width }).run();
    }
  };

  const handleHeightChange = (height: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && node.type.name === "image") {
      editor.chain().focus().updateAttributes("image", { height }).run();
    }
  };

  const handleAltChange = (alt: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && node.type.name === "image") {
      editor.chain().focus().updateAttributes("image", { alt }).run();
    }
  };

  const handleTitleChange = (title: string) => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && node.type.name === "image") {
      editor.chain().focus().updateAttributes("image", { title }).run();
    }
  };

  const handleResetSize = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && node.type.name === "image") {
      editor
        .chain()
        .focus()
        .updateAttributes("image", {
          width: null,
          height: null,
        })
        .run();
    }
  };

  // Get current image attributes
  const getCurrentImageAttrs = () => {
    if (!editor) return {};

    const { from, to } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && node.type.name === "image") {
      return node.attrs;
    }
    return {};
  };

  const currentAttrs = getCurrentImageAttrs();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn("image-controls-trigger", className)}
          data-active={isImageSelected}
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="image-controls-label">Image</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="image-controls-content" align="start">
        <div className="image-controls-section">
          <h4 className="image-controls-section-title">Image Properties</h4>

          <div className="image-controls-group">
            <label className="image-controls-label">Width</label>
            <input
              type="text"
              value={currentAttrs.width || ""}
              placeholder="auto"
              className="image-controls-input"
              onChange={(e) => handleWidthChange(e.target.value)}
            />
          </div>

          <div className="image-controls-group">
            <label className="image-controls-label">Height</label>
            <input
              type="text"
              value={currentAttrs.height || ""}
              placeholder="auto"
              className="image-controls-input"
              onChange={(e) => handleHeightChange(e.target.value)}
            />
          </div>

          <div className="image-controls-group">
            <label className="image-controls-label">Alt Text</label>
            <input
              type="text"
              value={currentAttrs.alt || ""}
              placeholder="Image description..."
              className="image-controls-input"
              onChange={(e) => handleAltChange(e.target.value)}
            />
          </div>

          <div className="image-controls-group">
            <label className="image-controls-label">Title</label>
            <input
              type="text"
              value={currentAttrs.title || ""}
              placeholder="Image title..."
              className="image-controls-input"
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>

          <div className="image-controls-group">
            <Button
              onClick={handleResetSize}
              className="image-controls-reset-btn"
            >
              Reset Size
            </Button>
          </div>

          <div className="image-controls-info">
            <p className="text-xs text-muted-foreground">
              Use values like "300px", "50%", or "auto" for width and height.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
