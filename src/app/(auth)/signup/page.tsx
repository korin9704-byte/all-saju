import { redirect } from "next/navigation";

// 카카오 OAuth는 로그인·회원가입이 같은 플로우 — /login 으로 통합
export default function SignupPage() {
  redirect("/login");
}
