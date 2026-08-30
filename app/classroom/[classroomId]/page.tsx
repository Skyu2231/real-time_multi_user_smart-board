"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Classroom, User } from "@/types/classroom";

export default function ClassroomPage() {
  const params = useParams();

  const [classroom, setClassroom] = useState<Classroom | null>(null);

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
              {student.name} ({student.role})
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}