"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { Classroom, User } from "@/types/classroom";
import type { ExcalidrawImperativeAPI,} from "@excalidraw/excalidraw/types";
import { supabase } from "@/lib/supabase";
import { CaptureUpdateAction } from "@excalidraw/excalidraw";


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

  const excalidrawAPI =
  useRef<ExcalidrawImperativeAPI | null>(null);

  const whiteboardChannel =
    useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isApplyingRemoteChange =
    useRef(false);

  const clientId = useRef(
    Math.random().toString(36).substring(2, 10)
  );

  const broadcastTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const saveTimeout =
  useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingElements = useRef<any>([]);

  const outgoingSequence = useRef(0);

  const lastReceivedSequence = useRef(
    new Map<string, number>()
  );

  const saveWhiteboard = async (elements: any) => {
  const classroomId = params.classroomId as string;

  const { error } = await supabase
    .from("whiteboards")
    .upsert(
      {
        classroom_id: classroomId,
        data: {
          elements,
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "classroom_id",
      }
    );

    if (error) {
      console.error(
        "Failed to save whiteboard:",
        error
      );
    } else {
      console.log("Whiteboard saved");
    }
  };

  const loadWhiteboard = async () => {
  const classroomId = params.classroomId as string;

  const { data, error } = await supabase
    .from("whiteboards")
    .select("data")
    .eq("classroom_id", classroomId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load whiteboard:",
      error
    );
    return;
  }

  if (!data?.data) {
    console.log("No saved whiteboard found");
    return;
  }

  const savedData = data.data as any;

  if (!savedData.elements) {
    console.log("Saved whiteboard has no elements");
    return;
  }

  if (!excalidrawAPI.current) {
    console.log(
      "Excalidraw API is not ready yet"
    );
    return;
  }

  isApplyingRemoteChange.current = true;

  excalidrawAPI.current.updateScene({
    elements: savedData.elements,
    captureUpdate: CaptureUpdateAction.NEVER,
  });

  requestAnimationFrame(() => {
    isApplyingRemoteChange.current = false;
  });

  console.log("Whiteboard restored");
};

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
        event: "*",
        schema: "public",
        table: "classroom_members",
        filter: `classroom_id=eq.${classroomId}`,
      },
      async (payload) => {
        console.log("Realtime classroom member change:", payload);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data: memberData, error } = await supabase
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

        if (error) {
          console.error(
            "Failed to reload classroom members:",
            error
          );

          return;
        }

        const updatedStudents: User[] = (memberData ?? [])
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

        setClassroom((currentClassroom) => {
          if (!currentClassroom) {
            return currentClassroom;
          }

          return {
            ...currentClassroom,
            students: updatedStudents,
          };
        });

        setCurrentUser((currentUser) => {
          if (!currentUser) {
            return currentUser;
          }

          const updatedStudent = updatedStudents.find(
            (student) => student.id === currentUser.id
          );

          if (!updatedStudent) {
            return currentUser;
          }

          return updatedStudent;
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [params.classroomId]);


    useEffect(() => {
  const classroomId = params.classroomId as string;

  const channel = supabase.channel(
    `whiteboard-${classroomId}`
  );

  whiteboardChannel.current = channel;

  channel
    .on(
      "broadcast",
      { event: "whiteboard-update" },
      (payload) => {
        console.log(
          "Received whiteboard update:",
          payload
        );

        const data = payload.payload;

        if (!data) {
          return;
        }

        if (data.clientId === clientId.current) {
          return;
        }

        if (!data.elements) {
          return;
        }

        if (!excalidrawAPI.current) {
          return;
        }

        const incomingSequence =
          typeof data.sequence === "number"
            ? data.sequence
            : 0;

        const previousSequence =
          lastReceivedSequence.current.get(
            data.clientId
          ) ?? -1;

        // Ignore an older update.
        if (incomingSequence <= previousSequence) {
          return;
        }

        lastReceivedSequence.current.set(
          data.clientId,
          incomingSequence
        );

        const currentElements =
          excalidrawAPI.current
            .getSceneElementsIncludingDeleted();

        const currentById = new Map(
          currentElements.map((element: any) => [
            element.id,
            element,
          ])
        );

        for (const incomingElement of data.elements) {
          const localElement =
            currentById.get(incomingElement.id);

          if (!localElement) {
            currentById.set(
              incomingElement.id,
              incomingElement
            );
            continue;
          }

          const incomingVersion =
            incomingElement.version ?? 0;

          const localVersion =
            localElement.version ?? 0;

          if (incomingVersion >= localVersion) {
            currentById.set(
              incomingElement.id,
              incomingElement
            );
          }
        }

        const mergedElements = Array.from(
          currentById.values()
        );

        isApplyingRemoteChange.current = true;

        excalidrawAPI.current.updateScene({
          elements: mergedElements,
          captureUpdate: CaptureUpdateAction.NEVER,
        });

        requestAnimationFrame(() => {
          isApplyingRemoteChange.current = false;
        });
      }
    )
    .subscribe((status) => {
      console.log(
        "Whiteboard realtime status:",
        status
      );
    });

  return () => {
    if (broadcastTimeout.current) {
      clearTimeout(broadcastTimeout.current);
      broadcastTimeout.current = null;
    }

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }


    whiteboardChannel.current = null;

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
        excalidrawAPI={(api) => {
          excalidrawAPI.current = api;
          loadWhiteboard();
        }}
        viewModeEnabled={
          currentUser?.role === "student" &&
          currentUser.permission !== "draw"
        }
        
        onChange={(elements) => {
          if (isApplyingRemoteChange.current) {
            return;
          }

          if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
          }

          saveTimeout.current = setTimeout(() => {
            saveWhiteboard(elements);

            saveTimeout.current = null;
          }, 1000);

          const channel = whiteboardChannel.current;

          if (!channel) {
            return;
          }

          // Always keep the newest local scene.
          pendingElements.current = elements;

          // Don't schedule multiple broadcasts.
          if (broadcastTimeout.current) {
            return;
          }

          broadcastTimeout.current = setTimeout(() => {
            const latestElements =
              pendingElements.current;

            outgoingSequence.current += 1;

            channel.send({
              type: "broadcast",
              event: "whiteboard-update",
              payload: {
                clientId: clientId.current,
                sequence: outgoingSequence.current,
                elements: latestElements,
              },
            });

            broadcastTimeout.current = null;
          }, 100);
        }}
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