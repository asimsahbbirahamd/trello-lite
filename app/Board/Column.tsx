"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Card from "./Card";

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

interface ColumnProps {
  column: ColumnType;
  onUpdate: (column: ColumnType) => void;
  onDelete: (columnId: string) => void;
}

export default function Column({ column, onUpdate, onDelete }: ColumnProps) {
  const [title, setTitle] = useState(column.title);
  const [editing, setEditing] = useState(false);

  const cards = column.cards ?? [];

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
  });

  async function saveTitle() {
    setEditing(false);

    const res = await fetch(`/api/columns/${column.id}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      console.error("Failed to update column title", await res.text());
      return;
    }

    const updated = (await res.json()) as ColumnType;

    onUpdate({
      ...column,
      ...updated,
      cards: updated.cards ?? cards,
    });
  }

  async function addCard() {
    const res = await fetch("/api/cards", {
      method: "POST",
      body: JSON.stringify({
        columnId: column.id,
        title: "New Card",
      }),
    });

    if (!res.ok) {
      console.error("Failed to create card", await res.text());
      return;
    }

    const newCard = (await res.json()) as CardType;

    onUpdate({
      ...column,
      cards: [...cards, newCard],
    });
  }

  async function deleteColumn() {
    await fetch(`/api/columns/${column.id}`, {
      method: "DELETE",
    });
    onDelete(column.id);
  }

  // 🔥 REAL delete happens here
  async function deleteCard(cardId: string) {
  const res = await fetch(`/api/cards/${cardId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    console.error("Failed to delete card on server", await res.text());
    // we *still* update the UI below so it feels responsive
  }

  const nextCards = (column.cards ?? []).filter(
    (c: CardType) => c.id !== cardId
  );

  onUpdate({
    ...column,
    cards: nextCards,
  });
}


  return (
    <div
      ref={setDroppableRef}
      className={`w-72 border border-gray-300 rounded-xl p-4 space-y-4 transition-colors ${
        isOver ? "bg-gray-300" : "bg-gray-200"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="w-full px-2 py-1 text-sm border rounded"
            autoFocus
          />
        ) : (
          <h2
            onClick={() => setEditing(true)}
            className="font-semibold text-gray-700 cursor-pointer"
          >
            {title}
          </h2>
        )}

        <button
          onClick={deleteColumn}
          className="text-gray-400 hover:text-red-500"
        >
          ✕
        </button>
      </div>

      {/* Cards */}
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {cards
            .slice()
            .sort(
              (a: CardType, b: CardType) =>
                (a?.order ?? 0) - (b?.order ?? 0)
            )
            .map((card: CardType) => (
              <Card
                key={card.id}
                card={card}
                onDelete={() => deleteCard(card.id)}
              />
            ))}
        </div>
      </SortableContext>

      {/* Add Card */}
      <button
        onClick={addCard}
        className="text-left w-full text-sm text-gray-600 hover:text-gray-900"
      >
        + Add a card
      </button>
    </div>
  );
}
