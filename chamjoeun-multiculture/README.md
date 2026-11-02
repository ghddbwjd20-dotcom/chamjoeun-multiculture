# Chamjoeun Multiculture

참조은다문화(주) 홈페이지·온라인 교육 통합 서비스 개발본입니다. 코드 구현과 외부 서비스 실연동 상태는 `docs/DEVELOPMENT.md`에서 구분합니다.

## 현재 연결 환경

2026-11-02 사용자 요청으로 현재 개발 사이트도 외부 PostgreSQL을 사용합니다. 이전 로컬 설정은 Git 제외 경로 `.local/.env.local-db-before-external`에 보관했습니다. 업무협약 등록·원본 보관은 `docs/MOU-IMPORT.md`를 참고하세요. 아래 로컬 DB 초기화 절차는 독립 개발 환경을 만들 때 사용합니다.

## 구성

- Next.js 16 App Router / React 19 / TypeScript
- PostgreSQL 18 + node-postgres(pg), SQL 마이그레이션
- 서버 세션·scrypt 비밀번호 해시·이메일 인증
- 영상: 비공개 Cloudflare R2 업로드·FFmpeg 변환 작업자·HLS·서명 검증 Worker 소스 (실제 계정 미연동)
- 한 서버에서 웹·DB 운영. Java·별도 관리형 DB·Redis 없이 시작합니다.
- v2~v4 원본은 수정하지 않았습니다. 기존 이미지는 임시 디자인 자산으로 재사용했습니다.

## 실행 (Node.js 22.13 이상, 권장 24 LTS)

```powershell
npm ci
npm run db:local
npm run db:migrate
npm run db:check
npm run dev -- --webpack
```

Windows의 한글 경로 문제를 피하기 위한 `db:local` 도우미가 포함돼 있습니다. 프로젝트별 개발용 PostgreSQL을 생성하고 127.0.0.1:55432에만 연결합니다. 위치는 `.local/runtime.json`, 비밀번호는 `.local/db-password`, 앱 설정은 `.env.local`에 저장되며 모두 Git에서 제외됩니다. 기존 설치 DB·사용자·테이블을 수정하지 않습니다.

처음 실행 시 `LOCAL_PG_HOME` 환경변수로 **영문 경로의 영속 개발 디렉터리**를 지정하는 것을 권장합니다. 지정하지 않으면 프로젝트별 임시 디렉터리를 사용합니다. 임시 디렉터리를 청소하면 개발 DB가 사라질 수 있으므로 작업 후 백업하세요. 기존 `.local/runtime.json`이 있으면 해당 경로를 재사용합니다.

현재 작업 환경의 실제 DB 경로도 `.local/runtime.json`에서 확인할 수 있습니다. DB 중지는 `npm run db:stop`, 백업에는 동일 메이저 버전의 PostgreSQL 클라이언트 도구가 필요합니다. 개발 DB 백업은 `powershell -File scripts/backup-db.ps1`입니다.

Linux/macOS 또는 Docker 사용 시:

```sh
# .env.example를 .env.local로 복사하고 직접 환경값 설정
# Compose는 .env.local을 자동으로 읽지 않으므로 명시합니다.
docker compose --env-file .env.local up -d db
npm run db:migrate
npm run dev
```

Docker용 POSTGRES_PASSWORD와 DATABASE_URL 비밀번호를 같게 지정합니다. DATABASE_URL의 특수문자는 URL 인코딩해야 합니다. 컨테이너의 DB는 일반에 공개하지 않습니다.

## 관리자 생성

기본 관리자·고정 비밀번호는 없습니다. 로컬 환경변수로 지정해 생성합니다.

```powershell
$env:ADMIN_EMAIL = '원하는 관리자 이메일'
$env:ADMIN_PASSWORD = '12자 이상의 별도 비밀번호'
npm run admin:create
Remove-Item Env:ADMIN_PASSWORD
```

생성된 계정으로 `/login`에서 로그인한 뒤 `/admin`을 이용합니다. 스크립트는 같은 이메일이 있으면 관리자 권한과 비밀번호를 갱신하므로 대상 주소를 확인하세요. 운영에서 예제 계정이나 개발 계정을 사용하지 마세요.

## 현재 구현

- 네이비·블루 홈페이지, 공통 반응형 헤더·메뉴·푸터
- 기관소개, 네 가지 주요사업, 정착·KIIP·조기적응 안내, 연락처
- 회원가입, 이메일 인증, 로그인·로그아웃, 서버 세션, 관리자 권한
- 관리자 과정 생성·수정·보관, 차시 추가, 무료 신청·내 강의실
- 학습 플레이어 및 서버 시청 구간·이어보기·자동/수동 수료 기반
- 온라인 문의 DB 접수·관리자 답변 기록
- 기관소식 등록·공개·목록·검색·상세
- 비밀번호 재설정·인증메일 재발송, 회원정보 수정·탈퇴, 구글·네이버·카카오 OAuth와 계정 연결 코드
- 토스 주문·승인·웹훅·전체취소, 수료증·자격증 PDF와 발급 이력 코드
- 게시물 편집·숨김·첨부, 기관정보·배너·팝업 관리와 공개 화면 반영
- 로그인 상태에서 접수한 문의·답변 조회와 페이지 이동, 다른 회원 문의 접근 제한
- 학습 화면 이탈 시 마지막 진도 저장, 학습 권한 확인 후 영상 토큰 재발급과 플레이어 갱신
- SQL 마이그레이션, 관리자 생성 도구, 백업 도구, 배포 설정 초안

## 아직 미완료

전체 계약 기능이 완료된 상태가 아닙니다. 결제·소셜로그인·이메일·영상은 실제 서비스 설정과 통합 검수가 필요합니다. 알림톡·문자·Web Push·뉴스레터의 발송 작업자와 운영 화면, MOU 확인 대기 1건 검수, 승인된 증명서 양식, 실제 교육 콘텐츠 등록과 운영 검수가 남아 있습니다. 알림과 발송 큐의 DB 테이블·일부 적재 코드만 있는 상태를 발송 기능 완료로 보지 않습니다.

문의 답변은 회원의 내 문의 화면에서 확인할 수 있으며 자동 이메일 전송은 하지 않습니다. 로그인 전에 접수한 문의는 이메일이 같아도 회원 계정으로 자동 연결하지 않습니다. 결제 키가 없으면 유료결제를 차단하며 무료 수강권으로 우회 등록하지 않습니다. 영상 미연동 시 준비 화면을 표시합니다.

## 이메일

개발 모드와 `DEV_EMAIL_PREVIEW=true`가 모두 설정되면 가입자에게 화면으로 테스트 인증 링크를 제공합니다. 실제 이메일은 보내지 않습니다. 운영 모드에서는 이 기능이 동작하지 않습니다. 운영 메일 발송은 RESEND_API_KEY·MAIL_FROM 설정과 발송 도메인 인증이 필요합니다. 현재 자동 답변/뉴스레터 전송은 미연동입니다.

## 검증

```sh
npm run typecheck
npm test
# 현재 Windows 환경에서 검증한 배포 빌드
npm run build -- --webpack
# 별도 실행한 개발 서버의 APP_URL과 일치시킨 뒤 실행
npm run test:integration
```

단위 검증과 DB 실제 연결·브라우저 흐름 검증을 구분합니다. 전체 결제·영상·부하·접근성·외부 서비스 검증은 실제 계정과 콘텐츠 연동 후 진행합니다.

## 운영과 예산

`docs/BUDGET.md`는 **서버+DB+영상 저장·전송·변환 월 10만 원 이하를 위한 설계 예산**입니다. 실견적이나 월 고정요금 보장이 아닙니다. 실제 클라우드 상품·환율·저장량·요청량·서버 외부 전송비를 확인한 뒤 가동합니다. 유료 리소스 생성과 실제 결제는 하지 않았습니다. Vercel 검토 배포와 외부 PostgreSQL 설정은 `docs/VERCEL-REVIEW.md`를 참고하세요.

운영 배포 전 APP_URL·이메일·영상·PG 설정, 개인정보/약관 확정, 일일 백업·7일 보관·별도 저장·복구 검증, 오류 모니터링, 비용 알림·업로드 제한·부하 검증을 완료해야 합니다. Docker Compose의 자원 제한은 과금의 하드 캡이 아닙니다.

개발용 샘플 과정은 `DEV_ADMIN_PASSWORD`를 로컬 환경변수로 지정하고 `npm run db:seed:dev`로 별도 등록합니다. 운영 DB에서는 실행하지 않습니다.
