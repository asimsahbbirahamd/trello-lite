"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";

import Column from "./Column";
import { Column as ColumnType } from "./types";



const defaultColumns: ColumnType[] = [
  {
    id: "todo",
    title: "To Do",
    cards: [
      { id: "todo-1", title: "Set up project" },
      { id: "todo-2", title: "Design board layout" },
      { id: "todo-3", title: "Plan features" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    cards: [{ id: "inprogress-1", title: "Build basic UI" }],
  },
  {
    id: "done",
    title: "Done",
    cards: [{ id: "done-1", title: "Decide tech stack" }],
  },
];

export default function Board() {
  const [columns, setColumns] = useState<ColumnType[]>(defaultColumns);

  // Load from localStorage
useEffect(() => {
  const saved = localStorage.getItem("kanban-board");
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as ColumnType[];
      setColumns(parsed);
    } catch (err) {
      console.error("Invalid saved board data:", err);
    }
  }
}, []);


  // Save when columns change
  useEffect(() => {
    localStorage.setItem("kanban-board", JSON.stringify(columns));
  }, [columns]);

  // Column operations ---------------------
  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      { id: `col-${Date.now()}`, title: "New Column", cards: [] },
    ]);
  };

  const deleteColumn = (id: string) =>
    setColumns((prev) => prev.filter((col) => col.id !== id));

  const editColumn = (id: string) =>
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, isEditing: true } : col))
    );

  const saveColumn = (id: string, value: string) =>
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id
          ? { ...col, title: value.trim() || col.title, isEditing: false }
          : col
      )
    );

  const cancelColumn = (id: string) =>
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, isEditing: false } : col))
    );

  // Card operations ----------------------
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

  // DRAG LOGIC ----------------------------------------------
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    setColumns((prev) => {
      let sourceColIndex = -1;
      let targetColIndex = -1;
      let sourceCardIndex = -1;
      let targetCardIndex = -1;

      prev.forEach((col, colIndex) =>
        col.cards.forEach((card, cardIndex) => {
          if (card.id === active.id) {
            sourceColIndex = colIndex;
            sourceCardIndex = cardIndex;
          }
          if (card.id === over.id) {
            targetColIndex = colIndex;
            targetCardIndex = cardIndex;
          }
        })
      );

      if (targetColIndex === -1) {
        const colId = over.id.toString();
        targetColIndex = prev.findIndex((col) => col.id === colId);
        targetCardIndex = prev[targetColIndex].cards.length;
      }

      const newCols = [...prev];
      const [moved] = newCols[sourceColIndex].cards.splice(
        sourceCardIndex,
        1
      );
      newCols[targetColIndex].cards.splice(targetCardIndex, 0, moved);
      return newCols;
    });
  }

  // RENDER ----------------------------------------------
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trello-Lite</h1>

        <button
          onClick={addColumn}
          className="text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700"
        >
          + Add Column
        </button>
      </header>

      <section className="flex-1 overflow-x-auto px-6 py-6">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 items-start">
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
      </section>
    </main>
  );
}
