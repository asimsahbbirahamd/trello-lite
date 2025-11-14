"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType } from "./types";

interface Props {
  card: CardType;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function Card({ card, onEdit, onSave, onCancel, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Editing state
  if (card.isEditing) {
    return (
      <input
        ref={setNodeRef}
        defaultValue={card.title}
        autoFocus
        onBlur={(e) => onSave(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave((e.target as HTMLInputElement).value);
          if (e.key === "Escape") onCancel();
        }}
        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm outline-none border border-slate-700 focus:border-blue-400"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onEdit}
      className="relative group rounded-lg bg-slate-800 px-3 py-2 text-sm shadow-sm cursor-pointer hover:bg-slate-700 transition"
    >
      {card.title}

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
      >
        ✕
      </button>
    </div>
  );
}
