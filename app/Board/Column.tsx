"use client";

import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column as ColumnType } from "./types";
import Card from "./Card";

interface ColumnProps {
  column: ColumnType;
  onAddCard: () => void;
  onDeleteColumn: () => void;
  onStartEditColumn: () => void;
  onSaveColumn: (value: string) => void;
  onCancelColumn: () => void;
  onStartEditCard: (id: string) => void;
  onSaveCard: (id: string, value: string) => void;
  onCancelCard: (id: string) => void;
  onDeleteCard: (id: string) => void;
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
}: ColumnProps) {
  const cardIds = column.cards.map((c) => c.id);

  return (
    <div className="flex w-80 flex-col rounded-2xl border border-slate-700 bg-slate-950/95 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl bg-slate-900/95 px-4 py-3">
        {column.isEditing ? (
          <ColumnTitleEditor
            initialValue={column.title}
            onSave={onSaveColumn}
            onCancel={onCancelColumn}
          />
        ) : (
          <>
            <div>
              <h2 className="text-sm font-semibold text-slate-50">
                {column.title}
              </h2>
              <p className="text-xs text-slate-400">
                {column.cards.length} task
                {column.cards.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={onStartEditColumn}
                className="rounded-md px-2 py-1 text-slate-300 hover:bg-slate-800"
              >
                Edit
              </button>
              <button
                onClick={onDeleteColumn}
                className="rounded-md px-2 py-1 text-red-300 hover:bg-red-700/40"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 px-3 py-3">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onEdit={onStartEditCard}
              onSave={onSaveCard}
              onCancel={onCancelCard}
              onDelete={onDeleteCard}
            />
          ))}
        </SortableContext>
      </div>

      {/* Footer: Add card */}
      <button
        onClick={onAddCard}
        className="mt-auto w-full rounded-b-2xl border-t border-slate-800 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-900/80"
      >
        + Add Card
      </button>
    </div>
  );
}

interface ColumnTitleEditorProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

function ColumnTitleEditor({
  initialValue,
  onSave,
  onCancel,
}: ColumnTitleEditorProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="flex w-full flex-col gap-2">
      <input
        className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-slate-50 outline-none focus:border-blue-500"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end gap-2 text-xs">
        <button
          className="rounded-md bg-slate-800 px-2 py-1 text-slate-200 hover:bg-slate-700"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="rounded-md bg-blue-600 px-2 py-1 text-white hover:bg-blue-500"
          onClick={() => onSave(value)}
        >
          Save
        </button>
      </div>
    </div>
  );
}
