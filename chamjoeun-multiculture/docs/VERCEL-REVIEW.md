# Vercel 검토 배포

- Vercel 프로젝트: chamjoeun-multiculture
- Git 저장소 루트 안의 `chamjoeun-multiculture/`를 Root Directory로 사용합니다.
- Node.js 24 / Next.js. 외부 PostgreSQL은 Neon 무료 플랜, Singapore 리전입니다.
- DB 비밀번호는 Vercel 환경변수로 주입합니다. `.env*`, `.local/`, `.vercel/`, 백업과 로컬 회원정보는 업로드하지 않습니다.
- 스키마 변경 시 외부 DB에 `scripts/migrate.ts`를 실행한 뒤 배포합니다. 빌드에서 DB를 자동 변경하지 않습니다.
- APP_URL은 실제 HTTPS 주소로 설정합니다.

## 별도 설정이 필요한 기능

- 회원가입 인증메일/비밀번호 복구: RESEND_API_KEY, MAIL_FROM 등록 필요. 미설정 시 가입을 명시적으로 차단합니다.
- Google/Naver/Kakao 로그인: 각 앱 키와 배포 도메인의 Callback URL 등록 필요.
- 결제: Toss 키와 도메인/웹훅 설정 필요.
- 실제 강의 영상: R2/Worker/변환 작업자 설정 필요. 로컬 개발 전용 샘플 영상 API는 운영 환경에서 비활성화됩니다.
- 첨부파일: 서버리스 로컬 디스크에는 영속 저장하지 않습니다. Vercel에서는 PostgreSQL 저장을 사용하며 합계 100MB의 검토용 한도를 적용합니다. 정식 운영에서는 별도 객체 저장소를 권장합니다.
- 검토 DB는 로컬 테스트 계정이나 수강기록을 복사하지 않은 별도 DB입니다.
