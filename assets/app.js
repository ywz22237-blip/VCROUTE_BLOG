// =====================================================
// VC route Insights — 공통 스크립트
// 아임웹 API는 Netlify Function 프록시(/api/posts)를 통해 호출
// =====================================================

const API_BASE = "/api/posts";

// 카테고리 슬러그 ↔ 표시명 매핑
const CATEGORIES = {
  guide:     { name: "투자 가이드",   desc: "Pre-A부터 Series C까지, 단계별로 알아야 할 투자의 기본." },
  ir:        { name: "IR 전략",       desc: "심사역이 첫 3장에서 보는 신호. 실제 IR 미팅에서 통하는 디테일." },
  market:    { name: "시장 리포트",   desc: "분기별 벤처투자 시장 데이터, 섹터별 트렌드와 인사이트." },
  interview: { name: "투자자 인터뷰", desc: "유니콘을 만든 투자자들의 철학과 의사결정 프로세스." },
};

// =====================================================
// API 호출
// =====================================================
async function fetchPosts({ limit = 10, page = 1, category = "" } = {}) {
  const params = new URLSearchParams({ limit, page });
  if (category) params.set("category", category);

  const res = await fetch(`${API_BASE}?${params}`);
  if (!res.ok) throw new Error("게시글 조회 실패");
  return await res.json(); // { list: [...], total_count, page, limit }
}

// =====================================================
// 썸네일 placeholder SVG
// =====================================================
const PLACEHOLDER_SVGS = [
  `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#3858E9"/>
    <g fill="#fff" opacity="0.8">
      <circle cx="80" cy="220" r="12"/><circle cx="150" cy="175" r="12"/>
      <circle cx="220" cy="195" r="12"/><circle cx="290" cy="140" r="12"/><circle cx="340" cy="105" r="12"/>
      <path d="M80 220 L150 175 L220 195 L290 140 L340 105" stroke="#fff" stroke-width="2.5" fill="none"/>
    </g>
  </svg>`,
  `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#1E1E1E"/>
    <rect x="55" y="80" width="58" height="160" rx="3" fill="#3858E9"/>
    <rect x="135" y="120" width="58" height="120" rx="3" fill="#5570EE"/>
    <rect x="215" y="60" width="58" height="180" rx="3" fill="#3858E9"/>
    <rect x="295" y="140" width="58" height="100" rx="3" fill="#7A8FF5"/>
    <line x1="40" y1="240" x2="375" y2="240" stroke="#fff" stroke-width="1.5" opacity="0.35"/>
  </svg>`,
  `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#EEF1FE"/>
    <g fill="none" stroke="#3858E9" stroke-width="1.8">
      <circle cx="200" cy="150" r="38"/><circle cx="200" cy="150" r="68"/>
      <circle cx="200" cy="150" r="98"/><circle cx="200" cy="150" r="128"/>
    </g>
    <circle cx="200" cy="150" r="7" fill="#3858E9"/>
  </svg>`,
  `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="300" fill="#F7F7F8"/>
    <rect x="55" y="60" width="280" height="38" rx="6" fill="#E7E7E9"/>
    <rect x="55" y="115" width="220" height="18" rx="4" fill="#E7E7E9"/>
    <rect x="55" y="143" width="180" height="18" rx="4" fill="#E7E7E9"/>
    <rect x="55" y="195" width="120" height="42" rx="21" fill="#3858E9"/>
  </svg>`,
];

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
}

function estimateReadTime(content) {
  if (!content) return "5분 읽기";
  const len = content.replace(/<[^>]+>/g, "").length;
  const minutes = Math.max(2, Math.round(len / 500));
  return `${minutes}분 읽기`;
}

function postUrl(post) {
  // 상세 페이지: post.html?id={id}
  return `/post.html?id=${encodeURIComponent(post.idx || post.id || "")}`;
}

// =====================================================
// 렌더러
// =====================================================
function renderFeaturedCards(targetId, posts, count = 4) {
  const grid = document.getElementById(targetId);
  if (!grid) return;
  if (!posts || posts.length === 0) {
    grid.innerHTML = `<p style="color:var(--muted);font-size:14px;">게시글이 없습니다.</p>`;
    return;
  }
  grid.innerHTML = posts.slice(0, count).map((post, i) => {
    const thumb = post.thumbnail_url
      ? `<img src="${post.thumbnail_url}" alt="${post.subject}" />`
      : PLACEHOLDER_SVGS[i % PLACEHOLDER_SVGS.length];
    const category = (post.category_name || post.tags?.[0] || "인사이트").toUpperCase();
    const excerpt = post.summary || (post.content ? post.content.replace(/<[^>]+>/g, "").slice(0, 80) + "…" : "");
    const author = post.writer_name || "VC route 리서치팀";
    const readTime = estimateReadTime(post.content);

    return `
    <a class="card" href="${postUrl(post)}">
      <div class="thumb">${thumb}</div>
      <div class="tags">${category}</div>
      <h3>${post.subject}</h3>
      <p class="excerpt">${excerpt}</p>
      <div class="byline">${author} · ${readTime}</div>
    </a>`;
  }).join("");
}

function renderRecentList(targetId, posts, offset = 4, count = 6) {
  const list = document.getElementById(targetId);
  if (!list) return;
  if (!posts || posts.length === 0) { list.innerHTML = ""; return; }

  const recent = posts.slice(offset, offset + count);
  if (recent.length === 0) { list.innerHTML = ""; return; }

  list.innerHTML = recent.map((post, i) => {
    const num = String(recent.length - i).padStart(3, "0");
    const category = post.category_name || post.tags?.[0] || "인사이트";
    return `
    <a class="mini" href="${postUrl(post)}">
      <div class="num">No. ${num}</div>
      <h4>${post.subject}</h4>
      <div class="meta">${formatDate(post.create_date)} · ${category}</div>
    </a>`;
  }).join("");
}

function renderEditorPick(targetId, post) {
  const el = document.getElementById(targetId);
  if (!el || !post) return;
  const thumb = post.thumbnail_url
    ? `<img src="${post.thumbnail_url}" alt="${post.subject}" />`
    : PLACEHOLDER_SVGS[0];
  const author = post.writer_name || "VC route 리서치팀";
  const readTime = estimateReadTime(post.content);
  el.innerHTML = `
    <div>
      <span class="label">Editor's Pick</span>
      <h3>${post.subject}</h3>
      <p>${post.summary || (post.content ? post.content.replace(/<[^>]+>/g,"").slice(0,140)+"…" : "")}</p>
      <div class="byline">${author} · ${readTime}</div>
    </div>
    <a class="pick-thumb" href="${postUrl(post)}">${thumb}</a>
  `;
}

function renderSkeletons(targetId, count = 4) {
  const grid = document.getElementById(targetId);
  if (!grid) return;
  grid.innerHTML = Array(count).fill(`
    <div>
      <div class="skeleton skel-thumb"></div>
      <div class="skeleton skel-line" style="width:40%"></div>
      <div class="skeleton skel-title" style="width:90%"></div>
      <div class="skeleton skel-title" style="width:75%"></div>
      <div class="skeleton skel-line" style="width:30%"></div>
    </div>
  `).join("");
}

// =====================================================
// 목업 데이터 (API 미연결/오류 시)
// =====================================================
const MOCK_POSTS = [
  { idx: 1, subject: "2026년 1분기 한국 벤처투자 시장: 회복의 신호인가, 일시적 반등인가",
    summary: "투자 건수는 늘었지만 평균 라운드 사이즈는 여전히 작은 이번 분기, 데이터로 살펴본 4가지 변화.",
    category_name: "시장 리포트", writer_name: "윤지호", content: "a".repeat(4000), create_date: "2026-04-05" },
  { idx: 2, subject: "심사역이 IR 덱의 첫 3장에서 확인하는 5가지 신호",
    summary: "100건이 넘는 IR 미팅에서 반복적으로 등장한 패턴. 첫 3장이 결정한다.",
    category_name: "IR 전략", writer_name: "박수민", content: "a".repeat(3000), create_date: "2026-04-03" },
  { idx: 3, subject: `"우리는 적자를 두려워하지 않습니다" — 알토스벤처스 김한준 대표 인터뷰`,
    summary: "유니콘을 만든 투자 철학, 그리고 한국 시장에서 그가 여전히 베팅하는 이유.",
    category_name: "투자자 인터뷰", writer_name: "이재민", content: "a".repeat(6000), create_date: "2026-03-30" },
  { idx: 4, subject: "Pre-A부터 Series C까지 — 라운드별로 달라지는 밸류에이션 로직",
    summary: "매출 0원에서 ARR 100억까지, 단계별로 투자자가 보는 숫자가 어떻게 달라지는가.",
    category_name: "투자 가이드", writer_name: "최서연", content: "a".repeat(5000), create_date: "2026-03-27" },
  { idx: 5, subject: "SAFE 노트와 컨버터블 노트, 한국 스타트업이 자주 놓치는 차이",
    summary: "", category_name: "투자 가이드", writer_name: "편집팀",
    create_date: "2026-04-02", content: "a".repeat(2000) },
  { idx: 6, subject: "딥테크 투자에 적합한 KPI는 무엇인가 — 매출이 답이 아닐 때",
    summary: "", category_name: "시장 리포트", writer_name: "편집팀",
    create_date: "2026-03-28", content: "a".repeat(2000) },
  { idx: 7, subject: "해외 투자자와의 첫 미팅 전에 준비해야 할 6가지",
    summary: "", category_name: "IR 전략", writer_name: "편집팀",
    create_date: "2026-03-21", content: "a".repeat(2000) },
  { idx: 8, subject: "파운더가 묻는다: '지분 얼마까지 내줘도 괜찮나요?'",
    summary: "", category_name: "투자 가이드", writer_name: "편집팀",
    create_date: "2026-03-15", content: "a".repeat(2000) },
  { idx: 9, subject: "프라이머 권도균 대표 — '지속가능한 회사의 첫 번째 조건'",
    summary: "", category_name: "투자자 인터뷰", writer_name: "편집팀",
    create_date: "2026-03-12", content: "a".repeat(2000) },
];

function filterByCategory(posts, slug) {
  if (!slug) return posts;
  const name = CATEGORIES[slug]?.name;
  if (!name) return posts;
  return posts.filter(p => (p.category_name || "").includes(name.split(" ")[0]));
}

// =====================================================
// 페이지별 초기화
// =====================================================
async function initHome() {
  renderSkeletons("featured-grid", 4);

  let posts = MOCK_POSTS;
  let usedMock = false;

  try {
    const result = await fetchPosts({ limit: 12 });
    if (result?.list?.length) posts = result.list;
    else { usedMock = true; }
  } catch (err) {
    console.error("아임웹 API 오류:", err);
    usedMock = true;
    const notice = document.getElementById("api-notice");
    if (notice) {
      notice.style.display = "block";
      notice.textContent = `⚠️ API 오류: ${err.message}. 아래는 샘플 데이터입니다.`;
    }
  }

  if (usedMock) {
    const notice = document.getElementById("api-notice");
    if (notice) notice.style.display = "block";
  }

  renderEditorPick("editor-pick", posts[0]);
  renderFeaturedCards("featured-grid", posts.slice(1), 4);
  renderRecentList("recent-list", posts, 5, 6);
}

async function initCategory(slug) {
  renderSkeletons("featured-grid", 6);

  let posts = MOCK_POSTS;
  let usedMock = false;

  try {
    const result = await fetchPosts({ limit: 30, category: CATEGORIES[slug]?.name });
    if (result?.list?.length) posts = result.list;
    else { usedMock = true; }
  } catch (err) {
    console.error("아임웹 API 오류:", err);
    usedMock = true;
    const notice = document.getElementById("api-notice");
    if (notice) {
      notice.style.display = "block";
      notice.textContent = `⚠️ API 오류: ${err.message}. 아래는 샘플 데이터입니다.`;
    }
  }

  if (usedMock) {
    posts = filterByCategory(MOCK_POSTS, slug);
    const notice = document.getElementById("api-notice");
    if (notice) notice.style.display = "block";
  }

  renderFeaturedCards("featured-grid", posts, 12);
}
