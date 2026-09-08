// 로그인·회원가입 통합 — /signup 은 /login 으로 리다이렉트
import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login");
}
