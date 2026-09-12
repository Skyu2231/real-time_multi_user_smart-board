"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

import styles from "./page.module.css";

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
      alert(`Failed to create classroom: ${error.message}`);
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in to join a classroom.");
      router.push("/login");
      return;
    }

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
      alert(`Failed to join classroom: ${joinError.message}`);
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
    return (
      <main className={styles.loading}>
        Loading SmartBoard...
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div
        className={`${styles.backgroundGlow} ${styles.glowOne}`}
      />

      <div
        className={`${styles.backgroundGlow} ${styles.glowTwo}`}
      />

      <div className={styles.container}>
        {/* Header */}

        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandMark}>✦</div>

            <div>
              <h1 className={styles.brandName}>
                SmartBoard
              </h1>

              <p className={styles.brandSubtitle}>
                Collaborative classroom workspace
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className={styles.logoutButton}
          >
            Logout
          </button>
        </header>

        {/* Hero */}

        <section className={styles.hero}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Interactive learning
          </div>

          <h2 className={styles.heroTitle}>
            Your classroom,
            <br />
            <span className={styles.gradientText}>
              reimagined.
            </span>
          </h2>

          <p className={styles.heroDescription}>
            Create a shared digital workspace where
            teachers and students can think, draw, and
            collaborate together in real time.
          </p>
        </section>

        {/* Classroom cards */}

        <section className={styles.cards}>
          {/* Create */}

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>＋</div>

              <div className={styles.cardTag}>
                Teacher
              </div>
            </div>

            <h3 className={styles.cardTitle}>
              Create a Classroom
            </h3>

            <p className={styles.cardDescription}>
              Start a new collaborative space and invite
              students to your interactive whiteboard.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Classroom name
              </label>

              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Physics — Grade 10"
                value={classroomName}
                onChange={(event) =>
                  setClassroomName(event.target.value)
                }
              />
            </div>

            <button
              onClick={createClassroom}
              className={styles.primaryButton}
            >
              Create Classroom
            </button>
          </div>

          {/* Join */}

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>↗</div>

              <div className={styles.cardTag}>
                Student
              </div>
            </div>

            <h3 className={styles.cardTitle}>
              Join a Classroom
            </h3>

            <p className={styles.cardDescription}>
              Enter the classroom details provided by
              your teacher and start collaborating.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Your name
              </label>

              <input
                className={styles.input}
                type="text"
                placeholder="Enter your name"
                value={studentName}
                onChange={(event) =>
                  setStudentName(event.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Classroom code
              </label>

              <input
                className={`${styles.input} ${styles.codeInput}`}
                type="text"
                placeholder="e.g. ABC123"
                value={classroomCode}
                onChange={(event) =>
                  setClassroomCode(event.target.value)
                }
              />
            </div>

            <button
              onClick={joinClassroom}
              className={styles.primaryButton}
            >
              Join Classroom
            </button>
          </div>
        </section>

        {/* Feature strip */}

        <section className={styles.bottomSection}>
          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>✦</span>
            Real-time collaboration
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>◈</span>
            Shared interactive whiteboard
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoIcon}>✓</span>
            Teacher-controlled permissions
          </div>
        </section>

        <footer className={styles.footer}>
          SmartBoard · Built for collaborative learning
        </footer>
      </div>
    </main>
  );
}