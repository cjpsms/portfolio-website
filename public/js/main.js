(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- header ---------- */
  const header = document.getElementById('header');
  const menu = document.getElementById('menu');
  const nav = document.getElementById('nav');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => { nav.classList.toggle('is-open', open); menu.setAttribute('aria-expanded', String(open)); };
  menu.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- typewriter ---------- */
  // Thai combining marks must stay with their base letter, so step by grapheme.
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));

  // ghost text -> [{g: grapheme, em: bool}] so gray <em> parts keep their colour while typing
  function units(ghost) {
    const out = [];
    ghost.childNodes.forEach((n) => {
      const em = n.nodeType === 1 && n.tagName === 'EM';
      graphemes(n.textContent).forEach((g) => out.push({ g, em }));
    });
    return out;
  }
  function html(list) {
    let s = '', inEm = false;
    for (const u of list) {
      if (u.em !== inEm) { s += u.em ? '<em>' : '</em>'; inEm = u.em; }
      s += esc(u.g);
    }
    return inEm ? s + '</em>' : s;
  }
  async function type(tw, { speed = 38, jitter = 30 } = {}) {
    const live = tw.querySelector('.tw__live');
    const list = units(tw.querySelector('.tw__ghost'));
    if (reduced) { live.innerHTML = html(list); return; }
    tw.classList.add('is-typing');
    for (let i = 1; i <= list.length; i++) {
      live.innerHTML = html(list.slice(0, i));
      await sleep(speed + Math.random() * jitter);
    }
    tw.classList.remove('is-typing');
    tw.classList.add('is-done');
  }

  // hero types on load, then the rest of the hero fades in
  const heroTw = document.querySelector('.tw[data-type="hero"]');
  const heroAfter = document.getElementById('heroAfter');
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(async () => {
    await sleep(reduced ? 0 : 350);
    await type(heroTw, { speed: 42, jitter: 40 });
    heroAfter.classList.add('is-in');
  });

  // the rest type once scrolled into view
  const typeIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { typeIo.unobserve(e.target); type(e.target, { speed: 24, jitter: 20 }); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('.tw[data-type="scroll"]').forEach((el) => typeIo.observe(el));

  /* ---------- showcase card ---------- */
  const SHOW = [
    { name: 'Grader-kak', kicker: 'ระบบตรวจโค้ด · JavaScript', desc: 'ระบบตรวจโค้ดออนไลน์ที่ทำกับเพื่อนที่ค่าย สอวน' },
    { name: 'ล่ามเชลล์', kicker: 'เกม · เล่นได้บนเว็บ', desc: 'เกมสอนใช้ Linux ให้นักเรียน พิมพ์ไทยได้ AI แปลเป็นคำสั่งให้' },
    { name: 'openbox', kicker: 'ฮาร์ดแวร์ + AI · Python', desc: 'ตู้ล็อกเกอร์รับพัสดุ สั่งผ่านบอท Telegram' },
    { name: 'claudeinstall', kicker: 'เครื่องมือ Linux · Python', desc: 'ติดตั้งโปรแกรมด้วยคำอธิบายภาษาคน' },
    { name: 'sensor-AI', kicker: 'ฮาร์ดแวร์ + AI · TypeScript', desc: 'ผู้ช่วยสั่งงานในบ้านด้วยเสียง ผ่าน Raspberry Pi Pico W' },
  ];
  const DUR = 4500;
  const showcase = document.getElementById('showcase');
  const scContent = showcase.querySelector('.showcase__content');
  const scKicker = document.getElementById('scKicker');
  const scTitle = document.getElementById('scTitle');
  const scDesc = document.getElementById('scDesc');
  const scDots = document.getElementById('scDots');
  let scIndex = 0, scTimer = 0, scVisible = false;

  const dots = SHOW.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', s.name);
    b.style.setProperty('--dur', DUR + 'ms');
    b.addEventListener('click', () => go(i));
    scDots.appendChild(b);
    return b;
  });
  function paintDots() {
    dots.forEach((d, i) => {
      d.classList.remove('is-on');
      d.classList.toggle('is-done', i < scIndex);
      d.setAttribute('aria-selected', String(i === scIndex));
    });
    void dots[scIndex].offsetWidth; // restart the fill animation
    if (scVisible && !reduced) dots[scIndex].classList.add('is-on');
  }
  async function go(i) {
    clearTimeout(scTimer);
    scIndex = (i + SHOW.length) % SHOW.length;
    scContent.classList.add('is-out');
    await sleep(reduced ? 0 : 380);
    const s = SHOW[scIndex];
    scKicker.textContent = s.kicker; scTitle.textContent = s.name; scDesc.textContent = s.desc;
    scContent.classList.remove('is-out');
    paintDots();
    if (scVisible && !reduced) scTimer = setTimeout(() => go(scIndex + 1), DUR);
  }
  new IntersectionObserver(([e]) => {
    scVisible = e.isIntersecting;
    clearTimeout(scTimer);
    if (scVisible) { paintDots(); if (!reduced) scTimer = setTimeout(() => go(scIndex + 1), DUR); }
  }, { threshold: 0.3 }).observe(showcase);
  paintDots();

  /* ---------- arc of icons ---------- */
  const arc = document.getElementById('arc');
  const arcItems = Array.from(arc.children);
  function layoutArc() {
    const w = arc.clientWidth, h = arc.clientHeight;
    const shown = arcItems.filter((el) => getComputedStyle(el).display !== 'none');
    const n = shown.length;
    const pad = Math.min(60, w * 0.06);
    shown.forEach((el, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const x = pad + t * (w - pad * 2);
      const y = h - 30 - Math.sin(Math.PI * t) * (h - 70);
      el.style.setProperty('--x', x + 'px');
      el.style.setProperty('--y', y + 'px');
      el.style.setProperty('--d', (-i * 0.4) + 's');
    });
  }
  new ResizeObserver(layoutArc).observe(arc);

  /* ---------- project rail (from /api/repos) ---------- */
  const COVERS = {
    Python: ['#2a63c9', '#e0b31a'], JavaScript: ['#c9a400', '#e8590c'], TypeScript: ['#1f6feb', '#7c4dff'],
    Shell: ['#2f9e44', '#1c7ed6'], Kotlin: ['#7c4dff', '#e64980'], 'C++': ['#d6336c', '#5f3dc4'],
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
    const [c1, c2] = COVERS[r.language] || ['#3c4a63', '#5b4b8a'];
    const meta = [r.language, r.updated ? dateFmt.format(new Date(r.updated)) : null].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('');
    const live = r.homepage ? `<a href="${esc(r.homepage)}" target="_blank" rel="noopener">ลองเล่น</a>` : '';
    el.innerHTML = `
      <a class="card__cover" href="${esc(r.url)}" target="_blank" rel="noopener" style="--c1:${c1};--c2:${c2}" tabindex="-1" aria-hidden="true"><span>${esc(r.name)}</span></a>
      <h3>${esc(r.name)}</h3>
      <div class="card__meta">${meta}</div>
      <p>${esc(r.th || '')}</p>
      <div class="card__links">${live}<a href="${esc(r.url)}" target="_blank" rel="noopener">ดูโค้ด</a></div>`;
    return el;
  }

  function updateNav() {
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }
  const step = () => { const c = rail.querySelector('.card:not(.is-hidden)'); return c ? c.getBoundingClientRect().width + 20 : 320; };
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
      b.className = 'filter'; b.type = 'button'; b.setAttribute('role', 'tab');
      b.textContent = t; b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', () => {
        filtersEl.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-selected', 'false'));
        b.setAttribute('aria-selected', 'true');
        rail.querySelectorAll('.card').forEach((c) => c.classList.toggle('is-hidden', i !== 0 && !c.dataset.tags.split('|').includes(t)));
        rail.scrollTo({ left: 0 });
        requestAnimationFrame(updateNav);
      });
      filtersEl.appendChild(b);
    });
  }

  fetch('/api/repos')
    .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then((data) => {
      const others = data.repos.filter((r) => !r.featured);
      rail.innerHTML = '';
      others.forEach((r) => rail.appendChild(card(r)));
      buildFilters(others);
      sourceEl.textContent = data.source === 'github' ? `${data.repos.length} โปรเจกต์ · อัปเดตจาก GitHub` : 'ต่อ GitHub ไม่ได้ ใช้รายการในเครื่องแทน';
      updateNav();
    })
    .catch(() => {
      sourceEl.textContent = 'โหลดรายการไม่สำเร็จ';
      rail.innerHTML = '<article class="card"><h3>ดูทั้งหมดบน GitHub</h3><p>โหลดรายการโปรเจกต์ไม่สำเร็จ ลองเปิดหน้า GitHub โดยตรง</p><div class="card__links"><a href="https://github.com/cjpsms?tab=repositories" target="_blank" rel="noopener">github.com/cjpsms</a></div></article>';
      updateNav();
    });
})();
