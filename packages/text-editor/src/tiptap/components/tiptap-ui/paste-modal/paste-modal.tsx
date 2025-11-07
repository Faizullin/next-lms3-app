"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { AtSignIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/at-sign-icon";
import { VideoIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/video-icon";
import { LinkIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/link-icon";
import { Popover } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/popover";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import { Separator } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/separator";

export interface PasteModalProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  pastedContent: string;
  position: { x: number; y: number } | null;
}

export interface PasteOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor, content: string) => void;
}

const pasteOptions: PasteOption[] = [
  {
    id: "mention",
    title: "멘션",
    description: "사용자나 항목을 멘션합니다",
    icon: AtSignIcon,
    action: (editor, content) => {
      // 멘션 처리 로직
      editor.chain().focus().insertContent(`@${content}`).run();
    },
  },
  {
    id: "video-embed",
    title: "동영상 임베드",
    description: "유튜브 링크를 임베드로 변환합니다",
    icon: VideoIcon,
    action: (editor, content) => {
      // 유튜브 링크를 임베드로 변환하는 로직
      const videoId = extractYouTubeVideoId(content);
      if (videoId) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "videoEmbed",
            attrs: { videoId, url: content },
          })
          .run();
      } else {
        // 일반 링크로 처리
        editor
          .chain()
          .focus()
          .insertContent({
            type: "link",
            attrs: { href: content },
            content: [{ type: "text", text: content }],
          })
          .run();
      }
    },
  },
  {
    id: "url",
    title: "URL",
    description: "일반 링크로 삽입합니다",
    icon: LinkIcon,
    action: (editor, content) => {
      // 일반 링크 처리 로직
      editor
        .chain()
        .focus()
        .insertContent({
          type: "link",
          attrs: { href: content },
          content: [{ type: "text", text: content }],
        })
        .run();
    },
  },
];

// 유튜브 비디오 ID 추출 함수
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || null;
    }
  }

  return null;
}

export function PasteModal({
  editor,
  isOpen,
  onClose,
  pastedContent,
  position,
}: PasteModalProps) {
  const handleOptionClick = (option: PasteOption) => {
    if (!editor) return;

    option.action(editor, pastedContent);
    onClose();
  };

  if (!isOpen || !position) return null;

  return (
    <Popover open={isOpen} onOpenChange={onClose}>
      <div
        className="paste-modal"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 1000,
        }}
      >
        <div className="paste-modal-content">
          <div className="paste-modal-header">
            <h3>붙여넣기 형식</h3>
          </div>
          <Separator />
          <div className="paste-modal-options">
            {pasteOptions.map((option) => (
              <Button
                key={option.id}
                data-style="ghost"
                className="paste-option-button"
                onClick={() => handleOptionClick(option)}
              >
                <option.icon className="paste-option-icon" />
                <div className="paste-option-content">
                  <div className="paste-option-title">{option.title}</div>
                  <div className="paste-option-description">
                    {option.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Popover>
  );
}
