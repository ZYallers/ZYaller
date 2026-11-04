/* ZYALLER 技术博客 SPA — hash 路由，支持 file:// 直接打开 */
(function () {
  'use strict';

  const { categories, articles, gradients, backgrounds = [], sections = [] } = window.BLOG_DATA;
  const app = document.getElementById('app');
  const searchInput = document.getElementById('searchInput');
  const backTop = document.getElementById('backTop');

  document.getElementById('headerStats').innerHTML =
    `<b>${articles.length}</b> 篇文章 · <b>${categories.length}</b> 个分类`;

  // 每次打开随机挑一张背景图
  (function initBackground() {
    const layer = document.getElementById('bgLayer');
    if (!layer || !backgrounds.length) return;
    const pick = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    const probe = new Image();
    probe.onload = () => {
      layer.style.backgroundImage = `url("${pick}")`;
      layer.classList.add('loaded');
    };
    probe.src = pick;
  })();

  // 图片加载失败时的兜底：换成 static/section 里的随机图（每张只兜底一次，避免死循环）
  window.__coverFallback = function (el) {
    if (el.dataset.fallback === '1' || !sections.length) { el.style.visibility = 'hidden'; return; }
    el.dataset.fallback = '1';
    el.src = sections[Math.floor(Math.random() * sections.length)];
  };
  const randomSection = () => sections.length
    ? sections[Math.floor(Math.random() * sections.length)] : '';

  // 正文图片加载失败时的通用占位图（内嵌 SVG，不依赖网络）
  const BROKEN_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#e4eaf2"/>
        </linearGradient>
        <linearGradient id="ic" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#b7c4d6"/><stop offset="1" stop-color="#8fa1b8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#bg)"/>
      <circle cx="120" cy="90" r="3" fill="#d3dce8"/>
      <circle cx="690" cy="330" r="4" fill="#d3dce8"/>
      <circle cx="640" cy="80" r="2.5" fill="#d3dce8"/>
      <circle cx="160" cy="330" r="2.5" fill="#d3dce8"/>
      <rect x="340" y="118" width="120" height="96" rx="14" fill="none" stroke="url(#ic)" stroke-width="5"/>
      <circle cx="370" cy="146" r="9" fill="url(#ic)"/>
      <path d="M346 202 L382 166 L404 188 L420 174 L454 202 Z" fill="url(#ic)"/>
      <text x="400" y="264" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif"
            font-size="26" fill="#7c8ca0" letter-spacing="1">图片加载失败</text>
      <text x="400" y="298" text-anchor="middle" font-family="PingFang SC, Microsoft YaHei, sans-serif"
            font-size="16" fill="#a3b0c2" letter-spacing="0.5">原图可能已失效，或被限制访问</text>
    </svg>`
  );

  // 给正文里的图片兜底：加载失败换成占位图，并把原地址放进 tooltip
  function bindContentImages(root) {
    root.querySelectorAll('.md img').forEach(img => {
      const apply = () => {
        if (img.dataset.broken === '1') return;
        img.dataset.broken = '1';
        if (!img.title) img.title = img.getAttribute('src') || '';
        img.src = BROKEN_IMG;
        img.alt = '图片加载失败';
        img.classList.add('img-broken');
      };
      img.addEventListener('error', apply);
      // 缓存里已判失败的图不会再触发 error，这里补一刀
      if (img.complete && img.naturalWidth === 0) apply();
    });
  }

  const ROWS_PER_PAGE = 5;
  // 首屏按「5 行」算：用当前容器宽度换算出实际列数（桌面 3 列=15 篇，手机 1 列=5 篇）
  function pageSize() {
    const width = (app.clientWidth || 1080) - 40; // 去掉左右 padding
    const cols = Math.max(1, Math.floor((width + 18) / 318)); // 卡片最小 300px + gap 18
    return cols * ROWS_PER_PAGE;
  }
  const state = { cat: 'all', keyword: '', shown: pageSize() };

  // ---------- 工具 ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function gradientFor(article) {
    let h = 0;
    for (const ch of article.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = gradients[h % gradients.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
  }

  // 每篇文章的兜底图在本次会话内固定，避免「加载更多」时图片乱跳
  const coverCache = new Map();
  function pickFallback(a) {
    if (!sections.length) return '';
    if (!coverCache.has(a.id)) {
      coverCache.set(a.id, sections[Math.floor(Math.random() * sections.length)]);
    }
    return coverCache.get(a.id);
  }

  // ---------- 路由解析 ----------
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h) return { view: 'home' };
    const parts = h.split('/').map(decodeURIComponent);
    if (parts[0] === 'article' && parts.length >= 3) {
      return { view: 'article', cat: parts[1], file: parts.slice(2).join('/') };
    }
    if (parts[0] === 'cat' && parts[1]) {
      return { view: 'home', cat: parts[1] };
    }
    return { view: 'home' };
  }

  // ---------- 列表页 ----------
  function filteredArticles() {
    const kw = state.keyword.trim().toLowerCase();
    return articles.filter(a => {
      if (state.cat !== 'all' && a.cat !== state.cat) return false;
      if (kw && !(a.title.toLowerCase().includes(kw) || a.excerpt.toLowerCase().includes(kw))) return false;
      return true;
    });
  }

  function cardHTML(a) {
    const src = a.cover || pickFallback(a);
    return `
      <article class="card" data-id="${esc(a.id)}">
        <div class="card-cover" style="background:${gradientFor(a)}">
          <img src="${esc(src)}" alt="${esc(a.title)}" loading="lazy" onerror="__coverFallback(this)">
          <span class="cat-badge">${esc(a.catLabel)}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${esc(a.title)}</div>
          <div class="card-excerpt">${esc(a.excerpt)}</div>
          <div class="card-meta"><span>${esc(a.date || '')}</span></div>
        </div>
      </article>`;
  }

  function renderHome() {
    const list = filteredArticles();
    const shown = list.slice(0, state.shown);
    const catLabel = state.cat === 'all' ? '全部文章'
      : (categories.find(c => c.key === state.cat) || {}).label || state.cat;

    app.innerHTML = `
      <div class="cat-bar">
        <span class="chip ${state.cat === 'all' ? 'active' : ''}" data-cat="all">全部<span class="cnt">${articles.length}</span></span>
        ${categories.map(c => `
          <span class="chip ${state.cat === c.key ? 'active' : ''}" data-cat="${esc(c.key)}">
            ${esc(c.label)}<span class="cnt">${c.count}</span>
          </span>`).join('')}
      </div>
      <div class="list-head">
        <h2>${esc(catLabel)}</h2>
        <span>${list.length} 篇${state.keyword ? ` · 关键词“${esc(state.keyword)}”` : ''}</span>
      </div>
      ${shown.length ? `
        <div class="grid">${shown.map(cardHTML).join('')}</div>
        ${list.length > shown.length ? `<button class="load-more" id="loadMore">加载更多（还有 ${list.length - shown.length} 篇）</button>` : ''}
      ` : `<div class="empty">没有找到匹配的文章，换个关键词试试？</div>`}
    `;

    app.querySelectorAll('.chip').forEach(el => {
      el.addEventListener('click', () => {
        state.cat = el.dataset.cat;
        state.shown = pageSize();
        location.hash = state.cat === 'all' ? '#/' : `#/cat/${encodeURIComponent(state.cat)}`;
        renderHome();
      });
    });
    app.querySelectorAll('.card').forEach(el => {
      el.addEventListener('click', () => {
        location.hash = `#/article/${el.dataset.id.split('/').map(encodeURIComponent).join('/')}`;
      });
    });
    const more = document.getElementById('loadMore');
    if (more) more.addEventListener('click', () => { state.shown += pageSize(); renderHome(); });
  }

  // ---------- 详情页 ----------
  marked.setOptions({ breaks: true, gfm: true });

  function renderArticle(cat, file) {
    const a = articles.find(x => x.cat === cat && x.file === file);
    if (!a) { app.innerHTML = `<div class="empty">文章不存在 <a href="#/">返回首页</a></div>`; return; }

    const catArticles = articles.filter(x => x.cat === a.cat);
    const idx = catArticles.indexOf(a);
    const prev = catArticles[idx + 1], next = catArticles[idx - 1];

    const html = marked.parse(a.content);
    app.innerHTML = `
      <div class="article-wrap">
        <a class="back-link" href="#/cat/${encodeURIComponent(a.cat)}">← 返回 ${esc(a.catLabel)}</a>
        <img class="article-cover" src="${esc(a.cover || pickFallback(a))}" alt="${esc(a.title)}" onerror="__coverFallback(this)">
        <h1 class="article-title">${esc(a.title)}</h1>
        <div class="article-meta">
          <a class="cat-badge2" href="#/cat/${encodeURIComponent(a.cat)}">${esc(a.catLabel)}</a>
          ${a.date ? `<span>📅 ${esc(a.date)}</span>` : ''}
          ${a.author ? `<span>✍️ ${a.authorUrl ? `<a href="${esc(a.authorUrl)}" target="_blank" rel="noopener">${esc(a.author)}</a>` : esc(a.author)}</span>` : ''}
        </div>
        <div class="md">${html}</div>
        <div class="article-nav">
          ${prev ? `<a href="#/article/${encodeURIComponent(prev.cat)}/${encodeURIComponent(prev.file)}">← ${esc(prev.title)}</a>` : '<span></span>'}
          ${next ? `<a href="#/article/${encodeURIComponent(next.cat)}/${encodeURIComponent(next.file)}" style="text-align:right">${esc(next.title)} →</a>` : '<span></span>'}
        </div>
      </div>`;
    app.querySelectorAll('pre code').forEach(block => {
      try { hljs.highlightElement(block); } catch (e) { /* ignore */ }
    });
    bindContentImages(app);
    window.scrollTo(0, 0);
  }

  // ---------- 路由入口 ----------
  function route() {
    const r = parseHash();
    if (r.view === 'article') {
      searchInput.value = '';
      state.keyword = '';
      renderArticle(r.cat, r.file);
    } else {
      if (r.cat) { state.cat = r.cat; state.shown = pageSize(); }
      renderHome();
    }
  }

  searchInput.addEventListener('input', () => {
    state.keyword = searchInput.value;
    state.shown = pageSize();
    if (parseHash().view !== 'home') location.hash = '#/';
    else renderHome();
  });

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 400);
  });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  route();
})();
