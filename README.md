# 백점수익

초등학생이 틀린 수학 익힘책 문항을 다시 생각하고, 단계적인 도움을 받아 스스로 100점 완료까지 도달하도록 돕는 학습 웹앱입니다.

현재 학생 선택 화면에는 학생 이름 대신 다음 번호만 표시합니다.

- 1번~8번
- 31번~39번

## 현재 구현 범위

- 학생 17명 번호 선택
- 초기 비밀번호 `000` 로그인 및 최초 비밀번호 변경
- 3자리 숫자 비밀번호, 로그인 실패 제한, 로그아웃
- 분수의 덧셈과 뺄셈 샘플 문항의 단계적 진단
- 학생 답변을 대화 말풍선으로 보여 주는 챗봇형 학습 도우미
- 답변에 따른 질문 분기, 오류 유형과 핵심 개념 저장
- 원래 문제 재풀이 및 `100점 완료`
- 학생별 오답노트와 진도 화면
- 교사 로그인, 전체 학생 대시보드, 학생 상세 기록
- 교사의 학생 비밀번호 `000` 초기화
- Supabase 테이블·RLS 마이그레이션 및 샘플 데이터 시드 스크립트

분수의 덧셈과 뺄셈, 소수의 나눗셈, 비와 비율 샘플 3개가 모두 챗봇형 진단 흐름으로 연결되어 있습니다.

## 실행 방법

### 1. 필요한 프로그램

- Node.js 22 이상
- 실제 데이터를 저장하려면 Supabase 프로젝트

### 2. 설치

작업 폴더에서 터미널을 열고 실행합니다.

```powershell
npm install
```

### 3. 환경변수 설정

`.env.example`을 복사하여 `.env.local` 파일을 만들고 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://프로젝트아이디.supabase.co
VITE_SUPABASE_ANON_KEY=공개_anon_key
SUPABASE_URL=https://프로젝트아이디.supabase.co
SUPABASE_ANON_KEY=공개_anon_key
SUPABASE_SERVICE_ROLE_KEY=서버전용_service_role_key
TEACHER_INITIAL_PASSWORD=교사초기비밀번호
TEACHER_AUTH_EMAIL=teacher@bakjumsu.local
```

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 노출되면 안 됩니다. `.env.local`을 다른 사람에게 공유하지 마세요.

환경변수 5개(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)가 모두 있으면 실제 Supabase Auth와 Postgres를 사용합니다. 값이 없으면 화면 흐름을 확인할 수 있는 데모 저장소로 실행됩니다. 데모 데이터는 서버를 다시 시작하면 초기화됩니다.

### 4. Supabase 테이블 만들기

1. Supabase 프로젝트를 엽니다.
2. SQL Editor로 이동합니다.
3. `supabase/migrations/001_initial.sql`의 내용을 붙여 넣습니다.
4. 실행합니다.

학생 비밀번호는 `students` 테이블에 평문으로 저장하지 않습니다. Supabase Auth가 비밀번호를 해시하여 보관하고, `students`에는 비밀번호 변경 여부와 로그인 제한 상태만 저장합니다.

### 5. Supabase 샘플 데이터 생성

PowerShell에서 다음 환경변수를 설정한 뒤 실행합니다. `TEACHER_INITIAL_PASSWORD`에는 실제 사용할 교사 초기 비밀번호를 입력하세요.

```powershell
$env:SUPABASE_URL="https://프로젝트아이디.supabase.co"
$env:SUPABASE_ANON_KEY="공개_anon_key"
$env:SUPABASE_SERVICE_ROLE_KEY="서버전용_service_role_key"
$env:TEACHER_INITIAL_PASSWORD="교사초기비밀번호"
$env:TEACHER_AUTH_EMAIL="teacher@bakjumsu.local"
npm run supabase:seed
```

시드 스크립트는 `6학년 2반`, 교사 1명, 학생 17명(1~8번·31~39번), 샘플 문항 3개를 생성합니다. 학생은 모두 초기 비밀번호 `000`으로 시작합니다.

### 6. 개발 서버 실행

```powershell
npm run dev
```

터미널에 표시된 주소를 Chrome에서 엽니다.

### 7. 빌드 확인

```powershell
npm run build
```

## 데모 로그인

Supabase 환경변수가 없을 때 사용할 수 있습니다.

- 학생: 화면에 표시된 번호 중 하나, 초기 비밀번호 `000`
- 교사: 환경변수 `TEACHER_INITIAL_PASSWORD` 값
- 환경변수가 없을 때 데모 교사 비밀번호 기본값: `teacher`

## 챗봇형 단계적 도움

학생이 문항에서 `도움 시작하기`를 누르면 한 번에 질문 하나가 말풍선으로 표시됩니다.

1. 생각할 부분 질문
2. 필요한 핵심 개념
3. 쉬운 유사 예시
4. 원래 문제 다시 풀기

학생이 선택한 답도 자신의 말풍선으로 쌓이고, 답변에 따라 다음 질문이나 개념·예시가 달라집니다. 정답과 전체 풀이를 처음부터 보여 주지 않으며, 모든 응답은 진단 기록으로 저장됩니다.

## 새 문항 추가

현재 데모 모드에서는 `lib/demo-store.ts`의 `sampleQuestions` 배열에 문항을 추가합니다. Supabase 모드에서는 `questions` 테이블에 행을 추가하거나 이후 교사용 문항 등록 화면을 연결하면 됩니다.

문항에는 다음 정보를 넣습니다.

- 학년, 학기, 단원, 차시, 쪽수, 문항 번호
- 문제 문장, 정답, 허용 답안
- 핵심 개념
- 진단 시작 노드 ID
- 진단 노드 배열

진단 노드의 선택지에는 다음 값을 설정할 수 있습니다.

- `nextNodeId`: 다음 질문 ID
- `errorType`: 교사용 오류 유형
- `concept`: 학생에게 보여 줄 핵심 개념
- `example`: 학생에게 보여 줄 쉬운 유사 예시
- `repeatQuestion`: 같은 질문을 다시 보여 줄지 여부
- `teacherHelp`: 교사 도움 필요 상태로 바꿀지 여부

## 데이터 보호

- 공개 학생 선택 화면에는 활성 학생의 번호만 표시합니다.
- 학생은 자신의 학습 기록만 조회·수정할 수 있습니다.
- 교사는 담당 학급의 전체 기록을 조회할 수 있습니다.
- Supabase RLS로 학생별 기록 접근을 분리합니다.
- 비밀번호 변경·검증·초기화는 서버와 Supabase Auth에서 처리합니다.
- 교사는 학생의 현재 비밀번호를 볼 수 없고, `000` 초기화만 할 수 있습니다.

## 테스트 흐름

1. 학생 번호를 선택하고 `000`으로 로그인합니다.
2. 새 3자리 비밀번호를 설정합니다.
3. 분수 샘플 문항을 선택합니다.
4. 챗봇 질문에 답하며 진단을 진행합니다.
5. 원래 문제에 `7/12`를 입력하여 `100점 완료`를 확인합니다.
6. 로그아웃 후 다른 번호로 로그인하여 기록이 분리되는지 확인합니다.
7. 교사로 로그인해 학생 기록을 확인하고 비밀번호 초기화를 테스트합니다.

## 주요 파일

- `app/page.tsx`: 학생·교사 화면과 챗봇형 학습 흐름
- `app/globals.css`: 반응형 화면 스타일
- `app/api/`: 서버 로그인·학습 기록·교사 API
- `lib/demo-store.ts`: 데모 저장소와 샘플 문항
- `supabase/migrations/001_initial.sql`: 테이블과 RLS 정책
- `supabase/seed/sample-questions.json`: Supabase 샘플 문항
- `scripts/seed-supabase.mjs`: Supabase 초기 데이터 생성
