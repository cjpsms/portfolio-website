(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------- top bar ---------- */
  const topbar = document.getElementById('topbar');
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.getElementById('navLinks');
  const onScroll = () => topbar.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('is-open')));
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  function observeReveal(root) { root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el)); }
  observeReveal(document);

  /* ---------- hero typing ---------- */
  const typedEl = document.getElementById('typed');
  const caret = document.querySelector('.caret');
  const phrases = [
    'เครื่องมือบน Linux',
    'เกมสอนเทอร์มินัล',
    'ระบบตรวจโค้ด',
    'บอทที่ใช้ AI',
    'ตู้ล็อกเกอร์อัจฉริยะ',
    'เซิร์ฟเวอร์ที่บ้าน',
  ];
  // Thai combining marks must stay with their base letter, so split by grapheme.
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));

  async function typeLoop() {
    if (reduced) { typedEl.textContent = phrases[0]; return; }
    let i = 0;
    for (;;) {
      const g = graphemes(phrases[i]);
      caret.classList.add('is-typing');
      for (let k = 1; k <= g.length; k++) { typedEl.textContent = g.slice(0, k).join(''); await sleep(70 + Math.random() * 60); }
      caret.classList.remove('is-typing');
      await sleep(1900);
      caret.classList.add('is-typing');
      for (let k = g.length - 1; k >= 0; k--) { typedEl.textContent = g.slice(0, k).join(''); await sleep(32); }
      await sleep(260);
      i = (i + 1) % phrases.length;
    }
  }
  typeLoop();

  /* ---------- terminal demo on the stage ---------- */
  const termBody = document.getElementById('termBody');
  const PROMPT = '<span class="c-green">cj@arch</span>:<span class="c-blue">~</span>$ ';
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const scenes = [
    {
      cmd: 'clauderun "หาไฟล์ที่ใหญ่ที่สุด 5 อัน"',
      out: [
        '<span class="c-dim">คิดอยู่...</span>',
        '<span class="c-amber">du -ah . | sort -rh | head -5</span>',
        'รันเลยไหม [y/N] y',
        '<span class="c-dim">2.1G</span>  ./Videos/trip.mkv',
        '<span class="c-dim">840M</span>  ./Downloads/arch.iso',
        '<span class="c-dim">312M</span>  ./program/fly-brain-sim/data',
      ],
    },
    {
      cmd: 'claudeinstall "โปรแกรมตัดต่อวิดีโอ"',
      out: [
        '<span class="c-dim">ไม่เจอชื่อตรง ๆ ถาม AI...</span>',
        'เจอ <span class="c-pink">kdenlive</span> ใน <span class="c-blue">pacman</span> (extra)',
        '<span class="c-amber">sudo pacman -S kdenlive</span>',
        'ติดตั้งเลยไหม [y/N] y',
        '<span class="c-green">ติดตั้งเสร็จแล้ว</span>',
      ],
    },
    {
      cmd: 'archinfo --once',
      out: [
        '<span class="c-blue">arch</span> · linux 7.2 · up 3d 4h',
        'cpu   <span class="c-green">████░░░░░░</span> 38%  52°C',
        'ram   <span class="c-amber">██████░░░░</span> 9.4/16G',
        'disk  <span class="c-green">███░░░░░░░</span> 31%',
        'net   <span class="c-green">online</span>  ↓ 4.2 MB/s  ↑ 310 KB/s',
        'pacman  <span class="c-pink">12</span> อัปเดตรออยู่',
      ],
    },
  ];

  async function termLoop() {
    if (!termBody) return;
    let lines = [];
    const render = (extra = '') => { termBody.innerHTML = lines.join('\n') + (extra ? '\n' + extra : ''); };
    if (reduced) {
      const s = scenes[0];
      termBody.innerHTML = PROMPT + esc(s.cmd) + '\n' + s.out.join('\n');
      return;
    }
    for (let i = 0; ; i = (i + 1) % scenes.length) {
      const s = scenes[i];
      lines = [];
      const g = graphemes(s.cmd);
      for (let k = 0; k <= g.length; k++) {
        termBody.innerHTML = PROMPT + esc(g.slice(0, k).join('')) + '<span class="cursor-block"></span>';
        await sleep(k === 0 ? 700 : 45 + Math.random() * 55);
      }
      lines.push(PROMPT + esc(s.cmd));
      await sleep(350);
      for (const line of s.out) { lines.push(line); render(); await sleep(260 + Math.random() * 260); }
      render(PROMPT + '<span class="cursor-block"></span>');
      await sleep(2600);
    }
  }
  // start the terminal only once the stage is on screen
  const stage = document.getElementById('stage');
  if (stage) {
    const so = new IntersectionObserver(([e]) => { if (e.isIntersecting) { so.disconnect(); termLoop(); } });
    so.observe(stage);
  }

  /* ---------- timeline accordion ---------- */
  const tls = document.querySelectorAll('.tl');
  tls.forEach((tl) => tl.addEventListener('click', () => {
    const open = !tl.classList.contains('is-open');
    tls.forEach((t) => { t.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); });
    if (open) { tl.classList.add('is-open'); tl.setAttribute('aria-expanded', 'true'); }
  }));

  /* ---------- tools rail (from /api/repos) ---------- */
  const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', Shell: '#89e051',
    Kotlin: '#A97BFF', 'C++': '#f34b7d', C: '#555555', HTML: '#e34c26', CSS: '#663399', Lua: '#000080', QML: '#44a51c',
  };
  const rail = document.getElementById('rail');
  const filtersEl = document.getElementById('filters');
  const sourceEl = document.getElementById('repoSource');
  const prev = document.getElementById('railPrev');
  const next = document.getElementById('railNext');

  const dateFmt = new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric' });

  function card(r) {
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.tags = (r.tags || []).join('|');
    const lang = r.language ? `<span class="card__lang" style="--c:${LANG_COLORS[r.language] || '#9aa0a6'}"><i></i>${esc(r.language)}</span>` : '<span></span>';
    const tags = (r.tags || []).slice(0, 2).map((t) => `<span>${esc(t)}</span>`).join('');
    const when = r.updated ? `<time datetime="${r.updated}">${dateFmt.format(new Date(r.updated))}</time>` : '<span></span>';
    const live = r.homepage ? `<a href="${encodeURI(r.homepage)}" target="_blank" rel="noopener">ลองเล่น <span class="arrow">&rarr;</span></a>` : '';
    el.innerHTML = `
      <div class="card__top">${lang}<span class="card__tags">${tags}</span></div>
      <h3>${esc(r.name)}</h3>
      <p>${esc(r.th || '')}</p>
      <div class="card__foot">${when}<span style="display:flex;gap:16px">${live}<a href="${encodeURI(r.url)}" target="_blank" rel="noopener">โค้ด <span class="arrow">&rarr;</span></a></span></div>`;
    return el;
  }

  function updateNav() {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max;
  }
  function step() {
    const c = rail.querySelector('.card:not(.is-hidden)');
    return c ? c.getBoundingClientRect().width + 16 : 320;
  }
  prev.addEventListener('click', () => rail.scrollBy({ left: -step() * 2 }));
  next.addEventListener('click', () => rail.scrollBy({ left: step() * 2 }));
  rail.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);

  function buildFilters(repos) {
    const counts = new Map();
    repos.forEach((r) => (r.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    const tags = ['ทั้งหมด', ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)];
    filtersEl.innerHTML = '';
    tags.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'filter'; b.type = 'button'; b.role = 'tab';
      b.textContent = t; b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', () => {
        filtersEl.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-selected', 'false'));
        b.setAttribute('aria-selected', 'true');
        rail.querySelectorAll('.card').forEach((c) => {
          c.classList.toggle('is-hidden', i !== 0 && !c.dataset.tags.split('|').includes(t));
        });
        rail.scrollTo({ left: 0 });
        requestAnimationFrame(updateNav);
      });
      filtersEl.appendChild(b);
    });
  }

  async function loadRepos() {
    try {
      const res = await fetch('/api/repos');
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      const tools = data.repos.filter((r) => !r.featured);
      rail.innerHTML = '';
      tools.forEach((r) => rail.appendChild(card(r)));
      buildFilters(tools);
      sourceEl.textContent = data.source === 'github' ? `${data.repos.length} โปรเจกต์` : 'ตอนนี้ต่อ GitHub ไม่ได้ ใช้รายการในเครื่องแทน';

      const langs = new Set(data.repos.map((r) => r.language).filter(Boolean));
      document.getElementById('statRepos').textContent = data.repos.length;
      if (langs.size) document.getElementById('statLangs').textContent = langs.size;
      updateNav();
    } catch (err) {
      sourceEl.textContent = 'โหลดรายการไม่สำเร็จ';
      rail.innerHTML = '<article class="card"><h3>ดูทั้งหมดบน GitHub</h3><p>โหลดรายการโปรเจกต์ไม่สำเร็จ ลองเปิดหน้า GitHub โดยตรง</p><div class="card__foot"><span></span><a href="https://github.com/cjpsms?tab=repositories" target="_blank" rel="noopener">github.com/cjpsms <span class="arrow">&rarr;</span></a></div></article>';
      updateNav();
    }
  }
  loadRepos();
})();
