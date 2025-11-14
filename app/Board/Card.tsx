"use client";

import { useState, KeyboardEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card as CardType } from "./types";

interface CardProps {
  card: CardType;
  onEdit: (id: string) => void;
  onSave: (id: string, value: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Card({
  card,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: CardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [value, setValue] = useState(card.title);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSave(card.id, value);
    } else if (e.key === "Escape") {
      onCancel(card.id);
    }
  };

  // 📝 Edit mode
  if (card.isEditing) {
    return (
      <div className="rounded-xl bg-slate-800/90 p-2 shadow-sm">
        <input
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-50 outline-none focus:border-blue-500"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <div className="mt-2 flex justify-between gap-2 text-xs">
          <button
            className="rounded-md bg-red-700 px-2 py-1 text-white hover:bg-red-600"
            onClick={() => {
              console.log("DELETE in edit mode", card.id);
              onDelete(card.id);
            }}
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              className="rounded-md bg-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-600"
              onClick={() => onCancel(card.id)}
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-500"
              onClick={() => onSave(card.id, value)}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Normal mode (view)
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-xl bg-slate-800/95 px-3 py-2 text-sm text-slate-50 shadow-sm hover:bg-slate-700/95"
    >
      <p className="leading-snug">{card.title}</p>

      {/* Always-visible actions */}
      <div className="mt-2 flex justify-end gap-2 text-xs">
        <button
          className="rounded-md bg-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-600"
          onClick={() => {
            console.log("EDIT click", card.id);
            onEdit(card.id);
          }}
        >
          Edit
        </button>
        <button
          className="rounded-md bg-red-700 px-2 py-1 text-white hover:bg-red-600"
          onClick={(e) => {
            e.stopPropagation();
            console.log("DELETE click", card.id);
            onDelete(card.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
