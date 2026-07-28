-- 백점수익 첫 번째 버전 Supabase 스키마
-- 학생/교사 비밀번호는 이 테이블에 저장하지 않고 Supabase Auth가 관리합니다.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade integer not null check (grade between 1 and 6),
  school_year integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  student_number integer not null,
  name text not null,
  auth_email text not null unique,
  must_change_password boolean not null default true,
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(class_id, student_number)
);

create table if not exists public.teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  grade integer not null check (grade between 1 and 6),
  semester integer not null check (semester in (1, 2)),
  unit text not null,
  lesson text not null,
  page integer not null,
  question_number integer not null,
  question_text text not null,
  question_image_url text,
  correct_answer text not null,
  accepted_answers jsonb not null default '[]'::jsonb,
  concepts text[] not null default '{}',
  diagnostic_start_id text not null,
  diagnostic_nodes jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  status text not null default 'NOT_STARTED' check (status in ('NOT_STARTED','DIAGNOSING','CONCEPT_HELP','RETRYING','COMPLETED','TEACHER_HELP_NEEDED')),
  current_diagnostic_node_id text not null,
  diagnosed_error_types text[] not null default '{}',
  provided_concepts text[] not null default '{}',
  retry_count integer not null default 0,
  retry_answer text not null default '',
  is_completed boolean not null default false,
  needs_teacher_help boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(student_id, question_id)
);

create table if not exists public.diagnostic_responses (
  id uuid primary key default gen_random_uuid(),
  learning_record_id uuid not null references public.learning_records(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  diagnostic_node_id text not null,
  question_text text not null,
  answer text not null,
  next_node_id text,
  diagnosed_error_type text,
  response_time_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  learning_record_id uuid references public.learning_records(id) on delete cascade,
  note text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists learning_records_student_idx on public.learning_records(student_id);
create index if not exists diagnostic_responses_student_idx on public.diagnostic_responses(student_id);
create index if not exists students_class_number_idx on public.students(class_id, student_number);

create or replace function public.is_teacher()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'teacher', false);
$$;

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.questions enable row level security;
alter table public.learning_records enable row level security;
alter table public.diagnostic_responses enable row level security;
alter table public.teacher_notes enable row level security;

drop policy if exists classes_public_read on public.classes;
create policy classes_public_read on public.classes for select using (true);

drop policy if exists students_self_or_teacher on public.students;
create policy students_self_or_teacher on public.students for select using (id = auth.uid() or public.is_teacher());

drop policy if exists teachers_self on public.teachers;
create policy teachers_self on public.teachers for select using (id = auth.uid() or public.is_teacher());

drop policy if exists questions_authenticated_read on public.questions;
create policy questions_authenticated_read on public.questions for select to authenticated using (is_active = true or public.is_teacher());

drop policy if exists learning_records_owner_read on public.learning_records;
create policy learning_records_owner_read on public.learning_records for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists learning_records_owner_insert on public.learning_records;
create policy learning_records_owner_insert on public.learning_records for insert with check (student_id = auth.uid() or public.is_teacher());
drop policy if exists learning_records_owner_update on public.learning_records;
create policy learning_records_owner_update on public.learning_records for update using (student_id = auth.uid() or public.is_teacher()) with check (student_id = auth.uid() or public.is_teacher());

drop policy if exists diagnostic_owner_read on public.diagnostic_responses;
create policy diagnostic_owner_read on public.diagnostic_responses for select using (student_id = auth.uid() or public.is_teacher());
drop policy if exists diagnostic_owner_insert on public.diagnostic_responses;
create policy diagnostic_owner_insert on public.diagnostic_responses for insert with check (student_id = auth.uid() or public.is_teacher());

drop policy if exists teacher_notes_class_read on public.teacher_notes;
create policy teacher_notes_class_read on public.teacher_notes for select using (public.is_teacher() and teacher_id = auth.uid());
drop policy if exists teacher_notes_insert on public.teacher_notes;
create policy teacher_notes_insert on public.teacher_notes for insert with check (public.is_teacher() and teacher_id = auth.uid());
drop policy if exists teacher_notes_update on public.teacher_notes;
create policy teacher_notes_update on public.teacher_notes for update using (public.is_teacher() and teacher_id = auth.uid()) with check (public.is_teacher() and teacher_id = auth.uid());

-- 공개 로그인 화면은 번호만 반환합니다. 이름과 인증 식별자는 공개하지 않습니다.
create or replace view public.student_login_roster as
select class_id, student_number
from public.students
where is_active = true;

grant select on public.student_login_roster to anon, authenticated;
