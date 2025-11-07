import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";

const LANGUAGE_OPTIONS = [
  "javascript",
  "typescript",
  "html",
  "css",
  "json",
  "python",
  "java",
  "go",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "rust",
  "swift",
  "kotlin",
  "sql",
  "bash",
  "markdown",
  "yaml",
  "dockerfile",
  "gitignore",
  "scss",
  "less",
  "xml",
  "vue",
  "react",
  "jsx",
  "tsx",
  "graphql",
  "apache",
  "nginx",
  "ini",
  "toml",
  "csv",
  "diff",
  "git",
  "powershell",
  "r",
  "matlab",
  "scala",
  "perl",
  "lua",
  "dart",
  "elixir",
  "erlang",
  "haskell",
  "clojure",
  "fsharp",
  "ocaml",
  "nim",
  "zig",
  "crystal",
  "julia",
  "racket",
  "scheme",
  "prolog",
  "fortran",
  "cobol",
  "pascal",
  "ada",
  "basic",
  "assembly",
  "verilog",
  "vhdl",
  "solidity",
  "abap",
  "sap",
  "plsql",
  "tcl",
  "awk",
  "sed",
  "vim",
  "emacs",
  "latex",
  "tex",
  "asciidoc",
  "rst",
  "coffeescript",
  "livescript",
  "elm",
  "purescript",
  "reason",
  "rescript",
  "merlin",
  "fstar",
  "agda",
  "idris",
  "coq",
  "lean",
  "isabelle",
  "hol",
  "acl2",
  "twelf",
  "beluga",
  "cedille",
];

interface CodeBlockLanguageDropdownProps {
  editor: Editor;
}

export const CodeBlockLanguageDropdown: React.FC<
  CodeBlockLanguageDropdownProps
> = ({ editor }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [currentLanguage, setCurrentLanguage] = useState("javascript");
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const updateMenu = () => {
      const isCodeBlock = editor.isActive("codeBlock");
      setIsVisible(isCodeBlock);

      if (!isCodeBlock) return;

      // 현재 코드 블록의 언어 가져오기
      const codeBlockAttrs = editor.getAttributes("codeBlock");
      const language = codeBlockAttrs.language || "javascript";
      setCurrentLanguage(language);

      const result = editor.view.domAtPos(editor.state.selection.from);
      let node = result.node;

      // TextNode일 경우 parentElement를 찾도록
      if (
        !(node instanceof HTMLElement) &&
        node.parentNode instanceof HTMLElement
      ) {
        node = node.parentNode;
      }

      // pre 블럭 찾기
      const block = (node as HTMLElement).closest?.("pre");

      if (block) {
        const rect = block.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY - 20,
          left: rect.left + window.scrollX + 12,
        });
      }
    };

    updateMenu();
    editor.on("selectionUpdate", updateMenu);

    return () => {
      editor.off("selectionUpdate", updateMenu);
    };
  }, [editor]);

  // 드롭다운이 열릴 때 검색창에 포커스
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    setIsOpen(false);
    setSearchTerm(""); // 검색어 초기화
    editor.commands.updateAttributes("codeBlock", { language: lang });
  };

  // 언어 이름을 대문자로 변환하는 함수
  const formatLanguageName = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      html: "HTML",
      css: "CSS",
      json: "JSON",
      python: "Python",
      java: "Java",
      go: "Go",
      cpp: "C++",
      csharp: "C#",
      php: "PHP",
      ruby: "Ruby",
      rust: "Rust",
      swift: "Swift",
      kotlin: "Kotlin",
      sql: "SQL",
      bash: "Bash",
      markdown: "Markdown",
      yaml: "YAML",
      dockerfile: "Dockerfile",
      gitignore: ".gitignore",
      scss: "SCSS",
      less: "Less",
      xml: "XML",
      vue: "Vue",
      react: "React",
      jsx: "JSX",
      tsx: "TSX",
      graphql: "GraphQL",
      apache: "Apache",
      nginx: "Nginx",
      ini: "INI",
      toml: "TOML",
      csv: "CSV",
      diff: "Diff",
      git: "Git",
      powershell: "PowerShell",
      r: "R",
      matlab: "MATLAB",
      scala: "Scala",
      perl: "Perl",
      lua: "Lua",
      dart: "Dart",
      elixir: "Elixir",
      erlang: "Erlang",
      haskell: "Haskell",
      clojure: "Clojure",
      fsharp: "F#",
      ocaml: "OCaml",
      nim: "Nim",
      zig: "Zig",
      crystal: "Crystal",
      julia: "Julia",
      racket: "Racket",
      scheme: "Scheme",
      prolog: "Prolog",
      fortran: "Fortran",
      cobol: "COBOL",
      pascal: "Pascal",
      ada: "Ada",
      basic: "BASIC",
      assembly: "Assembly",
      verilog: "Verilog",
      vhdl: "VHDL",
      solidity: "Solidity",
      abap: "ABAP",
      sap: "SAP",
      plsql: "PL/SQL",
      tcl: "TCL",
      awk: "AWK",
      sed: "Sed",
      vim: "Vim",
      emacs: "Emacs",
      latex: "LaTeX",
      tex: "TeX",
      asciidoc: "AsciiDoc",
      rst: "reStructuredText",
      coffeescript: "CoffeeScript",
      livescript: "LiveScript",
      elm: "Elm",
      purescript: "PureScript",
      reason: "Reason",
      rescript: "ReScript",
    };

    return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // 검색어에 따라 언어 필터링
  const filteredLanguages = LANGUAGE_OPTIONS.filter((lang) =>
    formatLanguageName(lang).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="code-block-language-dropdown"
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        zIndex: 999,
      }}
    >
      <div className="language-selector" onClick={() => setIsOpen(!isOpen)}>
        <span className="language-name">
          {formatLanguageName(currentLanguage)}
        </span>
        <svg
          className={`chevron-icon ${isOpen ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="language-dropdown-menu">
          {/* 검색 입력창 */}
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="언어를 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="language-search-input"
            />
          </div>

          {/* 검색 결과가 없을 때 */}
          {filteredLanguages.length === 0 && (
            <div className="no-results">검색 결과가 없습니다</div>
          )}

          {/* 필터링된 언어 목록 */}
          {filteredLanguages.map((lang) => (
            <div
              key={lang}
              className={`language-option ${currentLanguage === lang ? "selected" : ""}`}
              onClick={() => changeLanguage(lang)}
            >
              {formatLanguageName(lang)}
              {currentLanguage === lang && (
                <svg
                  className="check-icon"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
