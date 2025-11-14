"use client";

import dynamic from "next/dynamic";

const Board = dynamic(() => import("./Board/Board"), {
  ssr: false,
});

export default function HomePage() {
  return <Board />;
}
