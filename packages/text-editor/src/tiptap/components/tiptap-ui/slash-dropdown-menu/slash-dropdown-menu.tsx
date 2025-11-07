"use client";

import * as React from "react";

// --- Lib ---
import { getElementOverflowPosition } from "@workspace/text-editor/tiptap/lib/tiptap-collab-utils";

// --- Tiptap UI ---
import type {
  SuggestionItem,
  SuggestionMenuProps,
  SuggestionMenuRenderProps,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-utils/suggestion-menu";
import {
  filterSuggestionItems,
  SuggestionMenu,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-utils/suggestion-menu";

// --- Hooks ---
import type { SlashMenuConfig } from "@workspace/text-editor/tiptap/components/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu";
import { useSlashDropdownMenu } from "@workspace/text-editor/tiptap/components/tiptap-ui/slash-dropdown-menu/use-slash-dropdown-menu";

// --- UI Primitives ---
import {
  Button,
  ButtonGroup,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import {
  Card,
  CardBody,
  CardGroupLabel,
  CardItemGroup,
} from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/card";
import { Separator } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/separator";

import "@workspace/text-editor/tiptap/components/tiptap-ui/slash-dropdown-menu/slash-dropdown-menu.scss";

type SlashDropdownMenuProps = Omit<
  SuggestionMenuProps,
  "items" | "children"
> & {
  config?: SlashMenuConfig;
};

export const SlashDropdownMenu = (props: SlashDropdownMenuProps) => {
  const { config, ...restProps } = props;
  const { getSlashMenuItems } = useSlashDropdownMenu(config);
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const update = () =>
      setIsDark(document.body.classList.contains("code-dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <SuggestionMenu
      char="/"
      pluginKey="slashDropdownMenu"
      decorationClass="tiptap-slash-decoration"
      decorationContent="Filter..."
      selector="tiptap-slash-dropdown-menu"
      items={({ query, editor }) => {
        const items = filterSuggestionItems(getSlashMenuItems(editor), query);
        return items;
      }}
      {...restProps}
    >
      {(props) => <List {...props} config={config} isDark={isDark} />}
    </SuggestionMenu>
  );
};

const Item = (props: {
  item: SuggestionItem;
  isSelected: boolean;
  onSelect: () => void;
  isDark?: boolean;
}) => {
  const { item, isSelected, onSelect, isDark } = props;
  const itemRef = React.useRef<HTMLButtonElement>(null);
  const [hovered, setHovered] = React.useState(false);

  React.useEffect(() => {
    const selector = document.querySelector(
      '[data-selector="tiptap-slash-dropdown-menu"]',
    ) as HTMLElement;
    if (!itemRef.current || !isSelected || !selector) return;

    const overflow = getElementOverflowPosition(itemRef.current, selector);

    if (overflow === "top") {
      itemRef.current.scrollIntoView(true);
    } else if (overflow === "bottom") {
      itemRef.current.scrollIntoView(false);
    }
  }, [isSelected]);

  const BadgeIcon = item.badge;

  const dynamicColor = isDark ? (hovered ? "#000000" : "#ffffff") : undefined;

  return (
    <Button
      ref={itemRef}
      data-style="ghost"
      data-active-state={isSelected ? "on" : "off"}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ color: dynamicColor }}
    >
      {BadgeIcon && (
        <BadgeIcon
          className="tiptap-button-icon"
          style={{ color: dynamicColor, fill: dynamicColor }}
        />
      )}
      <div className="tiptap-button-text" style={{ color: dynamicColor }}>
        {item.title}
      </div>
    </Button>
  );
};

const List = ({
  items,
  selectedIndex,
  onSelect,
  config,
  isDark,
}: SuggestionMenuRenderProps & {
  config?: SlashMenuConfig;
  isDark?: boolean;
}) => {
  const renderedItems = React.useMemo(() => {
    const rendered: React.ReactElement[] = [];
    const showGroups = config?.showGroups !== false;

    if (!showGroups) {
      items.forEach((item, index) => {
        rendered.push(
          <Item
            key={`item-${index}-${item.title}`}
            item={item}
            isSelected={index === selectedIndex}
            onSelect={() => onSelect(item)}
            isDark={isDark}
          />,
        );
      });
      return rendered;
    }

    const groups: {
      [groupLabel: string]: { items: SuggestionItem[]; indices: number[] };
    } = {};

    items.forEach((item, index) => {
      const groupLabel = item.group || "";
      if (!groups[groupLabel]) {
        groups[groupLabel] = { items: [], indices: [] };
      }
      groups[groupLabel].items.push(item);
      groups[groupLabel].indices.push(index);
    });

    Object.entries(groups).forEach(([groupLabel, groupData], groupIndex) => {
      if (groupIndex > 0) {
        rendered.push(
          <Separator
            key={`separator-${groupIndex}`}
            orientation="horizontal"
          />,
        );
      }

      const groupItems = groupData.items.map((item, itemIndex) => {
        const originalIndex = groupData.indices[itemIndex];
        return (
          <Item
            key={`item-${originalIndex}-${item.title}`}
            item={item}
            isSelected={originalIndex === selectedIndex}
            onSelect={() => onSelect(item)}
            isDark={isDark}
          />
        );
      });

      if (groupLabel) {
        rendered.push(
          <CardItemGroup key={`group-${groupIndex}-${groupLabel}`}>
            <CardGroupLabel style={{ color: isDark ? "#8b949e" : undefined }}>
              {groupLabel}
            </CardGroupLabel>
            <ButtonGroup>{groupItems}</ButtonGroup>
          </CardItemGroup>,
        );
      } else {
        rendered.push(...groupItems);
      }
    });

    return rendered;
  }, [items, selectedIndex, onSelect, config?.showGroups, isDark]);

  if (!renderedItems.length) {
    return null;
  }

  return (
    <Card
      className="tiptap-slash-card"
      style={{
        maxHeight: "var(--suggestion-menu-max-height)",
        backgroundColor: isDark ? "#1e1e1e" : undefined,
        borderColor: isDark ? "#30363d" : undefined,
        color: isDark ? "#c9d1d9" : undefined,
      }}
    >
      <CardBody
        className="tiptap-slash-card-body"
        style={{ color: isDark ? "#c9d1d9" : undefined }}
      >
        {renderedItems}
      </CardBody>
    </Card>
  );
};
