import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "냥점 <no-reply@nyangjeom.com>";
// 이메일 링크는 고객에게 나가므로 localhost 가 섞이지 않게 방어한다
// (로컬에서 장애 복구 재생성을 돌려도 링크는 항상 프로덕션 주소)
const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const SITE_URL = envSiteUrl && !envSiteUrl.includes("localhost") ? envSiteUrl : "https://nyangjeom.com";

export async function sendResultEmail({
  to,
  resultId,
  productName,
  name,
}: {
  to: string;
  resultId: string;
  productName: string;
  name?: string | null;
}) {
  const url = `${SITE_URL}/results/${resultId}`;
  const greeting = name ? `${name}님의` : "구매하신";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `[냥점] ${greeting} ${productName} 결과가 도착했어요`,
    html: `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Kirang+Haerang&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#F3EEFA;font-family:'Gowun Dodum','Apple SD Gothic Neo',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EEFA;padding:40px 0;">
    <tr><td align="center">
      <!-- 밤하늘 다크 — 보라 배경 + 별 -->
      <table width="520" cellpadding="0" cellspacing="0" style="background:#584A93;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(74,58,114,0.18);">
        <tr><td style="padding:36px 40px 8px;text-align:center;">
          <span style="color:#ffffff;font-size:26px;font-family:'Kirang Haerang','Gowun Dodum',sans-serif;letter-spacing:0.05em;">냥점</span>
          <p style="margin:6px 0 0;color:#C9BDE6;font-size:13px;">&#10022; &#730; &#183; &#10023; &#183; &#730; &#10022;</p>
        </td></tr>
        <tr><td style="padding:22px 40px 34px;text-align:center;">
          <h1 style="margin:0 0 26px;font-size:21px;font-weight:400;color:#ffffff;line-height:1.7;">
            ${greeting}<br>
            <span style="color:#F3BFE7;">'${productName}'</span><br>
            결과가 도착했어요.
          </h1>
          <a href="${url}" style="display:inline-block;background:#ffffff;color:#584A93;text-decoration:none;padding:15px 110px;border-radius:999px;font-size:16px;font-weight:400;text-align:center;">
            결과 보기!!
          </a>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.15);text-align:center;">
          <p style="margin:0;font-size:12.5px;color:#B9A8DD;line-height:1.6;">
            이 메일은 냥점(nyangjeom.com) 결제 완료 후 자동 발송됩니다.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
