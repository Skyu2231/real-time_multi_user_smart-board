interface ClassroomPageProps {
  params: Promise<{
    classroomId: string;
  }>;
}

export default async function ClassroomPage({
  params,
}: ClassroomPageProps) {
  const { classroomId } = await params;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1>Classroom</h1>

      <p>
        Classroom ID: <strong>{classroomId}</strong>
      </p>
    </main>
  );
}