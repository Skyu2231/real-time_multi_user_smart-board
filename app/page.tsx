// import ExcalidrawClient from "./components/ExcalidrawClient";

// export default function Home() {
//   return <ExcalidrawClient />;
// }


"use client";
import { Classroom } from "@/types/classroom";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  const [classroomName, setClassroomName] = useState("");
  const [classroomCode, setClassroomCode] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      

    // console.log("Current authenticated user:", user);


      if (!user) {
        router.push("/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkAuth();
  }, [router]);

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
  async function joinClassroom() {
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

  // Get the currently logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("You must be logged in to join a classroom.");
    router.push("/login");
    return;
  }

  // Check that the classroom exists
  const { data: classroom, error: classroomError } =
    await supabase
      .from("classrooms")
      .select("id, name")
      .eq("id", code)
      .single();

  if (classroomError || !classroom) {
    console.error(
      "Failed to find classroom:",
      classroomError
    );

    alert("Classroom not found. Please check the code.");
    return;
  }

  // Check whether the student is already a member
  const { data: existingMember } = await supabase
    .from("classroom_members")
    .select("id")
    .eq("classroom_id", code)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    alert("You have already joined this classroom.");
    sessionStorage.setItem("currentUserId", user.id);
    router.push(`/classroom/${code}`);
    return;
  }

  // Add the student to the classroom
  const { error: joinError } = await supabase
    .from("classroom_members")
    .insert({
      classroom_id: code,
      user_id: user.id,
      permission: "none",
    });

  if (joinError) {
    console.error(
      "Failed to join classroom:",
      joinError
    );

    alert(
      `Failed to join classroom: ${joinError.message}`
    );

    return;
  }

  sessionStorage.setItem("currentUserId", user.id);

  router.push(`/classroom/${code}`);
}
  async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Failed to log out:", error);
    alert("Failed to log out.");
    return;
  }

  router.push("/login");
}

  if (checkingAuth) {
    return <p>Checking authentication...</p>;
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
        
        <button onClick={logout}>
          Logout
        </button>

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