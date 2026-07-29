"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiagnosticNode, LearningRecord, Question, Student, TeacherDashboard } from "../lib/bakjumsu-types";

type View = "landing" | "pin" | "password" | "student" | "teacher-login" | "teacher";
type StudentTab = "home" | "questions" | "notebook" | "progress" | "password";
type ChatMessage = { role: "assistant" | "student"; text: string };

const statusLabels: Record<LearningRecord["status"], string> = {
  NOT_STARTED: "시작 전",
  DIAGNOSING: "진단 중",
  CONCEPT_HELP: "개념 도움 중",
  RETRYING: "재풀이 중",
  COMPLETED: "100점 완료",
  TEACHER_HELP_NEEDED: "교사 도움 필요",
};

const statusClass: Record<LearningRecord["status"], string> = {
  NOT_STARTED: "status-gray",
  DIAGNOSING: "status-yellow",
  CONCEPT_HELP: "status-yellow",
  RETRYING: "status-orange",
  COMPLETED: "status-green",
  TEACHER_HELP_NEEDED: "status-red",
};

const json = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "요청을 처리하지 못했습니다.");
  return payload as T;
};

const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) : "기록 없음";

export default function Home() {
  const [view, setView] = useState<View>("landing");
  const [studentTab, setStudentTab] = useState<StudentTab>("home");
  const [className, setClassName] = useState("6학년 2반");
  const [students, setStudents] = useState<Array<{ id: string; studentNumber: number }>>([]);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [notice, setNotice] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [activeRecord, setActiveRecord] = useState<LearningRecord | null>(null);
  const [activeConcept, setActiveConcept] = useState("");
  const [activeExample, setActiveExample] = useState("");
  const [retryAnswer, setRetryAnswer] = useState("");
  const [retryResult, setRetryResult] = useState<"correct" | "wrong" | null>(null);
  const [teacherPassword, setTeacherPassword] = useState("");
  const [teacherDashboard, setTeacherDashboard] = useState<TeacherDashboard | null>(null);
  const [diagnosticStartedAt, setDiagnosticStartedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    json<{ class: { name: string }; students: Array<{ id: string; studentNumber: number }> }>("/api/public")
      .then((payload) => { setClassName(payload.class.name); setStudents(payload.students); })
      .catch((error: Error) => setNotice(error.message));
  }, []);

  const currentQuestion = useMemo(() => questions.find((question) => question.id === activeRecord?.questionId) ?? null, [questions, activeRecord]);
  const currentNode = useMemo<DiagnosticNode | null>(() => currentQuestion?.diagnosticNodes.find((node) => node.id === activeRecord?.currentDiagnosticNodeId) ?? null, [currentQuestion, activeRecord]);
  const completedRecords = records.filter((record) => record.isCompleted);
  const needsHelpRecords = records.filter((record) => record.needsTeacherHelp);
  const activeRecords = records.filter((record) => !record.isCompleted);

  const loadLearning = async () => {
    const payload = await json<{ questions: Question[]; records: LearningRecord[]; responses?: Array<{ learningRecordId: string; questionText: string; answer: string }> }>("/api/learning");
    setQuestions(payload.questions);
    const responsesByRecord = new Map<string, Array<{ learningRecordId: string; questionText: string; answer: string }>>();
    (payload.responses ?? []).forEach((response) => responsesByRecord.set(response.learningRecordId, [...(responsesByRecord.get(response.learningRecordId) ?? []), response]));
    const nextRecords = payload.records.map((record) => ({ ...record, diagnosticResponses: responsesByRecord.get(record.id) ?? [] }));
    setRecords(nextRecords);
    setActiveRecord((current) => current ? nextRecords.find((record) => record.id === current.id) ?? current : current);
  };

  const chooseStudent = (number: number) => {
    setSelectedNumber(number);
    setPin("");
    setNotice("");
    setView("pin");
  };

  const studentLogin = async () => {
    if (selectedNumber === null || pin.length !== 3) return setNotice("3자리 비밀번호를 입력해 주세요.");
    try {
      const payload = await json<{ student: Student }>("/api/auth/student-login", { method: "POST", body: JSON.stringify({ studentNumber: selectedNumber, pin }) });
      setStudent(payload.student);
      setPin("");
      setNotice("");
      if (payload.student.mustChangePassword) setView("password");
      else { await loadLearning(); setStudentTab("home"); setView("student"); }
    } catch (error) { setNotice((error as Error).message); setPin(""); }
  };

  const changePassword = async () => {
    if (pin.length !== 3 || passwordAgain.length !== 3) return setNotice("새 비밀번호를 3자리 숫자로 입력해 주세요.");
    try {
      const payload = await json<{ student: Student }>("/api/auth/change-password", { method: "POST", body: JSON.stringify({ pin, confirmation: passwordAgain }) });
      setStudent(payload.student);
      setPin(""); setPasswordAgain(""); setNotice("");
      await loadLearning();
      setStudentTab("home"); setView("student");
    } catch (error) { setNotice((error as Error).message); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setView("landing"); setStudent(null); setTeacherDashboard(null); setActiveRecord(null); setRecords([]); setQuestions([]); setSelectedNumber(null); setPin(""); setNotice("");
  };

  const startQuestion = async () => {
    if (!selectedQuestionId) return setNotice("문항을 먼저 선택해 주세요.");
    try {
      const payload = await json<{ record: LearningRecord }>("/api/learning", { method: "POST", body: JSON.stringify({ action: "start", questionId: selectedQuestionId }) });
      setActiveRecord(payload.record); setRetryResult(null); setRetryAnswer(""); setActiveConcept(""); setActiveExample(""); setDiagnosticStartedAt(Date.now()); setStudentTab("questions"); setNotice("");
      await loadLearning();
    } catch (error) { setNotice((error as Error).message); }
  };

  const answerDiagnostic = async (answer: string) => {
    if (!activeRecord) return null;
    try {
      const payload = await json<{ record: LearningRecord; nextNodeId: string | null; concept: string | null; example: string | null; matched?: boolean; feedback?: string | null }>("/api/learning", { method: "POST", body: JSON.stringify({ action: "response", recordId: activeRecord.id, answer, responseTimeMs: Date.now() - diagnosticStartedAt }) });
      setActiveRecord(payload.record);
      setActiveConcept(payload.concept ?? ""); setActiveExample(payload.example ?? "");
      setDiagnosticStartedAt(Date.now());
      setNotice(payload.matched === false ? payload.feedback ?? "답을 조금 더 구체적으로 적어 보세요." : "");
      if (payload.nextNodeId === "retry") { setRetryResult(null); setRetryAnswer(""); }
      await loadLearning();
      return payload;
    } catch (error) { setNotice((error as Error).message); return null; }
  };

  const submitRetry = async () => {
    if (!activeRecord || !retryAnswer.trim()) return setNotice("답을 입력해 주세요.");
    try {
      const payload = await json<{ record: LearningRecord; correct: boolean }>("/api/learning", { method: "POST", body: JSON.stringify({ action: "retry", recordId: activeRecord.id, answer: retryAnswer }) });
      setActiveRecord(payload.record); setRetryResult(payload.correct ? "correct" : "wrong");
      await loadLearning();
    } catch (error) { setNotice((error as Error).message); }
  };

  const requestTeacherHelp = async () => {
    if (!activeRecord) return;
    const payload = await json<{ record: LearningRecord }>("/api/learning", { method: "POST", body: JSON.stringify({ action: "help", recordId: activeRecord.id }) });
    setActiveRecord(payload.record); await loadLearning(); setNotice("선생님께 도움 요청을 보냈어요.");
  };

  const teacherLogin = async () => {
    try {
      await json("/api/auth/teacher-login", { method: "POST", body: JSON.stringify({ password: teacherPassword }) });
      const payload = await json<{ dashboard: TeacherDashboard }>("/api/teacher");
      setTeacherDashboard(payload.dashboard); setTeacherPassword(""); setNotice(""); setView("teacher");
    } catch (error) { setNotice((error as Error).message); }
  };

  const resetPassword = async (studentNumber: number) => {
    if (!window.confirm(`${studentNumber}번 학생의 비밀번호를 000으로 초기화할까요?\n다음 접속 시 새 비밀번호를 설정해야 합니다.`)) return;
    await json("/api/teacher", { method: "POST", body: JSON.stringify({ action: "reset-password", studentNumber }) });
    const payload = await json<{ dashboard: TeacherDashboard }>("/api/teacher");
    setTeacherDashboard(payload.dashboard); setNotice(`${studentNumber}번 학생의 비밀번호를 초기화했습니다.`);
  };

  const selectNumber = (number: string) => {
    if (pin.length < 3) setPin((value) => value + number);
  };

  const renderPinPad = (title: string, onSubmit: () => void, second = false) => (
    <section className="auth-card">
      <p className="eyebrow">안전한 입장</p>
      <h1>{title}</h1>
      <p className="auth-help">비밀번호는 화면에 표시되지 않고 ●로 보여요.</p>
      <div className="pin-dots" aria-label="입력한 비밀번호">{[0, 1, 2].map((index) => <span key={index} className={pin[index] ? "filled" : ""}>●</span>)}</div>
      <div className="keypad" aria-label="숫자 키패드">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((number) => <button key={number} onClick={() => selectNumber(number)}>{number}</button>)}
        <button className="keypad-muted" onClick={() => setPin("")}>전체 지우기</button>
        <button onClick={() => selectNumber("0")}>0</button>
        <button className="keypad-muted" onClick={() => setPin((value) => value.slice(0, -1))}>한 자리 지우기</button>
      </div>
      {notice && <p className="notice error">{notice}</p>}
      <button className="button primary full" onClick={onSubmit}>{second ? "변경 완료" : "입장하기"}</button>
      <button className="button text full" onClick={() => { setPin(""); setNotice(""); setView("landing"); }}>다른 번호 선택하기</button>
    </section>
  );

  if (view === "landing") return (
    <main className="app-shell landing-shell">
      <header className="brand-header"><div className="brand-mark">100</div><div><strong>백점수익</strong><span>틀린 문제를 다시, 내 힘으로</span></div></header>
      <section className="landing-card">
        <div className="landing-copy"><p className="eyebrow">6학년 2반 · 개인 완성학습</p><h1>나의 번호를<br /><span>선택하세요.</span></h1><p>틀린 문항을 차근차근 다시 풀고,<br />내가 막힌 부분을 찾아봐요.</p></div>
        <div className="class-box"><div className="class-box-top"><span>학급</span><strong>{className}</strong></div><div className="student-grid">{students.map((item) => <button className="student-number" key={item.id} onClick={() => chooseStudent(item.studentNumber)}>{item.studentNumber}<small>번</small></button>)}</div></div>
      </section>
      <button className="teacher-entry" onClick={() => { setNotice(""); setView("teacher-login"); }}>교사 입장</button>
      <footer className="landing-footer"><span>백점수익</span><span>정답보다 과정을 소중하게</span></footer>
    </main>
  );

  if (view === "pin" && selectedNumber !== null) return <main className="app-shell auth-shell"><header className="brand-header"><div className="brand-mark">100</div><strong>백점수익</strong></header>{renderPinPad(`${selectedNumber}번 학생이 맞나요?`, studentLogin)}</main>;

  if (view === "password") return <main className="app-shell auth-shell"><header className="brand-header"><div className="brand-mark">100</div><strong>백점수익</strong></header><section className="auth-card password-card"><p className="eyebrow">첫 입장 준비</p><h1>새 비밀번호를<br />정해 주세요.</h1><p className="auth-help">000은 초기화 전용입니다. 000이 아닌 3자리 숫자를 만들어 주세요.</p><label>새 3자리 비밀번호<input inputMode="numeric" type="password" maxLength={3} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 3))} /></label><label>새 비밀번호 다시 입력<input inputMode="numeric" type="password" maxLength={3} value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value.replace(/\D/g, "").slice(0, 3))} /></label>{notice && <p className="notice error">{notice}</p>}<button className="button primary full" onClick={changePassword}>변경 완료</button></section></main>;

  if (view === "teacher-login") return <main className="app-shell auth-shell"><header className="brand-header"><div className="brand-mark">100</div><strong>백점수익</strong></header><section className="auth-card password-card"><p className="eyebrow">교사 전용</p><h1>학급 현황을<br />확인합니다.</h1><p className="auth-help">교사 비밀번호를 입력해 주세요.</p><label>교사 비밀번호<input type="password" value={teacherPassword} onChange={(event) => setTeacherPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && teacherLogin()} /></label>{notice && <p className="notice error">{notice}</p>}<button className="button primary full" onClick={teacherLogin}>교사로 입장하기</button><button className="button text full" onClick={() => { setNotice(""); setView("landing"); }}>학생 화면으로 돌아가기</button></section></main>;

  if (view === "teacher" && teacherDashboard) return <TeacherView dashboard={teacherDashboard} notice={notice} onReset={resetPassword} onLogout={logout} />;

  return <StudentView student={student} tab={studentTab} setTab={setStudentTab} questions={questions} records={records} completedRecords={completedRecords} activeRecords={activeRecords} needsHelpRecords={needsHelpRecords} selectedQuestionId={selectedQuestionId} setSelectedQuestionId={setSelectedQuestionId} onStart={startQuestion} activeRecord={activeRecord} setActiveRecord={setActiveRecord} currentQuestion={currentQuestion} currentNode={currentNode} activeConcept={activeConcept} activeExample={activeExample} answerDiagnostic={answerDiagnostic} retryAnswer={retryAnswer} setRetryAnswer={setRetryAnswer} retryResult={retryResult} submitRetry={submitRetry} requestTeacherHelp={requestTeacherHelp} onLogout={logout} passwordPin={pin} setPasswordPin={setPin} passwordAgain={passwordAgain} setPasswordAgain={setPasswordAgain} onChangePassword={changePassword} />;
}

function StudentView(props: {
  student: Student | null; tab: StudentTab; setTab: (tab: StudentTab) => void; questions: Question[]; records: LearningRecord[]; completedRecords: LearningRecord[]; activeRecords: LearningRecord[]; needsHelpRecords: LearningRecord[]; selectedQuestionId: string; setSelectedQuestionId: (value: string) => void; onStart: () => void; activeRecord: LearningRecord | null; setActiveRecord: (record: LearningRecord | null) => void; currentQuestion: Question | null; currentNode: DiagnosticNode | null; activeConcept: string; activeExample: string; answerDiagnostic: (answer: string) => void; retryAnswer: string; setRetryAnswer: (value: string) => void; retryResult: "correct" | "wrong" | null; submitRetry: () => void; requestTeacherHelp: () => void; notice: string; onLogout: () => void; passwordPin: string; setPasswordPin: (value: string) => void; passwordAgain: string; setPasswordAgain: (value: string) => void; onChangePassword: () => void;
}) {
  const { student, tab, setTab, questions, records, completedRecords, activeRecords, needsHelpRecords, selectedQuestionId, setSelectedQuestionId, onStart, activeRecord, setActiveRecord, currentQuestion, currentNode, activeConcept, activeExample, answerDiagnostic, retryAnswer, setRetryAnswer, retryResult, submitRetry, requestTeacherHelp, onLogout, passwordPin, setPasswordPin, passwordAgain, setPasswordAgain, onChangePassword } = props;
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [semester, setSemester] = useState("1");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedQuestionNumber, setSelectedQuestionNumber] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [progressSemester, setProgressSemester] = useState("");
  const [progressUnit, setProgressUnit] = useState("");
  const semesterUnitOrder = semester === "1" ? ["분수의 나눗셈", "각기둥과 각뿔", "소수의 나눗셈", "비와 비율", "여러 가지 그래프", "직육면체의 부피와 겉넓이"] : ["분수의 나눗셈", "소수의 나눗셈", "공간과 입체", "비례식과 비례배분", "원의 넓이"];
  const semesterQuestions = questions.filter((question) => question.grade === 6 && String(question.semester) === semester && (question.id.startsWith("grade6-semester1-fraction-division-") || question.id.includes("-lesson")));
  const units = semesterUnitOrder.filter((unit) => semesterQuestions.some((question) => question.unit === unit));
  const progressUnitOrder = progressSemester === "1" ? ["분수의 나눗셈", "각기둥과 각뿔", "소수의 나눗셈", "비와 비율", "여러 가지 그래프", "직육면체의 부피와 겉넓이"] : progressSemester === "2" ? ["분수의 나눗셈", "소수의 나눗셈", "공간과 입체", "비례식과 비례배분", "원의 넓이"] : [];
  const progressQuestions = progressSemester && progressUnit ? questions.filter((question) => question.grade === 6 && String(question.semester) === progressSemester && question.unit === progressUnit && question.isPlayable) : [];
  const progressUnits = progressUnitOrder.filter((unit) => progressQuestions.some((question) => question.unit === unit));
  const progressLessons = [...new Set(progressQuestions.map((question) => question.lesson))];
  const lessons = [...new Set(semesterQuestions.filter((question) => question.unit === selectedUnit).map((question) => question.lesson))];
  const selectedCatalogQuestion = semesterQuestions.find((question) => question.unit === selectedUnit && question.lesson === selectedLesson && String(question.questionNumber) === selectedQuestionNumber) ?? null;
  const isRetry = activeRecord?.status === "RETRYING" || currentNode?.id === "retry";
  const currentStatus = activeRecord ? statusLabels[activeRecord.status] : "";

  const savedChatMessages = useMemo<ChatMessage[]>(() => {
    if (!activeRecord) return [];
    return (activeRecord.diagnosticResponses ?? []).flatMap((response) => [
      { role: "assistant" as const, text: response.questionText },
      { role: "student" as const, text: response.answer },
    ]);
  }, [activeRecord]);

  const submitChatInput = async () => {
    const value = chatInput.trim();
    if (!value) return;
    setChatMessages((messages) => {
      const previous = [...savedChatMessages, ...messages];
      const alreadyAsked = Boolean(currentNode && previous.some((message) => message.role === "assistant" && message.text === currentNode.question));
      return [...messages, ...(currentNode && !alreadyAsked ? [{ role: "assistant" as const, text: currentNode.question }] : []), { role: "student" as const, text: value }];
    });
    setChatInput("");
    const tutorRequest = currentQuestion
      ? (json("/api/tutor", {
          method: "POST",
          body: JSON.stringify({
            question: { grade: currentQuestion.grade, semester: currentQuestion.semester, unit: currentQuestion.unit, lesson: currentQuestion.lesson, page: currentQuestion.page, questionNumber: currentQuestion.questionNumber, questionText: currentQuestion.questionText, concepts: currentQuestion.concepts },
            diagnostic: { stage: currentNode?.stage, question: currentNode?.question, concept: activeConcept, example: activeExample },
            studentAnswer: value,
            previousMessages: [...savedChatMessages, ...chatMessages].slice(-6),
          }),
        }) as Promise<{ enabled?: boolean; reply?: string | null }>).catch(() => ({ enabled: false, reply: null }))
      : Promise.resolve({ enabled: false, reply: null });
    const [tutor, learning] = await Promise.all([
      tutorRequest,
      answerDiagnostic(value) as unknown as Promise<{ feedback?: string | null } | null>,
    ]);
    const replies = [
      tutor.reply ? { role: "assistant" as const, text: tutor.reply } : null,
      learning?.feedback ? { role: "assistant" as const, text: learning.feedback } : null,
    ].filter((message): message is { role: "assistant"; text: string } => Boolean(message));
    if (replies.length) setChatMessages((messages) => [...messages, ...replies]);
  };

  const chatTranscript = useMemo(() => {
    if (!activeRecord || !currentNode) return [];
    const messages = [...savedChatMessages, ...chatMessages];
    const alreadyAsked = messages.some((message) => message.role === "assistant" && message.text === currentNode.question);
    return alreadyAsked ? messages : [...messages, { role: "assistant" as const, text: currentNode.question }];
  }, [activeRecord, currentNode, savedChatMessages, chatMessages]);

  const questionCard = currentQuestion && <div className="problem-card"><div className="problem-meta"><span>{currentQuestion.grade}학년 · {currentQuestion.semester}학기 · {currentQuestion.unit}</span><span>{currentQuestion.lesson} · {currentQuestion.questionNumber}번</span></div><p>{currentQuestion.questionText}</p>{currentQuestion.pdfUrl && <iframe className="pdf-preview problem-pdf" src={currentQuestion.pdfUrl} title="선택한 수학 익힘책 문제" />}</div>;

  const progressNav = (next: StudentTab) => { setTab(next); setActiveRecord(null); setChatMessages([]); };

  return <main className="app-shell student-shell">
    <header className="student-header"><button className="brand-inline" onClick={() => progressNav("home")}><span className="brand-mark">100</span><strong>백점수익</strong></button><div className="student-header-info"><span>{student?.studentNumber}번 학생</span><button onClick={onLogout}>로그아웃</button></div></header>
    <div className="student-layout"><aside className="side-nav" aria-label="학생 메뉴"><button className={tab === "home" ? "active" : ""} onClick={() => progressNav("home")}>홈</button><button className={tab === "questions" ? "active" : ""} onClick={() => progressNav("questions")}>틀린 문항 선택</button><button className={tab === "notebook" ? "active" : ""} onClick={() => progressNav("notebook")}>나의 오답노트</button><button className={tab === "progress" ? "active" : ""} onClick={() => progressNav("progress")}>나의 진도</button><button className={tab === "password" ? "active" : ""} onClick={() => progressNav("password")}>비밀번호 변경</button></aside>
      <section className="student-content">
        {tab === "home" && <><div className="page-heading"><p className="eyebrow">MY COMPLETE LEARNING</p><h1>{student?.studentNumber}번님의<br /><span>백점수익</span></h1><p>오늘도 한 문제씩, 내가 막힌 곳을 찾아 끝까지 완성해요.</p></div><div className="stat-grid"><StatCard label="100점 완료" value={completedRecords.length} tone="green" /><StatCard label="재풀이할 문제" value={activeRecords.length} tone="orange" /><StatCard label="선생님 도움 필요" value={needsHelpRecords.length} tone="red" /></div><div className="home-grid"><div className="panel continue-panel"><div className="panel-title"><div><p className="eyebrow">TODAY</p><h2>오늘 이어서 풀기</h2></div><span className="panel-icon">→</span></div>{activeRecords[0] ? <><p className="muted">{questions.find((question) => question.id === activeRecords[0].questionId)?.unit}</p><h3>{questions.find((question) => question.id === activeRecords[0].questionId)?.questionText}</h3><button className="button primary" onClick={() => { setActiveRecord(activeRecords[0]); setTab("questions"); }}>이어서 풀기</button></> : <><p className="empty-text">지금은 진행 중인 문제가 없어요.</p><button className="button secondary" onClick={() => setTab("questions")}>문제 고르기</button></>}</div><div className="panel concept-panel"><div className="panel-title"><div><p className="eyebrow">MY NOTE</p><h2>최근 오답노트</h2></div><span className="panel-icon green-dot">●</span></div>{records.slice(-3).reverse().map((record) => <div className="mini-record" key={record.id}><span className={`status-dot ${statusClass[record.status]}`} /><div><strong>{questions.find((question) => question.id === record.questionId)?.unit}</strong><small>{statusLabels[record.status]}</small></div></div>)}{records.length === 0 && <p className="empty-text">문제를 시작하면 여기에 기록돼요.</p>}</div></div></>}

        {tab === "questions" && <div className="study-area">{!activeRecord ? <><div className="page-heading compact"><p className="eyebrow">STEP 01 · CHOOSE A QUESTION</p><h1>틀린 문항을<br /><span>선택해요.</span></h1><p>학기, 단원, 차시, 문항 번호를 고르면 PDF에서 해당 문제를 찾아 보여 드려요.</p></div><div className="selector-panel panel"><label>학기<select value={semester} onChange={(event) => { setSemester(event.target.value); setSelectedUnit(""); setSelectedLesson(""); setSelectedQuestionNumber(""); setSelectedQuestionId(""); }}><option value="1">1학기</option><option value="2">2학기</option></select></label><label>단원<select value={selectedUnit} onChange={(event) => { setSelectedUnit(event.target.value); setSelectedLesson(""); setSelectedQuestionNumber(""); setSelectedQuestionId(""); }}><option value="">단원을 선택하세요</option>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label><label>차시<select value={selectedLesson} onChange={(event) => { setSelectedLesson(event.target.value); setSelectedQuestionNumber(""); setSelectedQuestionId(""); }} disabled={!selectedUnit}><option value="">차시를 선택하세요</option>{lessons.map((lesson) => <option key={lesson} value={lesson}>{lesson}</option>)}</select></label><label>문항 번호<select value={selectedQuestionNumber} onChange={(event) => { const number = event.target.value; setSelectedQuestionNumber(number); const match = semesterQuestions.find((question) => question.unit === selectedUnit && question.lesson === selectedLesson && String(question.questionNumber) === number); setSelectedQuestionId(match?.id ?? ""); }} disabled={!selectedLesson}><option value="">문항 번호를 선택하세요</option>{semesterQuestions.filter((question) => question.unit === selectedUnit && question.lesson === selectedLesson).sort((a, b) => a.questionNumber - b.questionNumber).map((question) => <option key={question.id} value={question.questionNumber}>{question.questionNumber}번</option>)}</select></label>{selectedCatalogQuestion && <div className="selected-preview"><div className="problem-meta"><span>{selectedCatalogQuestion.semester}학기 · {selectedCatalogQuestion.unit}</span><span>{selectedCatalogQuestion.questionNumber}번 · {selectedCatalogQuestion.page}쪽</span></div><p>{selectedCatalogQuestion.questionText}</p>{selectedCatalogQuestion.pdfUrl ? <iframe className="pdf-preview" src={selectedCatalogQuestion.pdfUrl} title="선택한 수학 익힘책 문제" /> : <small>이 문제는 등록된 문제 내용으로 보여 드려요.</small>}</div>}<button className="button primary" disabled={!selectedQuestionId || !selectedCatalogQuestion?.isPlayable} onClick={onStart}>도움 시작하기</button></div></> : <><div className="study-top"><button className="back-link" onClick={() => { setActiveRecord(null); setChatMessages([]); }}>← 문항 목록으로</button><span className={`status-badge ${statusClass[activeRecord.status]}`}>{currentStatus}</span></div>{questionCard}<div className="stage-bar"><span className="stage-current">{isRetry ? "4단계" : `${currentNode?.stage ?? 1}단계`}</span><div><b className={!isRetry ? "on" : ""}>생각할 부분</b><b className={activeRecord.status === "CONCEPT_HELP" ? "on" : ""}>핵심 개념</b><b className={activeExample ? "on" : ""}>유사 예시</b><b className={isRetry ? "on" : ""}>원래 문제 재도전</b></div></div>{retryResult === "correct" ? <CompleteCard record={activeRecord} question={currentQuestion} onDone={() => { setActiveRecord(null); setChatMessages([]); }} /> : isRetry ? <div className="diagnostic-panel panel retry-panel chatbot-panel"><p className="eyebrow">STEP 04 · TRY AGAIN</p><div className="chat-history" role="log" aria-live="polite">{chatTranscript.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span className="chat-avatar">{message.role === "assistant" ? "도움" : "나"}</span><p>{message.text}</p></div>)}<div className="chat-message assistant"><span className="chat-avatar">도움</span><p>이제 원래 문제를 다시 풀어 볼까요? 정답을 바로 알려주지 않고, 스스로 생각할 수 있게 기다릴게요.</p></div></div>{activeConcept && <div className="hint-box"><strong>확인한 개념</strong><p>{activeConcept}</p></div>}{activeExample && <div className="example-box"><strong>쉬운 예시</strong><p>{activeExample}</p></div>}<p className="retry-problem">{currentQuestion?.questionText}</p><input className="answer-input" value={retryAnswer} onChange={(event) => setRetryAnswer(event.target.value)} placeholder="답을 입력해 주세요" onKeyDown={(event) => event.key === "Enter" && submitRetry()} />{retryResult === "wrong" && <p className="notice error">아직 조금 더 확인해 보면 좋아요. 정답을 바로 알려주지 않고 다시 생각할 수 있게 도와줄게요.</p>}<button className="button primary" onClick={submitRetry}>답 보내기</button><button className="button text" onClick={requestTeacherHelp}>선생님께 도움 요청하기</button></div> : <div className="diagnostic-panel panel chatbot-panel"><p className="eyebrow">STEP {currentNode?.stage ?? 1} · CHAT WITH YOUR TUTOR</p><div className="chat-header"><span className="chat-avatar assistant-avatar">도움</span><div><strong>백점 도우미</strong><small>한 번에 하나씩 같이 생각해요.</small></div></div><div className="chat-history" role="log" aria-live="polite">{(chatTranscript.length ? chatTranscript : [{ role: "assistant", text: currentNode?.question ?? "어디에서 막혔는지 같이 찾아볼까요?" }]).map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><span className="chat-avatar">{message.role === "assistant" ? "도움" : "나"}</span><p>{message.text}</p></div>)}{activeConcept && <div className="chat-message assistant"><span className="chat-avatar">도움</span><p>이 개념을 확인해 보면 좋아요.<br /><strong>{activeConcept}</strong></p></div>}{activeExample && <div className="chat-message assistant example-message"><span className="chat-avatar">예시</span><p>{activeExample}</p></div>}</div><div className="chat-composer"><div className="chat-input-row"><input className="answer-input" value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder={currentNode?.type === "NUMBER" ? "숫자 답을 적어 주세요" : "내 생각을 적어 주세요"} inputMode={currentNode?.type === "NUMBER" ? "decimal" : "text"} onKeyDown={(event) => event.key === "Enter" && submitChatInput()} /><button className="button primary" onClick={submitChatInput}>보내기</button></div></div><div className="study-actions"><button onClick={() => { setActiveRecord(null); setChatMessages([]); setChatInput(""); }}>처음부터 다시 시작</button><button onClick={requestTeacherHelp}>선생님께 도움 요청</button></div><p className="concept-trail">지금까지 확인한 핵심 개념: {activeRecord.providedConcepts.length ? activeRecord.providedConcepts.join(" · ") : "아직 없어요"}</p></div>}</>}
        </div>}

        {tab === "notebook" && <><div className="page-heading compact"><p className="eyebrow">MY WRONG ANSWER NOTE</p><h1>나의<br /><span>오답노트</span></h1><p>도움을 받은 문제는 자동으로 여기에 기록돼요.</p></div><div className="record-list">{records.length === 0 ? <div className="empty-card">아직 오답노트가 비어 있어요. 틀린 문항을 하나 골라 시작해 보세요.</div> : records.map((record) => <RecordCard key={record.id} record={record} question={questions.find((question) => question.id === record.questionId)} onOpen={() => { setActiveRecord(record); setChatMessages([]); setChatInput(""); setTab("questions"); }} />)}</div></>}

        {tab === "progress" && <><div className="page-heading compact"><p className="eyebrow">MY PROGRESS</p><h1>나의<br /><span>완성 현황</span></h1><p>학기와 단원을 고르면 해당 차시의 100점 완료 상태를 확인할 수 있어요.</p></div><div className="progress-board panel"><div className="progress-filters"><label>학기<select value={progressSemester} onChange={(event) => { setProgressSemester(event.target.value); setProgressUnit(""); }}><option value="">학기를 선택하세요</option><option value="1">1학기</option><option value="2">2학기</option></select></label><label>단원<select value={progressUnit} onChange={(event) => setProgressUnit(event.target.value)} disabled={!progressSemester}><option value="">단원을 선택하세요</option>{progressUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label></div>{progressSemester && progressUnit ? <><div className="progress-summary"><strong>{progressQuestions.filter((question) => records.some((record) => record.questionId === question.id && record.status === "COMPLETED")).length}</strong><span>/ {progressQuestions.length}문항 100점 완료</span></div><div className="progress-lesson-list">{progressLessons.map((lesson) => { const lessonQuestions = progressQuestions.filter((question) => question.lesson === lesson); const completed = lessonQuestions.length > 0 && lessonQuestions.every((question) => records.some((record) => record.questionId === question.id && record.status === "COMPLETED")); return <label className="progress-row" key={lesson}><div><strong>{lesson}</strong><small>{lessonQuestions.length}문항</small></div><input className="progress-check" type="checkbox" checked={completed} disabled aria-label={lesson + " 100점 완료"} /></label>; })}</div></> : <div className="empty-card">학기와 단원을 모두 선택하면 차시별 완성 현황이 보여요.</div>}</div></>}

        {tab === "password" && <div className="password-inline panel"><p className="eyebrow">ACCOUNT</p><h2>비밀번호 변경</h2><p>새로운 3자리 숫자를 입력해 주세요. 000은 사용할 수 없어요.</p><label>새 비밀번호<input inputMode="numeric" type="password" maxLength={3} value={passwordPin} onChange={(event) => setPasswordPin(event.target.value.replace(/\D/g, "").slice(0, 3))} /></label><label>새 비밀번호 다시 입력<input inputMode="numeric" type="password" maxLength={3} value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value.replace(/\D/g, "").slice(0, 3))} /></label><button className="button primary" onClick={onChangePassword}>변경 완료</button></div>}
      </section>
    </div>
  </main>;
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>문항</small></div>; }

function RecordCard({ record, question, onOpen }: { record: LearningRecord; question?: Question; onOpen?: () => void }) { return <article className={"record-card"} onClick={onOpen} onKeyDown={(event) => event.key === "Enter" && onOpen?.()} role={onOpen ? "button" : undefined} tabIndex={onOpen ? 0 : undefined}><div className="record-card-top"><span className={"status-badge " + statusClass[record.status]}>{statusLabels[record.status]}</span><span>{formatDate(record.updatedAt)}</span></div><h3>{question?.questionText}</h3><p>{question?.grade}학년 · {question?.unit} · {question?.lesson}</p>{record.diagnosedErrorTypes.length > 0 && <div className="tag-row">{record.diagnosedErrorTypes.map((error) => <span key={error}>{error}</span>)}</div>}<div className="record-details"><span>확인한 개념 {record.providedConcepts.length}개</span><span>재풀이 {record.retryCount}회</span></div></article>; }

function CompleteCard({ record, question, onDone }: { record: LearningRecord; question: Question | null; onDone: () => void }) { return <div className="complete-card"><div className="complete-mark">✓</div><p className="eyebrow">COMPLETE</p><h2>100점 완료!</h2><p>{question?.unit}의 {question?.questionNumber}번 문항을 스스로 해결했어요.</p><div className="completion-summary"><div><span>처음 막혔던 부분</span><strong>{record.diagnosedErrorTypes[0] ?? "천천히 생각해 보기"}</strong></div><div><span>확인한 핵심 개념</span><strong>{record.providedConcepts.length || question?.concepts.length || 0}개</strong></div></div><p className="complete-note">이 문제는 나의 오답노트에 저장되었어요.</p><button className="button primary" onClick={onDone}>오답노트로 돌아가기</button></div>; }

function TeacherView({ dashboard, notice, onReset, onLogout }: { dashboard: TeacherDashboard; notice: string; onReset: (studentNumber: number) => void; onLogout: () => void }) { return <main className="app-shell teacher-shell"><header className="student-header"><div className="brand-inline"><span className="brand-mark">100</span><strong>백점수익 <em>교사</em></strong></div><div className="student-header-info"><span>김선생님</span><button onClick={onLogout}>로그아웃</button></div></header><section className="teacher-content"><div className="page-heading"><p className="eyebrow">CLASSROOM DASHBOARD · 6학년 2반</p><h1>우리 반의<br /><span>완성 현황</span></h1><p>학생 한 명 한 명의 막힌 지점과 도움 요청을 확인해 주세요.</p></div>{notice && <div className="notice info">{notice}</div>}<div className="teacher-stat-grid"><StatCard label="전체 학생" value={dashboard.totalStudents} tone="blue" /><StatCard label="오늘 접속" value={dashboard.todayLoginCount} tone="blue" /><StatCard label="100점 완료 학생" value={dashboard.completedStudentCount} tone="green" /><StatCard label="교사 도움 필요" value={dashboard.teacherHelpCount} tone="red" /></div><div className="teacher-panel panel"><div className="panel-title"><div><p className="eyebrow">STUDENT OVERVIEW</p><h2>학생별 현황</h2></div><span className="muted">총 {dashboard.totalStudents}명</span></div><div className="teacher-table-wrap"><table><thead><tr><th>번호</th><th>최근 접속</th><th>최근 문항</th><th>오류 유형</th><th>상태</th><th>완료</th><th>관리</th></tr></thead><tbody>{dashboard.students.map(({ student, currentRecord, completedCount, unresolvedCount, latestError }) => <tr key={student.id}><td><strong>{student.studentNumber}번</strong></td><td>{formatDate(student.lastLoginAt)}</td><td>{currentRecord ? "분수의 덧셈" : "-"}</td><td>{latestError ?? "-"}</td><td><span className={`status-badge ${currentRecord ? statusClass[currentRecord.status] : "status-gray"}`}>{currentRecord ? statusLabels[currentRecord.status] : "시작 전"}</span></td><td>{completedCount} / {completedCount + unresolvedCount}</td><td><button className="small-button" onClick={() => onReset(student.studentNumber)}>비밀번호 000 초기화</button></td></tr>)}</tbody></table></div></div><div className="teacher-lower-grid"><div className="panel insight-panel"><p className="eyebrow">COMMON CONCEPTS</p><h2>이번 주 살펴볼 개념</h2><p>학생들이 문제를 풀며 선택한 오류 유형을 모아 다음 수업에 활용할 수 있어요.</p><div className="insight-bar"><span>통분 개념 부족</span><b style={{ width: "68%" }} /></div><div className="insight-bar"><span>최소공배수 이해 부족</span><b style={{ width: "42%" }} /></div></div><div className="panel insight-panel alert-panel"><p className="eyebrow">NEEDS ATTENTION</p><h2>도움 요청 알림</h2><p>빨간색 상태의 학생에게 먼저 말을 걸어 주세요.</p><strong className="alert-number">{dashboard.teacherHelpCount}<small>명</small></strong></div></div></section></main>; }
