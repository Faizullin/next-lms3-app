import { Extension } from "@tiptap/core";

export const TapIndent = Extension.create({
  name: "tabIndent",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state, dispatch } = editor.view;
        const { selection } = state;
        const tab = "  "; // 혹은 '\t'

        if (editor.isActive("codeBlock")) {
          dispatch(state.tr.insertText(tab, selection.from, selection.to));
          return true;
        }

        return false;
      },
    };
  },
});
