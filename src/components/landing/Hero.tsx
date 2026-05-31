import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="w-full bg-[#F9F8F5] py-24 md:py-32 text-center">
      <div className="container">
        {/* 메인 헤드라인 */}
        <h1 className="text-[36px] md:text-[52px] font-semibold tracking-tight leading-[1.15] text-ink">
          {siteConfig.tagline}
        </h1>

        {/* 서브 카피 */}
        <p className="mt-5 text-[15px] text-body tracking-wide">
          {siteConfig.description}
        </p>

        {/* 버튼 */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/products" className={cn(buttonVariants({ size: "lg" }))}>
            상품 보기
          </Link>
          <Link href="#how-it-works" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            이용 안내
          </Link>
        </div>

      </div>
    </section>
  );
}
