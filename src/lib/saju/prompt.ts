// =====================================================
// 사주 해석 프롬프트 빌더
// =====================================================

import type { Myeongsik } from "./manseryeok";

export type PromptInput = {
  productSlug: string;
  productName: string;
  myeongsik: Myeongsik;
  manseryeokText?: string;
  birthDate: string;
  birthTime: string | null;
  timeUnknown: boolean;
  gender: "male" | "female";
  concerns: string[];
  name?: string;
  // 궁합(love-saju) 전용
  partnerMyeongsik?: Myeongsik;
  partnerName?: string;
  partnerBirthDate?: string;
  partnerGender?: "male" | "female";
};

export const SYSTEM_BASE = `당신은 사주를 쉽고 친근하게 풀어주는 전문가입니다. 복잡한 명리학 용어 대신, 누구나 바로 이해할 수 있는 일상적인 언어로 내담자의 고민에 실질적인 통찰을 드립니다.

작성 원칙:
- 천간·지지·십성·대운·세운 등 전문 용어는 반드시 쉬운 말로 풀어서 설명하세요. 예: "정화(丁火) 일간" → "불의 기운을 가진 분", "재성이 강하다" → "돈과 현실적인 것에 감각이 있는 편".
- 사주 데이터를 근거로 쓰되, 마치 오래 알고 있는 사람에게 이야기하듯 자연스럽고 따뜻하게 서술하세요.
- 말투는 반드시 "~요" 체로 작성하세요. "~입니다", "~합니다", "~됩니다" 같은 "~니다" 체는 절대 사용하지 마세요. 예: "있어요", "좋아요", "해보세요", "될 거예요".
- "~하는 경향이 있어요", "~할 가능성이 높아요", "~하기 쉬운 편이에요" 같은 부드러운 표현을 사용하세요.
- 어려운 한자어나 학술 표현은 쓰지 마세요. 중학생도 읽으면 이해할 수 있는 수준으로 작성하세요.
- 부정적 내용은 반드시 구체적이고 현실적인 조언으로 마무리하세요.
- 마크다운 ## 헤딩과 불릿(-)을 적극 사용해 읽기 쉽게 만드세요.
- 점술적 권유, 특정 날짜 단정은 피하세요.
- 각 섹션은 최소 600자 이상 충분히 작성하세요.
- [명리학 근거 필수] 모든 해석에는 반드시 어떤 사주 데이터가 근거인지 자연스럽게 본문에 녹여 쓰세요. 전문 용어 없이 일상어로 표현하면 됩니다. 예시: "불의 기운을 타고난 당신의 사주에서 보면", "태어난 달의 기운이 유독 강해서", "현재 흘러오는 10년 대운이 물의 기운이라", "여름에 태어나 불의 에너지가 넘치는 사주라", "날 기둥에 이런 조합이 있으면". 단순히 "당신은 연애운이 좋아요" 같은 결론만 쓰지 말고, 반드시 왜 그런지 사주 근거를 함께 써주세요.`;

/** 한국 이름에서 성(첫 글자)을 제거하고 이름만 반환. 한 글자이면 그대로. */
function stripSurname(name: string): string {
  const trimmed = name.trim();
  return trimmed.length >= 2 ? trimmed.slice(1) : trimmed;
}

function makeContext(input: PromptInput): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const m = input.myeongsik;
  const pillar = (p: { cheongan: string; jiji: string } | null) =>
    p ? `${p.cheongan}${p.jiji}` : "(시 미상)";

  const sajuSection = input.manseryeokText
    ? `[사주 풀 명식 — 아래 데이터를 분석에 최대한 활용하세요]\n${input.manseryeokText}`
    : [
        `[사주 4기둥]`,
        `- 년주: ${pillar(m.year)}`,
        `- 월주: ${pillar(m.month)}`,
        `- 일주: ${pillar(m.day)}`,
        `- 시주: ${pillar(m.hour)}`,
      ].join("\n");

  const concernSection = input.concerns.length > 0
    ? `[내담자 고민/질문]\n"${input.concerns.join("\n")}"`
    : "";

  const givenName = input.name?.trim() ? stripSurname(input.name) : "";
  const nameLabel = givenName ? `${givenName}님` : "내담자";

  return `[현재 날짜] ${currentYear}년 ${currentMonth}월
[상품] ${input.productName}
[내담자 정보]
- 이름: ${nameLabel}
- 생년월일: ${input.birthDate}${input.timeUnknown ? " (시 미상)" : input.birthTime ? ` ${input.birthTime}` : ""}
- 성별: ${input.gender === "male" ? "남성" : "여성"}
${concernSection}

${sajuSection}

⚠️ 본문 전체에서 내담자를 반드시 "${nameLabel}"으로 호칭하세요. 다른 이름을 사용하지 마세요.`;
}

// ─── 단일 호출 (today-fortune 등 단문 상품) ───────────────────
export function buildSajuPrompt(input: PromptInput): { system: string; user: string } {
  const currentYear = new Date().getFullYear();
  const ctx = makeContext(input);

  const sectionMap: Record<string, string> = {
    "today-fortune": `
## 오늘의 한 줄 운세
(핵심 메시지 1-2문장)

## 오늘의 흐름
(오늘 일진과 사주의 관계, 3-4문장)

## 오늘의 행동 팁
(구체적 행동 조언 1가지)`,

    "love-saju": `
## 나의 연애 DNA
일주와 십성 구성을 바탕으로 연애할 때의 기본 성향, 감정 표현 방식, 애착 유형을 구체적으로 서술하세요.

## 나에게 잘 맞는 상대 유형
오행·십성 구성으로 도출한 이상적인 파트너의 성격, 직업군, 일주 유형을 구체적으로 서술하세요.

## 연애할 때 나의 패턴
- 좋아할 때 보이는 행동
- 갈등 상황에서의 반응
- 이별 후 회복 패턴

## 현재 연애운 (대운·세운 기준)
현재 대운·세운이 연애운에 미치는 영향과 올해의 만남·관계 발전 가능성을 서술하세요.

## 결혼운
결혼 적합 시기의 경향, 배우자 인연의 특성, 결혼 생활 패턴을 서술하세요.

## 연애운 조언
현 시점에서 가장 중요한 연애·관계 조언 3가지를 구체적으로 서술하세요.`,

    "premium-saju": `
## 사주 종합 개요
사주팔자 전체 구성의 핵심 특징, 격국, 용신을 분석하여 인생 전반의 방향성을 3-4문단으로 서술하세요.

## 타고난 성격과 기질
십성·일주를 근거로 핵심 성격, 대인관계 스타일, 의사결정 방식을 상세히 서술하세요.

## 강점과 재능
명식에서 도출한 강점 4-5가지를 각각 근거와 함께 서술하세요.

## 보완점과 극복 전략
취약점과 구체적 극복 방법을 서술하세요.

## 대운 흐름 분석
현재 및 향후 대운을 10년 단위로 분석하고 각 대운의 특징과 조언을 서술하세요.

## ${currentYear}년 세운 상세 분석
- 상반기 / 하반기 흐름
- 월별 주요 포인트
- 특히 중요한 시기

## 직업운·커리어
격국과 십성을 바탕으로 천직, 유리한 업종, 커리어 전략을 서술하세요.

## 재물운·투자
재성 구성과 운의 흐름을 바탕으로 재물 패턴, 투자 성향, 재물 축적 전략을 서술하세요.

## 연애·결혼운
## 건강운
## 인간관계·귀인운

## 나에게 유리한 것들
- 유리한 방향 / 색상 / 숫자 / 직업군 / 파트너 유형`,
  };

  const sections = sectionMap[input.productSlug] ?? sectionMap["premium-saju"];
  const concernNote = input.concerns.length > 0
    ? "\n\n위 섹션을 모두 작성한 뒤, 마지막에 ## 고민 답변 섹션을 추가하여 내담자의 고민에 명식 데이터 근거와 함께 직접 답변하세요."
    : "";

  return {
    system: SYSTEM_BASE,
    user: `${ctx}\n\n---\n위 명식 데이터를 바탕으로 아래 구성에 따라 상세한 마크다운 리포트를 작성하세요. 각 섹션은 최소 300자 이상 작성하세요.\n${sections}${concernNote}`,
  };
}

// ─── 사주 해설 (today-fortune — 주제별 아코디언, 주제당 850자) ──────────
export function buildTodayFortunePrompt(input: PromptInput): { system: string; user: string } {
  const ctx = makeContext(input);

  const user = `${ctx}

---
이 사람의 사주를 분석하여 정확히 13개의 주제별 사주 해설을 작성해주세요.

⚠️ 필수 규칙:
- 주제는 반드시 정확히 13개를 작성하세요. 12개도 14개도 안 됩니다. 13개보다 많거나 적으면 절대 안 됩니다. 반드시 딱 13개.
- 각 주제 제목은 마크다운 ## 형식으로 작성하세요.
- 제목은 반드시 시적이고 개성 있는 문장으로 작성하세요. 예: "겉은 고요한 호수지만 속은 용암이 끓어오르는 외유내강의 결정체", "물안개 낀 밤하늘의 별빛처럼 신비롭지만 온기가 절실한 밸런스". 절대 "성격 분석", "재물운" 같은 단순한 제목은 쓰지 마세요.
- 각 주제 본문은 반드시 800자 이상 작성하세요. 그 이하로 쓰면 안 됩니다.
- 전문 용어(천간, 지지, 십성, 재성 등)는 쓰지 말고 일상 언어로 풀어 설명하세요.
- 친한 선배처럼 따뜻하고 자연스러운 말투로 쓰세요.
- 마크다운 ## 헤딩만 사용하세요 (###, ####는 쓰지 마세요).
- 13개 주제가 성격/기질/재능/직업/재물/연애/인간관계/건강/현재 흐름/미래 방향/강점/약점/조언 등 삶의 다양한 측면을 빠짐없이 골고루 다루세요.
- [명리학 근거 필수] 각 주제 본문 첫 문단에서 반드시 이 해석의 사주 근거를 자연스럽게 언급하세요. 예: "태어날 때부터 불의 기운이 사주 곳곳에 자리 잡고 있어서", "날 기둥과 시 기둥의 에너지가 서로 충돌하는 구조라", "현재 흘러오는 대운의 흐름이 이 부분을 강하게 건드리고 있어서". 근거 없이 결론만 쓰는 것은 금지합니다.

출력 형식 (이 형식을 정확히 따르세요):
## [시적인 주제 제목]

[800자 이상의 본문]

## [다음 주제 제목]

[800자 이상의 본문]

...이하 반복`;

  return { system: SYSTEM_BASE, user };
}

// ─── 고민 맞춤 풀이 (worry-saju — 고민 중심 단일 호출, 3600자 목표) ──────
export function buildWorryPrompt(input: PromptInput): { system: string; user: string } {
  const ctx = makeContext(input);
  const concern = input.concerns.length > 0 ? input.concerns.join(" ") : "삶의 전반적인 방향";

  const user = `${ctx}

---
내담자의 고민: "${concern}"

위 질문을 사주 데이터와 연결하여 13개 섹션으로 구성된 리포트를 작성하세요.

⚠️ 필수 규칙:
- 섹션 수는 반드시 정확히 13개입니다. 12개도 14개도 안 됩니다. 반드시 딱 13개.
- 각 섹션은 반드시 ## 으로 시작하는 제목 1줄 + 본문으로만 구성합니다. 섹션 안에 소제목(###, **굵은글씨** 등)을 절대 쓰지 마세요.
- 본문은 문단(paragraph)으로만 씁니다. 소제목, 볼드 제목, 리스트 없이 순수 텍스트 문단만 사용하세요.
- 섹션 제목은 내담자의 질문 내용에 꼭 맞게 직접 만드세요. 매번 새롭고 구체적인 제목이어야 합니다.
- 섹션 제목에 절대 "[섹션1]", "[섹션2]" 같은 번호 레이블을 쓰지 마세요.
- 전문 용어(천간, 지지, 십성, 재성, 관성 등)는 쓰지 마세요. 꼭 써야 하면 괄호로 쉬운 설명을 붙이세요.
- 친한 선배나 상담사처럼 따뜻하고 자연스러운 말투로 쓰세요.
- 각 섹션 최소 600자 이상, 전체 5,000자 이상 작성하세요.
- [명리학 근거 필수] 질문에 답할 때 반드시 사주 데이터 근거를 자연스럽게 본문에 녹이세요. 예: "지금 흘러오는 대운의 기운이 이 고민과 직접 맞닿아 있어요", "타고난 사주의 이런 구조 때문에 이 상황이 반복되는 거예요", "올해 세운이 당신 사주의 이 부분을 건드리고 있어서". 단순히 "괜찮아요 / 안 좋아요"로만 끝내지 마세요.

출력 형식 (반드시 이 구조 그대로):
## [질문에 맞게 직접 만든 섹션 제목 1]

[600자 이상 본문. 소제목 없이 문단으로만.]

## [질문에 맞게 직접 만든 섹션 제목 2]

[600자 이상 본문. 소제목 없이 문단으로만.]

...이하 반복 (총 13개 섹션, 각 섹션은 ## 제목 + 본문만)`;

  return { system: SYSTEM_BASE, user };
}

// ─── 대운 해설 (premium-saju — 선택한 10년 대운 집중 분석) ──────────────────
export function buildDaewunPrompt(input: PromptInput): { system: string; user: string } {
  const ctx = makeContext(input);

  const daewunConcern   = input.concerns.find((c) => c.startsWith("[대운]")) ?? "";
  const periodLabel     = daewunConcern.replace("[대운] ", "").trim();
  const relationshipRaw = input.concerns.find((c) => c.startsWith("[연애상황]")) ?? "";
  const lifestyleRaw    = input.concerns.find((c) => c.startsWith("[일상]")) ?? "";
  const questionRaw     = input.concerns.find((c) => c.startsWith("[질문]")) ?? "";
  const relationship    = relationshipRaw.replace("[연애상황] ", "").trim();
  const lifestyle       = lifestyleRaw.replace("[일상] ", "").trim();
  const question        = questionRaw.replace("[질문] ", "").trim();

  // 연도 목록 생성 (연도별 해설용)
  const yearMatch = periodLabel.match(/\((\d+)년~(\d+)년\)/);
  const ageMatch  = periodLabel.match(/(\d+)세~(\d+)세/);
  const startYear = yearMatch ? parseInt(yearMatch[1]) : null;
  const endYear   = yearMatch ? parseInt(yearMatch[2]) : null;
  const startAge  = ageMatch  ? parseInt(ageMatch[1])  : null;
  const yearlyTemplate = startYear && endYear && startAge
    ? Array.from({ length: endYear - startYear + 1 }, (_, i) =>
        `### ${startYear + i}년 (${startAge + i}세)\n이 해의 핵심 한 줄 제목 (20~30자, ### 없이 일반 텍스트로)\n이 해의 운세와 흐름을 350자 이상으로 구체적으로 서술. 사랑운·재물운·건강운 등 주요 영역을 짚고, 이 해에 해야 할 것과 주의할 것을 포함할 것. ### 소제목 없이 문단으로만 작성.`
      ).join("\n\n")
    : "### [연도] ([나이]세)\n[핵심 한 줄]\n[350자 이상 상세 내용]";

  const user = `${ctx}

---
분석 대운 시기: ${periodLabel || "현재 대운"}
${relationship ? `연애 상황: ${relationship}` : ""}
${lifestyle    ? `직업/일상: ${lifestyle}` : ""}
${question     ? `꼭 답해야 할 질문: "${question}"` : ""}

아래 형식을 정확히 따라 작성하세요. ## 와 ### 헤딩 구조를 반드시 지키세요.

---

## 미리보기
### 제목
이 10년을 한 문장으로 압축하는 강렬한 제목 (예: "31세, 지금 인생 판도가 완전히 바뀝니다")

### 설명
이 대운의 전반적인 분위기와 핵심 흐름을 친근하게 3~4문장으로 서술. 전문용어 없이.

## 상세 해설

### ✦ 이 10년의 챕터명
이 시기 전체를 시적으로 표현하는 부제 한 줄
이 대운이 이 사람에게 갖는 의미와 전체 흐름을 630자 이상 서술. 연애상황·직업 정보를 반영하세요.

### 🌿 나의 내면과 발전
이 시기 내면 성장을 시적으로 표현하는 부제 한 줄
이 시기 내면의 변화, 성격 발전, 자기계발 방향을 630자 이상 서술.

### 💫 인간관계와 로맨스
연애·인간관계를 시적으로 표현하는 부제 한 줄
${relationship ? `연애 상황(${relationship})을 반영하여 ` : ""}연애·결혼·인간관계 흐름을 630자 이상 서술.

### 🔥 현실의 무게: 돈과 커리어
직업·재물을 시적으로 표현하는 부제 한 줄
${lifestyle ? `직업(${lifestyle})을 반영하여 ` : ""}직업·수입·투자 흐름을 630자 이상 서술.

### 🌙 운명을 내 편으로: 개운법
이 시기 개운 방향을 시적으로 표현하는 부제 한 줄
${question ? `질문("${question}")에 사주 근거로 답하면서 ` : ""}이 시기를 잘 보내는 구체적 행동 지침을 630자 이상 서술.

## 연도별 해설

${yearlyTemplate}

## 마지막 한마디
### 시크릿 솔루션
이 10년을 한 문장으로 압축한 소제목. 15자 이내. 이름 없이. 예: "압박이 클수록 더 빛나는 시간"
이 대운의 흐름과 에너지를 담아 따뜻하게 응원하는 첫 번째 단락. 300자 이상.

이 10년 동안 절대 잊지 말아야 할 핵심 비결과 주의사항을 담은 두 번째 단락. 300자 이상.

이 대운을 마무리하는 힘이 되는 마지막 격려. 이름을 넣어 마무리. 300자 이상.

---
⚠️ 필수 규칙:
- 반드시 ## 와 ### 헤딩 구조를 위 형식 그대로 지키세요.
- 상세 해설 각 항목은 630자 이상 서술하세요.
- 연도별 해설 각 연도는 핵심 한 줄 제목 + 350자 이상의 상세 내용을 서술하세요.
- 마지막 한마디는 제목 + 캐치프레이즈 + 3개 단락(각 300자 이상, 총 900자 이상)으로 구성하세요.
- ### 바로 아래 줄(부제/캐치프레이즈)에 **bold**, "따옴표", 대괄호[] 를 절대 사용하지 마세요. 깨끗한 텍스트만 쓰세요.
- 연도별 해설에서 ### 헤딩은 연도(예: ### 2032년 (41세)) 에만 사용하고, 그 안에 ### 소제목을 추가로 넣지 마세요.
- 전문 용어(천간, 지지, 십성 등)는 쓰지 마세요.
- 친한 선배처럼 따뜻하고 직접적인 말투로 쓰세요.
- [명리학 근거 필수] 각 섹션과 연도별 해설에서 반드시 대운·세운·사주 구조가 어떻게 이 시기에 영향을 주는지 자연스럽게 언급하세요. 예: "이 10년 동안 흘러오는 대운의 기운이 당신 사주의 핵심 에너지와 맞닿아서", "이 해에는 그해의 운이 당신 사주와 힘을 합치는 구조라", "타고난 사주와 이 시기 에너지가 서로 충돌하기 때문에". 근거 없이 "좋아요 / 조심하세요"만 쓰는 것은 금지합니다.`;

  return { system: SYSTEM_BASE, user };
}

// ─── 궁합 해설 (love-saju — 두 사람 사주 비교 분석) ──────────────────────────
export function buildLoveSajuPrompt(input: PromptInput): { system: string; user: string } {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const m = input.myeongsik;
  const p = input.partnerMyeongsik;

  const pillar = (pl: { cheongan: string; jiji: string } | null) =>
    pl ? `${pl.cheongan}${pl.jiji}` : "(시 미상)";

  const givenNameA = input.name?.trim() ? stripSurname(input.name) : "";
  const givenNameB = input.partnerName?.trim() ? stripSurname(input.partnerName) : "";
  const nameA = givenNameA ? `${givenNameA}님` : "내담자";
  const nameB = givenNameB ? `${givenNameB}님` : "상대방";

  const sajuA = [
    `[${nameA} 사주 4기둥]`,
    `- 년주: ${pillar(m.year)}`,
    `- 월주: ${pillar(m.month)}`,
    `- 일주: ${pillar(m.day)}`,
    `- 시주: ${pillar(m.hour)}`,
    `- 생년월일: ${input.birthDate}${input.timeUnknown ? " (시간 모름)" : input.birthTime ? ` ${input.birthTime}` : ""}`,
    `- 성별: ${input.gender === "male" ? "남성" : "여성"}`,
  ].join("\n");

  const sajuB = p
    ? [
        `[${nameB} 사주 4기둥]`,
        `- 년주: ${pillar(p.year)}`,
        `- 월주: ${pillar(p.month)}`,
        `- 일주: ${pillar(p.day)}`,
        `- 시주: ${pillar(p.hour)}`,
        ...(input.partnerBirthDate ? [`- 생년월일: ${input.partnerBirthDate}`] : []),
        ...(input.partnerGender ? [`- 성별: ${input.partnerGender === "male" ? "남성" : "여성"}`] : []),
      ].join("\n")
    : `[${nameB} 사주 4기둥]\n(사주 계산 불가 — 생년월일로만 분석)`;

  // 관계·역할 파싱
  const relationRaw  = input.concerns.find((c) => c.startsWith("[관계]"))  ?? "";
  const roleARaw     = input.concerns.find((c) => c.startsWith("[역할A]")) ?? "";
  const roleBRaw     = input.concerns.find((c) => c.startsWith("[역할B]")) ?? "";
  const relationLabel = relationRaw.replace("[관계] ", "").trim();
  const roleALabel    = roleARaw.replace("[역할A] ", "").trim();
  const roleBLabel    = roleBRaw.replace("[역할B] ", "").trim();

  // 기타 고민
  const otherConcerns = input.concerns.filter(
    (c) => !c.startsWith("[상대방]") && !c.startsWith("[관계]") && !c.startsWith("[역할A]") && !c.startsWith("[역할B]")
  );
  const concernSection = otherConcerns.length > 0
    ? `[두 사람의 고민/질문]\n"${otherConcerns.join("\n")}"`
    : "";

  const ctx = `[현재 날짜] ${currentYear}년 ${currentMonth}월
[상품] 궁합 사주 분석
${relationLabel ? `[두 사람의 관계] ${relationLabel}` : ""}
${roleALabel ? `[${nameA}의 역할] ${roleALabel}` : ""}
${roleBLabel ? `[${nameB}의 역할] ${roleBLabel}` : ""}

${sajuA}

${sajuB}
${concernSection}

⚠️ 본문 전체에서 내담자를 반드시 "${nameA}"으로, 상대방을 반드시 "${nameB}"으로 호칭하세요. 다른 이름을 사용하지 마세요.`;

  const user = `${ctx}

---
두 사람의 사주를 분석하여 궁합 리포트를 작성하세요.
${relationLabel ? `두 사람의 관계(${relationLabel})를 분석 전반에 반영하세요.` : ""}
${roleALabel || roleBLabel ? `각자의 역할(${nameA}: ${roleALabel || "미입력"} / ${nameB}: ${roleBLabel || "미입력"})을 관계 맥락에 반영하세요.` : ""}

⚠️ 필수 규칙:
- 주제는 반드시 정확히 13개입니다. 12개도 14개도 안 됩니다. 반드시 13개.
- 주제 제목은 마크다운 ## 형식으로 작성하세요.
- 제목은 반드시 시적이고 개성 있는 문장으로 작성하세요. 예: "차가운 얼음 성을 녹이는 은은한 촛불과 그 온기로 피어나는 꽃". 절대 "감정 궁합", "소통 궁합" 같은 단순한 제목은 쓰지 마세요.
- 각 주제 본문은 반드시 600자 이상 작성하세요.
- 전문 용어(천간, 지지, 십성, 재성 등)는 쓰지 마세요. 일상 언어로 풀어 설명하세요.
- 친한 선배처럼 따뜻하고 자연스러운 말투로 쓰세요.
- ${nameA}과 ${nameB} 두 사람을 구체적으로 비교하며 서술하세요.
- 마크다운 ## 헤딩만 사용하세요 (###, ####는 절대 쓰지 마세요).
- 13개 주제가 감정·애착·소통·갈등·재물·가치관·시너지·결혼·올해 운·조언 등 관계의 다양한 측면을 골고루 다루세요.
- [명리학 근거 필수] 각 주제에서 두 사람의 사주가 어떻게 맞닿거나 충돌하는지 반드시 근거를 자연스럽게 언급하세요. 예: "${nameA}님은 불의 기운이 강한 사주인데, ${nameB}님은 물의 기운을 타고나서 서로 부딪히는 에너지가 있어요", "두 사람의 날 기둥이 서로 힘을 합치는 구조라 이런 부분에서 잘 맞아요". 근거 없이 "잘 맞아요 / 안 맞아요"만 쓰는 것은 금지합니다.

아래 형식을 정확히 따르세요 — 먼저 점수·제목을 출력하고, 이어서 13개 주제를 출력하세요:

## 궁합 점수
[0에서 100 사이 숫자 하나만. 예: 82]

## 궁합 제목
[이 두 사람의 궁합을 시적이고 강렬하게 압축하는 한 줄. 50자 이내. 관계·두 사람 특성 등 구체적 맥락 포함.]

## [시적인 주제 제목 1]

[600자 이상 본문]

## [시적인 주제 제목 2]

[600자 이상 본문]

...이하 13개까지 반복`;

  return { system: SYSTEM_BASE, user };
}

// ─── 부동산 투자 풀이 (realestate — 부동산 중심 단일 호출) ──────────────────
export function buildRealEstateSajuPrompt(input: PromptInput): { system: string; user: string } {
  const ctx = makeContext(input);
  const concern = input.concerns
    .map(c => c.replace(/^\[질문\]\s*/, ""))
    .filter(Boolean)
    .join(" ");

  const user = `${ctx}

---
${concern ? `내담자의 궁금한 점: "${concern}"` : ""}

위 사주 데이터를 바탕으로 부동산 투자 운에 대해 13개 섹션으로 구성된 리포트를 작성하세요.

⚠️ 필수 규칙:
- 섹션 수는 반드시 정확히 13개입니다. 12개도 14개도 안 됩니다. 반드시 딱 13개.
- 각 섹션은 반드시 ## 으로 시작하는 제목 1줄 + 본문으로만 구성합니다. 섹션 안에 소제목(###, **굵은글씨** 등)을 절대 쓰지 마세요.
- 본문은 문단(paragraph)으로만 씁니다. 소제목, 볼드 제목, 리스트 없이 순수 텍스트 문단만 사용하세요.
- 모든 섹션은 부동산·재물·투자 주제에 초점을 맞추세요.
- 섹션 제목은 부동산과 내담자 상황에 맞게 구체적으로 만드세요.
- 전문 용어(천간, 지지, 십성, 재성, 관성 등)는 쓰지 마세요. 꼭 써야 하면 괄호로 쉬운 설명을 붙이세요.
- 친한 선배나 상담사처럼 따뜻하고 자연스러운 말투로 쓰세요.
- 각 섹션 최소 600자 이상, 전체 5,000자 이상 작성하세요.
- [명리학 근거 필수] 각 섹션에서 반드시 사주 데이터 근거를 자연스럽게 본문에 녹이세요. 예: "지금 흘러오는 대운의 기운이 부동산 투자와 잘 맞는 시기예요", "타고난 사주의 재물 기운 구조가 이런 특성을 보여줘요". 단순히 "좋아요 / 안 좋아요"로만 끝내지 마세요.

출력 형식 (반드시 이 구조 그대로):
## [부동산과 내담자 상황에 맞게 직접 만든 섹션 제목 1]

[600자 이상 본문. 소제목 없이 문단으로만.]

## [섹션 제목 2]

[600자 이상 본문. 소제목 없이 문단으로만.]

...이하 반복 (총 13개 섹션, 각 섹션은 ## 제목 + 본문만)
${concern ? "\n위 13개 섹션 안에 내담자의 궁금한 점에 대한 답변을 자연스럽게 녹여서 작성하세요." : ""}`;

  return { system: SYSTEM_BASE, user };
}

// ─── 분할 호출 (레거시 — 현재 미사용) ──────
export function buildSajuPromptMultiParts(input: PromptInput): string[] {
  return [buildWorryPrompt(input).user];
}
