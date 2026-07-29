import { demoStore } from "../../../lib/demo-store";
import type { DiagnosticResponse, LearningRecord, Question } from "../../../lib/bakjumsu-types";
import { getCookie, isSupabaseConfigured, supabaseRest, supabaseUpdateUserData, supabaseUser } from "../../../lib/supabase-rest";

const getSession = (request: Request) => demoStore.getSession(request.headers.get("cookie")?.match(/(?:^|; )bp-session=([^;]+)/)?.[1] ?? null);

const fractionDivisionLessons = [
  "자연수÷자연수의 몫을 분수로 나타내어 볼까요 (1)",
  "자연수÷자연수의 몫을 분수로 나타내어 볼까요 (2)",
  "분수÷자연수를 알아볼까요",
  "분수÷자연수를 분수의 곱셈으로 나타내어 볼까요",
  "대분수÷자연수를 알아볼까요",
];

const lessonFromRow = (row: Record<string, unknown>) => {
  const unit = String(row.unit);
  const imageUrl = String(row.question_image_url ?? "");
  const pdfPage = Number(imageUrl.match(/math_ikhim_6-1-1\.pdf#page=(\d+)/)?.[1] ?? 0);
  if (Number(row.semester) === 1 && unit === "분수의 나눗셈" && pdfPage >= 2 && pdfPage <= 11) return fractionDivisionLessons[Math.floor((pdfPage - 2) / 2)];
  return String(row.lesson);
};

const questionFromRow = (row: Record<string, unknown>): Question => ({
  id: String(row.id), grade: Number(row.grade), semester: Number(row.semester), unit: String(row.unit), lesson: lessonFromRow(row), page: Number(row.page), questionNumber: Number(row.question_number), questionText: String(row.question_text), pdfUrl: row.question_image_url ? String(row.question_image_url) : undefined, pdfPage: row.question_image_url ? Number(String(row.question_image_url).match(/#page=(\d+)/)?.[1] ?? 0) || undefined : undefined, correctAnswer: String(row.correct_answer), acceptedAnswers: Array.isArray(row.accepted_answers) ? row.accepted_answers.map(String) : [], concepts: Array.isArray(row.concepts) ? row.concepts.map(String) : [], diagnosticStartId: String(row.diagnostic_start_id), diagnosticNodes: Array.isArray(row.diagnostic_nodes) ? row.diagnostic_nodes as Question["diagnosticNodes"] : [], isPlayable: true,
});

const normalizeAnswer = (value: string) => value.trim().replace(/\s+/g, "").toLowerCase();
const diagnosticOption = (node: Question["diagnosticNodes"][number] | undefined, answer: string) => {
  if (!node) return undefined;
  const normalized = normalizeAnswer(answer);
  const aliases: Record<string, string[]> = {
    yes: ["예", "네", "맞아요", "맞습니다", "yes"],
    no: ["아니요", "아니오", "아니", "no"],
    unknown: ["잘모르겠어요", "모르겠어요", "모르겠습니다", "모르겠어", "unknown"],
  };
  return node.options?.find((item) => {
    if (item.value === "*") return Boolean(normalized);
    if (item.keywords?.some((keyword) => normalized.includes(normalizeAnswer(keyword)))) return true;
    const candidates = [item.value, item.label, ...(aliases[item.value.toLowerCase()] ?? [])];
    return candidates.some((candidate) => normalizeAnswer(candidate) === normalized);
  });
};

const recordFromRow = (row: Record<string, unknown>): LearningRecord => ({
  id: String(row.id), studentId: String(row.student_id), questionId: String(row.question_id), status: row.status as LearningRecord["status"], currentDiagnosticNodeId: String(row.current_diagnostic_node_id), diagnosedErrorTypes: Array.isArray(row.diagnosed_error_types) ? row.diagnosed_error_types.map(String) : [], providedConcepts: Array.isArray(row.provided_concepts) ? row.provided_concepts.map(String) : [], retryCount: Number(row.retry_count ?? 0), retryAnswer: String(row.retry_answer ?? ""), isCompleted: Boolean(row.is_completed), needsTeacherHelp: Boolean(row.needs_teacher_help), startedAt: String(row.started_at), completedAt: row.completed_at ? String(row.completed_at) : null, updatedAt: String(row.updated_at),
});

const responseFromRow = (row: Record<string, unknown>): DiagnosticResponse => ({ id: String(row.id), learningRecordId: String(row.learning_record_id), studentId: String(row.student_id), questionId: String(row.question_id), diagnosticNodeId: String(row.diagnostic_node_id), questionText: String(row.question_text), answer: String(row.answer), nextNodeId: row.next_node_id ? String(row.next_node_id) : null, diagnosedErrorType: row.diagnosed_error_type ? String(row.diagnosed_error_type) : null, responseTimeMs: Number(row.response_time_ms ?? 0), createdAt: String(row.created_at) });
const lessonCompletionsFromUser = (user: { user_metadata?: Record<string, unknown> } | null) => {
  const value = user?.user_metadata?.bakjumsuik_lesson_completions;
  return value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).map(([key, completed]) => [key, Boolean(completed)])) : {};
};

const supabaseStudent = async (request: Request) => {
  const accessToken = getCookie(request, "bp-access");
  const user = accessToken ? await supabaseUser(accessToken) : null;
  if (!accessToken || !user) return null;
  const students = await supabaseRest(`students?id=eq.${user.id}&select=id&limit=1`, { token: accessToken }) as Array<{ id: string }>;
  return students[0] ? { accessToken, studentId: user.id } : null;
};

const supabaseState = async (accessToken: string, studentId: string) => {
  const user = await supabaseUser(accessToken);
  const [questionRows, recordRows, responseRows] = await Promise.all([
    supabaseRest("questions?select=*&is_active=eq.true&order=grade.asc,unit.asc,page.asc", { token: accessToken }),
    supabaseRest(`learning_records?select=*&student_id=eq.${studentId}&order=updated_at.desc`, { token: accessToken }),
    supabaseRest(`diagnostic_responses?select=*&student_id=eq.${studentId}&order=created_at.asc`, { token: accessToken }),
  ]);
  return { questions: (questionRows as Array<Record<string, unknown>>).map(questionFromRow), records: (recordRows as Array<Record<string, unknown>>).map(recordFromRow), responses: (responseRows as Array<Record<string, unknown>>).map(responseFromRow), lessonCompletions: lessonCompletionsFromUser(user) };
};

export async function GET(request: Request) {
  if (isSupabaseConfigured()) {
    const session = await supabaseStudent(request);
    if (!session) return Response.json({ message: "학생 로그인 후 이용할 수 있습니다." }, { status: 401 });
    return Response.json(await supabaseState(session.accessToken, session.studentId));
  }
  const session = getSession(request);
  if (!session?.studentId) return Response.json({ message: "학생 로그인 후 이용할 수 있습니다." }, { status: 401 });
    return Response.json({ questions: demoStore.getQuestions(), records: demoStore.getRecords(session.studentId), responses: demoStore.getResponses(session.studentId), lessonCompletions: demoStore.getLessonCompletions(session.studentId) });
}

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const session = await supabaseStudent(request);
    if (!session) return Response.json({ message: "학생 로그인 후 이용할 수 있습니다." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const action = String(body.action ?? "");
    if (action === "lesson-completion") {
      const user = await supabaseUser(session.accessToken);
      const completions = lessonCompletionsFromUser(user);
      const key = `${Number(body.semester)}|${String(body.unit ?? "")}|${String(body.lesson ?? "")}`;
      completions[key] = Boolean(body.completed);
      await supabaseUpdateUserData(session.accessToken, { ...(user?.user_metadata ?? {}), bakjumsuik_lesson_completions: completions });
      return Response.json({ lessonCompletions: completions });
    }
    if (action === "start") {
      const questionId = String(body.questionId ?? "");
      const existingRows = await supabaseRest(`learning_records?select=*&student_id=eq.${session.studentId}&question_id=eq.${questionId}&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      if (existingRows[0]) return Response.json({ record: recordFromRow(existingRows[0]) });
      const questionRows = await supabaseRest(`questions?select=*&id=eq.${encodeURIComponent(questionId)}&is_active=eq.true&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      const question = questionRows[0] ? questionFromRow(questionRows[0]) : null;
      if (!question) return Response.json({ message: "문항을 찾을 수 없습니다." }, { status: 404 });
      const createdRows = await supabaseRest("learning_records", { method: "POST", token: session.accessToken, headers: { Prefer: "return=representation" }, body: JSON.stringify({ student_id: session.studentId, question_id: question.id, status: "DIAGNOSING", current_diagnostic_node_id: question.diagnosticStartId, diagnosed_error_types: [], provided_concepts: [], retry_count: 0, retry_answer: "", is_completed: false, needs_teacher_help: false }) }) as Array<Record<string, unknown>>;
      return Response.json({ record: recordFromRow(createdRows[0]) });
    }
    if (action === "response") {
      const recordRows = await supabaseRest(`learning_records?select=*&id=eq.${body.recordId}&student_id=eq.${session.studentId}&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      const record = recordRows[0] ? recordFromRow(recordRows[0]) : null;
      if (!record) return Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
      const questionRows = await supabaseRest(`questions?select=*&id=eq.${encodeURIComponent(record.questionId)}&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      const question = questionRows[0] ? questionFromRow(questionRows[0]) : null;
      const node = question?.diagnosticNodes.find((item) => item.id === record.currentDiagnosticNodeId);
      const answer = String(body.answer ?? "");
      const option = diagnosticOption(node, answer);
      const nextNodeId = option?.nextNodeId ?? null;
      const diagnosedErrorTypes = option?.errorType && !record.diagnosedErrorTypes.includes(option.errorType) ? [...record.diagnosedErrorTypes, option.errorType] : record.diagnosedErrorTypes;
      const providedConcepts = option?.concept && !record.providedConcepts.includes(option.concept) ? [...record.providedConcepts, option.concept] : record.providedConcepts;
      const status = nextNodeId === "retry" ? "RETRYING" : option?.concept ? "CONCEPT_HELP" : "DIAGNOSING";
      const updateRows = await supabaseRest(`learning_records?id=eq.${record.id}&student_id=eq.${session.studentId}`, { method: "PATCH", token: session.accessToken, headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, current_diagnostic_node_id: nextNodeId && nextNodeId !== "retry" ? nextNodeId : record.currentDiagnosticNodeId, diagnosed_error_types: diagnosedErrorTypes, provided_concepts: providedConcepts, needs_teacher_help: Boolean(option?.needsTeacherHelp), updated_at: new Date().toISOString() }) }) as Array<Record<string, unknown>>;
      await supabaseRest("diagnostic_responses", { method: "POST", token: session.accessToken, body: JSON.stringify({ learning_record_id: record.id, student_id: session.studentId, question_id: record.questionId, diagnostic_node_id: node?.id ?? record.currentDiagnosticNodeId, question_text: node?.question ?? "", answer, next_node_id: nextNodeId, diagnosed_error_type: option?.errorType ?? null, response_time_ms: Number(body.responseTimeMs ?? 0) }) });
      return Response.json({ record: recordFromRow(updateRows[0]), nextNodeId, concept: option?.concept ?? node?.concept ?? null, example: option?.example ?? node?.example ?? null, errorType: option?.errorType ?? null, matched: Boolean(option), feedback: option?.feedback ?? (option ? null : "답을 조금 더 구체적으로 적어 보세요. 잘 모르겠다면 ‘잘 모르겠어요’라고 적어도 괜찮아요.") });
    }
    if (action === "ready-retry") {
      const recordRows = await supabaseRest(`learning_records?select=*&id=eq.${body.recordId}&student_id=eq.${session.studentId}&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      const record = recordRows[0] ? recordFromRow(recordRows[0]) : null;
      if (!record) return Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
      const updateRows = await supabaseRest(`learning_records?id=eq.${record.id}&student_id=eq.${session.studentId}`, { method: "PATCH", token: session.accessToken, headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "RETRYING", needs_teacher_help: false, updated_at: new Date().toISOString() }) }) as Array<Record<string, unknown>>;
      return Response.json({ record: recordFromRow(updateRows[0]) });
    }
    if (action === "retry") {
      const recordRows = await supabaseRest(`learning_records?select=*&id=eq.${body.recordId}&student_id=eq.${session.studentId}&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      const record = recordRows[0] ? recordFromRow(recordRows[0]) : null;
      if (!record) return Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
      const questionRows = await supabaseRest(`questions?select=*&id=eq.${encodeURIComponent(record.questionId)}&limit=1`, { token: session.accessToken }) as Array<Record<string, unknown>>;
      const question = questionRows[0] ? questionFromRow(questionRows[0]) : null;
      const answer = String(body.answer ?? "");
      const normalized = answer.trim().replace(/\s/g, "").toLowerCase();
      const correct = question?.acceptedAnswers.includes("*") ? Boolean(normalized) : question?.acceptedAnswers.some((item) => item.replace(/\s/g, "").toLowerCase() === normalized) ?? false;
      const retryCount = record.retryCount + 1;
      const status = correct ? "COMPLETED" : retryCount >= 2 ? "TEACHER_HELP_NEEDED" : "RETRYING";
      const updateRows = await supabaseRest(`learning_records?id=eq.${record.id}&student_id=eq.${session.studentId}`, { method: "PATCH", token: session.accessToken, headers: { Prefer: "return=representation" }, body: JSON.stringify({ retry_count: retryCount, retry_answer: answer, status, is_completed: correct, needs_teacher_help: !correct && retryCount >= 2, completed_at: correct ? new Date().toISOString() : null, updated_at: new Date().toISOString() }) }) as Array<Record<string, unknown>>;
      return Response.json({ record: recordFromRow(updateRows[0]), correct });
    }
    if (action === "help") {
      const updateRows = await supabaseRest(`learning_records?id=eq.${body.recordId}&student_id=eq.${session.studentId}`, { method: "PATCH", token: session.accessToken, headers: { Prefer: "return=representation" }, body: JSON.stringify({ status: "TEACHER_HELP_NEEDED", needs_teacher_help: true, updated_at: new Date().toISOString() }) }) as Array<Record<string, unknown>>;
      return Response.json({ record: recordFromRow(updateRows[0]) });
    }
    return Response.json({ message: "알 수 없는 학습 요청입니다." }, { status: 400 });
  }
  const session = getSession(request);
  if (!session?.studentId) return Response.json({ message: "학생 로그인 후 이용할 수 있습니다." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");
  if (action === "lesson-completion") {
    const completions = demoStore.setLessonCompletion(session.studentId, Number(body.semester), String(body.unit ?? ""), String(body.lesson ?? ""), Boolean(body.completed));
    return Response.json({ lessonCompletions: completions });
  }
  if (action === "start") {
    const record = demoStore.startRecord(session.studentId, String(body.questionId ?? ""));
    return record ? Response.json({ record }) : Response.json({ message: "문항을 찾을 수 없습니다." }, { status: 404 });
  }
  if (action === "response") {
    const result = demoStore.recordResponse(session.studentId, String(body.recordId ?? ""), String(body.answer ?? ""), Number(body.responseTimeMs ?? 0));
    return result ? Response.json(result) : Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
  }
  if (action === "ready-retry") {
    const record = demoStore.markReadyToRetry(session.studentId, String(body.recordId ?? ""));
    return record ? Response.json({ record }) : Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
  }
  if (action === "retry") {
    const result = demoStore.submitRetry(session.studentId, String(body.recordId ?? ""), String(body.answer ?? ""));
    return result ? Response.json(result) : Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
  }
  if (action === "help") {
    const record = demoStore.requestHelp(session.studentId, String(body.recordId ?? ""));
    return record ? Response.json({ record }) : Response.json({ message: "학습 기록을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ message: "알 수 없는 학습 요청입니다." }, { status: 400 });
}
