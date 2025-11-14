// app/Board/types.ts

export type Card = {
  id: string;
  title: string;
  isEditing?: boolean;
};

export type Column = {
  id: string;
  title: string;
  isEditing?: boolean;
  cards: Card[];
};
