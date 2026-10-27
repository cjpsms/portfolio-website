// Dot vortex for every canvas.vortex: particles orbiting in a ring, faster near the middle,
// with the ring centre drifting a little toward the pointer.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PALETTE = [
    [255, 255, 255], [255, 255, 255], [255, 255, 255],
    [124, 155, 255], [124, 155, 255], [167, 139, 250], [96, 200, 255],
  ];
  // where the ring sits inside the card, per variant
  const LAYOUT = {
    showcase: { cx: 0.5, cy: 0.5, scale: 0.46 },
    cta: { cx: 0.76, cy: 0.5, scale: 0.5 },
  };

  function vortex(canvas) {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    const layout = LAYOUT[canvas.dataset.vortex] || LAYOUT.showcase;
    let w = 0, h = 0, R = 0, dots = [], visible = false, raf = 0;
    const center = { x: 0, y: 0, tx: 0, ty: 0 };

    function gauss() { return (Math.random() + Math.random() + Math.random()) / 3; }

    function build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = host.clientWidth; h = host.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(w, h * 1.4) * layout.scale;
      center.x = center.tx = w * layout.cx;
      center.y = center.ty = h * layout.cy;
      const count = Math.min(2600, Math.round((w * h) / 260));
      dots = Array.from({ length: count }, () => {
        const ring = 0.72 + (gauss() - 0.5) * 0.7; // a band around the middle, empty centre
        const c = PALETTE[(Math.random() * PALETTE.length) | 0];
        return {
          r: ring,
          a: Math.random() * Math.PI * 2,
          s: (0.00035 + Math.random() * 0.00025) / ring,
          size: Math.random() < 0.12 ? 2.2 : 1 + Math.random() * 0.9,
          ph: Math.random() * Math.PI * 2,
          col: `rgb(${c[0]},${c[1]},${c[2]})`,
          base: c[0] === 255 ? 0.35 + Math.random() * 0.45 : 0.6 + Math.random() * 0.4,
        };
      });
      draw(performance.now(), 0);
    }

    let last = 0;
    function draw(t, dt) {
      ctx.clearRect(0, 0, w, h);
      center.x += (center.tx - center.x) * 0.04;
      center.y += (center.ty - center.y) * 0.04;
      for (const d of dots) {
        d.a += d.s * dt;
        const breathe = 1 + 0.035 * Math.sin(t * 0.0006 + d.ph);
        const rr = d.r * R * breathe;
        const x = center.x + Math.cos(d.a) * rr;
        const y = center.y + Math.sin(d.a) * rr * 0.78;
        if (x < -4 || x > w + 4 || y < -4 || y > h + 4) continue;
        // dots on the lower half of the ring read as "closer": a bit brighter
        const depth = 0.75 + 0.25 * Math.sin(d.a);
        ctx.globalAlpha = d.base * depth * (0.7 + 0.3 * Math.sin(t * 0.002 + d.ph));
        ctx.fillStyle = d.col;
        ctx.fillRect(x, y, d.size, d.size);
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      const dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      draw(t, dt);
      raf = visible ? requestAnimationFrame(loop) : 0;
      if (!raf) last = 0;
    }

    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      center.tx = w * layout.cx + (e.clientX - r.left - w * layout.cx) * 0.08;
      center.ty = h * layout.cy + (e.clientY - r.top - h * layout.cy) * 0.08;
    });
    host.addEventListener('pointerleave', () => { center.tx = w * layout.cx; center.ty = h * layout.cy; });

    new ResizeObserver(build).observe(host);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(loop);
    }).observe(host);
  }

  document.querySelectorAll('canvas.vortex').forEach(vortex);
})();
