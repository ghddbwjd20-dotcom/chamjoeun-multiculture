# 메인페이지 시안 반영

2026-11-03. 고객 제공 이미지의 헤더, 왼쪽 소개 문구, 오른쪽 메인 사진과 소개 카드, 겹쳐진 주요 서비스 7개, 주요 사업 카드 3개 구성을 반영했다. 하단의 사업·교육·소식 영역은 유지했다. 첫 화면은 정지 사진으로 표시하고 사용자가 소개 영상 버튼을 누르면 기존 영상이 모달에서 재생된다.

관련 코드: `src/components/home-intro.tsx`, `src/components/home-intro.css`, `src/components/site-navigation.tsx`, `src/app/page.tsx`.

사진은 고객 시안에 포함된 사진 원본을 제공받은 것이 아니라, 시안을 참고해 built-in image_gen 도구로 새로 생성했다. 프로젝트 이미지 경로: `E:/참조은다문화/chamjoeun-multiculture/public/images/home-reference-hero.jpg`. 기존 로고와 영상은 유지했다.

최종 이미지 생성 프롬프트:

> Photorealistic-natural website hero photograph, landscape 16:9. Recreate the photographic scene in the central hero of the provided reference website screenshot as a standalone high-resolution photograph WITHOUT website interface, cards, borders, captions or Korean words. Bright contemporary education counseling office with tall glass windows, soft cool daylight, subtle gray and blue palette. Four adults around a table: East Asian man in light shirt at left seen from back, smiling Korean female educator in navy blazer center facing camera, brown-haired woman seen from back at right-center, smiling South Asian man in light gray knit cardigan at right. Laptop on table. Faces in lower half, spacious window architecture upper half. Subtle wall typography in upper-right may say DIVERSE PEOPLE BRIGHTER SOCIETY. Match natural candid composition, professional welcoming atmosphere. Image only, no page mockup.

검증: 타입 검사 및 기존 단위 테스트 15개 통과. 테스트 브라우저에서 소개 슬라이드 이동, 영상 모달 열기·Escape 닫기, 모바일 메뉴 조작 확인. 홈페이지 변경만 이전 운영 배포 소스에 적용해 배포하여 진행 중인 다른 개발 코드를 함께 배포하지 않는다.

## 하단 디자인 통일

고객 후속 요청에 따라 EDUCATION & COMMUNITY부터 푸터까지 동일한 디자인을 적용했다. `src/components/home-continuation.css`를 홈페이지 영역에만 적용하여 다른 상세 페이지 스타일을 유지한다. 교육 사업은 4열 흰색 카드로 정리하고 온라인 학습, 설립이념, 기관소식, 협력기관, 문의 영역의 제목·여백·색상·테두리·버튼 규격을 맞췄다. 모바일에서는 1열 또는 2열로 전환한다. 기존 학습 미리보기 탭, 샘플 영상, 게시판 분류와 각 페이지 링크를 유지한다.

타입 검사 통과. 360·390·768·1024·1280·1764px에서 페이지 가로 넘침 없음. LMS 탭 및 다음 기능 버튼, 소식 분류 변경 확인. 배포: `dpl_4wgvTrWCFfjFYdWrFG9bg7JNgW6D`.

## 메뉴·연락처 후속 수정

메인 헤더 메뉴를 화면의 정확한 가운데에 배치하고 PC 헤더 88→72px, 모바일 72→64px로 축소했다. 기관소개 메뉴는 기관소개·연혁·오시는길, 기관소식 메뉴는 공지사항·사업소식·업무협약으로 정리하고 정착·사회통합의 한국어·한국문화 하위 링크를 제거했다. 해당 본문 콘텐츠는 유지한다.

기관정보 JSON에 선택 항목 `mobile`을 추가하고 요청 번호 010-8633-5629를 외부 DB에 저장했다. 대표번호는 유지한다. 메인·문의·기관소개의 방문 안내·푸터·상담 안내에서 전화 연결 링크를 제공하며 관리자 기관 기본정보에서 수정할 수 있다. 기존 정보는 `.local/contact-before-mobile.json`에 백업했다.
