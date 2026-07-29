const firstSemesterFractionDivisionLessons = [
  { from: 1, to: 1, name: "단원도입 (수익 9쪽)" },
  { from: 2, to: 3, name: "1. (자연수)÷(자연수)의 몫을 분수로 나타내어 볼까요 (1) (수익 10~11쪽)" },
  { from: 4, to: 5, name: "2. (자연수)÷(자연수)의 몫을 분수로 나타내어 볼까요 (2) (수익 12~13쪽)" },
  { from: 6, to: 7, name: "3. (분수)÷(자연수)를 알아볼까요 (수익 14~15쪽)" },
  { from: 8, to: 9, name: "4. (분수)÷(자연수)를 분수의 곱셈으로 나타내어 볼까요 (수익 16~17쪽)" },
  { from: 10, to: 11, name: "5. (대분수)÷(자연수)를 알아볼까요 (수익 18~19쪽)" },
];

const workbookLessonCatalog = [
  ["math_ikhim_6-1-2.pdf", 1, 1, "단원도입 (수익 21쪽)"],
  ["math_ikhim_6-1-2.pdf", 2, 3, "1. 각기둥을 알아볼까요(1) (수익 22~23쪽)"],
  ["math_ikhim_6-1-2.pdf", 4, 5, "2. 각기둥을 알아볼까요(2) (수익 24~25쪽)"],
  ["math_ikhim_6-1-2.pdf", 6, 9, "3. 각기둥의 전개도를 알아볼까요 (수익 26~29쪽)"],
  ["math_ikhim_6-1-2.pdf", 10, 11, "4. 각뿔을 알아볼까요(1) (수익 30~31쪽)"],
  ["math_ikhim_6-1-2.pdf", 12, 13, "5. 각뿔을 알아볼까요(2) (수익 32~33쪽)"],
  ["math_ikhim_6-1-3.pdf", 1, 1, "단원도입 (수익 35쪽)"],
  ["math_ikhim_6-1-3.pdf", 2, 3, "1. (소수)÷(자연수)를 알아볼까요(1) (수익 36~37쪽)"],
  ["math_ikhim_6-1-3.pdf", 4, 5, "2. (소수)÷(자연수)를 알아볼까요(2) (수익 38~39쪽)"],
  ["math_ikhim_6-1-3.pdf", 6, 7, "3. (소수)÷(자연수)를 알아볼까요(3) (수익 40~41쪽)"],
  ["math_ikhim_6-1-3.pdf", 8, 9, "4. (소수)÷(자연수)를 알아볼까요(4) (수익 42~43쪽)"],
  ["math_ikhim_6-1-3.pdf", 10, 11, "5. (소수)÷(자연수)를 알아볼까요(5) (수익 44~45쪽)"],
  ["math_ikhim_6-1-3.pdf", 12, 13, "6. 자연수÷자연수의 몫을 소수로 나타내어 볼까요 (수익 46~47쪽)"],
  ["math_ikhim_6-1-3.pdf", 14, 15, "7. 어림셈한 결과를 이용하여 몫의 소수점 위치를 확인해 볼까요 (수익 48~49쪽)"],
  ["math_ikhim_6-1-4.pdf", 1, 1, "단원도입 (수익 51쪽)"],
  ["math_ikhim_6-1-4.pdf", 2, 3, "1. 두 수를 비교해 볼까요 (수익 52~53쪽)"],
  ["math_ikhim_6-1-4.pdf", 4, 5, "2. 비를 알아볼까요 (수익 54~55쪽)"],
  ["math_ikhim_6-1-4.pdf", 6, 7, "3. 비율을 알아볼까요 (수익 56~57쪽)"],
  ["math_ikhim_6-1-4.pdf", 8, 9, "4. 비율이 사용되는 경우를 알아볼까요 (수익 58~59쪽)"],
  ["math_ikhim_6-1-4.pdf", 10, 11, "5. 백분율을 알아볼까요 (수익 60~61쪽)"],
  ["math_ikhim_6-1-4.pdf", 12, 13, "6. 백분율이 사용되는 경우를 알아볼까요 (수익 62~63쪽)"],
  ["math_ikhim_6-1-5.pdf", 1, 1, "단원도입 (수익 65쪽)"],
  ["math_ikhim_6-1-5.pdf", 2, 3, "1. 띠그래프와 원그래프를 알아볼까요 (수익 66~67쪽)"],
  ["math_ikhim_6-1-5.pdf", 4, 5, "2. 띠그래프와 원그래프로 나타내는 방법을 알아볼까요 (수익 68~69쪽)"],
  ["math_ikhim_6-1-5.pdf", 6, 7, "3. 자료를 조사하여 띠그래프와 원그래프로 나타내어 볼까요 (수익 70~71쪽)"],
  ["math_ikhim_6-1-5.pdf", 8, 9, "4. 띠그래프와 원그래프를 해석해 볼까요 (수익 72~73쪽)"],
  ["math_ikhim_6-1-5.pdf", 10, 11, "5. 여러 가지 그래프를 활용해 볼까요 (수익 74~75쪽)"],
  ["math_ikhim_6-1-6.pdf", 1, 1, "단원도입 (수익 77쪽)"],
  ["math_ikhim_6-1-6.pdf", 2, 3, "1. 1 cm³를 알아볼까요 (수익 78~79쪽)"],
  ["math_ikhim_6-1-6.pdf", 4, 5, "2. 직육면체의 부피를 구하는 방법을 알아볼까요 (수익 80~81쪽)"],
  ["math_ikhim_6-1-6.pdf", 6, 7, "3. 1 m³를 알아볼까요 (수익 82~83쪽)"],
  ["math_ikhim_6-1-6.pdf", 8, 9, "4. 직육면체의 겉넓이를 구하는 방법을 알아볼까요 (수익 84~85쪽)"],
  ["math_ikhim_6-2-1.pdf", 1, 1, "단원도입 (수익 9쪽)"],
  ["math_ikhim_6-2-1.pdf", 2, 3, "1. 분모가 같은 (분수)÷(분수)를 알아볼까요(1) (수익 10~11쪽)"],
  ["math_ikhim_6-2-1.pdf", 4, 5, "2. 분모가 같은 (분수)÷(분수)를 알아볼까요(2) (수익 12~13쪽)"],
  ["math_ikhim_6-2-1.pdf", 6, 7, "3. 분모가 다른 (분수)÷(분수)를 알아볼까요 (수익 14~15쪽)"],
  ["math_ikhim_6-2-1.pdf", 8, 9, "4. (자연수)÷(분수)를 알아볼까요 (수익 16~17쪽)"],
  ["math_ikhim_6-2-1.pdf", 10, 11, "5. (분수)÷(분수)를 (분수)×(분수)로 나타내어 볼까요 (수익 18~19쪽)"],
  ["math_ikhim_6-2-1.pdf", 12, 13, "6. (분수)÷(분수)를 구해 볼까요 (수익 20~21쪽)"],
  ["math_ikhim_6-2-2.pdf", 1, 1, "단원도입 (수익 23쪽)"],
  ["math_ikhim_6-2-2.pdf", 2, 3, "1. 소수의 나눗셈을 알아볼까요 (수익 24~25쪽)"],
  ["math_ikhim_6-2-2.pdf", 4, 5, "2. (소수)÷(소수)를 알아볼까요(1) (수익 26~27쪽)"],
  ["math_ikhim_6-2-2.pdf", 6, 7, "3. (소수)÷(소수)를 알아볼까요(2) (수익 28~29쪽)"],
  ["math_ikhim_6-2-2.pdf", 8, 9, "4. (자연수)÷(소수)를 알아볼까요 (수익 30~31쪽)"],
  ["math_ikhim_6-2-2.pdf", 10, 11, "5. 몫을 반올림하여 나타내어 볼까요 (수익 32~33쪽)"],
  ["math_ikhim_6-2-2.pdf", 12, 13, "6. 나누어 주고 남는 양을 알아볼까요 (수익 34~35쪽)"],
  ["math_ikhim_6-2-3.pdf", 1, 1, "단원도입 (수익 37쪽)"],
  ["math_ikhim_6-2-3.pdf", 2, 3, "1. 어느 방향에서 보았을까요 (수익 38~39쪽)"],
  ["math_ikhim_6-2-3.pdf", 4, 5, "2. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(1) (수익 40~41쪽)"],
  ["math_ikhim_6-2-3.pdf", 6, 7, "3. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(2) (수익 42~43쪽)"],
  ["math_ikhim_6-2-3.pdf", 8, 9, "4. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(3) (수익 44~45쪽)"],
  ["math_ikhim_6-2-3.pdf", 10, 11, "5. 쌓은 모양과 쌓기나무의 개수를 알아볼까요(4) (수익 46~47쪽)"],
  ["math_ikhim_6-2-3.pdf", 12, 13, "6. 쌓기나무로 여러 가지 모양을 만들어 볼까요 (수익 48~49쪽)"],
  ["math_ikhim_6-2-4.pdf", 1, 1, "단원도입 (수익 51쪽)"],
  ["math_ikhim_6-2-4.pdf", 2, 3, "1. 비의 성질을 알아볼까요 (수익 52~53쪽)"],
  ["math_ikhim_6-2-4.pdf", 4, 5, "2. 간단한 자연수의 비로 나타내어 볼까요 (수익 54~55쪽)"],
  ["math_ikhim_6-2-4.pdf", 6, 7, "3. 비례식을 알아볼까요 (수익 56~57쪽)"],
  ["math_ikhim_6-2-4.pdf", 8, 9, "4. 비례식의 성질을 알아볼까요 (수익 58~59쪽)"],
  ["math_ikhim_6-2-4.pdf", 10, 11, "5. 비례식을 활용해 볼까요 (수익 60~61쪽)"],
  ["math_ikhim_6-2-4.pdf", 12, 13, "6. 비례배분을 해 볼까요 (수익 62~63쪽)"],
  ["math_ikhim_6-2-5.pdf", 1, 1, "단원도입 (수익 65쪽)"],
  ["math_ikhim_6-2-5.pdf", 2, 3, "1. 원주와 지름의 관계를 알아볼까요 (수익 66~67쪽)"],
  ["math_ikhim_6-2-5.pdf", 4, 5, "2. 원주율을 알아볼까요 (수익 68~69쪽)"],
  ["math_ikhim_6-2-5.pdf", 6, 7, "3. 원주와 지름을 구해 볼까요 (수익 70~71쪽)"],
  ["math_ikhim_6-2-5.pdf", 8, 9, "4. 원의 넓이를 어림해 볼까요 (수익 72~73쪽)"],
  ["math_ikhim_6-2-5.pdf", 10, 11, "5. 원의 넓이를 구하는 방법을 알아볼까요 (수익 74~75쪽)"],
  ["math_ikhim_6-2-5.pdf", 12, 13, "6. 원의 넓이를 활용해 볼까요 (수익 76~77쪽)"],
] as const;

const pdfPageOf = (row: Record<string, unknown>) => {
  const imageUrl = String(row.question_image_url ?? "");
  return Number(imageUrl.match(/math_ikhim_6-[12]-[1-6]\.pdf#page=(\d+)/)?.[1] ?? 0);
};

/** Keep student and teacher lesson keys identical for legacy first-semester rows. */
export const normalizeLessonName = (row: Record<string, unknown>) => {
  const semester = Number(row.semester);
  const unit = String(row.unit ?? "");
  const imageUrl = String(row.question_image_url ?? "");
  const pdfPage = pdfPageOf(row);
  if (semester === 1 && unit === "분수의 나눗셈") {
    const lesson = firstSemesterFractionDivisionLessons.find((item) => pdfPage >= item.from && pdfPage <= item.to);
    if (lesson) return lesson.name;
  }
  const file = imageUrl.match(/(math_ikhim_6-[12]-[1-6]\.pdf)/)?.[1];
  const lesson = workbookLessonCatalog.find(([catalogFile, from, to]) => catalogFile === file && pdfPage >= from && pdfPage <= to);
  if (lesson) return lesson[3];
  return String(row.lesson ?? "");
};
