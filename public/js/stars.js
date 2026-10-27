// Starfield for every canvas.stars: slow drifting points that lean away from the pointer.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ffffff', '#ffffff', '#ffffff', '#9ec5ff', '#ffc2dc', '#ffe1a8', '#b6f0cf'];

  function starfield(canvas) {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    let w = 0, h = 0, dpr = 1, stars = [], visible = false, raf = 0;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / (canvas.classList.contains('stars--mini') ? 5200 : 3400));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        ox: 0, oy: 0,
        r: Math.random() < 0.08 ? 1.6 : Math.random() * 1.1 + 0.3,
        vx: (Math.random() - 0.5) * 0.06, vy: -Math.random() * 0.12 - 0.02,
        tw: Math.random() * Math.PI * 2,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      }));
      if (reduced) draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        if (!reduced) {
          s.x += s.vx; s.y += s.vy;
          if (s.y < -4) { s.y = h + 4; s.x = Math.random() * w; }
          if (s.x < -4) s.x = w + 4; else if (s.x > w + 4) s.x = -4;
          // push away from the pointer, then ease back
          const dx = s.x + s.ox - mouse.x, dy = s.y + s.oy - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const f = (1 - d2 / 16000) * 2.2, d = Math.sqrt(d2) || 1;
            s.ox += (dx / d) * f; s.oy += (dy / d) * f;
          }
          s.ox *= 0.94; s.oy *= 0.94;
        }
        const a = 0.45 + 0.55 * Math.sin(t * 0.0012 + s.tw) ** 2;
        ctx.globalAlpha = a;
        ctx.fillStyle = s.c;
        ctx.beginPath();
        ctx.arc(s.x + s.ox, s.y + s.oy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      raf = visible ? requestAnimationFrame(loop) : 0;
    }

    host.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    host.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

    new ResizeObserver(resize).observe(host);
    resize();

    // only animate while on screen
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(loop);
    }).observe(host);
  }

  document.querySelectorAll('canvas.stars').forEach(starfield);
})();
