/* Spatial — lightweight 3D hitbox visualizer (no deps) */
(function () {
  const canvas = document.getElementById("spatial-viz");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  let shape = "box"; // box | sphere
  let t0 = performance.now();
  let dragging = false, lastX = 0, lastY = 0;
  let yaw = 0.55, pitch = 0.38;
  let auto = true;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // Controls
  document.querySelectorAll("[data-viz-shape]").forEach(btn => {
    btn.addEventListener("click", () => {
      shape = btn.getAttribute("data-viz-shape");
      document.querySelectorAll("[data-viz-shape]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  const autoBtn = document.querySelector("[data-viz-auto]");
  if (autoBtn) {
    autoBtn.addEventListener("click", () => {
      auto = !auto;
      autoBtn.classList.toggle("active", auto);
      autoBtn.textContent = auto ? "Auto orbit" : "Manual";
    });
  }

  canvas.addEventListener("pointerdown", e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    auto = false;
    if (autoBtn) { autoBtn.classList.remove("active"); autoBtn.textContent = "Manual"; }
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.008;
    pitch = Math.max(-1.1, Math.min(1.1, pitch + (e.clientY - lastY) * 0.008));
    lastX = e.clientX; lastY = e.clientY;
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("pointercancel", () => { dragging = false; });

  // Math
  function rot(p, y, ptc) {
    const cy = Math.cos(y), sy = Math.sin(y);
    const cp = Math.cos(ptc), sp = Math.sin(ptc);
    let x = p[0], yy = p[1], z = p[2];
    // yaw around Y
    let x1 = x * cy - z * sy;
    let z1 = x * sy + z * cy;
    // pitch around X
    let y2 = yy * cp - z1 * sp;
    let z2 = yy * sp + z1 * cp;
    return [x1, y2, z2];
  }

  function project(p) {
    const scale = Math.min(W, H) * 0.42;
    const z = p[2] + 4.2;
    const f = scale / z;
    return [W * 0.5 + p[0] * f, H * 0.48 - p[1] * f, z];
  }

  function strokePoly(pts, stroke, fill, alpha) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) {
      ctx.globalAlpha = alpha || 0.12;
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.globalAlpha = alpha || 0.9;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawBox(ox, oy, oz, sx, sy, sz, color, fillA, dash) {
    const corners = [
      [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
      [-sx, -sy,  sz], [sx, -sy,  sz], [sx, sy,  sz], [-sx, sy,  sz],
    ].map(c => rot([c[0] + ox, c[1] + oy, c[2] + oz], yaw, pitch));
    const pr = corners.map(project);
    const faces = [
      [0,1,2,3], [4,5,6,7], [0,1,5,4], [2,3,7,6], [0,3,7,4], [1,2,6,5],
    ];
    // depth sort faces by avg z
    const sorted = faces.map(f => {
      const z = (pr[f[0]][2] + pr[f[1]][2] + pr[f[2]][2] + pr[f[3]][2]) / 4;
      return { f, z };
    }).sort((a, b) => b.z - a.z);

    ctx.setLineDash(dash || []);
    for (const { f } of sorted) {
      strokePoly([pr[f[0]], pr[f[1]], pr[f[2]], pr[f[3]]], color, color, fillA);
    }
    ctx.setLineDash([]);
  }

  function drawSphere(ox, oy, oz, r, color, fillA, dash) {
    // latitude / longitude wireframe
    const rings = 7, segs = 16;
    ctx.setLineDash(dash || []);
    for (let i = 1; i < rings; i++) {
      const lat = (i / rings) * Math.PI - Math.PI / 2;
      const pts = [];
      for (let j = 0; j <= segs; j++) {
        const lon = (j / segs) * Math.PI * 2;
        const x = ox + r * Math.cos(lat) * Math.cos(lon);
        const y = oy + r * Math.sin(lat);
        const z = oz + r * Math.cos(lat) * Math.sin(lon);
        pts.push(project(rot([x, y, z], yaw, pitch)));
      }
      strokePoly(pts, color, null, 0.55);
    }
    for (let j = 0; j < segs; j++) {
      const lon = (j / segs) * Math.PI * 2;
      const pts = [];
      for (let i = 0; i <= rings; i++) {
        const lat = (i / rings) * Math.PI - Math.PI / 2;
        const x = ox + r * Math.cos(lat) * Math.cos(lon);
        const y = oy + r * Math.sin(lat);
        const z = oz + r * Math.cos(lat) * Math.sin(lon);
        pts.push(project(rot([x, y, z], yaw, pitch)));
      }
      strokePoly(pts, color, null, 0.35);
    }
    // soft fill disc approx
    const c = project(rot([ox, oy, oz], yaw, pitch));
    const edge = project(rot([ox + r, oy, oz], yaw, pitch));
    const rad = Math.hypot(edge[0] - c[0], edge[1] - c[1]);
    ctx.beginPath();
    ctx.arc(c[0], c[1], rad, 0, Math.PI * 2);
    ctx.globalAlpha = fillA || 0.08;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  function drawGround() {
    const size = 2.4, step = 0.4;
    ctx.strokeStyle = "rgba(139,124,240,0.12)";
    ctx.lineWidth = 1;
    for (let i = -size; i <= size + 0.001; i += step) {
      const a = project(rot([i, -1.1, -size], yaw, pitch));
      const b = project(rot([i, -1.1,  size], yaw, pitch));
      const c = project(rot([-size, -1.1, i], yaw, pitch));
      const d = project(rot([ size, -1.1, i], yaw, pitch));
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.stroke();
    }
  }

  function drawPlayer(ox, oz, color, alpha, scale) {
    const s = scale || 1;
    // body box
    drawBox(ox, -0.55 * s, oz, 0.28 * s, 0.55 * s, 0.18 * s, color, alpha * 0.25);
    // head
    drawBox(ox, 0.2 * s, oz, 0.16 * s, 0.16 * s, 0.16 * s, color, alpha * 0.2);
  }

  const rewindEl = document.getElementById("viz-rewind");
  const lagEl = document.getElementById("viz-lag");

  function frame(now) {
    const t = (now - t0) / 1000;
    if (auto) yaw = t * 0.35;

    ctx.clearRect(0, 0, W, H);
    // vignette-ish bg
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 10, W * 0.5, H * 0.45, Math.max(W, H) * 0.7);
    g.addColorStop(0, "#12101c");
    g.addColorStop(1, "#0b0a12");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawGround();

    // Target path (circle)
    const pathR = 1.35;
    const ang = t * 1.1;
    const tx = Math.cos(ang) * pathR;
    const tz = Math.sin(ang) * pathR;

    // Lag / rewind ghost (where server thinks they were)
    const lag = 0.22 + 0.08 * Math.sin(t * 0.7);
    const past = ang - lag * 1.1;
    const gx = Math.cos(past) * pathR;
    const gz = Math.sin(past) * pathR;

    // Ghost (rewound pose)
    drawPlayer(gx, gz, "#7c6af0", 0.55, 0.95);
    // Live target
    drawPlayer(tx, tz, "#34d399", 0.9, 1);

    // Attacker hitbox at origin-ish
    const hx = -0.15, hz = 0.1;
    if (shape === "sphere") {
      // ghost hitbox volume at rewind
      drawSphere(hx, 0, hz, 0.95, "#8b7cf0", 0.1, [4, 4]);
      drawSphere(hx, 0, hz, 0.95, "#a78bfa", 0.14);
    } else {
      drawBox(hx, 0.05, hz, 0.85, 0.7, 1.05, "#8b7cf0", 0.1, [4, 4]);
      drawBox(hx, 0.05, hz, 0.85, 0.7, 1.05, "#a78bfa", 0.14);
    }

    // Claim ray visual
    const a = project(rot([hx, 0.1, hz], yaw, pitch));
    const b = project(rot([gx, 0.1, gz], yaw, pitch));
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.strokeStyle = "rgba(167,139,250,0.45)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    if (rewindEl) rewindEl.textContent = lag.toFixed(2) + "s";
    if (lagEl) lagEl.textContent = Math.round(lag * 1000) + "ms";

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
