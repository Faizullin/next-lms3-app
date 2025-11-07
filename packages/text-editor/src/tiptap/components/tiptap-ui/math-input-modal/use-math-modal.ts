import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface MathModalState {
  isOpen: boolean;
  type: "inline" | "block" | null;
  editor: Editor | null;
}

export function useMathModal() {
  const [modalState, setModalState] = useState<MathModalState>({
    isOpen: false,
    type: null,
    editor: null,
  });

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      const { type, editor } = event.detail;
      setModalState({
        isOpen: true,
        type,
        editor,
      });
    };

    window.addEventListener(
      "open-math-modal",
      handleOpenModal as EventListener,
    );

    return () => {
      window.removeEventListener(
        "open-math-modal",
        handleOpenModal as EventListener,
      );
    };
  }, []);

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: null,
      editor: null,
    });
  };

  const handleSubmit = (latex: string) => {
    if (!modalState.editor || !modalState.type) return;

    if (modalState.type === "inline") {
      modalState.editor.chain().focus().insertInlineMath({ latex }).run();
    } else if (modalState.type === "block") {
      modalState.editor.chain().focus().insertBlockMath({ latex }).run();
    }

    closeModal();
  };

  const getModalProps = () => {
    if (!modalState.isOpen) return null;

    const isInline = modalState.type === "inline";

    return {
      isOpen: modalState.isOpen,
      onClose: closeModal,
      onSubmit: handleSubmit,
      title: isInline ? "인라인 수식 삽입" : "블록 수식 삽입",
      placeholder: isInline ? "E = mc^2" : "\\frac{a}{b}",
      example: isInline ? "E = mc^2" : "\\frac{a}{b}",
    };
  };

  return {
    modalProps: getModalProps(),
  };
}
