"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();

  const [classroomName, setClassroomName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [classroomCode, setClassroomCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(false);
  }

  async function createClassroom() {
    setError("");

    if (!classroomName.trim()) {
      setError("Please enter a classroom name.");
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const classroomId = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

      const { error: insertError } = await supabase
        .from("classrooms")
        .insert({
          id: classroomId,
          name: classroomName.trim(),
          teacher_id: user.id,
        });

      if (insertError) {
        console.error(insertError);
        setError("Could not create the classroom. Please try again.");
        return;
      }

      sessionStorage.setItem("currentUserId", user.id);

      router.push(`/classroom/${classroomId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function joinClassroom() {
    setError("");

    if (!studentName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!classroomCode.trim()) {
      setError("Please enter the classroom code.");
      return;
    }

    setJoining(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const normalizedCode = classroomCode.trim().toUpperCase();

      const { data: classroom, error: classroomError } = await supabase
        .from("classrooms")
        .select("id")
        .eq("id", normalizedCode)
        .maybeSingle();

      if (classroomError) {
        console.error(classroomError);
        setError("Could not check the classroom. Please try again.");
        return;
      }

      if (!classroom) {
        setError("Classroom not found. Check the code and try again.");
        return;
      }

      const { data: existingMember, error: memberCheckError } =
        await supabase
          .from("classroom_members")
          .select("id")
          .eq("classroom_id", normalizedCode)
          .eq("user_id", user.id)
          .maybeSingle();

      if (memberCheckError) {
        console.error(memberCheckError);
        setError("Could not check your classroom membership.");
        return;
      }

      if (!existingMember) {
        const { error: memberInsertError } = await supabase
          .from("classroom_members")
          .insert({
            classroom_id: normalizedCode,
            user_id: user.id,
            permission: "none",
          });

        if (memberInsertError) {
          console.error(memberInsertError);
          setError("Could not join the classroom. Please try again.");
          return;
        }
      }

      sessionStorage.setItem("currentUserId", user.id);

      router.push(`/classroom/${normalizedCode}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className={styles.loadingScreen}>
        <div className={styles.loadingLogo}>SB</div>
        <p>Loading SmartBoard...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Decorative background */}
      <div className={styles.backgroundNoise} />
      <div className={styles.backgroundGlow} />

      {/* =====================================================
          NAVIGATION
          ===================================================== */}

      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoBox}>
            SB
          </div>

          <div className={styles.logoText}>
            <strong>SmartBoard</strong>
            <span>interactive classroom</span>
          </div>
        </div>

        <nav className={styles.navigation}>
          <a href="#how-it-works">How it works</a>
          <a href="#classrooms">Classrooms</a>
          <a href="#features">Features</a>
        </nav>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={logout}
        >
          Logout
        </button>
      </header>

      {/* =====================================================
          HERO
          ===================================================== */}

      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroLabel}>
            <span className={styles.labelLine} />
            INTERACTIVE CLASSROOM PLATFORM
          </div>

          <h1 className={styles.heroTitle}>
            Your classroom,
            <br />
            <span>reimagined.</span>
          </h1>

          <p className={styles.heroDescription}>
            A shared digital whiteboard where teachers and students
            can draw, explain, and collaborate together in real time.
          </p>

          <div className={styles.heroActions}>
            <a
              href="#classrooms"
              className={styles.primaryAction}
            >
              Get started
              <span>→</span>
            </a>

            <a
              href="#how-it-works"
              className={styles.secondaryAction}
            >
              See how it works
            </a>
          </div>

          <div className={styles.heroMeta}>
            <div>
              <span className={styles.metaSymbol}>●</span>
              REAL-TIME
            </div>

            <div>
              <span className={styles.metaSymbol}>□</span>
              SHARED BOARD
            </div>

            <div>
              <span className={styles.metaSymbol}>+</span>
              TEACHER CONTROL
            </div>
          </div>
        </div>

        {/* =================================================
            ANIMATED BOARD
            ================================================= */}

        <div className={styles.boardArea}>
          <div className={styles.boardShadow} />

          <div className={styles.smartBoard}>
            {/* Board header */}
            <div className={styles.boardHeader}>
              <div className={styles.boardBrand}>
                <span className={styles.boardLogo}>SB</span>

                <div>
                  <strong>Physics — Class 10</strong>
                  <small>Shared classroom board</small>
                </div>
              </div>

              <div className={styles.liveStatus}>
                <span />
                LIVE
              </div>
            </div>

            {/* Board canvas */}
            <div className={styles.canvas}>
              <div className={styles.canvasGrid} />

              {/* Equation */}
              <div className={styles.equation}>
                <span>F</span>
                <small>=</small>
                <em>m</em>
                <span>a</span>
              </div>

              {/* Teacher handwriting */}
              <svg
                className={styles.drawing}
                viewBox="0 0 600 350"
                preserveAspectRatio="none"
              >
                <path
                  className={styles.drawPath}
                  d="M80 240 C115 205 135 270 170 230 C210 185 235 205 270 225 C315 250 340 155 385 180 C420 200 435 230 470 175 C500 130 520 145 550 105"
                />
              </svg>

              {/* Graph */}
              <div className={styles.graph}>
                <span className={styles.xAxis} />
                <span className={styles.yAxis} />
                <span className={styles.graphCurve} />

                <i className={styles.graphDotOne} />
                <i className={styles.graphDotTwo} />
                <i className={styles.graphDotThree} />
              </div>

              {/* Teacher cursor */}
              <div className={`${styles.cursor} ${styles.teacherCursor}`}>
                <span className={styles.cursorArrow}>↖</span>

                <div className={styles.cursorTag}>
                  <b>T</b>
                  Teacher
                </div>
              </div>

              {/* Student cursor */}
              <div className={`${styles.cursor} ${styles.studentCursor}`}>
                <span className={styles.cursorArrow}>↖</span>

                <div className={styles.cursorTag}>
                  <b>S</b>
                  Student 01
                </div>
              </div>

              {/* Notification */}
              <div className={styles.boardNotification}>
                <span>✓</span>

                <div>
                  <strong>Student 01</strong>
                  <small>permission granted</small>
                </div>
              </div>
            </div>

            {/* Board footer */}
            <div className={styles.boardFooter}>
              <div className={styles.people}>
                <div className={styles.peopleIcons}>
                  <span>T</span>
                  <span>S</span>
                  <span>A</span>
                </div>

                <small>
                  <b>3</b> connected
                </small>
              </div>

              <div className={styles.synced}>
                <span />
                synced
              </div>
            </div>
          </div>

          {/* Floating labels */}
          <div className={styles.floatingNoteOne}>
            <span>01</span>
            Teacher draws
          </div>

          <div className={styles.floatingNoteTwo}>
            <span>02</span>
            Student joins
          </div>

          <div className={styles.floatingNoteThree}>
            <span>03</span>
            Everyone sees it
          </div>
        </div>
      </section>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator}>
        <span>scroll</span>
        <div />
      </div>

      {/* =====================================================
          HOW IT WORKS
          ===================================================== */}

      <section
        id="how-it-works"
        className={styles.howSection}
      >
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionNumber}>01</span>
            <span className={styles.sectionLabel}>
              HOW IT WORKS
            </span>
          </div>

          <h2>
            One board.
            <br />
            <span>Everyone connected.</span>
          </h2>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepTop}>
              <span>01</span>
              <span className={styles.stepArrow}>↗</span>
            </div>

            <div className={styles.stepIllustration}>
              <div className={styles.miniBoard}>
                <span className={styles.miniBoardTitle}>
                  CLASSROOM
                </span>

                <span className={styles.miniLine} />
                <span className={styles.miniLineShort} />
                <span className={styles.miniCircle} />
              </div>
            </div>

            <h3>Create a classroom</h3>

            <p>
              A teacher creates a classroom and gets a unique
              classroom code.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepTop}>
              <span>02</span>
              <span className={styles.stepArrow}>↗</span>
            </div>

            <div className={styles.stepIllustration}>
              <div className={styles.joinIllustration}>
                <div className={styles.personTeacher}>T</div>
                <div className={styles.connectionLine} />
                <div className={styles.personStudent}>S</div>
              </div>
            </div>

            <h3>Students join</h3>

            <p>
              Students enter the classroom code and connect to
              the shared workspace.
            </p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepTop}>
              <span>03</span>
              <span className={styles.stepArrow}>↗</span>
            </div>

            <div className={styles.stepIllustration}>
              <div className={styles.collaborationIllustration}>
                <span className={styles.collabLineOne} />
                <span className={styles.collabLineTwo} />
                <span className={styles.collabLineThree} />
                <span className={styles.collabDot} />
              </div>
            </div>

            <h3>Collaborate live</h3>

            <p>
              Teachers control permissions while everyone sees
              board changes in real time.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          CLASSROOM ACTIONS
          ===================================================== */}

      <section
        id="classrooms"
        className={styles.classroomsSection}
      >
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionNumber}>02</span>
            <span className={styles.sectionLabel}>
              CLASSROOMS
            </span>
          </div>

          <h2>
            Ready to start
            <br />
            <span>your classroom?</span>
          </h2>
        </div>

        <div className={styles.classroomCards}>
          {/* Teacher */}
          <div className={styles.classroomCard}>
            <div className={styles.cardCorner}>TEACHER</div>

            <div className={styles.cardNumber}>01</div>

            <div className={styles.cardIcon}>
              +
            </div>

            <h3>Create a Classroom</h3>

            <p>
              Start a shared workspace and invite students to
              collaborate on the board.
            </p>

            <div className={styles.formGroup}>
              <label htmlFor="classroomName">
                CLASSROOM NAME
              </label>

              <input
                id="classroomName"
                className={styles.formInput}
                type="text"
                placeholder="e.g. Physics — Class 10"
                value={classroomName}
                onChange={(e) =>
                  setClassroomName(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createClassroom();
                  }
                }}
              />
            </div>

            <button
              type="button"
              className={styles.cardButton}
              onClick={createClassroom}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className={styles.spinner} />
                  Creating...
                </>
              ) : (
                <>
                  Create classroom
                  <span>→</span>
                </>
              )}
            </button>

            <div className={styles.cardBottom}>
              You become the classroom teacher.
            </div>
          </div>

          {/* Student */}
          <div
            className={`${styles.classroomCard} ${styles.studentCard}`}
          >
            <div className={styles.cardCorner}>STUDENT</div>

            <div className={styles.cardNumber}>02</div>

            <div className={styles.cardIcon}>
              ↗
            </div>

            <h3>Join a Classroom</h3>

            <p>
              Connect to an existing classroom using the code
              provided by your teacher.
            </p>

            <div className={styles.formGroup}>
              <label htmlFor="studentName">
                YOUR NAME
              </label>

              <input
                id="studentName"
                className={styles.formInput}
                type="text"
                placeholder="e.g. Alex"
                value={studentName}
                onChange={(e) =>
                  setStudentName(e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="classroomCode">
                CLASSROOM CODE
              </label>

              <input
                id="classroomCode"
                className={`${styles.formInput} ${styles.codeInput}`}
                type="text"
                placeholder="e.g. A7K2PX"
                maxLength={6}
                value={classroomCode}
                onChange={(e) =>
                  setClassroomCode(
                    e.target.value.toUpperCase()
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    joinClassroom();
                  }
                }}
              />
            </div>

            <button
              type="button"
              className={styles.cardButton}
              onClick={joinClassroom}
              disabled={joining}
            >
              {joining ? (
                <>
                  <span className={styles.spinner} />
                  Joining...
                </>
              ) : (
                <>
                  Join classroom
                  <span>→</span>
                </>
              )}
            </button>

            <div className={styles.cardBottom}>
              Your teacher controls drawing access.
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span>!</span>
            {error}
          </div>
        )}
      </section>

      {/* =====================================================
          FEATURES
          ===================================================== */}

      <section
        id="features"
        className={styles.featuresSection}
      >
        <div className={styles.featuresIntro}>
          <span className={styles.sectionLabel}>
            03 — FEATURES
          </span>

          <h2>
            Built for
            <br />
            <span>interactive learning.</span>
          </h2>
        </div>

        <div className={styles.featureRows}>
          <div className={styles.featureRow}>
            <span>01</span>

            <div>
              <h3>Real-time collaboration</h3>
              <p>
                Changes made on the shared board are synchronized
                between connected classroom members.
              </p>
            </div>

            <span className={styles.featureArrow}>↗</span>
          </div>

          <div className={styles.featureRow}>
            <span>02</span>

            <div>
              <h3>Teacher-controlled permissions</h3>
              <p>
                Teachers can decide which students are allowed
                to draw on the shared whiteboard.
              </p>
            </div>

            <span className={styles.featureArrow}>↗</span>
          </div>

          <div className={styles.featureRow}>
            <span>03</span>

            <div>
              <h3>Persistent whiteboards</h3>
              <p>
                Classroom board data is saved so the workspace
                can be restored when needed.
              </p>
            </div>

            <span className={styles.featureArrow}>↗</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          SB
        </div>

        <div>
          <strong>SmartBoard</strong>
          <span>Interactive classroom collaboration</span>
        </div>

        <span className={styles.footerYear}>
          2026
        </span>
      </footer>
    </main>
  );
}