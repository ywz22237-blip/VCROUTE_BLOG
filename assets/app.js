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
    summary: "가장 많이 쓰는 초기 투자 계약서 두 가지. 똑같아 보여도 결과가 다르다.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-04-02" },
  { idx: 6, subject: "딥테크 투자에 적합한 KPI는 무엇인가 — 매출이 답이 아닐 때",
    summary: "기술 기반 스타트업을 평가할 때 매출만으로 부족한 이유와 대안 지표들.",
    category_name: "시장 리포트", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-28" },
  { idx: 7, subject: "해외 투자자와의 첫 미팅 전에 준비해야 할 6가지",
    summary: "글로벌 VC 미팅 전 반드시 챙겨야 할 실전 체크리스트.",
    category_name: "IR 전략", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-21" },
  { idx: 8, subject: "파운더가 묻는다: '지분 얼마까지 내줘도 괜찮나요?'",
    summary: "라운드별 적정 희석률과 Cap Table 관리 전략.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-15" },
  { idx: 9, subject: "프라이머 권도균 대표 — '지속가능한 회사의 첫 번째 조건'",
    summary: "파운더 출신 투자자의 눈으로 보는 좋은 회사의 기준.",
    category_name: "투자자 인터뷰", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-12" },
  { idx: 10, subject: "AI 스타트업 투자 심사 기준: 2026년 판도 변화",
    summary: "파운데이션 모델 시대에 VC가 새롭게 보는 평가 포인트들.",
    category_name: "시장 리포트", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-10" },
  { idx: 11, subject: "IR 덱에서 절대 넣지 말아야 할 슬라이드 7가지",
    summary: "심사역이 덮는 순간을 만드는 피해야 할 슬라이드들.",
    category_name: "IR 전략", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-08" },
  { idx: 12, subject: "소프트뱅크 벤처스 이준표 대표 — '한국 시장에서 유니콘을 만드는 법'",
    summary: "한국에서 글로벌로 가는 스타트업의 공통점을 묻다.",
    category_name: "투자자 인터뷰", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-05" },
  { idx: 13, subject: "Seed 라운드 밸류에이션, 얼마가 적정인가",
    summary: "시장 데이터로 보는 2026년 Seed 적정 밸류에이션 밴드.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-03-01" },
  { idx: 14, subject: "2025년 한국 벤처 시장 연간 리포트: 숫자로 돌아본 12개월",
    summary: "투자금액·건수·섹터별 분포를 한 눈에 정리한 연간 리포트.",
    category_name: "시장 리포트", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-02-28" },
  { idx: 15, subject: "텀시트에서 창업자가 놓치기 쉬운 독소 조항 5가지",
    summary: "Liquidation preference, drag-along, 반희석 조항 쉽게 이해하기.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-02-22" },
  { idx: 16, subject: "한국투자파트너스 김영덕 대표 — '포트폴리오 전략의 3원칙'",
    summary: "20년 경력 투자자가 말하는 분산·집중·타이밍의 원칙.",
    category_name: "투자자 인터뷰", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-02-15" },
  { idx: 17, subject: "바이오 섹터 투자 동향: 임상 단계별 밸류에이션 로직",
    summary: "Phase 1, 2, 3 임상 단계에 따른 기업가치 변화 패턴.",
    category_name: "시장 리포트", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-02-10" },
  { idx: 18, subject: "IR 미팅에서 심사역이 실제로 메모하는 것들",
    summary: "미팅 노트에 적히는 3가지 카테고리와 그 의미.",
    category_name: "IR 전략", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-02-05" },
  { idx: 19, subject: "창업자가 VC에게 물어봐야 할 10가지 질문",
    summary: "좋은 투자자는 좋은 질문에 답한다. 체크리스트.",
    category_name: "IR 전략", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-01-30" },
  { idx: 20, subject: "카카오벤처스 김기준 대표 — '플랫폼 사업 투자 기준'",
    summary: "플랫폼 비즈니스 모델 평가의 핵심 지표.",
    category_name: "투자자 인터뷰", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-01-25" },
  { idx: 21, subject: "Series B에서 성장률과 효율성, 무엇이 더 중요한가",
    summary: "Rule of 40으로 보는 Series B 기업 평가.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-01-20" },
  { idx: 22, subject: "ESG 투자, 한국 벤처 생태계에 얼마나 자리잡았나",
    summary: "ESG 기준이 한국 VC의 투자 의사결정에 미치는 영향.",
    category_name: "시장 리포트", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-01-15" },
  { idx: 23, subject: "데이터룸(Data Room) 완벽 가이드: 실사 대비 체크리스트",
    summary: "심사역이 실사 단계에서 확인하는 문서들 총정리.",
    category_name: "IR 전략", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-01-10" },
  { idx: 24, subject: "IMM 인베스트먼트 장동우 대표 — '한국 중견기업 투자의 묘미'",
    summary: "Growth 단계 투자의 성공 공식과 실패 사례들.",
    category_name: "투자자 인터뷰", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2026-01-05" },
  { idx: 25, subject: "Pre-Series A 단계에서 절대 놓치지 말아야 할 3가지",
    summary: "Seed와 Series A 사이, 가장 많이 흔들리는 구간.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-12-28" },
  { idx: 26, subject: "ESOP(스톡옵션) 설계의 정석: 인재 확보와 지분 희석의 균형",
    summary: "초기 팀에 얼마를 배정할지, 언제 행사하게 할지의 원칙.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-12-20" },
  { idx: 27, subject: "Convertible Note vs SAFE: 어느 쪽이 우리에게 맞을까",
    summary: "두 계약 구조의 장단점과 한국 시장에서의 사용 사례.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-12-15" },
  { idx: 28, subject: "Cap Table 관리 도구 비교: Carta, Pulley, 엑셀까지",
    summary: "단계별로 어떤 도구가 적합한지, 전환 시점은 언제인지.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-12-10" },
  { idx: 29, subject: "밸류에이션 10배의 차이를 만드는 3가지 스토리텔링",
    summary: "같은 사업이어도 다르게 보이게 하는 내러티브 설계.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-12-05" },
  { idx: 30, subject: "벤처대출(Venture Debt)을 언제 써야 하는가",
    summary: "지분 희석 없이 런웨이를 늘리는 방법과 리스크.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-11-28" },
  { idx: 31, subject: "다운라운드를 피할 수 없을 때 창업자가 취할 수 있는 선택",
    summary: "벤치마크 밸류가 떨어졌을 때 현실적인 선택지들.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-11-20" },
  { idx: 32, subject: "Secondary 거래: 창업자가 구주를 파는 올바른 타이밍",
    summary: "라운드별 적정 세컨더리 비율과 투자자 반응.",
    category_name: "투자 가이드", writer_name: "편집팀", content: "a".repeat(2000), create_date: "2025-11-15" },
];

// =====================================================
// 상세 페이지 렌더링
// =====================================================
async function fetchPostById(id) {
  // Netlify Function이 단건 조회를 지원하지 않으므로 list에서 찾기
  try {
    const result = await fetchPosts({ limit: 50 });
    const list = result?.list || [];
    return list.find(p => String(p.idx || p.id) === String(id));
  } catch {
    return null;
  }
}

function buildToc(bodyEl, tocEl) {
  if (!bodyEl || !tocEl) return;
  const headings = bodyEl.querySelectorAll("h2, h3");
  if (headings.length === 0) { tocEl.parentElement.style.display = "none"; return; }

  const ul = document.createElement("ul");
  headings.forEach((h, i) => {
    const id = `h-${i}`;
    h.id = id;
    const li = document.createElement("li");
    if (h.tagName === "H3") li.className = "toc-h3";
    li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
    ul.appendChild(li);
  });
  tocEl.appendChild(ul);

  // Active 표시
  const links = tocEl.querySelectorAll("a");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === `#${e.target.id}`));
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  headings.forEach(h => observer.observe(h));
}

function bindShareButtons(post) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent(post.subject || "");

  const map = {
    "share-linkedin": `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    "share-facebook": `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    "share-x":        `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
  };
  Object.entries(map).forEach(([id, link]) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", () => window.open(link, "_blank", "noopener,width=600,height=520"));
  });

  const copy = document.getElementById("share-copy");
  if (copy) {
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        copy.title = "복사됨!";
        setTimeout(() => copy.title = "링크 복사", 1500);
      } catch {}
    });
  }
}

async function initPost() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  let post = null;
  if (id) {
    try { post = await fetchPostById(id); } catch {}
  }
  if (!post) {
    post = MOCK_POSTS.find(p => String(p.idx) === String(id)) || MOCK_POSTS[0];
    const notice = document.getElementById("api-notice");
    if (notice) notice.style.display = "block";
  }

  // 헤더 + 메타데이터
  const desc = post.summary || (post.content ? post.content.replace(/<[^>]+>/g,"").slice(0,160) : "VC route Insights의 인사이트 글.");
  const ogImg = post.thumbnail_url || "https://blog.vcroute.com/assets/og-default.svg";
  const url = window.location.href;

  document.title = `${post.subject} — VC route Insights`;
  const setAttr = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };
  setAttr("meta-desc",      "content", desc);
  setAttr("meta-canonical", "href",    url);
  setAttr("og-title",       "content", `${post.subject} — VC route Insights`);
  setAttr("og-desc",        "content", desc);
  setAttr("og-url",         "content", url);
  setAttr("og-image",       "content", ogImg);
  setAttr("tw-title",       "content", `${post.subject} — VC route Insights`);
  setAttr("tw-desc",        "content", desc);
  setAttr("tw-image",       "content", ogImg);

  document.getElementById("post-category").textContent = post.category_name || "인사이트";
  document.getElementById("post-title").textContent = post.subject;
  document.getElementById("post-lead").textContent = post.summary || "";
  document.getElementById("post-author").textContent = post.writer_name || "VC route 리서치팀";
  document.getElementById("post-date").textContent = formatDate(post.create_date);
  document.getElementById("post-readtime").textContent = estimateReadTime(post.content);

  const avatar = document.getElementById("post-avatar");
  if (avatar) avatar.textContent = (post.writer_name || "VC")[0];
  const authorBio = document.getElementById("post-author-bio");
  if (authorBio) authorBio.textContent = `${post.writer_name || "VC route 리서치팀"} · VC route Insights`;

  // 커버
  const cover = document.getElementById("post-cover");
  if (cover) {
    cover.innerHTML = post.thumbnail_url
      ? `<img src="${post.thumbnail_url}" alt="${post.subject}" />`
      : PLACEHOLDER_SVGS[(post.idx || 0) % PLACEHOLDER_SVGS.length];
  }

  // 본문
  const body = document.getElementById("post-body");
  if (body) {
    if (post.content && post.content.length > 100 && post.content.includes("<")) {
      body.innerHTML = post.content;
    } else {
      // 목업/평문일 경우 더미 본문
      body.innerHTML = `
        <p>${post.summary || "이 글은 아임웹에서 작성된 콘텐츠를 표시하는 샘플 페이지입니다."}</p>
        <h2>1. 시장의 변화는 어디서 시작되는가</h2>
        <p>스타트업 투자 시장은 매 분기 다른 얼굴을 보여줍니다. 데이터로 보는 흐름은 직관과 다를 때가 많습니다. 2026년 1분기 한국 벤처투자 시장은 작년 대비 회복세를 보이고 있지만, 평균 라운드 사이즈는 여전히 작은 수준입니다.</p>
        <h3>1.1 투자 건수 vs 라운드 사이즈</h3>
        <p>건수가 늘어났다는 것은 시장이 활성화되고 있다는 긍정적 신호이지만, 평균 투자액이 줄어들고 있다는 것은 투자자들이 여전히 조심스럽게 접근하고 있다는 의미입니다.</p>
        <blockquote>"투자자가 보는 것은 숫자가 아니라 그 숫자 뒤의 이야기다." — 익명의 심사역</blockquote>
        <h2>2. 심사역이 진짜 보는 디테일</h2>
        <p>100건이 넘는 IR 미팅 데이터를 분석한 결과, 첫 3장에서 결정되는 신호는 명확합니다. 시장의 크기, 팀의 역량, 그리고 문제 정의의 명료함입니다.</p>
        <ul>
          <li>시장 크기와 성장률을 명확한 숫자로 제시할 것</li>
          <li>팀의 unique insight를 한 문장으로 요약할 것</li>
          <li>현재 트랙션을 정직하게 공개할 것</li>
        </ul>
        <h2>3. 결론: 다음 분기를 위한 준비</h2>
        <p>다음 분기에 투자를 받으려는 창업자라면, 지금부터 준비해야 할 것은 데이터와 스토리의 균형입니다. 둘 중 하나만으로는 부족합니다.</p>
      `;
    }

    buildToc(body, document.getElementById("post-toc"));
  }

  bindShareButtons(post);

  // 관련 글: 같은 카테고리 다른 글
  let related = MOCK_POSTS;
  try {
    const result = await fetchPosts({ limit: 12 });
    if (result?.list?.length) related = result.list;
  } catch {}
  related = related
    .filter(p => String(p.idx || p.id) !== String(post.idx || post.id))
    .filter(p => !post.category_name || (p.category_name || "").includes((post.category_name || "").split(" ")[0]))
    .slice(0, 3);
  if (related.length < 3) {
    related = MOCK_POSTS.filter(p => String(p.idx) !== String(post.idx)).slice(0, 3);
  }
  renderFeaturedCards("related-grid", related, 3);
}

// =====================================================
// 검색 (모든 페이지에서 동작)
// =====================================================
let _searchCache = null;
async function loadSearchIndex() {
  if (_searchCache) return _searchCache;
  try {
    const result = await fetchPosts({ limit: 100 });
    if (result?.list?.length) { _searchCache = result.list; return _searchCache; }
  } catch {}
  _searchCache = MOCK_POSTS;
  return _searchCache;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function highlight(text, q) {
  if (!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return safe.replace(re, "<mark>$1</mark>");
}

function mountSearch() {
  if (document.getElementById("search-modal")) return;
  // 헤더에 .search 트리거가 없는 페이지(임베드 위젯 등)에서는 마운트하지 않음
  if (!document.querySelector(".search")) return;

  const modal = document.createElement("div");
  modal.id = "search-modal";
  modal.className = "search-modal";
  modal.innerHTML = `
    <div class="search-box" role="dialog" aria-label="검색">
      <div class="search-input-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="search-modal-input" type="search" placeholder="제목, 요약, 카테고리로 검색..." autocomplete="off" />
        <kbd>ESC</kbd>
      </div>
      <div class="search-results" id="search-results">
        <div class="empty">검색어를 입력하세요.</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const input  = modal.querySelector("#search-modal-input");
  const result = modal.querySelector("#search-results");
  let posts    = [];

  const open = async () => {
    modal.classList.add("open");
    setTimeout(() => input.focus(), 50);
    if (posts.length === 0) posts = await loadSearchIndex();
  };
  const close = () => { modal.classList.remove("open"); input.value = ""; render(""); };

  const render = (q) => {
    if (!q) {
      result.innerHTML = `<div class="empty">검색어를 입력하세요.</div>`;
      return;
    }
    const lc = q.toLowerCase();
    const hits = posts.filter(p =>
      (p.subject || "").toLowerCase().includes(lc) ||
      (p.summary || "").toLowerCase().includes(lc) ||
      (p.category_name || "").toLowerCase().includes(lc)
    ).slice(0, 12);

    if (hits.length === 0) {
      result.innerHTML = `<div class="empty">"${escapeHtml(q)}"에 대한 결과가 없습니다.</div>`;
      return;
    }
    result.innerHTML = hits.map(p => `
      <a class="search-result" href="${postUrl(p)}">
        <div class="cat">${escapeHtml(p.category_name || "인사이트")}</div>
        <h5>${highlight(p.subject, q)}</h5>
        <p>${highlight(p.summary || "", q)}</p>
      </a>
    `).join("");
  };

  // 입력
  input.addEventListener("input", (e) => render(e.target.value.trim()));

  // 닫기: ESC, 배경 클릭
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
    // Cmd/Ctrl+K로 열기
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      modal.classList.contains("open") ? close() : open();
    }
  });

  // 헤더의 모든 .search 클릭/포커스 시 모달 열기
  document.querySelectorAll(".search input").forEach(el => {
    el.addEventListener("focus", (e) => { e.target.blur(); open(); });
    el.addEventListener("click", open);
  });
  document.querySelectorAll(".search").forEach(el => {
    el.addEventListener("click", open);
  });
}

document.addEventListener("DOMContentLoaded", mountSearch);

function filterByCategory(posts, slug) {
  if (!slug) return posts;
  const name = CATEGORIES[slug]?.name;
  if (!name) return posts;
  return posts.filter(p => (p.category_name || "").trim() === name);
}

// =====================================================
// 페이지별 초기화
// =====================================================
const PER_PAGE = 12;

async function initHome() {
  renderSkeletons("featured-grid", 6);

  let posts = MOCK_POSTS;
  let usedMock = false;

  try {
    const result = await fetchPosts({ limit: 20 });
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
  renderFeaturedCards("featured-grid", posts.slice(1), 6);     // 3 x 2 = 6
  renderRecentList("recent-list", posts, 7, 6);
}

async function initCategory(slug) {
  const params = new URLSearchParams(window.location.search);
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));

  renderSkeletons("featured-grid", PER_PAGE);

  let posts = MOCK_POSTS;
  let usedMock = false;

  try {
    const result = await fetchPosts({ limit: 200, category: CATEGORIES[slug]?.name });
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

  const total = posts.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const pageItems = posts.slice(start, start + PER_PAGE);

  renderFeaturedCards("featured-grid", pageItems, PER_PAGE);
  renderPagination("pagination", { page, pages, baseUrl: window.location.pathname });
}

// =====================================================
// 페이지네이션 렌더러
// =====================================================
function renderPagination(targetId, { page, pages, baseUrl }) {
  const el = document.getElementById(targetId);
  if (!el) return;
  if (pages <= 1) { el.innerHTML = ""; return; }

  const href = (p) => `${baseUrl}?page=${p}`;
  const parts = [];

  // Prev
  if (page > 1) parts.push(`<a href="${href(page - 1)}" class="prev" aria-label="이전 페이지">‹</a>`);
  else parts.push(`<span class="disabled">‹</span>`);

  // 번호: 최대 7개 창 (현재 페이지 중심)
  const window_ = 2;
  let from = Math.max(1, page - window_);
  let to   = Math.min(pages, page + window_);
  if (to - from < 4) {
    if (from === 1) to = Math.min(pages, from + 4);
    if (to === pages) from = Math.max(1, to - 4);
  }

  if (from > 1) {
    parts.push(`<a href="${href(1)}">1</a>`);
    if (from > 2) parts.push(`<span class="gap">…</span>`);
  }
  for (let i = from; i <= to; i++) {
    if (i === page) parts.push(`<span class="current">${i}</span>`);
    else parts.push(`<a href="${href(i)}">${i}</a>`);
  }
  if (to < pages) {
    if (to < pages - 1) parts.push(`<span class="gap">…</span>`);
    parts.push(`<a href="${href(pages)}">${pages}</a>`);
  }

  // Next
  if (page < pages) parts.push(`<a href="${href(page + 1)}" class="next" aria-label="다음 페이지">›</a>`);
  else parts.push(`<span class="disabled">›</span>`);

  el.innerHTML = parts.join("");
}
