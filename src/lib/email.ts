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
    @import url('https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap');
  </style>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Gowun Dodum','Apple SD Gothic Neo',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#111111;padding:32px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">냥점🐱</span>
        </td></tr>
        <tr><td style="padding:40px 40px 24px;">
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#111;line-height:1.6;">
            ${greeting}<br>
            <span style="color:#764ae6;">'${productName}'</span><br>
            결과가 도착했어요.
          </h1>
          <a href="${url}" style="display:block;background:#111111;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:17px;font-weight:600;letter-spacing:-0.3px;text-align:center;">
            지금 보러가기
          </a>
        </td></tr>
        <tr><td style="padding:24px 40px 40px;border-top:1px solid #f0f0f0;">
          <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
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
