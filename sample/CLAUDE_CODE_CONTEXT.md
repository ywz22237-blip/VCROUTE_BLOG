# 프로젝트 인계 컨텍스트 — VC route Insights 블로그

## 프로젝트 목표
아임웹을 CMS(글 작성/관리)로 사용하고,
별도 HTML 사이트를 Netlify에 호스팅하여 블로그를 운영한다.

## 구조 요약
```
[아임웹] 글 작성·관리 (CMS)
    ↓ REST API v2
[Netlify Functions] 프록시 서버 (CORS 해결)
    ↓
[index.html] 블로그 프론트엔드 (Pretendard 폰트, 반응형)
```

## 아임웹 API 정보
- API 엔드포인트: https://api.imweb.me/v2
- 인증: GET /v2/auth?key={API_KEY}&secret={SECRET_KEY} → access_token 반환 (유효시간 1시간)
- 게시글 조회: GET /v2/boards/{BOARD_CODE}/posts?limit=20
- 헤더: access-token: {access_token}

## 환경변수 (Netlify에 설정 필요)
- IMWEB_API_KEY
- IMWEB_SECRET_KEY
- IMWEB_BOARD_CODE

## 폴더 구조
```
my-blog/
├── index.html                  ← 블로그 메인 (디자인 완성본 있음)
├── netlify.toml                ← /api/posts → /.netlify/functions/posts 리다이렉트
└── netlify/
    └── functions/
        └── posts.js            ← 아임웹 API 프록시
```

## 현재 완성된 것
- index.html 디자인 완성 (vcroute-blog-imweb.html 파일)
  - Pretendard 폰트
  - 좌측 sticky 소개 + 우측 2열 카드 그리드
  - 로딩 스켈레톤 애니메이션
  - 썸네일 없을 때 SVG 플레이스홀더 자동 삽입
  - 최근 글 목록 섹션
  - 뉴스레터 구독 섹션
  - 반응형 (960px 이하 1열)
  - API 미연결 시 목업 데이터 표시

## 다음 작업 (Claude Code에서 할 것)
1. netlify/functions/posts.js 작성
2. netlify.toml 작성
3. index.html에서 /api/posts 호출하도록 수정
4. GitHub 저장소 생성 및 push
5. Netlify 연결 및 환경변수 설정

## 디자인 스펙
- 브랜드 컬러: #3858E9
- 폰트: Pretendard
- 배경: #FFFFFF
- 텍스트: #1E1E1E (ink), #6B7280 (muted)
- 최대 너비: 1280px
- 회사: 주식회사 벤처플랫폼 (ventureplatform.biz)
- 서비스명: VCRoute / VC route Insights
