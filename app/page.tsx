// import ExcalidrawClient from "./components/ExcalidrawClient";

// export default function Home() {
//   return <ExcalidrawClient />;
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [classroomName, setClassroomName] = useState("");
  const [classroomCode, setClassroomCode] = useState("");

  function createClassroom() {
    if (!classroomName.trim()) {
      alert("Please enter a classroom name.");
      return;
    }

    const id = Math.random().toString(36).substring(2, 8).toUpperCase();

    router.push(`/classroom/${id}`);
  }

  function joinClassroom() {
    const code = classroomCode.trim().toUpperCase();

    if (!code) {
      alert("Please enter a classroom code.");
      return;
    }

    router.push(`/classroom/${code}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
        }}
      >
        <h1>SmartBoard</h1>

        <p>Interactive classroom whiteboard</p>

        <hr />

        <section>
          <h2>Create a Classroom</h2>

          <input
            type="text"
            placeholder="Classroom name"
            value={classroomName}
            onChange={(event) => setClassroomName(event.target.value)}
          />

          <button onClick={createClassroom}>
            Create Classroom
          </button>
        </section>

        <hr />

        <section>
          <h2>Join a Classroom</h2>

          <input
            type="text"
            placeholder="Enter classroom code"
            value={classroomCode}
            onChange={(event) => setClassroomCode(event.target.value)}
          />

          <button onClick={joinClassroom}>
            Join Classroom
          </button>
        </section>
      </div>
    </main>
  );
}