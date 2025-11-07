"use client";

import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { cn } from "@workspace/ui/lib/utils";

const SUPPORTED_LANGUAGES = [
  { value: "auto", label: "Auto" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
];

export function CodeBlockComponent({
  node: {
    attrs: { language: defaultLanguage },
  },
  updateAttributes,
  extension,
  editor,
  selected,
}: NodeViewProps) {
  return (
    <NodeViewWrapper
      className={cn(
        "code-block-wrapper group relative my-6",
        selected && "ring-2 ring-blue-400"
      )}
    >
      {editor?.isEditable && (
        <select
          contentEditable={false}
          onChange={(event) =>
            updateAttributes({ language: event.target.value })
          }
          defaultValue={defaultLanguage}
          className="absolute right-2 top-2 z-10 h-7 cursor-pointer rounded-md border border-white/20 bg-black/90 px-2 text-xs font-medium text-white/90 opacity-0 shadow-sm outline-none backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black hover:text-white focus:opacity-100 focus:ring-2 focus:ring-white/20 group-hover:opacity-100"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      )}
      <pre>
        <code>
          <NodeViewContent />
        </code>
      </pre>
    </NodeViewWrapper>
  );
}

