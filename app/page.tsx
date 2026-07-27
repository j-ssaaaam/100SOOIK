"use client";

import { useEffect, useMemo, useState } from "react";

type Mood = {
  id: string;
  emoji: string;
  label: string;
  helper: string;
  color: string;
};

type CheckIn = {
  date: string;
  moodId: string;
  note: string;
};

const moods: Mood[] = [
  { id: "bright", emoji: "☀️", label: "아주 좋아요", helper: "에너지가 가득해요", color: "#D9F66F" },
  { id: "okay", emoji: "🌿", label: "괜찮아요", helper: "차분하게 시작해요", color: "#D9F0E3" },
  { id: "heavy", emoji: "🌧️", label: "조금 무거워요", helper: "마음이 천천히 움직여요", color: "#DDD5FF" },
  { id: "help", emoji: "🫧", label: "도움이 필요해요", helper: "누군가와 이야기하고 싶어요", color: "#FFC8B8" },
];

const seedHistory: CheckIn[] = [
  { date: "2026-07-24", moodId: "okay", note: "친구랑 쉬는 시간에 많이 웃었다." },
  { date: "2026-07-23", moodId: "bright", note: "발표를 끝내서 마음이 후련했다." },
  { date: "2026-07-22", moodId: "heavy", note: "잠을 조금 못 자서 피곤했다." },
  { date: "2026-07-21", moodId: "bright", note: "기다리던 체육 시간이 있었다." },
];

function getDateKey(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(
    new Date(`${dateKey}T12:00:00`),
  );
}

export default function Home() {
  const today = getDateKey();
  const [selectedMood, setSelectedMood] = useState("bright");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<CheckIn[]>(seedHistory);

  useEffect(() => {
    const stored = window.localStorage.getItem("moodlog-checkins");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as CheckIn[];
      const todayEntry = parsed.find((entry) => entry.date === today);
      if (todayEntry) {
        setSelectedMood(todayEntry.moodId);
        setNote(todayEntry.note);
        setSaved(true);
      }
      setHistory(parsed);
    } catch {
      window.localStorage.removeItem("moodlog-checkins");
    }
  }, [today]);

  const recentDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (4 - index));
      const key = getDateKey(date);
      return {
        key,
        label: index === 4 ? "오늘" : new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(date),
        entry: history.find((item) => item.date === key),
      };
    });
  }, [history]);

  const selected = moods.find((mood) => mood.id === selectedMood) ?? moods[0];
  const completedCount = recentDays.filter((day) => day.entry).length + (saved && !recentDays.some((day) => day.key === today) ? 1 : 0);
  const saveCheckIn = () => {
    const nextHistory = [{ date: today, moodId: selectedMood, note }, ...history.filter((entry) => entry.date !== today)];
    setHistory(nextHistory);
    window.localStorage.setItem("moodlog-checkins", JSON.stringify(nextHistory));
    setSaved(true);
  };

  return (
    <main className="site-shell">
      <nav className="topbar" aria-label="주요 메뉴">
        <a className="brand" href="#top" aria-label="마음로그 홈">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>마음로그</span>
        </a>
        <div className="nav-links">
          <a href="#checkin">오늘 기록</a>
          <a href="#history">나의 흐름</a>
        </div>
        <div className="nav-meta">
          <span className="mini-status"><span className="status-dot" /> 나만 보기</span>
          <button className="round-button" aria-label="도움말">?</button>
        </div>
      </nav>

      <div className="announcement"><span>매일 아침, 1분</span><span>내 마음을 알아가는 시간</span><span>✦</span></div>

      <div className="content" id="top">
        <section className="intro-grid">
          <div className="intro-copy">
            <p className="eyebrow">GOOD MORNING / {formatLongDate()}</p>
            <h1>오늘 마음은<br /><span>어떤 색</span>인가요?</h1>
            <p className="intro-text">등교 전 잠깐 멈추고, 지금 내 마음을 살펴봐요.<br />정답은 없어요. 느끼는 그대로면 충분해요.</p>
            <div className="intro-note"><span className="sparkle">✦</span><span>기록은 이 기기에만 안전하게 저장돼요.</span></div>
          </div>

          <div className="morning-card">
            <div className="sun-orbit" aria-hidden="true"><span>☀</span></div>
            <div className="morning-card-top"><span className="eyebrow">YOUR MORNING CHECK-IN</span><span className="card-date">{formatLongDate()}</span></div>
            <div className="card-question">지금 내 마음에<br />가장 가까운 걸 골라주세요.</div>
            <div className="progress-line"><span /><span /><span /><span /></div>
            <div className="tiny-caption">01 / 01 · 감정 선택</div>
          </div>
        </section>

        <section className="checkin-section" id="checkin">
          <div className="section-heading"><div><p className="eyebrow">STEP 01 · CHECK IN</p><h2>지금, 나는</h2></div><span className="section-count">1 / 2</span></div>
          <div className="mood-grid" role="radiogroup" aria-label="오늘의 감정 선택">
            {moods.map((mood) => (
              <button
                className={`mood-option ${selectedMood === mood.id ? "is-selected" : ""}`}
                key={mood.id}
                style={{ "--mood-color": mood.color } as React.CSSProperties}
                onClick={() => { setSelectedMood(mood.id); setSaved(false); }}
                role="radio"
                aria-checked={selectedMood === mood.id}
              >
                <span className="mood-emoji" aria-hidden="true">{mood.emoji}</span>
                <span className="mood-label">{mood.label}</span>
                <span className="mood-helper">{mood.helper}</span>
                <span className="select-mark" aria-hidden="true">{selectedMood === mood.id ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="note-block" aria-labelledby="note-title">
          <div className="note-copy"><p className="eyebrow">STEP 02 · ONE LINE</p><h2 id="note-title">왜 그런 마음이<br />들었을까요?</h2><p>짧게 적어도 좋아요. 오늘의 나에게<br />건네는 한 문장이 될 거예요.</p></div>
          <div className="note-form">
            <div className="chosen-mood" style={{ backgroundColor: selected.color }}><span>{selected.emoji}</span><div><strong>{selected.label}</strong><small>{selected.helper}</small></div></div>
            <label className="sr-only" htmlFor="daily-note">오늘의 한 줄 기록</label>
            <textarea id="daily-note" value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} placeholder="예: 오늘은 친구를 만나서 기분이 좋아졌다." maxLength={120} />
            <div className="form-bottom"><span>{note.length} / 120</span><button className="primary-button" onClick={saveCheckIn}>{saved ? "오늘 기록 완료 ✓" : "오늘 기록 저장하기"}</button></div>
          </div>
        </section>

        <section className="history-section" id="history">
          <div className="history-heading"><div><p className="eyebrow">YOUR WEEK IN FEELINGS</p><h2>이번 주 마음 날씨</h2></div><div className="streak"><span>✦</span><strong>{completedCount}일</strong><small>기록했어요</small></div></div>
          <div className="week-row">
            {recentDays.map((day) => {
              const mood = day.entry ? moods.find((item) => item.id === day.entry?.moodId) : null;
              return <div className={`day-card ${day.key === today ? "today" : ""}`} key={day.key}><span className="day-label">{day.label}</span><span className="day-emoji" style={{ backgroundColor: mood?.color ?? "#F3F1EC" }}>{mood?.emoji ?? "·"}</span><span className="day-date">{formatShortDate(day.key)}</span></div>;
            })}
          </div>
          <div className="history-footer"><p><span className="footer-spark">✦</span> 마음은 매일 달라질 수 있어요. 달라지는 나를 그대로 기록해 보세요.</p><button className="text-button" onClick={() => document.getElementById("checkin")?.scrollIntoView({ behavior: "smooth" })}>오늘 기록하러 가기 ↗</button></div>
        </section>
      </div>

      <footer className="footer"><span>마음로그</span><span>나를 알아가는 가장 작은 습관</span><span>© 2026 MOODLOG</span></footer>
    </main>
  );
}
