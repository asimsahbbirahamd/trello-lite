"use client";

import Card from "./Card";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Column as ColumnType } from "./types";

interface Props {
  column: ColumnType;
  onAddCard: () => void;
  onDeleteColumn: () => void;
  onStartEditColumn: () => void;
  onSaveColumn: (val: string) => void;
  onCancelColumn: () => void;

  // Card operations:
  onStartEditCard: (cardId: string) => void;
  onSaveCard: (cardId: string, val: string) => void;
  onCancelCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export default function Column({
  column,
  onAddCard,
  onDeleteColumn,
  onStartEditColumn,
  onSaveColumn,
  onCancelColumn,
  onStartEditCard,
  onSaveCard,
  onCancelCard,
  onDeleteCard,
}: Props) {
  return (
    <div
      id={column.id}
      className="w-72 rounded-xl bg-slate-900 border border-slate-800 flex flex-col group"
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-slate-800 relative">
        {column.isEditing ? (
          <input
            defaultValue={column.title}
            autoFocus
            onBlur={(e) => onSaveColumn(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onSaveColumn((e.target as HTMLInputElement).value);
              if (e.key === "Escape") onCancelColumn();
            }}
            className="w-full text-sm bg-slate-800 border border-slate-700 rounded px-2 py-1 outline-none focus:border-blue-400"
          />
        ) : (
          <h2
            onClick={onStartEditColumn}
            className="text-sm font-semibold cursor-pointer hover:text-blue-300"
          >
            {column.title}
          </h2>
        )}

        {/* Delete Column Button */}
        <button
          onClick={onDeleteColumn}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs"
        >
          🗑️
        </button>

        <span className="text-xs text-slate-500">{column.cards.length}</span>
      </div>

      {/* CARD LIST */}
      <div className="p-3 space-y-2">
        <SortableContext
          id={column.id}
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={() => onStartEditCard(card.id)}
              onSave={(val) => onSaveCard(card.id, val)}
              onCancel={() => onCancelCard(card.id)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </SortableContext>

        {/* Add Card */}
        <button
          onClick={onAddCard}
          className="w-full text-left text-xs text-slate-400 hover:text-white px-2 py-1 mt-1 rounded hover:bg-slate-800 transition"
        >
          + Add Card
        </button>
      </div>
    </div>
  );
}
