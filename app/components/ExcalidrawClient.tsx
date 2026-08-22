"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
  }
);

export default function ExcalidrawClient() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
      }}
    >
      <Excalidraw />
    </div>
  );
}