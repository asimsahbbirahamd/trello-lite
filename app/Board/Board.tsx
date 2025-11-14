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
        if (first) {
          const normalized: BoardType = {
            ...first,
            columns: (first.columns ?? []).map((col) => ({
              ...col,
              cards: (col.cards ?? []).map((card, idx) => ({
                ...card,
                order: card.order ?? idx,
              })),
            })),
          };
          setBoard(normalized);
        }
      });
  }, []);

  if (!board) {
    return <p className="p-6 text-gray-500">Loading board…</p>;
  }

  async function addColumn() {
    if (!board) return;

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

    const newColumn = (await res.json()) as {
      id: string;
      title: string;
      order: number;
      boardId: string;
    };

    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: [
          ...prev.columns,
          {
            id: newColumn.id,
            title: newColumn.title,
            order: newColumn.order,
            boardId: newColumn.boardId,
            cards: [],
          },
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

    // Find source column + card
    const sourceColIndex = columns.findIndex((col) =>
      (col.cards ?? []).some((c) => c.id === activeId)
    );
    if (sourceColIndex === -1) return;

    const sourceCol = columns[sourceColIndex];
    const sourceCards = [...(sourceCol.cards ?? [])];
    const activeCardIndex = sourceCards.findIndex((c) => c.id === activeId);
    if (activeCardIndex === -1) return;

    const activeCard = sourceCards[activeCardIndex];

    // Determine target column + index
    let targetColIndex = columns.findIndex((col) => col.id === overId);
    let targetCards: CardType[];
    let targetIndex: number;

    if (targetColIndex !== -1) {
      // Dropped on column itself
      targetCards = [...(columns[targetColIndex].cards ?? [])];
      targetIndex = targetCards.length;
    } else {
      // Dropped on another card
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
      // Move inside same column
      const reordered = arrayMove(sourceCards, activeCardIndex, targetIndex).map(
        (card, idx) => ({
          ...card,
          order: idx,
        })
      );

      columns[sourceColIndex] = {
        ...sourceCol,
        cards: reordered,
      };

      setBoard({
        ...board,
        columns,
      });

      persistColumnOrder(sourceCol.id, reordered);
    } else {
      // Move across columns
      // Remove from source
      sourceCards.splice(activeCardIndex, 1);
      const normalizedSource = sourceCards.map((card, idx) => ({
        ...card,
        order: idx,
      }));

      // Insert into target
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

      persistColumnOrder(columns[sourceColIndex].id, normalizedSource);
      persistColumnOrder(columns[targetColIndex].id, normalizedTarget);
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
          .sort((a: ColumnType, b: ColumnType) => a.order - b.order)
          .map((col: ColumnType) => (
            <Column
              key={col.id}
              column={col}
              onUpdate={updateColumn}
              onDelete={removeColumn}
            />
          ))}

        {/* Add Column Button */}
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
