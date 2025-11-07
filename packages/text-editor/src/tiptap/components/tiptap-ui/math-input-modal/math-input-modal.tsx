import React, { useState, useEffect } from "react";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import { Input } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/input";
import { Label } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/label";
import { Popover } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/popover";

interface MathInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (latex: string) => void;
  title: string;
  placeholder: string;
  example: string;
  // Optional display context (inline or block). Not used for logic here
  type?: "block" | "inline";
}

export function MathInputModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
  example,
}: MathInputModalProps) {
  const [latex, setLatex] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLatex("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (latex.trim()) {
      onSubmit(latex.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">예시: {example}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label
              htmlFor="latex-input"
              className="block text-sm font-medium mb-2"
            >
              LaTeX 수식
            </Label>
            <Input
              id="latex-input"
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder={placeholder}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              data-style="ghost"
              onClick={onClose}
              className="px-4 py-2"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!latex.trim()}
              className="px-4 py-2"
            >
              삽입
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
