"use client";

import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CodeBlockComponent } from "../components/code-block-component";
import { lowlight } from "../lib/lowlight-config";

export const CodeBlockLowlightExtension = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
}).configure({
  lowlight,
  HTMLAttributes: {
    class: "code-block-lowlight",
  },
});
