"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import Column from "./Column";
import type { Column as ColumnType } from "./types";

export default function Board() {
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load: localStorage first, then DB
  useEffect(() => {
    async function init() {
      try {
        // 1) Try localStorage so your changes survive refresh
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("kanban-board");
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as ColumnType[];
              setColumns(parsed);
              setLoading(false);
              return;
            } catch (err) {
              console.error("Invalid saved board data:", err);
            }
          }
        }

        // 2) Load from API (Supabase via Prisma)
        const res = await fetch("/api/boards");
        let data = await res.json();
        if (!Array.isArray(data)) data = [];

        let board;

        if (data.length === 0) {
          // If no board, create one
          const createRes = await fetch("/api/boards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "My Board" }),
          });
          board = await createRes.json();
        } else {
          board = data[0];
        }

        const mapped: ColumnType[] = (board.columns || []).map((col: any) => ({
          id: col.id,
          title: col.title,
          cards: (col.cards || []).map((card: any) => ({
            id: card.id,
            title: card.title,
          })),
        }));

        setColumns(mapped);
      } catch (err) {
        console.error("Failed to load board:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Persist to localStorage whenever columns change
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("kanban-board", JSON.stringify(columns));
  }, [columns]);

  // Column operations
  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      {
        id: `col-${Date.now()}`,
        title: "New Column",
        cards: [],
      },
    ]);
  };

  const deleteColumn = (id: string) =>
    setColumns((prev) => prev.filter((col) => col.id !== id));

  const editColumn = (id: string) =>
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, isEditing: true } : col
      )
    );

  const saveColumn = (id: string, value: string) =>
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id
          ? {
              ...col,
              title: value.trim() || col.title,
              isEditing: false,
            }
          : col
      )
    );

  const cancelColumn = (id: string) =>
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, isEditing: false } : col
      )
    );

  // Card operations
  const addCard = (colId: string) =>
    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId
          ? {
              ...col,
              cards: [
                ...col.cards,
                { id: `${colId}-${Date.now()}`, title: "New Task" },
              ],
            }
          : col
      )
    );

  const editCard = (cardId: string) =>
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, isEditing: true } : c
        ),
      }))
    );

  const saveCard = (cardId: string, val: string) =>
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId
            ? { ...c, title: val.trim() || c.title, isEditing: false }
            : c
        ),
      }))
    );

  const cancelCard = (cardId: string) =>
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((c) =>
          c.id === cardId ? { ...c, isEditing: false } : c
        ),
      }))
    );

  const deleteCard = (cardId: string) =>
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      }))
    );

  // Drag logic
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    setColumns((prev) => {
      let sourceColIndex = -1;
      let targetColIndex = -1;
      let sourceCardIndex = -1;
      let targetCardIndex = -1;

      prev.forEach((col, colIndex) => {
        col.cards.forEach((card, cardIndex) => {
          if (card.id === active.id) {
            sourceColIndex = colIndex;
            sourceCardIndex = cardIndex;
          }
          if (card.id === over.id) {
            targetColIndex = colIndex;
            targetCardIndex = cardIndex;
          }
        });
      });

      if (targetColIndex === -1) {
        const colId = String(over.id);
        targetColIndex = prev.findIndex((col) => col.id === colId);
        if (targetColIndex === -1) return prev;
        targetCardIndex = prev[targetColIndex].cards.length;
      }

      if (sourceColIndex === -1 || sourceCardIndex === -1) return prev;

      const newCols = prev.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      const [moved] = newCols[sourceColIndex].cards.splice(
        sourceCardIndex,
        1
      );

      newCols[targetColIndex].cards.splice(
        targetCardIndex ?? newCols[targetColIndex].cards.length,
        0,
        moved
      );

      return newCols;
    });
  }

  if (loading) {
    return <div className="p-6 text-white">Loading board...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-semibold text-white">Trello-Lite</h1>
        <button
          onClick={addColumn}
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
        >
          + Add Column
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 px-4 pb-4">
          {columns.map((col) => (
            <Column
              key={col.id}
              column={col}
              onAddCard={() => addCard(col.id)}
              onDeleteColumn={() => deleteColumn(col.id)}
              onStartEditColumn={() => editColumn(col.id)}
              onSaveColumn={(val) => saveColumn(col.id, val)}
              onCancelColumn={() => cancelColumn(col.id)}
              onStartEditCard={editCard}
              onSaveCard={saveCard}
              onCancelCard={cancelCard}
              onDeleteCard={deleteCard}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
