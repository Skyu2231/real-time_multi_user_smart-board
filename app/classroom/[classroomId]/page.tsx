"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Classroom, User } from "@/types/classroom";
import { supabase } from "@/lib/supabase";


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

  async function toggleDrawingPermission(studentId: string) {
  if (!classroom || currentUser?.role !== "teacher") {
    return;
  }

  const student = classroom.students.find(
    (student) => student.id === studentId
  );

  if (!student) {
    return;
  }

  const newPermission =
    student.permission === "draw" ? "none" : "draw";

  const { error } = await supabase
    .from("classroom_members")
    .update({
      permission: newPermission,
    })
    .eq("classroom_id", classroom.id)
    .eq("user_id", studentId);

  if (error) {
    console.error(
      "Failed to update drawing permission:",
      error
    );

    alert(
      `Failed to update permission: ${error.message}`
    );

    return;
  }

  const updatedStudents: User[] =
    classroom.students.map((student) => {
      if (student.id !== studentId) {
        return student;
      }

      return {
        ...student,
        permission: newPermission,
      };
    });

  setClassroom({
    ...classroom,
    students: updatedStudents,
  });

  if (currentUser?.id === studentId) {
    setCurrentUser({
      ...currentUser,
      permission: newPermission,
    });
  }
}

  useEffect(() => {
  async function loadClassroom() {
    const classroomId = params.classroomId as string;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      router.push("/login");
      return;
    }

    const { data: classroomData, error: classroomError } =
      await supabase
        .from("classrooms")
        .select("id, name, teacher_id")
        .eq("id", classroomId)
        .single();

    if (classroomError || !classroomData) {
      console.error(
        "Failed to load classroom:",
        classroomError
      );

      alert(
        `Failed to load classroom: ${
          classroomError?.message ?? "Classroom not found"
        }`
      );

      return;
    }

    const { data: teacherData, error: teacherError } =
      await supabase
        .from("profiles")
        .select("id, name, role")
        .eq("id", classroomData.teacher_id)
        .single();

    if (teacherError || !teacherData) {
      console.error(
        "Failed to load teacher:",
        teacherError
      );

      alert(
        `Failed to load teacher: ${
          teacherError?.message ?? "Teacher profile not found"
        }`
      );

      return;
    }


    const { data: memberData, error: memberError } =
      await supabase
        .from("classroom_members")
        .select(`
          user_id,
          permission,
          profiles (
            id,
            name,
            role
          )
        `)
        .eq("classroom_id", classroomId);

    if (memberError) {
      console.error(
        "Failed to load classroom members:",
        memberError
      );

      alert(
        `Failed to load students: ${memberError.message}`
      );

      return;
    }

    const students: User[] = (memberData ?? [])
  .filter((member) => {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles;

    return profile?.role === "student";
  })
  .map((member) => {
    const profile = Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles;

    return {
      id: member.user_id,
      name: profile?.name ?? "Student",
      role: "student" as const,
      permission:
        member.permission === "draw"
          ? ("draw" as const)
          : ("none" as const),
    };
  });

    const teacher: User = {
      id: teacherData.id,
      name: teacherData.name,
      role: "teacher",
      permission: "draw_and_type",
    };

    const classroom: Classroom = {
      id: classroomData.id,
      name: classroomData.name,
      teacher,
      students,
    };

    setClassroom(classroom);

    if (user.id === classroomData.teacher_id) {
      setCurrentUser(teacher);
      return;
    }

    const currentStudent = students.find(
      (student) => student.id === user.id
    );

    if (currentStudent) {
      setCurrentUser(currentStudent);
    }

  }

  loadClassroom();
}, [params.classroomId, router]);

  useEffect(() => {
  const classroomId = params.classroomId as string;

  const channel = supabase
    .channel(`classroom-members-${classroomId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "classroom_members",
        filter: `classroom_id=eq.${classroomId}`,
      },
      (payload) => {
        console.log(
          "Realtime permission update:",
          payload
        );

        const updatedMember =
          payload.new as {
            user_id: string;
            permission: "none" | "draw";
          };

        setClassroom((currentClassroom) => {
          if (!currentClassroom) {
            return currentClassroom;
          }

          const updatedStudents =
            currentClassroom.students.map((student) => {
              if (
                student.id !== updatedMember.user_id
              ) {
                return student;
              }

              return {
                ...student,
                permission:
                  updatedMember.permission === "draw"
                    ? ("draw" as const)
                    : ("none" as const),
              };
            });

          return {
            ...currentClassroom,
            students: updatedStudents,
          };
        });

        setCurrentUser((currentUser) => {
          if (
            !currentUser ||
            currentUser.id !== updatedMember.user_id
          ) {
            return currentUser;
          }

          return {
            ...currentUser,
            permission:
              updatedMember.permission === "draw"
                ? ("draw" as const)
                : ("none" as const),
          };
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [params.classroomId]);

  if (!classroom) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Loading classroom...</h1>
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
      onClick={() =>{
        sessionStorage.removeItem("currentUserId");
        router.replace("/");
      }
    }
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