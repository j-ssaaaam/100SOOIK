import { demoStore } from "../../../lib/demo-store";
import { getCookie, isSupabaseConfigured, supabaseUser } from "../../../lib/supabase-rest";

type TutorRequest = {
  question?: {
    grade?: number;
    semester?: number;
    unit?: string;
    lesson?: string;
    page?: number;
    questionNumber?: number;
    questionText?: string;
    concepts?: string[];
  };
  diagnostic?: {
    stage?: number;
    question?: string;
    concept?: string;
    example?: string;
  };
  studentAnswer?: string;
  previousMessages?: Array<{ role?: string; text?: string }>;
};

const MAX_TEXT_LENGTH = 1200;
const MAX_MESSAGES = 6;

const trimText = (value: unknown, max = MAX_TEXT_LENGTH) => String(value ?? "").trim().slice(0, max);

const hasStudentSession = async (request: Request) => {
  if (isSupabaseConfigured()) {
    const accessToken = getCookie(request, "bp-access");
    if (!accessToken) return false;
    return Boolean(await supabaseUser(accessToken));
  }

  const token = request.headers.get("cookie")?.match(/(?:^|; )bp-session=([^;]+)/)?.[1] ?? null;
  return Boolean(demoStore.getSession(token)?.studentId);
};

const parseModelReply = (raw: string) => {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as { reply?: unknown; diagnosis?: unknown };
    return {
      reply: trimText(parsed.reply, 500),
      diagnosis: trimText(parsed.diagnosis, 120),
    };
  } catch {
    return { reply: trimText(raw, 500), diagnosis: "아직 판단하기 어려움" };
  }
};

export async function POST(request: Request) {
  if (!(await hasStudentSession(request))) {
    return Response.json({ message: "학생 로그인 후 이용해 주세요." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ enabled: false, reply: null });

  const body = await request.json().catch(() => ({})) as TutorRequest;
  const question = body.question ?? {};
  const diagnostic = body.diagnostic ?? {};
  const messages = Array.isArray(body.previousMessages)
    ? body.previousMessages.slice(-MAX_MESSAGES).map((message) => `${message.role === "student" ? "학생" : "도우미"}: ${trimText(message.text, 300)}`).join("\n")
    : "";

  const systemInstruction = [
    "당신은 초등학생 수학 학습을 돕는 백점수익의 보조 튜터입니다.",
    "학생에게 정답, 최종 숫자, 전체 풀이를 바로 알려주지 마세요.",
    "현재 단계의 목표에 맞는 짧은 질문이나 생각 단서 하나만 제공하세요.",
    "학생의 답변에 없는 내용을 추측하지 말고, 문제에 없는 새로운 조건을 만들지 마세요.",
    "응답은 반드시 JSON 객체 하나로만 작성하세요. 형식: {\"reply\":\"학생에게 보낼 한두 문장\",\"diagnosis\":\"짧은 오류 판단\"}",
  ].join("\n");

  const userPrompt = [
    `문제 정보: ${question.grade ?? ""}학년 ${question.semester ?? ""}학기 / ${trimText(question.unit, 120)} / ${trimText(question.lesson, 160)} / ${question.questionNumber ?? ""}번`,
    `문제: ${trimText(question.questionText, 500)}`,
    `핵심 개념: ${(question.concepts ?? []).slice(0, 8).map((concept) => trimText(concept, 80)).join(", ")}`,
    `현재 도움 단계: ${diagnostic.stage ?? 1}단계`,
    `현재 질문: ${trimText(diagnostic.question, 500)}`,
    diagnostic.concept ? `이미 제공한 개념: ${trimText(diagnostic.concept, 300)}` : "",
    diagnostic.example ? `이미 제공한 유사 예시: ${trimText(diagnostic.example, 300)}` : "",
    `학생의 답변: ${trimText(body.studentAnswer, 500)}`,
    messages ? `이전 대화:\n${messages}` : "",
  ].filter(Boolean).join("\n");

  const model = process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 220, responseMimeType: "application/json" },
      }),
    });

    if (!response.ok) return Response.json({ enabled: false, reply: null });
    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!raw) return Response.json({ enabled: false, reply: null });
    const parsed = parseModelReply(raw);
    return Response.json({ enabled: Boolean(parsed.reply), reply: parsed.reply || null, diagnosis: parsed.diagnosis, model });
  } catch {
    return Response.json({ enabled: false, reply: null });
  }
}
