import { demoStore } from "../../../lib/demo-store";
import { isSupabaseConfigured, supabaseRest } from "../../../lib/supabase-rest";

export async function GET() {
  if (isSupabaseConfigured()) {
    const [classes, roster] = await Promise.all([
      supabaseRest("classes?select=id,name,grade&order=grade.asc&limit=1"),
      supabaseRest("student_login_roster?select=student_number&order=student_number.asc"),
    ]);
    const classRow = (classes as Array<{ id: string; name: string; grade: number }>)[0];
    return Response.json({ class: classRow ?? { id: "class-6-2", name: "6학년 2반", grade: 6 }, students: (roster as Array<{ student_number: number }>).map((student) => ({ id: `number-${student.student_number}`, studentNumber: student.student_number })) });
  }
  await demoStore.initialize();
  return Response.json({ class: { id: "class-6-2", name: "6학년 2반", grade: 6 }, students: demoStore.listStudents().map(({ id, studentNumber }) => ({ id, studentNumber })) });
}
