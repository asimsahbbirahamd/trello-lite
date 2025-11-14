"use client";

import { useEffect, useState } from "react";
import Column from "./Column";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

interface CardType {
  id: string;
  title: string;
  order: number;
  columnId: string;
  body?: string | null;
}

interface ColumnType {
  id: string;
  title: string;
  order: number;
  boardId: string;
  cards?: CardType[];
}

interface BoardType {
  id: string;
  title: string;
  columns: ColumnType[];
}

export default function Board() {
  const [board, setBoard] = useState<BoardType | null>(null);

  useEffect(() => {
    fetch("/api/boards")
      .then((res) => res.json())
      .then((data) => {
        const first = data?.[0] as BoardType | undefined;
        if (!first) return;

        // normalize cards & orders
        const normalized: BoardType = {
          ...first,
          columns: (first.columns ?? []).map((col) => {
            const cards = (col.cards ?? []).slice().sort((a, b) => {
              const ao = a.order ?? 0;
              const bo = b.order ?? 0;
              return ao - bo;
            });
            return {
              ...col,
              cards,
            };
          }),
        };

        setBoard(normalized);
      });
  }, []);

  if (!board) {
    return <p className="p-6 text-gray-500">Loading board…</p>;
  }

  async function addColumn() {
    const res = await fetch("/api/columns", {
      method: "POST",
      body: JSON.stringify({
        boardId: board.id,
        title: "Untitled",
      }),
    });

    if (!res.ok) {
      console.error("Failed to create column", await res.text());
      return;
    }

    const newColumn = (await res.json()) as ColumnType;

    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: [
          ...prev.columns,
          { ...newColumn, cards: [] },
        ],
      };
    });
  }

  function updateColumn(updated: ColumnType) {
    setBoard((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === updated.id
            ? {
                ...col,
                ...updated,
                cards: updated.cards ?? col.cards ?? [],
              }
            : col
        ),
      };
    });
  }

  function removeColumn(columnId: string) {
    setBoard((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        columns: prev.columns.filter((col) => col.id !== columnId),
      };
    });
  }

  async function persistColumnOrder(columnId: string, cards: CardType[]) {
    try {
      await fetch("/api/cards/reorder", {
        method: "POST",
        body: JSON.stringify({
          columnId,
          orderedIds: cards.map((c) => c.id),
        }),
      });
    } catch (err) {
      console.error("Failed to persist card order", err);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const columns = [...board.columns];

    // Find source column
    const sourceColIndex = columns.findIndex((col) =>
      (col.cards ?? []).some((c) => c.id === activeId)
    );
    if (sourceColIndex === -1) return;

    const sourceCol = columns[sourceColIndex];
    const sourceCards = [...(sourceCol.cards ?? [])];
    const activeCardIndex = sourceCards.findIndex((c) => c.id === activeId);
    if (activeCardIndex === -1) return;

    const activeCard = sourceCards[activeCardIndex];

    // Find target column & index
    let targetColIndex = columns.findIndex((col) => col.id === overId);
    let targetCards: CardType[];
    let targetIndex: number;

    if (targetColIndex !== -1) {
      // dropped on column area
      targetCards = [...(columns[targetColIndex].cards ?? [])];
      targetIndex = targetCards.length;
    } else {
      // dropped on another card
      targetColIndex = columns.findIndex((col) =>
        (col.cards ?? []).some((c) => c.id === overId)
      );
      if (targetColIndex === -1) return;

      targetCards = [...(columns[targetColIndex].cards ?? [])];
      const overIndex = targetCards.findIndex((c) => c.id === overId);
      if (overIndex === -1) return;
      targetIndex = overIndex;
    }

    const sourceIsTarget = sourceColIndex === targetColIndex;

    if (sourceIsTarget) {
      // 🔁 move inside the same column
      const reordered = arrayMove(sourceCards, activeCardIndex, targetIndex)
        .map((card, idx) => ({
          ...card,
          order: idx,
        }));

      columns[sourceColIndex] = {
        ...sourceCol,
        cards: reordered,
      };

      setBoard({
        ...board,
        columns,
      });

      void persistColumnOrder(sourceCol.id, reordered);
    } else {
      // 🔀 move across columns
      // remove from source
      sourceCards.splice(activeCardIndex, 1);
      const normalizedSource = sourceCards.map((card, idx) => ({
        ...card,
        order: idx,
      }));

      // insert into target
      const targetCol = columns[targetColIndex];
      targetCards.splice(targetIndex, 0, {
        ...activeCard,
        columnId: targetCol.id,
      });
      const normalizedTarget = targetCards.map((card, idx) => ({
        ...card,
        order: idx,
      }));

      columns[sourceColIndex] = {
        ...columns[sourceColIndex],
        cards: normalizedSource,
      };
      columns[targetColIndex] = {
        ...columns[targetColIndex],
        cards: normalizedTarget,
      };

      setBoard({
        ...board,
        columns,
      });

      void persistColumnOrder(columns[sourceColIndex].id, normalizedSource);
      void persistColumnOrder(columns[targetColIndex].id, normalizedTarget);
    }
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-gray-100">
        {board.columns
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((col) => (
            <Column
              key={col.id}
              column={col}
              onUpdate={updateColumn}
              onDelete={removeColumn}
            />
          ))}

        <button
          onClick={addColumn}
          className="h-fit px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50"
        >
          + Add Column
        </button>
      </div>
    </DndContext>
  );
}
