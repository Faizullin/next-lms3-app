"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";
import type { TextOptions, Language } from "../ai-types";

// -- Hooks --
import { useTiptapEditor } from "@workspace/text-editor/tiptap/hooks/use-tiptap-editor";

// -- Tiptap UI --
import {
  getContextAndInsertAt,
  useAiMenuState,
} from "@workspace/text-editor/tiptap/components/tiptap-ui/ai-menu";

// -- UI Primitives --
import {
  type Action,
  filterMenuGroups,
  filterMenuItems,
  Menu,
  MenuButton,
  MenuButtonArrow,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  useComboboxValueState,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/menu";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import { ComboboxList } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/combobox";
import { Separator } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/separator";

import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_TONES,
} from "./ai-menu-items-constants";
import type {
  EditorMenuAction,
  ExecutableMenuAction,
  MenuActionIdentifier,
  MenuActionRendererProps,
  NestedMenuAction,
} from "./ai-menu-items-types";

// -- Icons --
import { ChevronRightIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/chevron-right-icon";
import { SummarizeTextIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/summarize-text-icon";
import { Simplify2Icon } from "@workspace/text-editor/tiptap/components/tiptap-icons/simplify-2-icon";
import { LanguagesIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/languages-icon";
import { MicAiIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/mic-ai-icon";
import { TextExtendIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/text-extend-icon";
import { TextReduceIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/text-reduce-icon";
import { CompleteSentenceIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/complete-sentence-icon";
import { SmileAiIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/smile-ai-icon";
import { CheckAiIcon } from "@workspace/text-editor/tiptap/components/tiptap-icons/check-ai-icon";

function initializeEditorMenuActions(): Record<
  MenuActionIdentifier,
  EditorMenuAction
> {
  return {
    adjustTone: {
      type: "nested",
      component: ToneSelectionSubmenu,
      filterItems: true,
      icon: <MicAiIcon className="tiptap-button-icon" />,
      items: SUPPORTED_TONES,
      label: "Adjust tone",
      value: "adjustTone",
    },
    aiFixSpellingAndGrammar: {
      type: "executable",
      icon: <CheckAiIcon className="tiptap-button-icon" />,
      label: "Fix spelling & grammar",
      value: "aiFixSpellingAndGrammar",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiFixSpellingAndGrammar?: (options: unknown) => {
            run: () => boolean;
          };
        };
        if (typeof chainAny.aiFixSpellingAndGrammar === "function") {
          chainAny.aiFixSpellingAndGrammar(newOptions).run();
        }
      },
    },
    aiExtend: {
      type: "executable",
      icon: <TextExtendIcon className="tiptap-button-icon" />,
      label: "Make longer",
      value: "aiExtend",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiExtend?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiExtend === "function") {
          chainAny.aiExtend(newOptions).run();
        }
      },
    },
    aiShorten: {
      type: "executable",
      icon: <TextReduceIcon className="tiptap-button-icon" />,
      label: "Make shorter",
      value: "aiShorten",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiShorten?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiShorten === "function") {
          chainAny.aiShorten(newOptions).run();
        }
      },
    },
    simplifyLanguage: {
      type: "executable",
      icon: <Simplify2Icon className="tiptap-button-icon" />,
      label: "Simplify language",
      value: "simplifyLanguage",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiSimplify?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiSimplify === "function") {
          chainAny.aiSimplify(newOptions).run();
        }
      },
    },
    improveWriting: {
      type: "executable",
      icon: <SmileAiIcon className="tiptap-button-icon" />,
      label: "Improve writing",
      value: "improveWriting",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiRephrase?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiRephrase === "function") {
          chainAny.aiRephrase(newOptions).run();
        }
      },
    },
    emojify: {
      type: "executable",
      icon: <SmileAiIcon className="tiptap-button-icon" />,
      label: "Emojify",
      value: "emojify",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiEmojify?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiEmojify === "function") {
          chainAny.aiEmojify(newOptions).run();
        }
      },
    },
    continueWriting: {
      type: "executable",
      icon: <CompleteSentenceIcon className="tiptap-button-icon" />,
      label: "Continue writing",
      value: "continueWriting",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiComplete?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiComplete === "function") {
          chainAny.aiComplete(newOptions).run();
        }
      },
    },
    summarize: {
      type: "executable",
      icon: <SummarizeTextIcon className="tiptap-button-icon" />,
      label: "Add a summary",
      value: "summarize",
      onSelect: ({ editor, options }) => {
        if (!editor) return;

        const { insertAt, isSelection, context } =
          getContextAndInsertAt(editor);
        const newOptions: TextOptions = {
          ...options,
          insertAt,
          regenerate: !isSelection,
        };

        if (isSelection) {
          newOptions.text = context;
        }

        const chainAny = editor.chain() as unknown as {
          aiSummarize?: (options: unknown) => { run: () => boolean };
        };
        if (typeof chainAny.aiSummarize === "function") {
          chainAny.aiSummarize(newOptions).run();
        }
      },
    },
    translateTo: {
      type: "nested",
      component: LanguageSelectionSubmenu,
      filterItems: true,
      icon: <LanguagesIcon className="tiptap-button-icon" />,
      items: SUPPORTED_LANGUAGES,
      label: "Languages",
      value: "translateTo",
    },
  };
}

function mapInteractionContextToActions(
  menuActions: Record<MenuActionIdentifier, EditorMenuAction>,
) {
  const convertToMenuAction = (item: EditorMenuAction) => ({
    label: item.label,
    value: item.value,
    icon: item.icon,
    filterItems: item.type === "nested" ? item.filterItems : undefined,
  });

  const grouped: Action[] = [
    {
      label: "Edit",
      items: Object.values([
        menuActions.adjustTone,
        menuActions.aiFixSpellingAndGrammar,
        menuActions.aiExtend,
        menuActions.aiShorten,
        menuActions.simplifyLanguage,
        menuActions.improveWriting,
        menuActions.emojify,
      ]).map(convertToMenuAction),
    },
    {
      label: "Write",
      items: Object.values([
        menuActions.continueWriting,
        menuActions.summarize,
        menuActions.translateTo,
      ]).map(convertToMenuAction),
    },
  ];

  return grouped;
}

function isExecutableMenuItem(
  item: EditorMenuAction,
): item is ExecutableMenuAction {
  return item.type === "executable";
}

function isNestedMenuItem(item: EditorMenuAction): item is NestedMenuAction {
  return item.type === "nested";
}

export function LanguageSelectionSubmenu({
  editor,
}: {
  editor: Editor | null;
}) {
  const [searchValue] = useComboboxValueState();
  const { state, updateState } = useAiMenuState();

  const availableLanguages = React.useMemo(() => {
    const translationAction = initializeEditorMenuActions()
      .translateTo as NestedMenuAction;
    const languageOptions = { items: translationAction.items || [] };
    return filterMenuItems(languageOptions, searchValue);
  }, [searchValue]);

  const handleLanguageSelection = React.useCallback(
    (selectedLanguageCode: Language) => {
      if (!editor) return;

      const { insertAt, isSelection, context } = getContextAndInsertAt(editor);

      updateState({ language: selectedLanguageCode });

      const langOptions: TextOptions = {
        stream: true,
        format: "rich-text",
        insertAt,
        regenerate: !isSelection,
      };

      if (state.tone) {
        langOptions.tone = state.tone;
      }

      if (isSelection) {
        langOptions.text = context;
      }

      const chainAny = editor.chain() as unknown as {
        aiTranslate?: (
          lang: unknown,
          options: unknown,
        ) => { run: () => boolean };
      };
      if (typeof chainAny.aiTranslate === "function") {
        chainAny.aiTranslate(selectedLanguageCode, langOptions).run();
      }
    },
    [editor, state.tone, updateState],
  );

  const languageMenuItems = (
    <>
      {availableLanguages.length > 0 && (
        <MenuGroupLabel>Languages</MenuGroupLabel>
      )}
      {availableLanguages.map((language) => (
        <MenuItem
          key={language.value}
          onClick={() =>
            language.value &&
            handleLanguageSelection(language.value as Language)
          }
          render={
            <Button data-style="ghost">
              <LanguagesIcon className="tiptap-button-icon" />
              <span className="tiptap-button-text">{language.label}</span>
            </Button>
          }
        />
      ))}
    </>
  );

  if (searchValue) {
    return languageMenuItems;
  }

  return (
    <Menu
      placement="right"
      trigger={
        <MenuButton
          render={
            <MenuItem
              render={
                <Button data-style="ghost">
                  <LanguagesIcon className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Languages</span>
                  <MenuButtonArrow render={<ChevronRightIcon />} />
                </Button>
              }
            />
          }
        />
      }
    >
      <MenuContent>
        <ComboboxList>
          <MenuGroup>{languageMenuItems}</MenuGroup>
        </ComboboxList>
      </MenuContent>
    </Menu>
  );
}

export function ToneSelectionSubmenu({ editor }: { editor: Editor | null }) {
  const [searchValue] = useComboboxValueState();
  const { state, updateState } = useAiMenuState();

  const availableTones = React.useMemo(() => {
    const toneAction = initializeEditorMenuActions()
      .adjustTone as NestedMenuAction;
    const toneOptions = { items: toneAction.items || [] };
    return filterMenuItems(toneOptions, searchValue);
  }, [searchValue]);

  const handleToneSelection = React.useCallback(
    (selectedTone: string) => {
      if (!editor) return;

      const { insertAt, isSelection, context } = getContextAndInsertAt(editor);

      if (!state.tone || state.tone !== selectedTone) {
        updateState({ tone: selectedTone });
      }

      const toneOptions: TextOptions = {
        stream: true,
        format: "rich-text",
        insertAt,
        regenerate: !isSelection,
      };

      if (state.language) {
        toneOptions.language = state.language;
      }

      if (isSelection) {
        toneOptions.text = context;
      }

      const chainAny = editor.chain() as unknown as {
        aiAdjustTone?: (
          tone: unknown,
          options: unknown,
        ) => { run: () => boolean };
      };
      if (typeof chainAny.aiAdjustTone === "function") {
        chainAny.aiAdjustTone(selectedTone, toneOptions).run();
      }
    },
    [editor, state.language, state.tone, updateState],
  );

  const toneMenuItems = availableTones.map((tone) => (
    <MenuItem
      key={tone.value}
      onClick={() => handleToneSelection(tone.value || "")}
      render={
        <Button data-style="ghost">
          <span className="tiptap-button-text">{tone.label}</span>
        </Button>
      }
    />
  ));

  if (searchValue) {
    return toneMenuItems;
  }

  return (
    <Menu
      placement="right"
      trigger={
        <MenuButton
          render={
            <MenuItem
              render={
                <Button data-style="ghost">
                  <MicAiIcon className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Adjust Tone</span>
                  <MenuButtonArrow render={<ChevronRightIcon />} />
                </Button>
              }
            />
          }
        />
      }
    >
      <MenuContent>
        <ComboboxList>
          <MenuGroup>{toneMenuItems}</MenuGroup>
        </ComboboxList>
      </MenuContent>
    </Menu>
  );
}

export function MenuActionRenderer({
  menuItem,
  availableActions,
  editor,
}: MenuActionRendererProps) {
  const { state } = useAiMenuState();

  if (!menuItem.value) {
    return null;
  }

  const editorAction = availableActions[menuItem.value];
  if (!editorAction) {
    return null;
  }

  if (isNestedMenuItem(editorAction)) {
    const SubmenuComponent = editorAction.component;
    return <SubmenuComponent key={menuItem.value} editor={editor} />;
  }

  if (isExecutableMenuItem(editorAction)) {
    const options: TextOptions = {
      stream: true,
      format: "rich-text",
      language: state.language,
    };

    if (state.tone) {
      options.tone = state.tone;
    }

    return (
      <MenuItem
        key={menuItem.value}
        onClick={() =>
          editorAction.onSelect({
            editor,
            options,
          })
        }
        render={
          <Button data-style="ghost">
            {editorAction.icon}
            <span className="tiptap-button-text">{editorAction.label}</span>
          </Button>
        }
      />
    );
  }

  return null;
}

export function AiMenuItems({
  editor: providedEditor,
}: {
  editor?: Editor | null;
}) {
  const { editor } = useTiptapEditor(providedEditor);
  const [searchValue] = useComboboxValueState();

  const availableMenuActions = React.useMemo(
    () => initializeEditorMenuActions(),
    [],
  );
  const contextualActionGroups = React.useMemo(
    () => mapInteractionContextToActions(availableMenuActions),
    [availableMenuActions],
  );

  const filteredActionGroups = React.useMemo(() => {
    return (
      filterMenuGroups(contextualActionGroups, searchValue) ||
      contextualActionGroups
    );
  }, [contextualActionGroups, searchValue]);

  const wouldActionRenderContent = React.useCallback(
    (menuItem: Action) => {
      if (!menuItem.value) return false;

      const editorAction =
        availableMenuActions[menuItem.value as MenuActionIdentifier];
      if (!editorAction) return false;

      // For nested menu items with filterItems=true, check their internal filtering
      if (
        isNestedMenuItem(editorAction) &&
        editorAction.filterItems &&
        searchValue.trim()
      ) {
        const nestedItems = filterMenuItems(
          { items: editorAction.items || [] },
          searchValue,
        );
        return nestedItems.length > 0;
      }

      return true;
    },
    [availableMenuActions, searchValue],
  );

  if (!editor) {
    return null;
  }

  const renderableGroups = filteredActionGroups
    .map((actionGroup) => ({
      ...actionGroup,
      items: actionGroup.items?.filter(wouldActionRenderContent) ?? [],
    }))
    .filter((actionGroup) => actionGroup.items.length > 0);

  if (renderableGroups.length === 0) {
    return null;
  }

  return renderableGroups.map((actionGroup, groupIndex) => (
    <React.Fragment key={groupIndex}>
      <MenuGroup key={groupIndex}>
        <MenuGroupLabel>{actionGroup.label}</MenuGroupLabel>
        {actionGroup.items.map((menuItem: Action) => (
          <MenuActionRenderer
            key={menuItem.value || groupIndex}
            menuItem={menuItem}
            availableActions={availableMenuActions}
            editor={editor}
          />
        ))}
      </MenuGroup>
      {groupIndex < renderableGroups.length - 1 && (
        <Separator orientation="horizontal" />
      )}
    </React.Fragment>
  ));
}
