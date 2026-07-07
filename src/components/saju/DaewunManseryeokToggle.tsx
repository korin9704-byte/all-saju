import { MyeongsikTable } from "./MyeongsikTable";
import type { Myeongsik } from "@/lib/saju/manseryeok";

type Period = {
  startAge: number;
  endAge: number;
  startYear: number | null;
  isCurrent: boolean;
};

export function DaewunManseryeokToggle({
  myeongsik,
  periods,
  selectedStartAge,
}: {
  myeongsik: Myeongsik;
  periods: Period[];
  selectedStartAge: number | null;
}) {
  return (
    <section>
      {/* 만세력 — edge-to-edge */}
      <MyeongsikTable myeongsik={myeongsik} />
    </section>
  );
}
