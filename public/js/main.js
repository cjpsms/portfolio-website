(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motion = !!(window.gsap && window.ScrollTrigger) && !reduced;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad2 = (n) => String(n).padStart(2, '0');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  if (motion) gsap.registerPlugin(ScrollTrigger);
  // triggers are created out of page order (the gallery fills in later), so sort before measuring
  const refresh = () => { if (motion) { ScrollTrigger.sort(); ScrollTrigger.refresh(); } };

  // Fonts must be in before particles sample text, and before ScrollTrigger measures anything.
  const fontsReady = (document.fonts
    ? Promise.all([
      document.fonts.ready,
      document.fonts.load('500 80px "Google Sans Flex"', 'Grader-kak'),
      document.fonts.load('500 80px "Noto Sans Thai"', 'ล่ามเชลล์'),
    ])
    : Promise.resolve()).catch(() => {});
  // never hold the hero back for slow fonts
  const heroReady = Promise.race([fontsReady, sleep(700)]);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.13, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToY(target) {
    if (lenis) return lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
    const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- header ---------- */
  const header = $('#header');
  const menu = $('#menu');
  const nav = $('#nav');
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 4);
    if (y < 120 || y < lastY - 3) header.classList.remove('is-hidden');
    else if (y > lastY + 3 && !nav.classList.contains('is-open')) header.classList.add('is-hidden');
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => { nav.classList.toggle('is-open', open); menu.setAttribute('aria-expanded', String(open)); };
  menu.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const el = id === '#top' ? null : document.querySelector(id);
    if (id !== '#top' && !el) return;
    e.preventDefault();
    setMenu(false);
    scrollToY(el || 0);
  });

  /* ---------- cursor + magnetic buttons ---------- */
  if (motion && fine) {
    const cursor = $('#cursor');
    cursor.innerHTML = '<span></span>';
    const label = cursor.firstChild;
    gsap.set(cursor, { x: -100, y: -100, scale: 0.12 });
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
    let mode = '';
    window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); cursor.classList.add('is-on'); }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const tag = t.closest('[data-cursor]');
      const hot = !tag && t.closest('a, button, .arc__item, input');
      const dark = !!t.closest('.showcase, .cta, .story-card--now, .gcard__cover');
      const next = tag ? 'label' : hot ? 'hot' : 'dot';
      cursor.style.background = dark ? '#fff' : '';
      cursor.style.color = dark ? 'var(--ink)' : '';
      if (next === mode && next !== 'label') return;
      mode = next;
      cursor.classList.toggle('is-label', next === 'label');
      if (next === 'label') label.textContent = tag.dataset.cursor;
      gsap.to(cursor, { scale: next === 'label' ? 1 : next === 'hot' ? 0 : 0.12, duration: 0.4, ease: 'power3.out' });
    });

    $$('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      const my = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3);
        my((e.clientY - r.top - r.height / 2) * 0.45);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------- word splitting ---------- */
  // Thai has no spaces, so split by dictionary words; each word gets its own span.
  const wordSeg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  function splitWords(el, cls) {
    const out = [];
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const parts = wordSeg ? Array.from(wordSeg.segment(n.textContent), (s) => s.segment) : n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement('span');
            w.className = cls;
            const inner = document.createElement('span');
            inner.textContent = p;
            w.appendChild(inner);
            frag.appendChild(w);
            out.push(inner);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
    return out;
  }

  /* ---------- typewriter (hero) ---------- */
  // Thai combining marks must stay with their base letter, so step by grapheme.
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? Array.from(seg.segment(s), (x) => x.segment) : Array.from(s));
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

  /* ---------- hero ---------- */
  const heroField = new Field($('#heroField'), {
    shape: 'arch',
    palette: ['#4f7cff', '#6a6cff', '#8b5cf6', '#c056e0', '#f0568f', '#ff7a45', '#ffb020'],
    density: 430, max: 2800, size: [1.1, 1.9], alpha: [0.4, 0.95], repel: 130,
  });
  const ctaField = new Field($('#ctaField'), {
    shape: 'ring', palette: ['#ffffff', '#ffffff', '#ffffff', '#9db4ff', '#b9a3ff', '#7fd3ff'],
    density: 320, max: 2600, tilt: 0.8, band: 0.9, textH: 0.42, repel: 90,
  });
  const morphField = new Field($('#morphField'), {
    shape: 'ring', palette: ['#ffffff', '#ffffff', '#ffffff', '#9db4ff', '#b9a3ff', '#7fd3ff'],
    density: 300, max: 3400, tilt: 0.78, band: 0.8, textH: 0.26, size: [1.1, 1.9], alpha: [0.4, 0.95], repel: 100,
  });
  function layoutFields() {
    const m = window.innerWidth < 760;
    Object.assign(heroField.o, m ? { cx: 0.5, cy: 1.02, scale: 1, scaleY: 0.32 } : { cx: 0.72, cy: 1.06, scale: 0.5, scaleY: 0.84 });
    Object.assign(morphField.o, m ? { cx: 0.5, cy: 0.4, textCy: 0.38, scale: 0.42, textW: 0.86 } : { cx: 0.5, cy: 0.45, textCy: 0.42, scale: 0.36, textW: 0.74 });
    Object.assign(ctaField.o, m ? { cx: 0.5, cy: 0.78, textCy: 0.78, scale: 0.42, textW: 0.8, textH: 0.24 } : { cx: 0.75, cy: 0.5, textCy: 0.5, scale: 0.34, textW: 0.36, textH: 0.5 });
  }
  layoutFields();
  window.addEventListener('resize', layoutFields);

  const heroTw = $('.tw[data-type="hero"]');
  const heroAfter = $('#heroAfter');
  fontsReady.then(refresh);
  heroReady.then(async () => {
    // the rest of the hero shows right away; the headline types fast alongside it
    heroAfter.classList.add('is-in');
    await type(heroTw, { speed: 16, jitter: 14 });
  });

  if (motion) {
    gsap.to('#heroInner', {
      y: -140, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: (s) => heroField.setScatter(s.progress) },
    });
    gsap.to('#scrollHint', { opacity: 0, scrollTrigger: { trigger: '#hero', start: 'top top', end: '15% top', scrub: true } });
  }

  /* ---------- repos (shared by showcase, gallery, sheet) ---------- */
  let repos = [];
  const reposReady = fetch('/api/repos')
    .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
    .then((data) => { repos = data.repos || []; return data; });
  const repoFor = (name) => repos.find((r) => r.name.toLowerCase() === name.toLowerCase());

  /* ---------- showcase: dots morph into project names while pinned ---------- */
  const SHOW = [
    { repo: 'Grader-kak', name: 'Grader-kak', kicker: 'ระบบตรวจโค้ด · JavaScript', desc: 'ระบบตรวจโค้ดออนไลน์ที่ทำกับเพื่อนที่ค่าย สอวน' },
    { repo: 'lamshell', name: 'ล่ามเชลล์', kicker: 'เกม · เล่นได้บนเว็บ', desc: 'เกมสอนใช้ Linux ให้นักเรียน พิมพ์ไทยได้ AI แปลเป็นคำสั่งให้' },
    { repo: 'openbox', name: 'openbox', kicker: 'ฮาร์ดแวร์ + AI · Python', desc: 'ตู้ล็อกเกอร์รับพัสดุ สั่งผ่านบอท Telegram' },
    { repo: 'claudeinstall', name: 'claudeinstall', kicker: 'เครื่องมือ Linux · Python', desc: 'ติดตั้งโปรแกรมด้วยคำอธิบายภาษาคน' },
    { repo: 'sensor-AI', name: 'sensor-AI', kicker: 'ฮาร์ดแวร์ + AI · TypeScript', desc: 'ผู้ช่วยสั่งงานในบ้านด้วยเสียง ผ่าน Raspberry Pi Pico W' },
  ];
  const scInfo = $('.showcase__info');
  const scDots = $('#scDots');
  let scIndex = 0, scTimer = 0, morphOn = false, scST = null;
  $('#scTotal').textContent = pad2(SHOW.length);

  const dotFills = SHOW.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', s.name);
    b.innerHTML = '<i></i>';
    b.addEventListener('click', () => {
      if (scST) scrollToY(scST.start + ((i + 0.5) / SHOW.length) * (scST.end - scST.start));
      else showProject(i);
    });
    scDots.appendChild(b);
    return b.firstChild;
  });
  function paintDots(progress) {
    dotFills.forEach((f, i) => {
      const v = progress == null ? (i <= scIndex ? 1 : 0) : clamp(progress * SHOW.length - i, 0, 1);
      f.style.transform = `scaleX(${v})`;
      f.parentElement.setAttribute('aria-selected', String(i === scIndex));
    });
  }
  function showProject(i) {
    scIndex = i;
    $('#scIndex').textContent = pad2(i + 1);
    clearTimeout(scTimer);
    scInfo.classList.add('is-out');
    scTimer = setTimeout(() => {
      const s = SHOW[i];
      $('#scKicker').textContent = s.kicker;
      $('#scName').textContent = s.name;
      $('#scDesc').textContent = s.desc;
      scInfo.classList.remove('is-out');
    }, reduced ? 0 : 260);
    if (morphOn) fontsReady.then(() => morphField.setText(SHOW[scIndex].name));
    if (!scST) paintDots();
  }
  const setMorph = (on) => {
    morphOn = on;
    fontsReady.then(() => morphField.setText(morphOn ? SHOW[scIndex].name : null));
  };
  $('#scOpen').addEventListener('click', () => {
    const s = SHOW[scIndex];
    openSheet(repoFor(s.repo) || { name: s.repo, th: s.desc, url: `https://github.com/cjpsms/${s.repo}`, tags: [] });
  });

  if (motion) {
    const wrap = $('.showcase-wrap');
    const showcase = $('#showcase');
    const edge = () => (window.innerWidth < 640 ? 12 : 24);
    // the card grows from inset to full bleed as it reaches the top. clip-path, not padding:
    // the wrap gets pinned and ScrollTrigger freezes a pinned element's box at refresh.
    gsap.set(wrap, { paddingLeft: 0, paddingRight: 0 });
    gsap.fromTo(showcase, { clipPath: () => `inset(0px ${edge()}px round 32px)` }, {
      clipPath: 'inset(0px 0px round 0px)', ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top 85%', end: 'top top', scrub: true, invalidateOnRefresh: true },
    });
    gsap.set(showcase, { borderRadius: 0 });
    scST = ScrollTrigger.create({
      trigger: wrap, start: 'top top', end: () => '+=' + window.innerHeight * SHOW.length * 0.45, pin: true,
      onEnter: () => setMorph(true), onEnterBack: () => setMorph(true),
      onLeave: () => setMorph(false), onLeaveBack: () => setMorph(false),
      onUpdate: (s) => {
        const i = Math.min(SHOW.length - 1, Math.floor(s.progress * SHOW.length));
        if (i !== scIndex) showProject(i);
        paintDots(s.progress);
      },
    });
    paintDots(0);
  } else {
    setMorph(true);
    paintDots();
  }

  /* ---------- icon arc rolling with scroll ---------- */
  const arc = $('#arc');
  const arcItems = $$('.arc__item', arc);
  let arcShown = [], arcW = 0, arcH = 0, arcTarget = 0, arcRoll = 0, arcVisible = true;
  function measureArc() {
    arcW = arc.clientWidth; arcH = arc.clientHeight;
    arcShown = arcItems.filter((el) => getComputedStyle(el).display !== 'none');
  }
  function drawArc(time) {
    const n = arcShown.length;
    const pad = Math.min(60, arcW * 0.05);
    arcRoll += (arcTarget - arcRoll) * 0.08;
    const off = arcRoll + (reduced ? 0 : time * 0.000012);
    arcShown.forEach((el, i) => {
      let u = ((i + 0.5) / n + off) % 1;
      if (u < 0) u += 1;
      const x = pad + u * (arcW - pad * 2);
      const y = arcH - 34 - Math.sin(Math.PI * u) * (arcH - 84);
      const e = Math.min(1, Math.sin(Math.PI * u) * 2.8);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.72 + 0.28 * e).toFixed(3)})`;
      el.style.opacity = e.toFixed(3);
    });
  }
  new ResizeObserver(() => { measureArc(); drawArc(performance.now()); }).observe(arc);
  new IntersectionObserver(([en]) => { arcVisible = en.isIntersecting; }).observe(arc);
  if (motion) {
    ScrollTrigger.create({ trigger: '#intro', start: 'top bottom', end: 'bottom top', onUpdate: (s) => { arcTarget = s.progress * 0.45; } });
    gsap.ticker.add(() => { if (arcVisible) drawArc(performance.now()); });
  } else if (!reduced) {
    (function tick() { if (arcVisible) drawArc(performance.now()); requestAnimationFrame(tick); })();
  }

  /* ---------- statement: words light up as you scroll ---------- */
  const stWords = splitWords($('#statement'), 'sw');
  if (motion) {
    gsap.fromTo(stWords, { opacity: 0.13 }, {
      opacity: 1, ease: 'none', stagger: 0.4,
      scrollTrigger: { trigger: '#statement', start: 'top 82%', end: 'bottom 42%', scrub: true },
    });
  }

  /* ---------- split headings slide up ---------- */
  $$('.split').forEach((el) => {
    const words = splitWords(el, 'w');
    if (!motion) return;
    gsap.from(words, {
      yPercent: 120, duration: 1.1, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  /* ---------- horizontal pinned tracks ---------- */
  function horizontal(section, track, bar) {
    section.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const pinEl = section.firstElementChild; // trigger on the pinned box itself, the section may have padding
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: pinEl, pin: pinEl, start: 'top top',
        end: () => '+=' + Math.max(dist() * 0.55, 1), scrub: 0.35, invalidateOnRefresh: true,
        onUpdate: (s) => { if (bar) bar.style.transform = `scaleX(${s.progress})`; },
      },
    });
    return tween;
  }
  function nativeBar(viewport, bar) {
    viewport.addEventListener('scroll', () => {
      if (viewport.closest('.is-pinned')) return;
      const max = viewport.scrollWidth - viewport.clientWidth;
      bar.style.transform = `scaleX(${max > 0 ? viewport.scrollLeft / max : 1})`;
    }, { passive: true });
  }

  const story = $('#story');
  const storyTrack = $('#storyTrack');
  const storyBar = $('#storyBar');
  nativeBar($('.hs__viewport', story), storyBar);

  const gallery = $('#projects');
  const gTrack = $('#galleryTrack');
  const gBar = $('#galleryBar');
  const gViewport = $('#galleryViewport');
  nativeBar(gViewport, gBar);

  const mm = motion ? gsap.matchMedia() : null;
  if (motion) {
    mm.add('(min-width: 0px)', () => {
      const tween = horizontal(story, storyTrack, storyBar);
      gsap.from(storyTrack, { y: 120, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: story, start: 'top 75%' } });
      // cards further along tilt into place as they slide in
      $$('.story-card', storyTrack).forEach((card) => {
        if (card.offsetLeft < window.innerWidth * 0.8) return;
        gsap.from(card, {
          rotate: 5, scale: 0.9, yPercent: 8, transformOrigin: 'left bottom', ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 55%', scrub: true },
        });
      });
      return () => story.classList.remove('is-pinned');
    });
    mm.add('(min-width: 861px)', () => {
      horizontal(gallery, gTrack, gBar);
      return () => gallery.classList.remove('is-pinned');
    });
  }

  /* ---------- featured explorer ---------- */
  const exItems = $$('.ex-item');
  const exTexts = $('#exTexts');
  const exBars = $$('#exBars i');
  const exClones = exItems.map((it) => {
    const t = it.querySelector('.ex-item__text').cloneNode(true);
    t.className = 'ex-text';
    exTexts.appendChild(t);
    return t;
  });
  let exActive = -1;
  function setEx(i) {
    if (i === exActive) return;
    exActive = i;
    exClones.forEach((c, k) => c.classList.toggle('is-active', k === i));
    $('#exIndex').textContent = pad2(i + 1);
  }
  setEx(0);
  const exIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setEx(exItems.indexOf(e.target)); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  exItems.forEach((it) => exIo.observe(it));

  if (motion) {
    exItems.forEach((it, i) => {
      const g = it.querySelector('.glow');
      const ui = it.querySelector('.ui');
      gsap.fromTo(g, { scale: 0.84, borderRadius: 80 }, {
        scale: 1, borderRadius: 32, ease: 'none',
        scrollTrigger: { trigger: it, start: 'top bottom', end: 'center 55%', scrub: true },
      });
      gsap.fromTo(ui, { y: 110 }, {
        y: -60, ease: 'none',
        scrollTrigger: { trigger: it, start: 'top bottom', end: 'bottom top', scrub: true },
      });
      ScrollTrigger.create({
        trigger: it, start: 'top center', end: 'bottom center',
        onUpdate: (s) => exBars[i] && exBars[i].style.setProperty('--p', s.progress.toFixed(3)),
        onLeave: () => exBars[i] && exBars[i].style.setProperty('--p', 1),
        onLeaveBack: () => exBars[i] && exBars[i].style.setProperty('--p', 0),
      });
    });
    gsap.from('.ui--grader .row__meter i', {
      scaleX: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12,
      scrollTrigger: { trigger: '.ui--grader', start: 'top 75%' },
    });
    gsap.from('.ui--grader .row', { x: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.ui--grader', start: 'top 80%' } });
    gsap.from('.ui--game > *', { y: 26, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.ui--game', start: 'top 75%' } });
    gsap.from('.ui--chat > *', { y: 18, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.16, scrollTrigger: { trigger: '.ui--chat', start: 'top 75%' } });
  }

  /* ---------- gallery cards ---------- */
  const COVERS = {
    Python: ['#2a63c9', '#e0b31a'], JavaScript: ['#c9a400', '#e8590c'], TypeScript: ['#1f6feb', '#7c4dff'],
    Shell: ['#2f9e44', '#1c7ed6'], Kotlin: ['#7c4dff', '#e64980'], 'C++': ['#d6336c', '#5f3dc4'],
    HTML: ['#e8590c', '#d6336c'], Lua: ['#364fc7', '#15aabf'], CSS: ['#7048e8', '#1c7ed6'],
  };
  const cover = (r) => COVERS[r.language] || ['#3c4a63', '#5b4b8a'];
  const dateFmt = new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric' });

  function gcard(r, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gcard';
    b.dataset.cursor = 'เปิดดู';
    const [c1, c2] = cover(r);
    const meta = [r.language, r.updated ? dateFmt.format(new Date(r.updated)) : null].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('');
    b.innerHTML = `
      <span class="gcard__cover" style="--c1:${c1};--c2:${c2}">
        ${r.language ? `<span class="gcard__lang">${esc(r.language)}</span>` : '<span></span>'}
        <span class="gcard__no">${pad2(i + 1)}</span>
        <span class="gcard__name">${esc(r.name)}</span>
      </span>
      <span class="gcard__body">
        <span class="gcard__meta">${meta}</span>
        <span class="gcard__desc">${esc(r.th || '')}</span>
        <span class="gcard__more">ดูรายละเอียด</span>
      </span>`;
    b.addEventListener('click', () => openSheet(r, b));
    if (motion && fine) {
      const cv = b.firstElementChild;
      const rx = gsap.quickTo(b, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(b, 'rotationY', { duration: 0.6, ease: 'power3' });
      b.addEventListener('pointermove', (e) => {
        const c = cv.getBoundingClientRect();
        const px = (e.clientX - c.left) / c.width, py = (e.clientY - c.top) / c.height;
        ry((px - 0.5) * 12); rx((0.5 - clamp(py, 0, 1)) * 9);
        cv.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        cv.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      b.addEventListener('pointerleave', () => { rx(0); ry(0); });
    }
    return b;
  }

  let galleryIntroDone = false;
  function renderGallery(list) {
    gTrack.innerHTML = '';
    list.forEach((r, i) => gTrack.appendChild(gcard(r, i)));
    gBar.style.transform = 'scaleX(0)';
    gViewport.scrollLeft = 0;
    if (!motion) return;
    refresh();
    const cards = $$('.gcard', gTrack).slice(0, 6);
    if (!galleryIntroDone) {
      galleryIntroDone = true;
      gsap.from(cards, {
        y: 140, rotate: 4, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: gallery, start: 'top 70%' },
      });
      refresh();
    } else {
      gsap.from(cards, { y: 60, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05 });
    }
  }

  function buildFilters(list) {
    const filtersEl = $('#filters');
    const counts = new Map();
    list.forEach((r) => (r.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    const tags = ['ทั้งหมด', ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)];
    filtersEl.innerHTML = '';
    tags.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'filter'; b.type = 'button'; b.setAttribute('role', 'tab');
      b.textContent = t; b.setAttribute('aria-selected', String(i === 0));
      b.addEventListener('click', () => {
        if (b.getAttribute('aria-selected') === 'true') return;
        filtersEl.querySelectorAll('.filter').forEach((x) => x.setAttribute('aria-selected', 'false'));
        b.setAttribute('aria-selected', 'true');
        renderGallery(i === 0 ? list : list.filter((r) => (r.tags || []).includes(t)));
        // jump back to the start of the gallery so the new row is seen from its first card
        const st = motion ? ScrollTrigger.getAll().find((s) => s.pin && s.pin.parentElement && gallery.contains(s.pin)) : null;
        if (st && window.scrollY > st.start) scrollToY(st.start);
      });
      filtersEl.appendChild(b);
    });
  }

  reposReady
    .then((data) => {
      $('#repoSource').textContent = data.source === 'github'
        ? `${repos.length} โปรเจกต์ อัปเดตจาก GitHub`
        : `${repos.length} โปรเจกต์ (ต่อ GitHub ไม่ได้ ใช้รายการในเครื่อง)`;
      buildFilters(repos);
      renderGallery(repos);
    })
    .catch(() => {
      $('#repoSource').textContent = 'โหลดรายการไม่สำเร็จ';
      gTrack.innerHTML = '<a class="gcard gcard--empty" href="https://github.com/cjpsms?tab=repositories" target="_blank" rel="noopener"><span class="gcard__cover"><span></span><span class="gcard__name">ดูทั้งหมดบน GitHub</span></span><span class="gcard__body"><span class="gcard__desc">โหลดรายการโปรเจกต์ไม่สำเร็จ ลองเปิดหน้า GitHub โดยตรง</span></span></a>';
      refresh();
    });

  /* ---------- detail sheet ---------- */
  const sheet = $('#sheet');
  const panel = $('#sheetPanel');
  const readmeBox = $('#sheetReadme');
  const readmeCache = new Map();
  let sheetFor = null, lastFocus = null, sheetOpen = false;

  function fillSheet(r) {
    const [c1, c2] = cover(r);
    const cv = $('#sheetCover');
    cv.style.setProperty('--c1', c1);
    cv.style.setProperty('--c2', c2);
    $('#sheetCoverName').textContent = r.name;
    $('#sheetTitle').textContent = r.name;
    $('#sheetDesc').textContent = r.th || '';
    const meta = [r.language, r.updated ? 'อัปเดต ' + dateFmt.format(new Date(r.updated)) : null, ...(r.tags || [])].filter(Boolean);
    $('#sheetMeta').innerHTML = meta.map((m) => `<span>${esc(m)}</span>`).join('');
    const url = r.url || `https://github.com/cjpsms/${r.name}`;
    $('#sheetLinks').innerHTML =
      (r.homepage ? `<a class="btn btn--primary btn--sm" href="${esc(r.homepage)}" target="_blank" rel="noopener">ลองเล่น</a>` : '') +
      `<a class="btn btn--secondary btn--sm" href="${esc(url)}" target="_blank" rel="noopener">ดูโค้ดบน GitHub</a>`;
  }

  // README paths are relative to the repo; point images at raw files and links at GitHub.
  function fixReadme(root, name) {
    const isAbs = (u) => /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(u);
    const clean = (u) => u.replace(/^\.?\//, '');
    root.querySelectorAll('img[src]').forEach((img) => {
      const u = img.getAttribute('src');
      if (!isAbs(u)) img.src = `https://raw.githubusercontent.com/cjpsms/${name}/HEAD/${clean(u)}`;
      img.loading = 'lazy';
    });
    root.querySelectorAll('a[href]').forEach((a) => {
      const u = a.getAttribute('href');
      if (u.startsWith('#')) { a.removeAttribute('href'); return; }
      if (!isAbs(u)) a.href = `https://github.com/cjpsms/${name}/blob/HEAD/${clean(u)}`;
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  async function loadReadme(r) {
    const head = '<p class="readme__label">README</p>';
    readmeBox.innerHTML = head + '<p class="readme__state">กำลังโหลด</p>';
    try {
      let md = readmeCache.get(r.name);
      if (md == null) {
        const res = await fetch('/api/readme/' + encodeURIComponent(r.name));
        if (res.status === 404) md = '';
        else if (!res.ok) throw new Error(res.status);
        else md = await res.text();
        readmeCache.set(r.name, md);
      }
      if (sheetFor !== r.name) return;
      if (!md.trim()) { readmeBox.innerHTML = head + '<p class="readme__state">โปรเจกต์นี้ยังไม่มี README</p>'; return; }
      const div = document.createElement('div');
      div.className = 'md';
      div.innerHTML = window.DOMPurify && window.marked ? DOMPurify.sanitize(marked.parse(md)) : `<pre>${esc(md)}</pre>`;
      fixReadme(div, r.name);
      readmeBox.innerHTML = head;
      readmeBox.appendChild(div);
      if (motion) gsap.from(div, { opacity: 0, y: 16, duration: 0.6, ease: 'expo.out' });
    } catch {
      if (sheetFor !== r.name) return;
      readmeBox.innerHTML = head + '<p class="readme__state">โหลด README ไม่สำเร็จ ลองเปิดบน GitHub แทน</p>';
    }
  }

  function openSheet(r, from) {
    sheetFor = r.name;
    lastFocus = from || document.activeElement;
    fillSheet(r);
    loadReadme(r);
    $('.sheet__body', sheet).scrollTop = 0;
    sheet.hidden = false;
    sheetOpen = true;
    if (lenis) lenis.stop(); else document.documentElement.style.overflow = 'hidden';
    if (motion) {
      const mobile = window.innerWidth <= 640;
      gsap.killTweensOf([panel, '.sheet__backdrop']);
      gsap.fromTo('.sheet__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' });
      gsap.fromTo(panel, mobile ? { yPercent: 100, xPercent: 0 } : { xPercent: 106, yPercent: 0 }, { xPercent: 0, yPercent: 0, duration: 0.9, ease: 'expo.out' });
      gsap.fromTo('#sheetCoverName', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'expo.out', delay: 0.15 });
      gsap.fromTo('.sheet__body > :not(.sheet__readme)', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.05, delay: 0.2 });
    }
    $('.sheet__close', sheet).focus({ preventScroll: true });
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    const done = () => {
      sheet.hidden = true;
      if (lenis) lenis.start(); else document.documentElement.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (!motion) return done();
    const mobile = window.innerWidth <= 640;
    gsap.to('.sheet__backdrop', { opacity: 0, duration: 0.35 });
    gsap.to(panel, { ...(mobile ? { yPercent: 100 } : { xPercent: 106 }), duration: 0.5, ease: 'power3.in', onComplete: done });
  }

  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  document.addEventListener('keydown', (e) => {
    if (!sheetOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
    if (e.key !== 'Tab') return;
    const f = $$('a[href], button:not([disabled])', panel).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- duo, CEDT, contact, footer ---------- */
  if (motion) {
    gsap.from('.duo__item', { y: 90, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.duo', start: 'top 80%' } });
    gsap.from('.cedt__head > .body', { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.cedt__head', start: 'top 80%' } });

    const yearEls = $$('.year');
    gsap.from(yearEls, { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '#years', start: 'top 82%' } });
    mm.add({ wide: '(min-width: 901px)', narrow: '(max-width: 900px)' }, (ctx) => {
      const wide = ctx.conditions.wide;
      gsap.fromTo('#yearsLine', wide ? { scaleX: 0, scaleY: 1 } : { scaleY: 0, scaleX: 1 }, {
        scaleX: 1, scaleY: 1, ease: 'none',
        scrollTrigger: {
          trigger: '#years', start: 'top 78%', end: wide ? 'top 30%' : 'bottom 55%', scrub: true,
          onUpdate: (s) => yearEls.forEach((y, i) => y.classList.toggle('is-lit', s.progress > i / yearEls.length + 0.02)),
        },
      });
    });

    gsap.fromTo('.cta', { scale: 0.9, borderRadius: 72 }, {
      scale: 1, borderRadius: 32, ease: 'none',
      scrollTrigger: { trigger: '.cta-wrap', start: 'top bottom', end: 'top 35%', scrub: true },
    });
    gsap.from('.cta__sub, .cta .actions', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
    gsap.from('.footer__title', { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 55%', scrub: true } });
  } else {
    $$('.year').forEach((y) => y.classList.add('is-lit'));
    $('#yearsLine').style.transform = 'none';
  }

  // contact buttons pull the dots into a word while hovered
  $$('[data-morph]').forEach((b) => {
    const on = () => fontsReady.then(() => ctaField.setText(b.dataset.morph));
    const off = () => ctaField.setText(null);
    b.addEventListener('pointerenter', on);
    b.addEventListener('pointerleave', off);
    b.addEventListener('focus', on);
    b.addEventListener('blur', off);
  });

  refresh();
  window.addEventListener('load', refresh);
})();
