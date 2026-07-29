export type StudentStatus =
  | "NOT_STARTED"
  | "DIAGNOSING"
  | "CONCEPT_HELP"
  | "RETRYING"
  | "COMPLETED"
  | "TEACHER_HELP_NEEDED";

export type DiagnosticNodeType = "YES_NO_UNKNOWN" | "CHOICE" | "NUMBER" | "SHORT_TEXT";

export type DiagnosticOption = {
  value: string;
  label: string;
  nextNodeId?: string;
  errorType?: string;
  concept?: string;
  example?: string;
  keywords?: string[];
  feedback?: string;
  repeatQuestion?: boolean;
  needsTeacherHelp?: boolean;
};

export type DiagnosticNode = {
  id: string;
  stage: 1 | 2 | 3 | 4;
  type: DiagnosticNodeType;
  question: string;
  options?: DiagnosticOption[];
  concept?: string;
  example?: string;
};

export type Question = {
  id: string;
  grade: number;
  semester: number;
  unit: string;
  lesson: string;
  page: number;
  questionNumber: number;
  questionText: string;
  pdfUrl?: string;
  pdfPage?: number;
  correctAnswer: string;
  acceptedAnswers: string[];
  concepts: string[];
  diagnosticStartId: string;
  diagnosticNodes: DiagnosticNode[];
  isPlayable: boolean;
};

export type Student = {
  id: string;
  studentNumber: number;
  name: string;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
};

export type LearningRecord = {
  id: string;
  studentId: string;
  questionId: string;
  status: StudentStatus;
  currentDiagnosticNodeId: string;
  diagnosedErrorTypes: string[];
  providedConcepts: string[];
  retryCount: number;
  retryAnswer: string;
  isCompleted: boolean;
  needsTeacherHelp: boolean;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  diagnosticResponses?: DiagnosticResponse[];
};

export type DiagnosticResponse = {
  id: string;
  learningRecordId: string;
  studentId: string;
  questionId: string;
  diagnosticNodeId: string;
  questionText: string;
  answer: string;
  nextNodeId: string | null;
  diagnosedErrorType: string | null;
  responseTimeMs: number;
  createdAt: string;
};

export type StudentSession = {
  token: string;
  kind: "student" | "teacher";
  studentId?: string;
  teacherId?: string;
  createdAt: string;
};

export type TeacherDashboard = {
  totalStudents: number;
  todayLoginCount: number;
  completedStudentCount: number;
  diagnosingCount: number;
  retryingCount: number;
  teacherHelpCount: number;
  totalHelpRequests: number;
  students: Array<{
    student: Student;
    currentRecord: LearningRecord | null;
    completedCount: number;
    unresolvedCount: number;
    latestError: string | null;
  }>;
};
