import { z } from "zod";

/** "YYYY-MM-DD" 문자열이 실제 존재하는 날짜인지 (1900년~올해) */
export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1900 || y > new Date().getFullYear()) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** 생년월일 zod 스키마 (형식 + 실제 날짜 유효성) */
export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isValidBirthDate, "올바른 생년월일이 아닙니다");
