// import ExcalidrawClient from "./components/ExcalidrawClient";

// export default function Home() {
//   return <ExcalidrawClient />;
// }


"use client";
import { Classroom } from "@/types/classroom";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [classroomName, setClassroomName] = useState("");
  const [classroomCode, setClassroomCode] = useState("");
  const [studentName, setStudentName] = useState("");

  async function createClassroom() {
  if (!classroomName.trim()) {
    alert("Please enter a classroom name.");
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("You must be logged in to create a classroom.");
    router.push("/login");
    return;
  }

  const id = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  const { error } = await supabase
    .from("classrooms")
    .insert({
      id,
      name: classroomName.trim(),
      teacher_id: user.id,
    });

  if (error) {
    console.error("Failed to create classroom:", error);

    alert(
      `Failed to create classroom: ${error.message}`
    );

    return;
  }

  sessionStorage.setItem("currentUserId", user.id);

  router.push(`/classroom/${id}`);
}
  function joinClassroom() {
  const name = studentName.trim();
  const code = classroomCode.trim().toUpperCase();

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  if (!code) {
    alert("Please enter a classroom code.");
    return;
  }


  const storedClassroom = localStorage.getItem(
    `classroom-${code}`
  );

  if (!storedClassroom) {
    alert("Classroom not found. Please check the code.");
    router.push("/");
    return;
  }

    const student = {
    id: `student-${Date.now()}`,
    name,
    role: "student" as const,
    permission: "none" as const,
  };
  localStorage.setItem(
    `student-${code}`,
    JSON.stringify(student)
  );
  sessionStorage.setItem("currentUserId", student.id);

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
            placeholder="Your name"
            value={studentName}
            onChange={(event) => setStudentName(event.target.value)}
          />

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