"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Classroom, User } from "@/types/classroom";


const Excalidraw = dynamic(
  async () => {
    const module = await import("@excalidraw/excalidraw");

    return {
      default: module.Excalidraw,
    };
  },
  {
    ssr: false,
  }
);

export default function ClassroomPage() {
  const params = useParams();
  
  const router= useRouter();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  function toggleDrawingPermission(studentId: string) {
  if (!classroom || currentUser?.role !== "teacher") {
    return;
  }

//   const updatedStudents = classroom.students.map((student) => {
    const updatedStudents: User[] = classroom.students.map((student) => {
    if (student.id !== studentId) {
      return student;
    }

    return {
      ...student,
      permission:
        student.permission === "draw" ? "none" : "draw",
    };
  });

    const updatedClassroom: Classroom = {
    ...classroom,
    students: updatedStudents,
    };
  setClassroom(updatedClassroom);

  localStorage.setItem(
    `classroom-${classroom.id}`,
    JSON.stringify(updatedClassroom)
  );
}

  useEffect(() => {
    const classroomId = params.classroomId as string;

    const storedClassroom = localStorage.getItem(
      `classroom-${classroomId}`
    );

    const storedStudent = localStorage.getItem(
      `student-${classroomId}`
    );

    if (!storedClassroom) {
      return;
    }

    const classroomData: Classroom =
      JSON.parse(storedClassroom);

    if (storedStudent) {
      const student: User = JSON.parse(storedStudent);

      const alreadyJoined = classroomData.students.some(
        (existingStudent) => existingStudent.id === student.id
      );

      if (!alreadyJoined) {
        classroomData.students.push(student);

        localStorage.setItem(
          `classroom-${classroomId}`,
          JSON.stringify(classroomData)
        );
      }
    }

    setClassroom(classroomData);

    const currentUserId =
    sessionStorage.getItem("currentUserId");

    if (!currentUserId) {
    return;
    }

    if (classroomData.teacher.id === currentUserId) {
    setCurrentUser(classroomData.teacher);
    return;
    }

    const student = classroomData.students.find(
    (student) => student.id === currentUserId
    );

    if (student) {
    setCurrentUser(student);
    }
  }, [params.classroomId]);

  if (!classroom) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Classroom not found</h1>
      </main>
    );
  }

return (
  <main
    style={{
      minHeight: "100vh",
      padding: "20px",
    }}
  >
    <button
      onClick={() => router.push("/")}
      style={{
        marginBottom: "20px",
        padding: "8px 14px",
        cursor: "pointer",
      }}
    >
      Leave Classroom
    </button>


    <h1>{classroom.name}</h1>

    <p>
      Current-State: <strong>Active</strong>
    </p>

    {currentUser && (
      <div
        style={{
          marginTop: "10px",
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <p>
          You are: <strong>{currentUser.name}</strong> (
          {currentUser.role})
        </p>

        {currentUser.role === "teacher" ? (
          <p>
            Whiteboard: <strong>Editable</strong>
          </p>
        ) : (
          <p>
            Permission: <strong>{currentUser.permission}</strong>
          </p>
        )}
      </div>
    )}

    {currentUser?.role === "student" && (
      <p>
        {currentUser.permission === "draw"
          ? "You can draw on the whiteboard."
          : "You are currently in view-only mode."}
      </p>
    )}


    <div
      style={{
        marginTop: "10px",
        marginBottom: "20px",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <p style={{ margin: 0 }}>
        Classroom Code:
      </p>

      <strong
        style={{
          fontSize: "24px",
          letterSpacing: "3px",
        }}
      >
        {classroom.id}
      </strong>
    </div>

    <div
      style={{
        width: "100%",
        height: "600px",
        marginTop: "20px",
        border: "1px solid #ddd",
      }}
    >
      <Excalidraw
        viewModeEnabled={
          currentUser?.role === "student" &&
          currentUser.permission !== "draw"
        }
      />
    </div>

    <section style={{ marginTop: "30px" }}>
      <h2>Teacher</h2>

      <p>
        {classroom.teacher.name} ({classroom.teacher.role})
      </p>

      {currentUser?.role === "teacher" && (
        <>
          <h2>Students</h2>

          {classroom.students.length === 0 ? (
            <p>No students have joined yet.</p>
          ) : (
            <ul>
              {classroom.students.map((student) => (
                <li key={student.id} style={{marginBottom: "12px"}}>
                   <strong>{student.name}</strong>{" "}
                    ({student.role})

                      <br />

                      Permission:{" "}
                      <strong>
                        {student.permission === "draw"
                          ? "Can Draw"
                          : "View Only"}
                      </strong>

                      <br />

                  <button
                    onClick={() =>
                      toggleDrawingPermission(student.id)
                    }
                    style={{
                      marginTop:"5px",
                      padding:"6px 10px",
                      cursor:"pointer",
                      backgroundColor:"white",
                      color:"blue",
                      borderRadius:"5px",
                    }}
                  >
                    {student.permission === "draw"
                      ? "Revoke Drawing"
                      : "Allow Drawing"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  </main>
);
}