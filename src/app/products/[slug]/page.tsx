import React from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { SajuFormNoSSR as SajuForm } from "@/components/saju/SajuFormNoSSR";
import { ReviewList } from "@/components/reviews/ReviewList";
import { formatKRW } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/env";
import { productsSeed } from "@/config/products.seed";

type Product = { id: string; slug: string; name: string; description: string; price: number };
type Review = { id: string; rating: number; content: string; created_at: string };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Product | null;
  let reviews: Review[] | null = null;
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("id, slug, name, description, price")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    product = data;

    if (product) {
      const { data: r } = await supabase
        .from("reviews")
        .select("id, rating, content, created_at")
        .eq("product_id", product.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(5);
      reviews = r;
    }
    user = await getCurrentUser();
  } else {
    const seed = productsSeed.find((p) => p.slug === slug && p.is_active);
    product = seed ? { id: seed.slug, ...seed } : null;
  }

  if (!product) notFound();

  // 더미 리뷰 (실제 리뷰가 없을 때 표시)
  const dummyContents = [
    [5, "생각보다 훨씬 상세하게 나와서 놀랐어요. 제 성격이랑 딱 맞아서 소름 돋았어요 ㅠㅠ 주변에도 추천했어요!"],
    [5, "가격 대비 퀄리티가 너무 좋아요. 막연하게 궁금했던 부분들이 시원하게 정리됐어요. 또 살 것 같아요 😊"],
    [4, "친구 추천으로 봤는데 내용이 꽤 구체적이에요. 연애 부분이 특히 공감 갔어요. 만족합니다!"],
    [5, "올해 운세가 이렇게 잘 맞을 줄 몰랐어요. 직장 관련 내용이 특히 정확해서 깜짝 놀랐어요."],
    [5, "처음엔 반신반의했는데 읽다 보니 너무 공감돼서 눈물이 다 났어요. 강력 추천합니다."],
    [4, "내용이 충실하고 읽기 쉽게 잘 정리돼 있어요. 다음에 대운 해설도 볼 예정이에요!"],
    [5, "사주 봐야지 생각만 하다가 처음 봤는데 이렇게 잘 맞을 줄이야. 앞으로 매년 볼 것 같아요."],
    [5, "제 고민이랑 딱 맞는 내용이 나와서 위로받은 느낌이에요. 좋은 서비스 감사해요 🙏"],
    [4, "전반적으로 만족해요. 다음에 궁합도 보고 싶어요."],
    [5, "이 가격에 이 퀄리티? 진짜 말이 안 되게 잘 나와요. 친구들한테 다 공유했어요."],
    [5, "재미로 봤다가 너무 잘 맞아서 소름 돋았어요. 특히 성격 분석 파트가 신기했어요!"],
    [5, "오래 고민했던 부분에 대한 힌트를 얻은 것 같아요. 읽고 나서 마음이 많이 편해졌어요."],
    [4, "친절하고 이해하기 쉽게 써줘서 좋았어요. 어렵지 않게 읽을 수 있었어요."],
    [5, "매년 보던 사주집보다 훨씬 상세하고 정확해요. 이제 여기서만 볼 것 같아요."],
    [5, "연애운 부분이 너무 공감돼서 친구랑 같이 읽으면서 웃었어요 ㅋㅋ 재밌어요!"],
    [4, "처음 써보는데 만족해요. 내용이 길고 알차네요."],
    [5, "반응이 빠르고 내용도 알찼어요. 주변에 다 추천하고 있어요!"],
    [5, "운세보다 제 성격 분석이 너무 정확해서 놀랐어요. 신기하고 재미있었어요."],
    [4, "좋은 내용이에요. 조금 더 구체적인 조언이 있었으면 했는데, 그래도 전반적으로 만족!"],
    [5, "작년에 이어 올해도 봤어요. 항상 믿고 보는 곳이에요 😊"],
    [5, "남자친구랑 같이 봤는데 둘 다 너무 잘 맞아서 깜짝 놀랐어요. 재밌었어요!"],
    [5, "인생 방향에 대해 많이 고민하고 있었는데 도움이 많이 됐어요. 감사해요."],
    [4, "읽기 쉽고 내용도 좋아요. 이 가격이면 충분히 값어치 해요."],
    [5, "오늘 운세 보려고 시작했다가 다른 상품도 다 봐버렸어요 ㅋㅋ 너무 재밌어요!"],
    [5, "솔직히 사주를 믿는 편은 아닌데 내용이 너무 맞아서 당황했어요. 강추합니다."],
    [5, "글이 따뜻하고 위로가 돼요. 힘든 시기에 읽으니 더 와닿았어요."],
    [4, "전체적으로 만족해요. 다음엔 궁합 해설도 도전해볼게요!"],
    [5, "부모님 선물로 구매했는데 너무 좋아하셨어요. 효도 아이템이에요 😄"],
    [5, "이렇게 자세하게 풀이해줄 줄 몰랐어요. 대박이에요!"],
    [4, "내용이 알차고 도움이 됐어요. 읽는 데 시간이 좀 걸렸지만 그만큼 내용이 많아요."],
    [5, "직장 고민 중이었는데 딱 맞는 내용이 나왔어요. 결정에 큰 도움이 됐어요!"],
    [5, "친구 추천으로 왔다가 완전 팬 됐어요. 이제 정기적으로 볼 것 같아요."],
    [4, "재미있고 공감 가는 내용이 많았어요. 가성비 최고예요!"],
    [5, "불안했던 마음이 읽고 나서 많이 안정됐어요. 좋은 콘텐츠 감사해요."],
    [5, "사주는 처음인데 생각보다 훨씬 잘 나와서 놀랐어요. 또 올게요!"],
    [4, "전반적으로 좋아요. 다만 좀 더 상세한 월별 운세가 있었으면 좋겠어요."],
    [5, "글쓴이가 따뜻한 사람인 것 같아요. 내용도 좋고 글투도 좋아요."],
    [5, "올해 힘든 일이 많았는데 위로가 됐어요. 앞으로도 자주 이용할게요 💪"],
    [5, "지인 추천으로 봤는데 진짜 잘 맞아요. 이렇게 구체적일 줄 몰랐어요."],
    [4, "만족해요! 재미있게 읽었어요. 친구한테도 선물할 예정이에요."],
    [5, "제 사주가 이런 의미였구나 싶어서 신기했어요. 몰랐던 부분을 알게 됐어요."],
    [5, "결혼 앞두고 많이 불안했는데 읽고 나서 용기가 생겼어요. 감사합니다!"],
    [4, "내용이 풍부하고 좋아요. 이 가격에 이 정도면 최고죠!"],
    [5, "재미로 봤는데 너무 정확해서 무섭기도 해요 ㅋㅋㅋ 강력 추천!"],
    [5, "읽는 내내 고개를 끄덕이게 됐어요. 제 이야기 같아서 신기했어요."],
    [4, "좋은 서비스예요. 다음에는 남편 것도 봐줘야겠어요!"],
    [5, "글이 어렵지 않고 술술 읽혀요. 내용도 알차고 완전 만족이에요."],
    [5, "처음엔 반신반의했는데 읽다 보니 너무 맞아서 놀랐어요."],
    [5, "연애운이 딱 제 상황이랑 맞아서 소름 돋았어요. 앞으로도 잘 부탁해요!"],
    [4, "내용이 길고 자세해요. 천천히 읽으면 더 도움이 될 것 같아요."],
    [5, "올해 많은 고민이 있었는데 방향을 잡는 데 도움이 됐어요. 감사해요."],
    [5, "이렇게 정확한 사주 풀이는 처음이에요. 계속 이용할게요!"],
    [4, "전반적으로 만족이에요. 조금 더 긍정적인 조언도 있었으면 했어요."],
    [5, "친구랑 같이 봤는데 둘 다 놀랐어요. 이렇게 잘 맞을 줄이야!"],
    [5, "인생의 흐름을 이해하는 데 도움이 됐어요. 앞으로의 방향이 보이는 것 같아요."],
    [4, "내용이 충실해요. 읽고 나서 마음이 조금 편해진 것 같아요."],
    [5, "이 가격에 이 퀄리티면 완전 이득이에요. 다음에 또 올게요!"],
    [5, "제 성격을 이렇게 잘 표현해줄 줄 몰랐어요. 주변 사람들한테 보여줬더니 다들 맞다고 해요."],
    [4, "재미있게 읽었어요. 몇 가지 놀라운 부분도 있었어요!"],
    [5, "힘든 시기에 읽어서 그런지 더 위로가 됐어요. 감사합니다."],
    [5, "이번이 세 번째인데 항상 만족해요. 믿고 볼 수 있는 곳이에요."],
    [4, "좋아요! 부모님께도 선물해드릴 예정이에요."],
    [5, "제 인생의 흐름이 한눈에 보이는 것 같았어요. 매우 만족해요!"],
    [5, "사주 처음 봤는데 너무 재미있고 도움이 됐어요. 또 볼게요!"],
    [4, "내용 알차고 글도 읽기 쉬워요. 전반적으로 만족해요."],
    [5, "올해 방향을 잡는 데 정말 도움이 됐어요. 감사합니다 🙏"],
    [5, "솔직히 이 가격에 이 정도 퀄리티면 완전 가성비 최고예요."],
    [4, "재미있고 공감 가는 내용 많았어요. 다음에 궁합도 봐야겠어요!"],
    [5, "이렇게 잘 맞을 줄 몰랐어요. 놀랍고 신기해요. 강추합니다!"],
    [5, "글이 따뜻하고 위로가 됐어요. 읽는 내내 마음이 편안해졌어요."],
    [4, "전체적으로 만족이에요. 친구한테 선물로 추천할게요!"],
    [5, "매년 보고 있는데 갈수록 더 잘 나오는 것 같아요. 올해도 만족!"],
    [5, "처음 봤는데 이렇게 정확할 줄은 몰랐어요. 다음에 또 볼게요."],
    [4, "읽기 쉽고 이해하기 편해요. 내용도 풍부하고 좋아요."],
    [5, "연애운 보려고 봤는데 전체 인생 흐름도 이해하게 됐어요. 유익해요!"],
    [5, "고민이 많던 시기에 방향을 잡게 해줘서 감사해요. 정말 큰 도움이 됐어요."],
    [4, "좋은 내용이에요. 조금 더 자세히 알고 싶은 부분은 다른 상품도 봐야겠어요!"],
    [5, "이 정도면 완전 가성비 최고예요. 주변에 다 추천하고 있어요!"],
    [5, "올해 힘든 일들이 많았는데, 이유가 있었다는 걸 알고 나서 마음이 편해졌어요."],
    [4, "재밌게 읽었어요. 인생 흐름을 이해하는 데 도움이 됐어요."],
    [5, "친구가 사줬는데 너무 잘 맞아서 제가 또 샀어요 ㅋㅋ 최고예요!"],
    [5, "어렵지 않게 사주를 이해할 수 있게 설명해줘서 좋아요. 만족해요!"],
    [4, "전반적으로 좋아요. 이 가격에 이 정도면 충분히 값어치 있어요."],
    [5, "내용이 길어서 처음엔 부담스러웠는데, 읽다 보니 시간 가는 줄 몰랐어요."],
    [5, "남자친구 선물로 샀는데 너무 좋아했어요. 커플 추천 아이템이에요 💑"],
    [4, "좋은 서비스예요. 다음에는 대운 해설도 해볼게요!"],
    [5, "이렇게 정확하게 제 성격을 파악할 수 있는 게 신기해요. 완전 추천이에요!"],
    [5, "읽고 나서 제 자신에 대해 더 잘 이해하게 됐어요. 좋은 경험이었어요."],
    [4, "내용이 풍부해요. 시간 여유를 가지고 읽으면 더 좋을 것 같아요!"],
    [5, "올해 목표를 세우는 데 도움이 많이 됐어요. 읽길 잘했어요 😊"],
    [5, "사주가 이렇게 재미있는 줄 몰랐어요. 가족들한테도 선물할 예정이에요!"],
    [4, "좋은 내용이에요. 다음에는 다른 상품도 이용해볼게요."],
    [5, "제 인생에 이런 흐름이 있었구나 싶어서 신기하고 좋았어요. 강추!"],
    [5, "읽으면서 고개를 많이 끄덕였어요. 너무 공감 가는 내용이 많아요."],
    [4, "전반적으로 만족해요. 이 가격에 이 정도면 훌륭해요!"],
    [5, "처음엔 반신반의했는데 읽고 나니 완전 팬이 됐어요. 최고입니다!"],
    [5, "오래 고민했던 부분들에 대한 힌트를 얻었어요. 정말 도움이 됐어요 🙏"],
  ] as const;

  const dummyReviews: Review[] = dummyContents.map(([rating, content], i) => {
    const date = new Date("2026-05-29T00:00:00Z");
    date.setDate(date.getDate() - i);
    return { id: `d${i}`, rating: rating as number, content: content as string, created_at: date.toISOString() };
  });

  const displayReviews = (reviews && reviews.length > 0) ? reviews : dummyReviews;

  // 상품별 하이라이트 색상 (이미지 색상에 맞춤)
  const hlColors: Record<string, string> = {
    "today-fortune": "#ddd6fe",  // 보라
    "premium-saju":  "#bfdbfe",  // 하늘파랑
    "love-saju":     "#fbcfe8",  // 핑크
    "worry-saju":    "#fed7aa",  // 주황
  };
  const hlColor = hlColors[product.slug] ?? "#fde68a";
  const hl = (text: string) => (
    <span className="font-semibold" style={{ background: `linear-gradient(transparent 55%, ${hlColor} 55%)` }}>{text}</span>
  );

  const productDescriptions: Record<string, React.ReactNode[]> = {
    "today-fortune": [
      <>타고난 성격과 기질부터 올해의 운세 흐름까지, 내 사주를 누구나 이해할 수 있는 쉬운 말로 풀어드려요. 한자나 전문 용어 없이, 읽는 순간 '이게 나잖아' 싶은 느낌이 드실 거예요. 직업·재물·연애·건강·인간관계까지 삶 전반을 한눈에 살펴보고, 유리한 시기와 조심해야 할 시기는 언제인지 구체적으로 안내해드려요. 단순한 운세 풀이가 아닌, 내 삶의 패턴과 타고난 강점, 반복되는 시련의 이유까지 함께 짚어드리니, 나를 더 깊이 이해하고 싶은 모든 분께 강력 추천드려요.</>,
    ],
    "premium-saju": [
      <>다가올 10년 대운의 흐름을 연도별로 상세히 분석해드려요. 인생에는 치고 나가야 할 때와 조용히 준비해야 할 때가 분명히 따로 있어요. 많은 사람들이 이걸 모르고 쉬어야 할 때 무리하다가 기회를 놓쳐요. 에너지를 써야 할 시기와 기다려야 할 시기를 현명하게 선택하고, 앞으로 어떤 파도가 오는지 미리 알고 준비하면 같은 상황에서도 결과가 달라질 수 있어요. 이직·창업·결혼·투자 등 중요한 결정을 앞두고 있다면 꼭 확인해보세요.</>,
    ],
    "love-saju": [
      <>두 사람의 사주를 나란히 놓고 궁합 점수와 함께 감정·소통·갈등·가치관·결혼 궁합까지 13가지 주제로 꼼꼼히 분석해요. 단순한 점수가 아닌, 두 사람 사이에서 실제로 일어나는 일들을 사주로 풀어드려요. 왜 자꾸 같은 패턴의 갈등이 반복되는지, 잘 맞는 부분과 보완이 필요한 부분은 어디인지 짚고, 함께 더 행복해질 수 있는 방향까지 안내해드릴게요. 연인·부부·짝사랑·친구·가족 모두 가능해요.</>,
    ],
    "worry-saju": [
      <>연애·직장·돈·관계 등 어떤 질문이든 내 사주와 연결해 구체적으로 답해드려요. 깊은 고민일 수도, 문득 떠오른 궁금증일 수도 있어요. 거창하지 않아도 괜찮아요. 왜 이런 상황이 생겼는지 맥락부터 짚고, 지금 내가 어떤 시기에 있는지 이해하면 같은 상황도 다르게 보여요. 내 사주에 맞는 맞춤형 해설로 방향을 잡아드릴게요. 질문을 구체적으로 적어주실수록 더 정확한 답변을 드릴 수 있어요.</>,
    ],
  };

  return (
    <div className="container py-12 max-w-lg">
      <header className="mb-10 pb-10 border-b border-hairline">
        <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
        {product.description && (
          <p className="mt-2 text-sm text-body">{product.description}</p>
        )}
        <p className="mt-5 text-2xl font-mono font-medium text-ink">{formatKRW(product.price)}</p>
      </header>

      {/* 상품 소개 — today-fortune */}
      {product.slug === "today-fortune" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/today-fortune.png" alt="사주 해설" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — premium-saju */}
      {product.slug === "premium-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/premium-saju.png" alt="대운 해설" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — love-saju */}
      {product.slug === "love-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/love-saju.png" alt="궁합 해설" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 상품 소개 — worry-saju */}
      {product.slug === "worry-saju" && (
        <div className="mb-10 rounded-3xl overflow-hidden border-2 border-[#eeeeee] shadow-sm">
          <div className="w-full aspect-[962/663] overflow-hidden">
            <img src="/images/worry-saju.png" alt="무엇이든 물어보세요" className="w-full h-full object-cover" />
          </div>
        </div>
      )}



      {/* 상품 설명 */}
      {productDescriptions[product.slug] && (
        <div className="mb-8 space-y-3 text-lg text-ink leading-relaxed">
          {productDescriptions[product.slug].map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {/* 리뷰 섹션 */}
      {displayReviews.length > 0 && (
        <ReviewList reviews={displayReviews} />
      )}

      {/* 후기 → 입력폼 귀여운 구분선 */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#e0d6cc]" />
        <span className="text-base tracking-widest select-none">🐾 ✦ 🐾</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#e0d6cc]" />
      </div>

      <section className="mt-2">
        <SajuForm productId={product.id} productSlug={product.slug} isLoggedIn={!!user} />
      </section>
    </div>
  );
}
