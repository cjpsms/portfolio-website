// Particle field used by the hero (colored dome), the showcase (ring that morphs into text)
// and the contact card. Canvas 2D, a few thousand dots, paused while off screen.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => (Math.random() + Math.random() + Math.random()) / 3;

  class Field {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.host = canvas.parentElement;
      this.o = Object.assign({
        shape: 'ring',          // 'ring' | 'arch'
        cx: 0.5, cy: 0.5,       // shape centre, fraction of the canvas
        scale: 0.4,             // ring: radius as a fraction of min(w, h * 1.3); arch: x radius as a fraction of w
        scaleY: 0.8,            // arch only: y radius as a fraction of h
        tilt: 0.8,              // ring y squash
        band: 0.7,              // ring thickness
        density: 360,           // px² per dot
        max: 2400,
        palette: ['#ffffff'],
        alpha: [0.35, 0.85],
        size: [1, 1.9],
        spin: 1,
        repel: 110,
        textW: 0.72, textH: 0.3, textCy: null,
        textWeight: 500,
        dimOthers: 0.25,        // alpha for dots left out of the text
      }, opts);
      this.dots = [];
      this.scatter = 0;
      this.text = null;
      this.mouse = { x: -1e4, y: -1e4 };
      this.visible = false;
      this.raf = 0;
      this.last = 0;
      this.off = document.createElement('canvas');

      this.host.addEventListener('pointermove', (e) => {
        const r = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top;
      });
      this.host.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -1e4; });

      new ResizeObserver(() => this.build()).observe(this.host);
      new IntersectionObserver(([en]) => {
        this.visible = en.isIntersecting;
        if (this.visible && !this.raf) this.raf = requestAnimationFrame((t) => this.loop(t));
      }).observe(this.host);
    }

    build() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.host.clientWidth, h = this.host.clientHeight;
      if (!w || !h) return;
      const first = !this.w;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const o = this.o;
      const mobile = w < 640;
      const count = Math.min(mobile ? o.max * 0.55 : o.max, Math.round((w * h) / o.density));
      if (first || Math.abs(count - this.dots.length) > 40) {
        this.dots = Array.from({ length: count }, () => this.makeDot());
      }
      if (this.text) this.setText(this.text);
      if (reduced) this.draw(0, 0);
    }

    makeDot() {
      const o = this.o;
      let a, r;
      if (o.shape === 'arch') {
        a = Math.PI + 0.04 + Math.random() * (Math.PI - 0.08); // upper half
        r = 0.78 + gauss() * 0.44;
      } else {
        a = Math.random() * TAU;
        r = 1 - o.band / 2 + gauss() * o.band;
      }
      const ci = o.shape === 'arch'
        ? Math.min(o.palette.length - 1, Math.floor(((a - Math.PI) / Math.PI) * o.palette.length))
        : (Math.random() * o.palette.length) | 0;
      return {
        a, r,
        s: rand(0.6, 1.4) / Math.max(r, 0.3),
        size: Math.random() < 0.1 ? o.size[1] * 1.25 : rand(o.size[0], o.size[1]),
        alpha: rand(o.alpha[0], o.alpha[1]),
        col: o.palette[ci],
        ph: Math.random() * TAU,
        ease: rand(0.045, 0.11),
        x: rand(0, this.w || 800), y: rand(0, this.h || 600), // fly in from anywhere
        ox: 0, oy: 0,
        tx: null, ty: null,
      };
    }

    home(d, t) {
      const o = this.o, w = this.w, h = this.h;
      const cx = w * o.cx, cy = h * o.cy;
      if (o.shape === 'arch') {
        const rx = w * o.scale, ry = h * o.scaleY;
        const a = d.a + Math.sin(t * 0.00025 + d.ph) * 0.012;
        const rr = d.r * (1 + 0.025 * Math.sin(t * 0.0009 + d.ph)) * (1 + this.scatter * 0.9);
        return [cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr - this.scatter * h * 0.25];
      }
      const R = Math.min(w, h * 1.3) * o.scale;
      const a = d.a + t * 0.00006 * d.s * o.spin;
      const rr = d.r * R * (1 + 0.03 * Math.sin(t * 0.0007 + d.ph)) * (1 + this.scatter);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * o.tilt];
    }

    // Sample a word into points and hand them to the dots. null sends everyone home.
    setText(str) {
      this.text = str;
      this.dots.forEach((d) => { d.tx = d.ty = null; });
      if (str && this.w) this.sample(str);
      if (reduced && this.w) this.draw(0, 0);
    }

    sample(str) {
      const o = this.o, w = this.w, h = this.h;
      const off = this.off, octx = off.getContext('2d', { willReadFrequently: true });
      off.width = w; off.height = h;
      let size = h * o.textH;
      const font = (s) => `${o.textWeight} ${s}px "Google Sans Flex", "Noto Sans Thai", sans-serif`;
      octx.font = font(size);
      const mw = octx.measureText(str).width;
      if (mw > w * o.textW) size *= (w * o.textW) / mw;
      octx.clearRect(0, 0, w, h);
      octx.font = font(size);
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillStyle = '#fff';
      octx.fillText(str, w * o.cx, h * (o.textCy == null ? o.cy : o.textCy));
      const data = octx.getImageData(0, 0, w, h).data;
      const limit = this.dots.length * 0.92;
      let pts = [];
      for (let gap = Math.max(2, Math.round(size / 40)); gap < 30; gap++) {
        pts = [];
        for (let y = 0; y < h; y += gap) {
          for (let x = 0; x < w; x += gap) {
            if (data[(y * w + x) * 4 + 3] > 140) pts.push([x, y]);
          }
        }
        if (pts.length <= limit) break;
      }
      for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
      const order = this.dots.slice().sort(() => Math.random() - 0.5);
      pts.forEach((p, i) => { order[i].tx = p[0] + rand(-0.6, 0.6); order[i].ty = p[1] + rand(-0.6, 0.6); });
    }

    setScatter(v) { this.scatter = v; if (reduced && this.w) this.draw(0, 0); }

    draw(t, dt) {
      const ctx = this.ctx, o = this.o, m = this.mouse;
      ctx.clearRect(0, 0, this.w, this.h);
      const k = Math.min(dt / 16.7, 3);
      const textOn = !!this.text;
      const fade = 1 - Math.min(this.scatter * 1.1, 1);
      for (const d of this.dots) {
        let gx, gy;
        if (d.tx != null) { gx = d.tx; gy = d.ty; } else { [gx, gy] = this.home(d, t); }
        if (reduced) { d.x = gx; d.y = gy; } else {
          d.x += (gx - d.x) * d.ease * k;
          d.y += (gy - d.y) * d.ease * k;
          const dx = d.x + d.ox - m.x, dy = d.y + d.oy - m.y, d2 = dx * dx + dy * dy, rr = o.repel * o.repel;
          if (d2 < rr) { const f = (1 - d2 / rr) * 3.2, dd = Math.sqrt(d2) || 1; d.ox += (dx / dd) * f; d.oy += (dy / dd) * f; }
          d.ox *= 0.9; d.oy *= 0.9;
        }
        let a = d.alpha * (0.75 + 0.25 * Math.sin(t * 0.002 + d.ph));
        if (textOn) a = d.tx == null ? a * o.dimOthers : 0.8 + 0.2 * a; // the word reads bright, the rest fades back
        a *= fade;
        if (a < 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = d.col;
        const s = textOn && d.tx != null ? Math.max(d.size, 1.6) : d.size;
        if (o.shape === 'arch') ctx.fillRect(d.x + d.ox, d.y + d.oy, s * 2.2, s); // short dashes
        else ctx.fillRect(d.x + d.ox, d.y + d.oy, s, s);
      }
      ctx.globalAlpha = 1;
    }

    loop(t) {
      const dt = this.last ? Math.min(t - this.last, 64) : 16.7;
      this.last = t;
      this.draw(t, dt);
      if (this.visible && !reduced) this.raf = requestAnimationFrame((tt) => this.loop(tt));
      else { this.raf = 0; this.last = 0; }
    }
  }

  window.Field = Field;
})();
