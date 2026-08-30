"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Classroom, User } from "@/types/classroom";

export default function ClassroomPage() {
  const params = useParams();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  function toggleDrawingPermission(studentId: string) {
  if (!classroom) {
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
  }, [params.classroomId]);

  if (!classroom) {
    return (
      <main style={{ padding: "40px" }}>
        <h1>Classroom not found</h1>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px" }}>
      <h1>{classroom.name}</h1>

      <p>
        Classroom Code: <strong>{classroom.id}</strong>
      </p>

      <h2>Teacher</h2>

      <p>
        {classroom.teacher.name} ({classroom.teacher.role})
      </p>

      <h2>Students</h2>

        {classroom.students.length === 0 ? (
        <p>No students have joined yet.</p>
        ) : (
        <ul>
            {classroom.students.map((student) => (
            <li key={student.id}>
                {student.name} ({student.role}) - Permission:{" "}
                {student.permission}

                {" "}

                <button
                onClick={() =>
                    toggleDrawingPermission(student.id)
                }
                >
                {student.permission === "draw"
                    ? "Revoke Drawing"
                    : "Allow Drawing"}
                </button>
            </li>
            ))}
        </ul>
        )}
    </main>
  );
}