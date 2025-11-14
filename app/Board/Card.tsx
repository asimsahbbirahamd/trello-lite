"use client";

import { useState, KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CardType {
  id: string;
  title: string;
  order: number;
  columnId: string;
  body?: string | null;
}

interface CardProps {
  card: CardType;
  onDelete: () => void;
}

export default function Card({ card, onDelete }: CardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(card.title);
  const [saving, setSaving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function saveTitle() {
    setIsEditing(false);

    const trimmed = value.trim();
    if (!trimmed || trimmed === card.title) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: trimmed }),
      });

      if (!res.ok) {
        console.error("Failed to update card title", await res.text());
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setValue(card.title);
      setIsEditing(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm group relative flex items-start gap-2"
    >
      {/* 🔥 Drag handle only here */}
      <div
        {...attributes}
        {...listeners}
        className="w-2 h-6 mt-1 rounded-full bg-gray-300 cursor-grab active:cursor-grabbing"
        aria-label="Drag card"
      />

      {/* Card content */}
      <div className="flex-1">
        {isEditing ? (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={saving}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:ring focus:ring-gray-300"
          />
        ) : (
          <p
            className="text-sm text-gray-700 cursor-text"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {value}
          </p>
        )}
      </div>

      {/* Delete button – no dnd listeners, click is clean */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-1 mt-0.5 opacity-0 group-hover:opacity-100 
                   text-gray-400 hover:text-red-600 transition"
        aria-label="Delete card"
      >
        ✕
      </button>
    </div>
  );
}
