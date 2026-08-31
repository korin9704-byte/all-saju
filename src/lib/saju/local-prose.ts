// =====================================================
// 로컬 만세력 해설 문장 — 자체 작성 템플릿
// =====================================================
// luckyloveme 응답의 해설(prose) 슬롯을 같은 구조로 채운다.
// 외부 저작물을 복사하지 않고 전부 자체 문구를 쓴다 (저작권).
// 사실 계산은 local-analysis, 응답 형태는 local-adapter 담당 —
// 이 파일은 "유한 슬롯 × 자체 문장" 테이블과 템플릿 함수만 갖는다.

import { naegyeokStemPick, type LocalAnalysis } from "@/lib/saju/local-analysis";
import type { LocalGanji } from "@/lib/saju/local-ganji";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── 공용 소테이블 ────────────────────────────────────
const POSITION_AREA: Record<string, string> = {
  년간: "초년과 조상·가문의 기운", 년지: "초년의 환경과 뿌리",
  월간: "청년기와 사회 활동", 월지: "직업과 사회적 기반",
  일간: "자기 자신", 일지: "배우자와 중년의 삶",
  시간: "말년과 자녀와의 인연", 시지: "노후와 미래의 기반",
};
const AREA_SHORT: Record<string, string> = {
  년주: "조상·가문·초년 기반", 월주: "직업·커리어·사회적 역할",
  일주: "자아·배우자·가정", 시주: "자녀·노후·미래 계획",
};

// ── 십성 ────────────────────────────────────────────
/** 정/편 구분 */
export const SIPSEONG_TYPE: Record<string, string> = {
  비견: "정", 겁재: "편", 식신: "정", 상관: "편",
  정재: "정", 편재: "편", 정관: "정", 편관: "편", 정인: "정", 편인: "편",
};
const SIPSEONG_TRAIT: Record<string, string> = {
  비견: "독립심과 자기 주관이 뚜렷하고, 동료와 어깨를 나란히 하는 힘",
  겁재: "승부욕과 추진력이 강하고, 경쟁 속에서 성장하는 힘",
  식신: "표현력과 여유가 있어 의식주가 넉넉해지는 힘",
  상관: "재기와 창의성이 번뜩이되 틀을 깨려는 힘",
  정재: "성실하게 모으고 관리하는 안정적인 재물의 힘",
  편재: "크게 벌고 크게 쓰는 활동적인 재물의 힘",
  정관: "질서를 지키고 명예를 얻는 반듯한 힘",
  편관: "압박을 견디며 권위를 세우는 강한 힘",
  정인: "배움과 보살핌을 받는 따뜻한 학문의 힘",
  편인: "직관과 특수한 재능, 남다른 사고의 힘",
};
export function sipseongMeaning(position: string, sipseong: string): string {
  return `${POSITION_AREA[position] ?? position}에 ${SIPSEONG_TRAIT[sipseong] ?? sipseong}이 자리합니다.`;
}
const CAT_LABEL: Record<string, string> = { bigyeop: "비겁", siksang: "식상", jaeseong: "재성", gwanseong: "관성", inseong: "인성" };
const CAT_THEME: Record<string, string> = {
  비겁: "자립심과 동료 인연이 두드러져 스스로 개척하는 삶의 색이 짙습니다",
  식상: "표현·재능·활동의 기운이 왕성해 만들어내고 보여주는 일에 강합니다",
  재성: "재물과 현실 감각의 기운이 왕성해 실리를 챙기는 힘이 좋습니다",
  관성: "책임·명예·조직의 기운이 강해 규율 속에서 성취하는 형입니다",
  인성: "학문·지원·보호의 기운이 든든해 배우고 도움받는 복이 있습니다",
};
export function sipseongAnalysis(summary: Record<string, number>): string {
  const entries = Object.entries(summary).map(([k, v]) => [CAT_LABEL[k] ?? k, v] as [string, number]);
  const max = Math.max(...entries.map(([, v]) => v));
  const tops = entries.filter(([, v]) => v === max && max > 0).map(([k]) => k);
  const zero = entries.filter(([, v]) => v === 0).map(([k]) => k);
  const parts = [
    `십성 분포는 ${entries.map(([k, v]) => `${k} ${v}개`).join(", ")}입니다.`,
    tops.length ? `${tops.join("·")}이 가장 많아 ${CAT_THEME[tops[0]]}.` : "",
    zero.length ? `${zero.join("·")}은 원국에 드러나지 않아 해당 영역은 운에서 보완될 때 살아납니다.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}

// ── 12운성 ──────────────────────────────────────────
export const TWELVE_FORTUNE_INTERP: Record<string, {
  keyword: string; energy: string; personality: string[]; strengths: string[]; weaknesses: string[]; career: string;
}> = {
  장생: { keyword: "새싹", energy: "갓 태어난 생명처럼 맑고 순수하게 뻗어가는 기운",
    personality: ["순수하고 배움이 빠름", "사람들의 호감을 삽"], strengths: ["성장 잠재력", "원만한 인간관계"],
    weaknesses: ["경험 부족", "의존적일 수 있음"], career: "교육·연구·기획 등 성장형 분야" },
  목욕: { keyword: "멋내기", energy: "씻고 다듬는 시기의 감수성 예민하고 변화 많은 기운",
    personality: ["감각적이고 유행에 밝음", "호기심과 끼가 많음"], strengths: ["미적 감각", "적응력"],
    weaknesses: ["변덕", "구설수 주의"], career: "예술·미용·패션·엔터테인먼트" },
  관대: { keyword: "예복", energy: "관복을 입고 세상에 나서는 당당하고 패기 있는 기운",
    personality: ["자존심이 강하고 진취적", "명예를 중시"], strengths: ["추진력", "리더십"],
    weaknesses: ["융통성 부족", "독선 주의"], career: "행정·법조·군경 등 제복·직위 분야" },
  건록: { keyword: "녹봉", energy: "제 몫의 녹을 받는 자립과 실속의 안정된 기운",
    personality: ["성실하고 자수성가형", "책임감이 강함"], strengths: ["꾸준함", "경제적 자립"],
    weaknesses: ["고지식함", "융통성 부족"], career: "전문직·공직·안정적 조직" },
  제왕: { keyword: "정상", energy: "산꼭대기에 오른 가장 왕성하고 강력한 기운",
    personality: ["카리스마와 승부욕", "지는 것을 싫어함"], strengths: ["강한 실행력", "통솔력"],
    weaknesses: ["독주·과욕 주의", "꺾이면 크게 낙심"], career: "경영·정치·개척 분야" },
  쇠: { keyword: "노련함", energy: "정점을 지나 한 발 물러선 원숙하고 온화한 기운",
    personality: ["신중하고 원만함", "경험을 살리는 형"], strengths: ["안정감", "조언자 역할"],
    weaknesses: ["소극적", "추진력 약화"], career: "자문·관리·중재 분야" },
  병: { keyword: "감성", energy: "몸은 쉬어가나 마음은 깊어지는 사색의 기운",
    personality: ["다정다감하고 공감력 높음", "생각이 많음"], strengths: ["섬세함", "돌봄의 재능"],
    weaknesses: ["체력·의지 저하", "우유부단"], career: "의료·상담·복지·종교" },
  사: { keyword: "몰입", energy: "움직임을 멈추고 한 가지에 깊이 파고드는 기운",
    personality: ["진지하고 한 우물을 팜", "정신세계가 깊음"], strengths: ["집중력", "전문성"],
    weaknesses: ["활동성 부족", "비관 주의"], career: "연구·학문·기술 전문 분야" },
  묘: { keyword: "창고", energy: "거두어 저장하는 알뜰하고 침착한 기운",
    personality: ["절약형이고 침착함", "속을 잘 드러내지 않음"], strengths: ["저축·관리 능력", "인내심"],
    weaknesses: ["폐쇄적", "답답해 보일 수 있음"], career: "금융·관리·부동산" },
  절: { keyword: "리셋", energy: "끊어진 자리에서 다시 시작하는 극단의 전환 기운",
    personality: ["감정 기복이 있으나 회복이 빠름", "새로움을 좇음"], strengths: ["재기 능력", "유연한 전환"],
    weaknesses: ["끈기 부족", "귀가 얇음"], career: "변화가 잦은 유통·영업·프리랜서" },
  태: { keyword: "잉태", energy: "새 생명이 깃드는 희망과 구상의 기운",
    personality: ["낙천적이고 아이디어가 많음", "보호받는 형"], strengths: ["기획력", "밝은 에너지"],
    weaknesses: ["실행력 부족", "현실감 부족"], career: "기획·창작·스타트업 초기 단계" },
  양: { keyword: "양육", energy: "자라나는 것을 기르고 물려받는 안정된 기운",
    personality: ["온화하고 낙천적", "상속·계승 인연"], strengths: ["포용력", "안정 지향"],
    weaknesses: ["안주하려는 경향", "박력 부족"], career: "교육·양육·가업 계승" },
};

// ── 신강/신약 ────────────────────────────────────────
export function sinStrengthAnalysis(st: LocalAnalysis["sinStrength"]): string {
  if (st.isStrong) {
    return "신강(身强)한 사주로 일간의 힘이 넉넉합니다. 주관이 뚜렷하고 외부 환경에 쉽게 흔들리지 않으며, " +
      "스스로 결정하고 밀고 나가는 추진력이 장점입니다. 다만 힘이 넘치는 만큼 고집으로 비칠 수 있어, " +
      "식상·재성처럼 힘을 흘려보낼 출구를 만들 때 성취가 커집니다.";
  }
  if (st.level >= 3) {
    return "중화에 가까운 사주로 일간의 힘이 치우치지 않았습니다. 상황에 따라 밀고 당길 줄 아는 균형 감각이 있어 " +
      "극단적인 운의 흔들림이 적은 편입니다. 운의 흐름을 타면 강점이 자연스럽게 드러납니다.";
  }
  return "신약(身弱)한 사주로 일간이 주변 기운의 영향을 크게 받습니다. 섬세하고 유연하며 협력 속에서 힘을 내는 형입니다. " +
    "인성·비겁처럼 나를 돕는 기운이 들어올 때 크게 도약하니, 좋은 사람과 환경을 곁에 두는 것이 곧 개운법입니다.";
}
export function sinStrengthQualitative(st: LocalAnalysis["sinStrength"]): { type: string; analysis: string } {
  const helpers = st.bigyeopCount + st.inseongCount;
  if (st.isStrong && st.deukryeong) {
    return { type: "뿌리 깊은 신강", analysis: "월령을 얻고 세력도 갖춰 안팎이 모두 단단합니다. 위기에도 중심이 흔들리지 않는 대신, 남의 말을 흘려듣지 않는 유연함이 과제입니다." };
  }
  if (st.isStrong && !st.deukryeong) {
    return { type: "외강내유(外强內柔)", analysis: "겉으로는 힘 있고 당당하지만 월령의 뿌리가 약해 내면은 의외로 여립니다. 동료와 지지자의 존재가 힘의 원천이므로 관계를 소중히 할수록 강해집니다." };
  }
  if (!st.isStrong && st.deukryeong) {
    return { type: "외유내강(外柔內剛)", analysis: "드러나는 세력은 크지 않아도 월령의 뿌리가 있어 심지가 굳습니다. 조용히 버티다 때가 오면 제 몫을 해내는 형입니다." };
  }
  if (helpers === 0) {
    return { type: "진신약(眞身弱)", analysis: "나를 돕는 글자가 원국에 거의 없어 흐름에 순응하는 것이 지혜입니다. 주변의 힘을 빌리고 운을 기다리는 유연함이 최고의 전략입니다." };
  }
  return { type: "내실형 중화", analysis: "화려하진 않아도 필요한 기운이 고루 있어 실속이 있습니다. 큰 욕심보다 꾸준함으로 성취를 쌓는 형입니다." };
}

// ── 격국 (내격 상세) ─────────────────────────────────
const NAEGYEOK_DETAIL: Record<string, { description: string; characteristics: string[] }> = {
  "식신격(食神格)": { description: "월지의 기운이 식신이라 의식주가 넉넉하고 온화한 격입니다.",
    characteristics: ["낙천적이고 여유로운 성품", "먹을 복과 재능 복", "창작·교육·요식 분야 적성", "베풀수록 커지는 복"] },
  "상관격(傷官格)": { description: "월지의 기운이 상관이라 재주가 번뜩이고 표현이 거침없는 격입니다.",
    characteristics: ["창의적이고 언변이 뛰어남", "기존 질서에 도전", "예술·기술·방송 적성", "윗사람과의 마찰 주의"] },
  "편재격(偏財格)": { description: "월지의 기운이 편재라 큰 재물을 다루는 활동적인 격입니다.",
    characteristics: ["사교적이고 스케일이 큼", "유통·무역·투자 적성", "돈이 크게 돌고 큼", "지출 관리가 관건"] },
  "정재격(正財格)": { description: "월지의 기운이 정재라 성실하게 모으는 안정적인 격입니다.",
    characteristics: ["근면하고 계획적", "저축·관리 능력", "안정적 직장 적성", "지나친 신중함 주의"] },
  "편관격(偏官格)/칠살격": { description: "월지의 기운이 편관이라 압박 속에서 단련되는 강한 격입니다.",
    characteristics: ["승부 근성과 통솔력", "위기에 강함", "군경·스포츠·특수직 적성", "과로와 대인 긴장 주의"] },
  "정관격(正官格)": { description: "월지의 기운이 정관이라 반듯하고 명예를 중시하는 격입니다.",
    characteristics: ["단정하고 모범적", "신용이 자산", "공직·대기업 적성", "체면 손상에 민감"] },
  "편인격(偏印格)/효신격": { description: "월지의 기운이 편인이라 직관과 특수 재능이 빛나는 격입니다.",
    characteristics: ["독창적 사고", "한 분야 깊은 몰입", "의술·역술·기술·예술 적성", "변덕과 고독감 주의"] },
  "정인격(正印格)": { description: "월지의 기운이 정인이라 학문과 인덕이 든든한 격입니다.",
    characteristics: ["배움 복과 어른 복", "인자하고 덕이 있음", "교육·연구·문서 분야 적성", "현실 감각 보완 필요"] },
  "건록격(建祿格)": { description: "월지가 일간의 뿌리가 되어 자수성가하는 격입니다.",
    characteristics: ["독립심과 자존심이 강함", "제 힘으로 일어섬", "전문직·자영업 적성", "분배와 협력이 과제"] },
  "월겁격(月劫格)": { description: "월지의 기운이 겁재라 경쟁 속에서 크는 격입니다.",
    characteristics: ["승부욕과 행동력", "재물 욕구가 강함", "영업·스포츠·경쟁 분야 적성", "동업·보증 주의"] },
  "양인격(羊刃格)": { description: "월지가 양인이라 칼날 같은 힘을 품은 강렬한 격입니다.",
    characteristics: ["결단력과 돌파력", "큰일을 감당하는 그릇", "의료·군경·기술 적성", "힘의 방향 관리가 관건"] },
};
export function naegeokDetail(ganji: LocalGanji, dayGan: string, gyeokguk: LocalAnalysis["gyeokguk"]): any {
  if (gyeokguk.type !== "내격") return null;
  const pick = naegyeokStemPick(ganji, dayGan);
  const detail = NAEGYEOK_DETAIL[gyeokguk.name];
  const 격근거 = pick.isWangji && !pick.tugan
    ? `사왕지(${ganji.month.ji})는 투출이 없어도 본기(${pick.bongi})로 격을 정함`
    : pick.tugan
      ? `월지 ${ganji.month.ji}의 ${pick.grade}(${pick.pickStem})이 천간에 투출`
      : `투출 없음 — 월지 ${ganji.month.ji}의 본기(${pick.bongi})로 격 결정`;
  return {
    type: gyeokguk.name.split("(")[0], name: gyeokguk.name,
    sipsin: pick.monthSipseong,
    description: detail?.description ?? gyeokguk.reason,
    characteristics: detail?.characteristics ?? [],
    투출여부: pick.tugan, 격근거,
  };
}

// ── 귀인 · 신살 ─────────────────────────────────────
export const GUIIN_DESC: Record<string, string> = {
  cheoneul: "천을귀인 — 가장 귀한 별. 위기 때 귀인이 나타나 도와줍니다.",
  taegeuk: "태극귀인 — 시작과 끝을 관장하는 복덕. 큰 성취의 바탕이 됩니다.",
  cheondeok: "천덕귀인 — 하늘의 덕. 재난이 비껴가고 인덕이 따릅니다.",
  woldeok: "월덕귀인 — 달의 덕. 마음이 어질고 주변의 보살핌을 받습니다.",
  munchang: "문창귀인 — 학문의 별. 글재주와 시험 운이 좋습니다.",
  mungok: "문곡귀인 — 예술적 감성의 별. 표현과 창작에 재능이 있습니다.",
  hakdang: "학당귀인 — 배움의 별. 학업과 연구에서 두각을 나타냅니다.",
  bokseong: "복성귀인 — 타고난 복록. 의식주 걱정이 덜한 별입니다.",
  cheonju: "천주귀인 — 먹을 복의 별. 식복과 급여 운이 따릅니다.",
  cheongwan: "천관귀인 — 벼슬의 별. 공직·직위 운이 좋습니다.",
  cheonbok: "천복귀인 — 복이 두터운 별. 어려움이 와도 복으로 풀립니다.",
  geumyeo: "금여 — 황금 수레. 배우자 복과 품위 있는 인연의 별입니다.",
  yuha: "유하 — 물가의 버들. 감성과 인기의 별입니다.",
  jaego: "재고귀인 — 재물 창고. 모아둔 재산이 쌓이는 별입니다.",
  rok: "건록 — 녹봉의 자리. 노력한 만큼 안정적으로 거둡니다.",
  amrok: "암록 — 숨은 녹. 보이지 않는 곳에서 도움이 옵니다.",
};
export const SINSAL_MEANING: Record<string, string> = {
  도화: "도화살 — 사람을 끄는 매력. 인기와 이성 인연이 따르나 구설도 함께 옵니다.",
  홍염: "홍염살 — 은근한 색기와 매력. 예술적 감성으로 쓰면 큰 자산입니다.",
  화개: "화개살 — 예술과 종교·정신세계의 별. 고독 속에서 깊어집니다.",
};
export const SIBISINSAL_DESC: Record<string, string> = {
  겁살: "겁살 — 빼앗기는 기운. 재물·건강 관리에 미리 대비하면 액이 줄어듭니다.",
  재살: "재살 — 수옥살. 관재구설을 조심하고 다툼은 문서로 남기는 것이 좋습니다.",
  천살: "천살 — 하늘이 내리는 시련. 겸손함이 최고의 방패입니다.",
  지살: "지살 — 이동과 변동의 별. 이사·여행·전근 등 움직임이 잦습니다.",
  년살: "년살 — 도화의 기운. 꾸미고 드러내는 일에 강합니다.",
  월살: "월살 — 고초살. 메마른 시기를 버티는 인내가 필요합니다.",
  망신살: "망신살 — 체면 손상 주의. 드러나기 전에 스스로 정리하는 지혜가 필요합니다.",
  장성살: "장성살 — 장군의 별. 통솔력과 승진 운이 따릅니다.",
  반안살: "반안살 — 말안장의 별. 출세와 안정을 함께 얻습니다.",
  역마살: "역마살 — 움직여야 사는 별. 이동·해외·운수 분야와 인연이 깊습니다.",
  육해살: "육해살 — 은근한 방해. 건강과 잔병을 살피는 것이 우선입니다.",
  화개살: "화개살 — 재능을 덮었다 다시 펴는 별. 학문·예술·수행에 깊이가 있습니다.",
};

// ── 비견/겁재 ────────────────────────────────────────
export function bigyeonGeobjaeMeaning(kind: "비견" | "겁재", position: string): string {
  const area = POSITION_AREA[position] ?? position;
  return kind === "비견"
    ? `${area}에 비견 — 대등한 동료의 기운. 협력하면 힘이 배가되나 몫은 분명히 나누는 것이 좋습니다.`
    : `${area}에 겁재 — 경쟁자의 기운. 승부처에서는 강하지만 금전 거래·동업은 신중해야 합니다.`;
}
export function bigyeonGeobjaeAnalysis(bigyeonCount: number, geobjaeCount: number): string {
  const total = bigyeonCount + geobjaeCount;
  if (total === 0) return "원국에 비견·겁재가 드러나지 않아 독자 노선보다 조직과 시스템의 힘을 빌리는 것이 유리합니다.";
  if (total >= 3) return `비견 ${bigyeonCount}개·겁재 ${geobjaeCount}개로 어깨를 겨루는 기운이 강합니다. 자립심이 남다르지만 재물이 분산되기 쉬워, 내 몫의 경계를 분명히 하는 것이 재물 관리의 핵심입니다.`;
  return `비견 ${bigyeonCount}개·겁재 ${geobjaeCount}개 — 적당한 자립심과 협력 감각을 함께 갖췄습니다.`;
}

// ── 세운/월운 해석 ───────────────────────────────────
const SS_UN_THEME: Record<string, string> = {
  비견: "내 페이스를 지키며 동료와 나란히 가는", 겁재: "경쟁이 붙지만 그만큼 승부욕이 살아나는",
  식신: "하고 싶은 일과 의식주가 풍성해지는", 상관: "끼와 아이디어가 터져 나오는",
  편재: "큰돈이 오가고 활동 반경이 넓어지는", 정재: "차곡차곡 모이는 실속의",
  편관: "책임과 압박이 커지는 만큼 단련되는", 정관: "지위와 명예가 정돈되는",
  편인: "공부와 직관이 깊어지는", 정인: "배움과 귀인의 도움이 따르는",
};
const VERDICT_LINE: Record<string, string> = {
  대길: "용신의 기운이 크게 들어와 밀어붙일수록 성과가 나는 때입니다.",
  소길: "순풍이 부는 때이니 준비한 일을 차분히 진행하기 좋습니다.",
  평: "큰 굴곡 없는 평탄한 흐름 — 내실을 다지기에 알맞습니다.",
  소흉: "기신의 기운이 스치니 무리한 확장보다 점검과 관리가 우선입니다.",
  대흉: "역풍이 강한 때이니 큰 결정은 미루고 지키는 데 집중하는 것이 상책입니다.",
};
export function unInterpretation(kind: "해" | "달", ssGan: string, fortune: string | undefined, verdict: string): string {
  const theme = SS_UN_THEME[ssGan] ?? "";
  const f = fortune ? TWELVE_FORTUNE_INTERP[fortune] : undefined;
  return `${theme} ${kind}입니다.` +
    (f ? ` 12운성으로는 ${fortune}(${f.keyword}) — ${f.energy}이 흐릅니다.` : "") +
    ` ${VERDICT_LINE[verdict] ?? ""}`;
}

// ── 천간합 (사실 위주 구조 재현) ──────────────────────
const CHEONGAN_HAP: [string, string, string][] = [
  ["갑", "기", "토"], ["을", "경", "금"], ["병", "신", "수"], ["정", "임", "목"], ["무", "계", "화"],
];
const GAN_ELEM: Record<string, string> = { 갑: "목", 을: "목", 병: "화", 정: "화", 무: "토", 기: "토", 경: "금", 신: "금", 임: "수", 계: "수" };
const JI_ELEM: Record<string, string> = { 자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수" };
const SAENG: Record<string, string> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
export function cheonganHapInfo(ganji: LocalGanji): any {
  const pillars: [string, string][] = [["년주", "year"], ["월주", "month"], ["일주", "day"], ["시주", "hour"]];
  const haps: any[] = [];
  // API 실측: 인접 기둥(년-월, 월-일, 일-시)의 합만 기록한다
  for (let i = 0; i + 1 < pillars.length; i++) {
    const [pos1, k1] = pillars[i], [pos2, k2] = pillars[i + 1];
    const p1 = (ganji as any)[k1], p2 = (ganji as any)[k2];
    if (!p1 || !p2) continue;
    const hap = CHEONGAN_HAP.find(([x, y]) => (x === p1.gan && y === p2.gan) || (x === p2.gan && y === p1.gan));
    if (!hap) continue;
    const he = hap[2];
    const monthElem = JI_ELEM[ganji.month.ji];
    haps.push({
      position1: pos1, gan1: p1.gan, position2: pos2, gan2: p2.gan,
      hapType: `${p1.gan}${p2.gan}합`, resultElement: he,
      isAdjacent: true,
      isHaphwa: false, // 십성 계산은 무변환 (실측 — 합화 성립 케이스가 드묾)
      seasonalSupport: monthElem === he || SAENG[monthElem] === he,
      meaning: `${pos1} ${p1.gan}과 ${pos2} ${p2.gan}이 천간합(${he}) — 서로 끌어당겨 묶이는 인연의 기운입니다.`,
    });
  }
  // 오행 분포 (합화 미적용이므로 전후 동일)
  const count: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const [, k] of pillars) {
    const p = (ganji as any)[k]; if (!p) continue;
    count[GAN_ELEM[p.gan]]++; count[JI_ELEM[p.ji]]++;
  }
  return {
    haps, hasAnyHap: haps.length > 0, hasAnyHaphwa: false,
    ohaengImpact: { originalCount: { ...count }, afterHapCount: { ...count } },
  };
}

// ── 대운 메타 ────────────────────────────────────────
const GAN_YANG: Record<string, boolean> = { 갑: true, 을: false, 병: true, 정: false, 무: true, 기: false, 경: true, 신: false, 임: true, 계: false };
export function daeunMeta(
  input: { birthDate: string; birthTime: string | null; timeUnknown: boolean; calendar: string; gender: string },
  ganji: LocalGanji,
): any {
  const [y, m, d] = input.birthDate.split("-").map((v) => parseInt(v, 10));
  const hasTime = !input.timeUnknown && !!input.birthTime;
  const [hh, mm] = hasTime ? input.birthTime!.split(":").map((v) => parseInt(v, 10)) : [null, null];
  return {
    calculation_method: "절기 기준 — 생일과 절입일의 차이를 3으로 나눠 대운수를 정하는 전통 방식",
    birth_info: { year: y, month: m, day: d, hour: hh, minute: mm, gender: input.gender, calendar_type: input.calendar === "lunar" ? "음력" : "양력" },
    year_gan: ganji.year.gan, year_ji: ganji.year.ji, year_ganji: `${ganji.year.gan}${ganji.year.ji}`,
    is_yang_gan: GAN_YANG[ganji.year.gan],
    month_gan: ganji.month.gan, month_ji: ganji.month.ji, month_pillar: `${ganji.month.gan}${ganji.month.ji}`,
  };
}

// 위치 영역 라벨 (운 합충 meaning 보강용)
export function areaOf(position: string): string {
  return AREA_SHORT[position] ?? position;
}

// ── 12운성 보강 필드 (relationship / advice / level) ──
export const TWELVE_FORTUNE_EXTRA: Record<string, { relationship: string; advice: string; level: string }> = {
  장생: { relationship: "순수한 매력으로 좋은 인연이 이어집니다.", advice: "배움의 기회를 놓치지 말고 멘토를 곁에 두세요.", level: "길" },
  목욕: { relationship: "인기가 많은 만큼 감정 기복이 인연을 흔들 수 있습니다.", advice: "끼를 일과 예술로 흘려보내면 구설이 재능이 됩니다.", level: "중" },
  관대: { relationship: "당당한 모습에 끌리는 인연이 많으나 고집 조절이 필요합니다.", advice: "명분이 서는 무대에 서면 실력이 배로 빛납니다.", level: "길" },
  건록: { relationship: "믿음직한 모습이 매력 — 실속 있는 인연이 맺어집니다.", advice: "꾸준함이 최고의 무기이니 조급해하지 마세요.", level: "길" },
  제왕: { relationship: "주도하려는 기질이 강해 대등한 관계 맺기가 과제입니다.", advice: "정상에서는 내려오는 길을 함께 설계해야 오래갑니다.", level: "길" },
  쇠: { relationship: "편안하고 어른스러운 매력으로 신뢰를 얻습니다.", advice: "물러날 때를 아는 것이 이 운성의 지혜입니다.", level: "중" },
  병: { relationship: "다정함이 매력이지만 마음을 쓰다 지치기 쉽습니다.", advice: "남을 돌보는 만큼 자기 몸을 먼저 챙기세요.", level: "중" },
  사: { relationship: "깊고 진지한 인연을 선호하며 얕은 관계는 오래가지 않습니다.", advice: "한 분야에 몰입할 때 가장 큰 힘이 나옵니다.", level: "중" },
  묘: { relationship: "속정은 깊지만 표현이 서툴러 오해가 생길 수 있습니다.", advice: "모으는 재주를 살리되 마음은 열어 두세요.", level: "중" },
  절: { relationship: "정에 약해 쉽게 마음을 주니 사람을 천천히 확인하세요.", advice: "끊어진 자리가 새 출발점 — 전환기를 두려워하지 마세요.", level: "흉" },
  태: { relationship: "보호해 주는 인연과 잘 맞고 밝은 기운이 매력입니다.", advice: "구상을 실행으로 옮기는 작은 습관을 만드세요.", level: "중" },
  양: { relationship: "가정적이고 포용력 있는 인연 운입니다.", advice: "물려받은 것을 지키는 힘이 곧 개척의 밑천입니다.", level: "길" },
};
export function iljiAnalysisOf(fortune: string): string {
  const f = TWELVE_FORTUNE_INTERP[fortune];
  const e = TWELVE_FORTUNE_EXTRA[fortune];
  if (!f) return "";
  return `일지에 ${fortune}이 있습니다. ${f.energy}이 삶의 바탕에 흐릅니다.\n\n` +
    `[성격 특성] ${f.personality.join(", ")}\n\n[강점] ${f.strengths.join(", ")}\n\n` +
    `[약점/주의점] ${f.weaknesses.join(", ")}\n\n[조언] ${e?.advice ?? ""}`;
}

// ── 역마 상세 (12신살 파생 — 사실 계산) ────────────────
const SAMHAP_GROUP: Record<string, string> = {
  신: "수", 자: "수", 진: "수", 인: "화", 오: "화", 술: "화",
  사: "금", 유: "금", 축: "금", 해: "목", 묘: "목", 미: "목",
};
const YEOKMA_TARGET: Record<string, string> = { 수: "인", 화: "신", 금: "해", 목: "사" }; // 삼합 첫 글자를 충하는 지지
export function yeokmaDetail(ganji: LocalGanji): any {
  const jis: [string, string][] = ([["연지", "year"], ["월지", "month"], ["일지", "day"], ["시지", "hour"]] as [string, string][])
    .filter(([, k]) => (ganji as any)[k])
    .map(([pos, k]) => [pos, (ganji as any)[k].ji]);
  const by = (baseLabel: string, baseBranch: string) => {
    const target = YEOKMA_TARGET[SAMHAP_GROUP[baseBranch]];
    const found = jis.filter(([pos, ji]) => ji === target && pos !== baseLabel).map(([pos]) => pos);
    return { base: baseLabel, baseBranch, targetBranch: target, foundPositions: found, formed: found.length > 0 };
  };
  const byYear = by("연지", ganji.year.ji);
  const byDay = by("일지", ganji.day.ji);
  const positions = [...new Set([...byYear.foundPositions, ...byDay.foundPositions])];
  return {
    formed: byYear.formed || byDay.formed,
    byYear, byDay,
    occurrenceCount: positions.length, positions,
  };
}
