# 카카오 1초 로그인 설정 가이드

코드는 모두 준비되어 있고, 아래 외부 설정만 하면 바로 동작합니다.
(설정 전까지는 카카오 버튼 클릭 시 로그인이 시작되지 않습니다)

## 1. 카카오 개발자 앱 만들기

1. https://developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가
2. **앱 키 확인**: 요약 정보에서 `REST API 키` 복사
3. **카카오 로그인 활성화**: 제품 설정 → 카카오 로그인 → 활성화 ON
4. **Redirect URI 등록** (카카오 로그인 → Redirect URI):
   ```
   https://<supabase-project-ref>.supabase.co/auth/v1/callback
   ```
   (Supabase 대시보드 → Authentication → Providers → Kakao 화면에 표시되는 Callback URL 그대로)
5. **동의항목 설정** (카카오 로그인 → 동의항목):
   - 닉네임(profile_nickname): 필수 동의
   - **카카오계정 이메일(account_email): 필수 동의** ← 결과지 이메일 발송·계정 연결에 필요
   - ⚠️ 이메일 동의항목은 **비즈 앱 전환** 후에 필수 동의로 설정할 수 있습니다
     (앱 설정 → 비즈니스 → 개인 개발자 비즈 앱 전환. 사업자등록번호 필요)
6. 제품 설정 → 카카오 로그인 → 보안 → **Client Secret 생성** 후 복사, 활성화 ON

## 2. Supabase 설정

1. Supabase 대시보드 → Authentication → Providers → **Kakao**
2. Enabled ON
3. REST API Key → `Client ID` 칸에 입력
4. Client Secret → `Client Secret` 칸에 입력
5. 저장

## 3. 사이트 URL 확인

Supabase → Authentication → URL Configuration:
- Site URL: 배포 도메인 (예: https://나의도메인.com)
- Redirect URLs에 로컬 개발용 `http://localhost:3000/**` 추가

## 4. DB 마이그레이션 실행

Supabase SQL Editor에서 `supabase/migrations/0005_referral_kakao.sql` 내용 실행:
- 전 상품 990원 변경
- `free-mini` 상품 추가
- `profiles.referral_code` 컬럼 + `referral_rewards` 테이블 생성

## 동작 확인 체크리스트

- [ ] /login 에서 "카카오로 1초 로그인" → 카카오 동의 화면 → 로그인 완료
- [ ] 상품 페이지에서 정보 입력 → "카카오 1초 로그인하고 결제하기" → 로그인 후 자동으로 결제 페이지 이동
- [ ] /free?ref=코드 에서 정보 입력 → 카카오 로그인 → 미니 사주 결과
- [ ] 친구 완료 후 추천인 마이페이지에 무료권 1개 적립 (적립 n/4 표시)
- [ ] 무료권 보유 상태에서 상품 폼에 "무료권 사용하기" 체크박스 노출 → 결제 없이 결과
