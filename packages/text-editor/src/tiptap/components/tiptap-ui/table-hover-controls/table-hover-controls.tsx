"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import { Button } from "@workspace/text-editor/tiptap/components/tiptap-ui-primitive/button";
import "./table-hover-controls.scss";

type HoverTarget = {
  cellRect: DOMRect;
  tableRect: DOMRect;
  tableEl: HTMLElement;
  cursorX: number;
  cursorY: number;
};

export function TableHoverControls({ editor }: { editor: Editor | null }) {
  const [hoverTarget, setHoverTarget] = React.useState<HoverTarget | null>(
    null,
  );
  const hideTimeoutRef = React.useRef<number | null>(null);

  const cancelHide = React.useCallback(() => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleHide = React.useCallback(() => {
    cancelHide();
    hideTimeoutRef.current = window.setTimeout(() => {
      setHoverTarget(null);
      hideTimeoutRef.current = null;
    }, 100);
  }, [cancelHide]);

  React.useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        scheduleHide();
        return;
      }
      // 오버레이 위에 있을 때는 기존 호버 상태 유지
      const inOverlay = target.closest(".table-hover-controls");
      if (inOverlay) {
        cancelHide();
        return;
      }

      const cell = target.closest("td, th") as HTMLElement | null;
      if (cell && document.contains(cell)) {
        const cellRect = cell.getBoundingClientRect();
        const tableEl = cell.closest("table") as HTMLElement;
        const tableRect = tableEl.getBoundingClientRect();
        setHoverTarget({
          cellRect,
          tableRect,
          tableEl,
          cursorX: e.clientX,
          cursorY: e.clientY,
        });
        cancelHide();
        return;
      }

      // 테이블 영역 안에서는 이전 호버 유지, 완전히 벗어났을 때만 해제
      const inTable = target.closest("table");
      if (!inTable) {
        scheduleHide();
      }
    };

    const handleLeave = () => {
      // 윈도우 밖으로 나갈 때도 3초 후 숨김
      scheduleHide();
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      cancelHide();
    };
  }, [cancelHide, scheduleHide]);

  const selectCellAtRect = React.useCallback(
    (rect: DOMRect) => {
      if (!editor) return false;
      const posResult = editor.view.posAtCoords({
        left: rect.left + Math.min(10, rect.width / 2),
        top: rect.top + Math.min(10, rect.height / 2),
      });
      if (!posResult) return false;
      editor.chain().focus().setTextSelection(posResult.pos).run();
      return true;
    },
    [editor],
  );

  const handleAddRow = React.useCallback(() => {
    if (!editor || !hoverTarget) return;
    if (!selectCellAtRect(hoverTarget.cellRect)) return;
    editor.chain().focus().addRowAfter().run();

    // 새로 추가된 마지막 행의 첫 번째 셀 기준으로 호버 타겟 이동
    requestAnimationFrame(() => {
      if (!hoverTarget?.tableEl) return;
      const tableEl = hoverTarget.tableEl;
      const tableRect = tableEl.getBoundingClientRect();
      const newCell = tableEl.querySelector(
        "tr:last-child td:first-child, tr:last-child th:first-child",
      ) as HTMLElement | null;
      if (!newCell) return;
      const cellRect = newCell.getBoundingClientRect();
      setHoverTarget({
        cellRect,
        tableRect,
        tableEl,
        cursorX: cellRect.left + cellRect.width / 2,
        cursorY: cellRect.top + cellRect.height / 2,
      });
      cancelHide();

      // 선택도 새로 생성된 행의 첫 셀로 이동
      const pos = editor.view.posAtCoords({
        left: cellRect.left + Math.min(10, cellRect.width / 2),
        top: cellRect.top + Math.min(10, cellRect.height / 2),
      });
      if (pos) {
        editor.chain().focus().setTextSelection(pos.pos).run();
      }
    });
  }, [editor, hoverTarget, selectCellAtRect]);

  const handleAddColumn = React.useCallback(() => {
    if (!editor || !hoverTarget) return;
    if (!selectCellAtRect(hoverTarget.cellRect)) return;
    editor.chain().focus().addColumnAfter().run();

    // 새로 추가된 마지막 열의 마지막 셀 기준으로 호버 타겟 이동
    requestAnimationFrame(() => {
      if (!hoverTarget?.tableEl) return;
      const tableEl = hoverTarget.tableEl;
      const tableRect = tableEl.getBoundingClientRect();
      const newCell = tableEl.querySelector(
        "tr:last-child td:last-child, tr:last-child th:last-child",
      ) as HTMLElement | null;
      if (!newCell) return;
      const cellRect = newCell.getBoundingClientRect();
      setHoverTarget({
        cellRect,
        tableRect,
        tableEl,
        cursorX: cellRect.left + cellRect.width / 2,
        cursorY: cellRect.top + cellRect.height / 2,
      });
      cancelHide();

      // 선택도 새로 생성된 열의 마지막 셀로 이동
      const pos = editor.view.posAtCoords({
        left: cellRect.left + Math.min(10, cellRect.width / 2),
        top: cellRect.top + Math.min(10, cellRect.height / 2),
      });
      if (pos) {
        editor.chain().focus().setTextSelection(pos.pos).run();
      }
    });
  }, [editor, hoverTarget, selectCellAtRect]);

  if (!editor || !hoverTarget) return null;

  const { tableRect } = hoverTarget;

  // 행 끝(아래) + 열 끝(오른쪽) 에만 표시. 버튼 크기는 테이블 길이와 동일.
  const rowBtnStyle: React.CSSProperties = {
    position: "fixed",
    left: tableRect.left,
    top: tableRect.bottom + 8,
    width: tableRect.width,
    transform: "translate(0, 0)",
    zIndex: 1000,
    justifyContent: "center",
    display: "flex",
  };
  const colBtnStyle: React.CSSProperties = {
    position: "fixed",
    left: tableRect.right + 8,
    top: tableRect.top,
    height: tableRect.height,
    transform: "translate(0, 0)",
    zIndex: 1000,
    alignItems: "center",
    display: "flex",
  };

  return (
    <div className="table-hover-controls" aria-hidden>
      <Button
        type="button"
        data-style="ghost"
        className="table-hover-controls__btn table-hover-controls__btn--row"
        style={rowBtnStyle}
        onClick={() => {
          // 테이블의 마지막 행 기준으로 추가
          if (!editor) return;
          const lastRowFirstCell = hoverTarget.tableEl.querySelector(
            "tr:last-child td:first-child, tr:last-child th:first-child",
          ) as HTMLElement | null;
          if (lastRowFirstCell) {
            const r = lastRowFirstCell.getBoundingClientRect();
            const pos = editor.view.posAtCoords({
              left: r.left + Math.min(10, r.width / 2),
              top: r.bottom - 2,
            });
            if (pos) {
              editor
                .chain()
                .focus()
                .setTextSelection(pos.pos)
                .addRowAfter()
                .run();
              return;
            }
          }
          // 폴백
          handleAddRow();
        }}
        title="행 추가 (아래)"
      >
        + 행
      </Button>
      <Button
        type="button"
        data-style="ghost"
        className="table-hover-controls__btn table-hover-controls__btn--col"
        style={colBtnStyle}
        onClick={() => {
          // 테이블의 마지막 열 기준으로 추가
          if (!editor) return;
          const lastCell = hoverTarget.tableEl.querySelector(
            "tr:last-child td:last-child, tr:last-child th:last-child",
          ) as HTMLElement | null;
          if (lastCell) {
            const r = lastCell.getBoundingClientRect();
            const pos = editor.view.posAtCoords({
              left: r.right - 2,
              top: r.top + Math.min(10, r.height / 2),
            });
            if (pos) {
              editor
                .chain()
                .focus()
                .setTextSelection(pos.pos)
                .addColumnAfter()
                .run();
              return;
            }
          }
          // 폴백
          handleAddColumn();
        }}
        title="열 추가 (오른쪽)"
      >
        + 열
      </Button>
    </div>
  );
}
