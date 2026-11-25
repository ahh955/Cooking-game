// art.js — drawing helpers for Dapur Kilat.
// Every picture in the game is drawn in code with the canvas 2D API:
// chunky readable shapes, warm warung colors, big labels. No image files.

const PALETTE = {
  woodDark: '#5b3a1e',
  wood: '#8a5a2b',
  woodLight: '#c98f4e',
  counter: '#f3e2c7',
  counterEdge: '#d9b380',
  cream: '#fff8ec',
  ink: '#2b1a0e',
  red: '#d94f3d',
  redDark: '#a83226',
  green: '#4c9a4c',
  greenDark: '#2f6b2f',
  yellow: '#f2c14e',
  orange: '#e8823a',
  blue: '#3d7ea6',
  grey: '#8a8a8a',
  tileWall: '#f6e8cf',
  terra: '#c67b4e',
  terraDark: '#b06a42',
  steel: '#c9ced4',
  steelDark: '#9aa1a8',
};

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPanel(ctx, x, y, w, h, fill, stroke, radius) {
  roundRectPath(ctx, x, y, w, h, radius === undefined ? 12 : radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function drawText(ctx, text, x, y, size, color, align, weight) {
  ctx.font = (weight || 'bold') + ' ' + size + "px 'Trebuchet MS', Verdana, sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawIngredient(ctx, kind, cx, cy, s, cooked) {
  // Draws one ingredient centered at (cx, cy), roughly s pixels wide,
  // SEEN FROM ABOVE — the kitchen is top-down now, so every food is drawn
  // as it looks from above: round buns and patties, a square cheese slice,
  // rings of onion, a leafy lettuce blob, a round tomato.
  // kind: 'bun' | 'patty' | 'tomato' | 'lettuce' | 'cheese' | 'onion'
  // cooked: 0 raw .. 1 done (patty only); >1 means burnt.
  const u = s / 100;
  ctx.save();
  ctx.translate(cx, cy);
  if (kind === 'bun') {
    // Round bun from above: golden dome, lighter top, sesame seeds.
    ctx.fillStyle = '#e8a95c';
    ctx.beginPath();
    ctx.arc(0, 0, 40 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7cf8e';
    ctx.beginPath();
    ctx.arc(-6 * u, -8 * u, 26 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff3d0';
    const seeds = [[-18, -12], [4, -18], [20, -6], [-4, 2], [14, 12], [-20, 8]];
    for (const p of seeds) {
      ctx.beginPath();
      ctx.ellipse(p[0] * u, p[1] * u, 3.4 * u, 2.2 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineWidth = 2 * u;
    ctx.strokeStyle = '#c98a3e';
    ctx.beginPath();
    ctx.arc(0, 0, 40 * u, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'patty') {
    // Round patty from above, with grill stripes once cooked.
    let fill = '#8a5a3b';
    if (cooked !== undefined && cooked >= 1) fill = '#5e3a22';
    if (cooked !== undefined && cooked > 1) fill = '#241812';
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, 42 * u, 0, Math.PI * 2);
    ctx.fill();
    if (cooked !== undefined && cooked >= 1 && cooked <= 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 4 * u;
      for (const dx of [-18, 0, 18]) {
        ctx.beginPath();
        ctx.moveTo(dx * u, -30 * u);
        ctx.lineTo(dx * u, 30 * u);
        ctx.stroke();
      }
    }
    if (cooked !== undefined && cooked > 1) {
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(-16 * u, -4 * u, 5 * u, 0, Math.PI * 2);
      ctx.arc(12 * u, 6 * u, 6 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.arc(-10 * u, -12 * u, 18 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'tomato') {
    // Round tomato from above: red disc, stem star in the middle.
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.arc(0, 0, 40 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef6a5a';
    ctx.beginPath();
    ctx.arc(-12 * u, -12 * u, 22 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f8f3f';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 10 * u, Math.sin(a) * 10 * u, 7 * u, 3.5 * u, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#2f6b2f';
    ctx.beginPath();
    ctx.arc(0, 0, 4 * u, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'lettuce') {
    ctx.fillStyle = '#58b368';
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const px = Math.cos(a) * 38 * u;
      const py = Math.sin(a) * 26 * u;
      ctx.moveTo(px, py);
      ctx.arc(px, py, 14 * u, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = '#7ed491';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26 * u, 16 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'cheese') {
    // Square cheese slice from above, slightly turned, with holes.
    ctx.save();
    ctx.rotate(0.28);
    ctx.fillStyle = '#f7c948';
    roundRectPath(ctx, -36 * u, -36 * u, 72 * u, 72 * u, 8 * u);
    ctx.fill();
    ctx.fillStyle = '#e0a92e';
    const holes = [[-14, -8], [12, 6], [0, 18]];
    for (const p of holes) {
      ctx.beginPath();
      ctx.arc(p[0] * u, p[1] * u, 5 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (kind === 'onion') {
    ctx.strokeStyle = '#b678c2';
    ctx.lineWidth = 7 * u;
    for (let r = 1; r <= 3; r++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * 13 * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#e8d5ee';
    ctx.lineWidth = 3 * u;
    ctx.beginPath();
    ctx.arc(0, 0, 20 * u, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCustomerFace(ctx, mood, cx, cy, r, hair) {
  // mood: 'happy' | 'annoyed' | 'angry' — the Diner Dash patience face.
  // hair: optional hair color so each customer reads as a different person.
  const skin = mood === 'happy' ? '#ffd9a0' : mood === 'annoyed' ? '#f2b880' : '#e88a6a';
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#7a4a21';
  ctx.stroke();
  // hair
  ctx.fillStyle = hair || '#4a2c14';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.55, r * 0.92, Math.PI, 0);
  ctx.fill();
  // eyes
  const eyeY = cy - r * 0.1;
  const eyeDx = r * 0.38;
  ctx.fillStyle = '#2b1a0e';
  if (mood === 'angry') {
    // angled brows
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2b1a0e';
    ctx.beginPath();
    ctx.moveTo(cx - eyeDx - 7, eyeY - 12);
    ctx.lineTo(cx - eyeDx + 7, eyeY - 5);
    ctx.moveTo(cx + eyeDx + 7, eyeY - 12);
    ctx.lineTo(cx + eyeDx - 7, eyeY - 5);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx - eyeDx, eyeY, r * 0.11, 0, Math.PI * 2);
  ctx.arc(cx + eyeDx, eyeY, r * 0.11, 0, Math.PI * 2);
  ctx.fill();
  // mouth
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7a2d1a';
  ctx.beginPath();
  if (mood === 'happy') {
    ctx.arc(cx, cy + r * 0.28, r * 0.42, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood === 'annoyed') {
    ctx.moveTo(cx - r * 0.3, cy + r * 0.45);
    ctx.lineTo(cx + r * 0.3, cy + r * 0.45);
  } else {
    ctx.arc(cx, cy + r * 0.75, r * 0.4, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  if (mood === 'angry') {
    // steam puffs
    ctx.strokeStyle = 'rgba(120,120,120,0.8)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.5, cy - r * 1.15);
    ctx.quadraticCurveTo(cx - r * 0.65, cy - r * 1.4, cx - r * 0.45, cy - r * 1.55);
    ctx.moveTo(cx + r * 0.5, cy - r * 1.15);
    ctx.quadraticCurveTo(cx + r * 0.65, cy - r * 1.4, cx + r * 0.45, cy - r * 1.55);
    ctx.stroke();
  }
}

function drawHeart(ctx, cx, cy, s, full) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s / 20, s / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = full ? '#e63946' : 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = full ? '#8f1d27' : '#999';
  ctx.stroke();
  ctx.restore();
}

function drawChopMarks(ctx, x, y, w, h, progress) {
  // Three chop slots: filled as the player clicks the board.
  const n = 3;
  const gap = 8;
  const cw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const bx = x + i * (cw + gap);
    drawPanel(ctx, bx, y, cw, h, i < progress ? '#4c9a4c' : '#e8dcc8', '#b09a78', 6);
    if (i < progress) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx + cw * 0.28, y + h * 0.55);
      ctx.lineTo(bx + cw * 0.45, y + h * 0.72);
      ctx.lineTo(bx + cw * 0.75, y + h * 0.3);
      ctx.stroke();
    }
  }
}

function drawTimerBar(ctx, x, y, w, h, fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  drawPanel(ctx, x, y, w, h, '#3a2a1a', null, 5);
  const fill = f > 0.6 ? '#4c9a4c' : f > 0.3 ? '#f2c14e' : '#d94f3d';
  if (f > 0.02) {
    drawPanel(ctx, x + 2, y + 2, (w - 4) * f, h - 4, fill, null, 4);
  }
}

// ------------------------------------------------------------ the kitchen room
// Everything behind the game is a real room now, drawn from code: a warm
// tiled wall, a terracotta floor, a range hood, spice shelves, a hanging
// rail with utensils, a round window and even warm daylight. All shades are
// picked by a deterministic hash of the tile coordinates — no Math.random —
// so the room looks identical on every frame.

function tileShade(tx, ty, n) {
  let v = (tx * 73 + ty * 131 + 17) % n;
  return v < 0 ? v + n : v;
}

function drawWallTiles(ctx, x, y, w, h, tileW, tileH, shades, grout) {
  // Warm subway tiles: brick-offset rows, two-tone checker, STRONG grout
  // so the wall reads as a kitchen wall at a glance, not a plain backdrop.
  const rows = Math.ceil(h / tileH);
  for (let r = 0; r < rows; r++) {
    const ry = y + r * tileH;
    const rh = Math.min(tileH, y + h - ry);
    const off = (r % 2) * tileW / 2;
    for (let cx = x - tileW + off; cx < x + w; cx += tileW) {
      const col = Math.round((cx - x) / tileW);
      ctx.fillStyle = shades[(Math.abs(col) + r) % shades.length];
      const fx = Math.max(cx, x);
      ctx.fillRect(fx, ry, Math.min(tileW - (fx - cx), x + w - fx), rh);
    }
  }
  ctx.strokeStyle = grout;
  ctx.lineWidth = 3;
  for (let r = 0; r <= rows; r++) {
    const ry = y + r * tileH;
    if (ry > y + h) break;
    ctx.beginPath();
    ctx.moveTo(x, ry);
    ctx.lineTo(x + w, ry);
    ctx.stroke();
  }
  for (let r = 0; r < rows; r++) {
    const ry = y + r * tileH;
    const rh = Math.min(tileH, y + h - ry);
    const off = (r % 2) * tileW / 2;
    for (let cx = x - tileW + off; cx < x + w; cx += tileW) {
      ctx.beginPath();
      ctx.moveTo(cx, ry);
      ctx.lineTo(cx, ry + rh);
      ctx.stroke();
    }
  }
}

function drawFloorTiles(ctx, x, y, w, h, tile) {
  // Terracotta checkerboard floor with deterministic shade variation.
  const cols = Math.ceil(w / tile);
  const rows = Math.ceil(h / tile);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let tone = (c + r) % 2 === 0 ? '#c67b4e' : '#9e5a30';
      if (tileShade(c, r, 7) === 0) tone = '#d98a5a';
      ctx.fillStyle = tone;
      const fx = x + c * tile, fy = y + r * tile;
      ctx.fillRect(fx, fy, Math.min(tile, x + w - fx), Math.min(tile, y + h - fy));
    }
  }
  ctx.strokeStyle = 'rgba(90,50,25,0.50)';
  ctx.lineWidth = 3;
  for (let c = 0; c <= cols; c++) {
    const gx = x + c * tile;
    if (gx > x + w) break;
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    const gy = y + r * tile;
    if (gy > y + h) break;
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
}

function drawRangeHood(ctx, cx, topY, w) {
  // Stainless range hood over the grill: flared canopy, warm under-lights.
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const tw = w * 0.5;
  const tx0 = cx - tw / 2, tx1 = cx + tw / 2;
  const botY = topY + 10;
  const grad = ctx.createLinearGradient(0, topY, 0, botY);
  grad.addColorStop(0, '#eef1f3');
  grad.addColorStop(0.55, '#c9ced4');
  grad.addColorStop(1, '#9aa1a8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(tx0, topY);
  ctx.lineTo(tx1, topY);
  ctx.lineTo(x1, botY);
  ctx.lineTo(x0, botY);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#7d838a';
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(x0, botY - 2, w, 2);
  for (const lx of [cx - w * 0.28, cx + w * 0.28]) {
    ctx.fillStyle = 'rgba(255,233,168,0.4)';
    ctx.beginPath();
    ctx.arc(lx, topY + 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(lx, topY + 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpiceShelf(ctx, x, y, w) {
  // Wooden shelf plank with little spice jars standing on it.
  // (x, y) is the top-left of the plank; jars stand on top of it.
  const jarW = 15, jarH = 20, gap = 6;
  const n = Math.max(1, Math.floor((w + gap) / (jarW + gap)));
  const totalW = n * jarW + (n - 1) * gap;
  const fills = ['#d94f3d', '#e8823a', '#4c9a4c', '#f2c14e'];
  let jx = x + (w - totalW) / 2;
  for (let i = 0; i < n; i++) {
    drawPanel(ctx, jx, y - jarH, jarW, jarH, 'rgba(255,250,240,0.94)', '#b09a78', 4);
    ctx.fillStyle = fills[i % fills.length];
    ctx.fillRect(jx + 2, y - jarH + 9, jarW - 4, jarH - 11);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(jx + 1, y - jarH - 2, jarW - 2, 4);
    jx += jarW + gap;
  }
  ctx.fillStyle = '#8a5a2b';
  roundRectPath(ctx, x, y, w, 7, 3);
  ctx.fill();
  ctx.fillStyle = '#c98f4e';
  ctx.fillRect(x, y, w, 2);
}

function drawHangingRail(ctx, x1, x2, y, hooks) {
  // Steel rail with hooks; hooks: [{x, kind}] kind: 'spatula'|'ladle'|'whisk'.
  ctx.strokeStyle = '#9aa1a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  for (const h of hooks) {
    ctx.strokeStyle = '#7d838a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(h.x, y + 4, 3, Math.PI, 0);
    ctx.stroke();
    if (h.kind === 'spatula') {
      ctx.strokeStyle = '#8a5a2b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(h.x, y + 7);
      ctx.lineTo(h.x, y + 13);
      ctx.stroke();
      ctx.fillStyle = '#c9ced4';
      roundRectPath(ctx, h.x - 6, y + 13, 12, 9, 3);
      ctx.fill();
    } else if (h.kind === 'ladle') {
      ctx.strokeStyle = '#8a8a8a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(h.x, y + 7);
      ctx.lineTo(h.x, y + 13);
      ctx.stroke();
      ctx.fillStyle = '#c9ced4';
      ctx.beginPath();
      ctx.arc(h.x, y + 17, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9aa1a8';
      ctx.beginPath();
      ctx.arc(h.x, y + 17, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#8a8a8a';
      ctx.lineWidth = 2.5;
      for (const dx of [-4, 0, 4]) {
        ctx.beginPath();
        ctx.moveTo(h.x, y + 7);
        ctx.quadraticCurveTo(h.x + dx, y + 15, h.x, y + 22);
        ctx.stroke();
      }
      ctx.fillStyle = '#8a5a2b';
      ctx.fillRect(h.x - 3, y + 4, 6, 5);
    }
  }
}

function drawRoundWindow(ctx, cx, cy, r, clip) {
  // Small round kitchen window: warm daylight, sun, soft clouds, sill.
  ctx.save();
  if (clip) {
    ctx.beginPath();
    ctx.rect(clip.x, clip.y, clip.w, clip.h);
    ctx.clip();
  }
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 3.2);
  glow.addColorStop(0, 'rgba(255,220,140,0.30)');
  glow.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const sky = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  sky.addColorStop(0, '#ffe9a8');
  sky.addColorStop(0.6, '#ffd98a');
  sky.addColorStop(1, '#f7b96a');
  ctx.fillStyle = sky;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.3, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(cx - r * 0.35, cy - r * 0.3, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.3, cy + r * 0.28, r * 0.3, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();
  ctx.fillStyle = '#8a5a2b';
  roundRectPath(ctx, cx - r - 6, cy + r - 1, r * 2 + 12, 6, 3);
  ctx.fill();
}

function drawWarmLight(ctx, w, h, region) {
  // Even warm daylight: soft bright center-top, gentle darker corners.
  ctx.save();
  if (region) {
    ctx.beginPath();
    ctx.rect(region.x, region.y, region.w, region.h);
    ctx.clip();
  }
  const g = ctx.createRadialGradient(w / 2, h * 0.18, 80, w / 2, h * 0.45, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(255,240,200,0.18)');
  g.addColorStop(0.6, 'rgba(255,240,200,0.04)');
  g.addColorStop(1, 'rgba(90,50,20,0.08)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawBigPan(ctx, cx, bodyCy, r, kind) {
  // A LARGE pan hanging on the wall by its handle: hook, handle, round body.
  // kind: 'fry' (dark steel) | 'copper' (copper saucepan).
  const topY = bodyCy - r;
  const hookY = topY - 16;
  ctx.strokeStyle = '#7d838a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, hookY + 3, 4, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#5b3a1e';
  roundRectPath(ctx, cx - 4, hookY + 5, 8, topY - hookY - 2, 3);
  ctx.fill();
  const body = kind === 'copper' ? '#b06a42' : '#3a3a3a';
  const rim = kind === 'copper' ? '#d98a5a' : '#9aa1a8';
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.fillStyle = kind === 'copper' ? '#c67b4e' : '#555555';
  ctx.beginPath();
  ctx.arc(cx, bodyCy, r - 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, bodyCy - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function drawStoveBody(ctx, x, y, w, h) {
  // Stainless stove unit the two grill burners sit on: steel body, darker
  // control strip at the bottom with four knobs.
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#eef1f3');
  grad.addColorStop(0.6, '#c9ced4');
  grad.addColorStop(1, '#aab0b7');
  drawPanel(ctx, x, y, w, h, grad, '#7d838a', 10);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  ctx.fillRect(x + 4, y + h - 40, w - 8, 36);
  const knobY = y + h - 14;
  for (const kx of [x + w * 0.22, x + w * 0.40, x + w * 0.60, x + w * 0.78]) {
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(kx, knobY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(kx, knobY);
    ctx.lineTo(kx, knobY - 5.5);
    ctx.stroke();
  }
}

function drawFridge(ctx, x, y, w, h) {
  // Tall fridge silhouette: light steel, freezer door on top, fridge below,
  // vertical handles, a magnet and a little note.
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, '#eef1f3');
  grad.addColorStop(0.5, '#dde1e5');
  grad.addColorStop(1, '#c2c8ce');
  drawPanel(ctx, x, y, w, h, grad, '#8a9097', 8);
  const splitY = y + h * 0.32;
  ctx.strokeStyle = '#8a9097';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, splitY);
  ctx.lineTo(x + w - 3, splitY);
  ctx.stroke();
  ctx.fillStyle = '#7d838a';
  roundRectPath(ctx, x + 7, y + h * 0.10, 6, h * 0.16, 3);
  ctx.fill();
  roundRectPath(ctx, x + 7, splitY + h * 0.08, 6, h * 0.22, 3);
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.arc(x + w * 0.62, y + h * 0.18, 5, 0, Math.PI * 2);
  ctx.fill();
  drawPanel(ctx, x + w * 0.55, y + h * 0.22, w * 0.34, h * 0.07, '#fff8ec', '#d9b380', 2);
}

function drawSink(ctx, x, y, w) {
  // Sink basin set into the worktop (x, y = top-left of the basin, w wide)
  // plus a small tap rising behind its right end.
  drawPanel(ctx, x, y, w, 26, '#c9ced4', '#8a9097', 8);
  drawPanel(ctx, x + 5, y + 4, w - 10, 18, '#5a6068', null, 6);
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 13, 4, 0, Math.PI * 2);
  ctx.fill();
  const fx = x + w - 2;
  ctx.strokeStyle = '#9aa1a8';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx, y + 2);
  ctx.lineTo(fx, y - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fx, y - 20);
  ctx.lineTo(fx - 12, y - 20);
  ctx.stroke();
}

function drawPot(ctx, x, y, w, h) {
  // Stainless pot with a lid, standing on the worktop.
  // (x, y) is the top-left of the lid; the body ends at y + h.
  ctx.fillStyle = '#e8ebee';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 6, w / 2 + 2, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9aa1a8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 1, 4, 0, Math.PI * 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#d5d9de');
  grad.addColorStop(1, '#9aa1a8');
  drawPanel(ctx, x, y + 8, w, h - 8, grad, '#7d838a', 6);
  ctx.fillStyle = '#5b3a1e';
  roundRectPath(ctx, x - 8, y + 12, 10, 6, 3);
  ctx.fill();
  roundRectPath(ctx, x + w - 2, y + 12, 10, 6, 3);
  ctx.fill();
}

function drawChef(ctx, cx, baseY, s, bob) {
  // The cook of Dapur Kilat, standing behind the counter.
  // (cx, baseY) is the bottom center; s is the height in pixels.
  // bob: small vertical idle offset in pixels.
  const u = s / 240;
  const top = baseY - s + (bob || 0);
  ctx.save();
  // toque (chef hat): three soft bumps
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.arc(cx - 26 * u, top + 26 * u, 22 * u, 0, Math.PI * 2);
  ctx.arc(cx, top + 16 * u, 26 * u, 0, Math.PI * 2);
  ctx.arc(cx + 26 * u, top + 26 * u, 22 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, cx - 34 * u, top + 30 * u, 68 * u, 22 * u, 8 * u);
  ctx.fill();
  ctx.stroke();
  // face
  const faceY = top + 82 * u;
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(cx, faceY, 30 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = '#7a4a21';
  ctx.stroke();
  // eyes + smile + blush
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.arc(cx - 11 * u, faceY - 4 * u, 3.4 * u, 0, Math.PI * 2);
  ctx.arc(cx + 11 * u, faceY - 4 * u, 3.4 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a2d1a';
  ctx.lineWidth = 2.6 * u;
  ctx.beginPath();
  ctx.arc(cx, faceY + 8 * u, 11 * u, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = 'rgba(217,79,61,0.35)';
  ctx.beginPath();
  ctx.arc(cx - 19 * u, faceY + 8 * u, 5 * u, 0, Math.PI * 2);
  ctx.arc(cx + 19 * u, faceY + 8 * u, 5 * u, 0, Math.PI * 2);
  ctx.fill();
  // moustache
  ctx.fillStyle = '#4a2c14';
  ctx.beginPath();
  ctx.ellipse(cx - 8 * u, faceY + 14 * u, 9 * u, 3.4 * u, -0.25, 0, Math.PI * 2);
  ctx.ellipse(cx + 8 * u, faceY + 14 * u, 9 * u, 3.4 * u, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // jacket
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, cx - 46 * u, top + 112 * u, 92 * u, 96 * u, 14 * u);
  ctx.fill();
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  // neckerchief
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(cx - 14 * u, top + 114 * u);
  ctx.lineTo(cx + 14 * u, top + 114 * u);
  ctx.lineTo(cx, top + 132 * u);
  ctx.closePath();
  ctx.fill();
  // jacket buttons
  ctx.fillStyle = '#8a8a8a';
  for (const by of [140, 162, 184]) {
    ctx.beginPath();
    ctx.arc(cx, top + by * u, 3 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // apron
  ctx.fillStyle = '#3d7ea6';
  roundRectPath(ctx, cx - 34 * u, top + 152 * u, 68 * u, 56 * u, 8 * u);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold ' + Math.round(13 * u) + "px 'Trebuchet MS', Verdana, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KILAT', cx, top + 180 * u);
  // legs (trousers) down to the feet, plus shoes — the chef stands on the
  // floor, so his figure reaches baseY instead of ending at the apron.
  const legTop = top + 198 * u;
  const legH = baseY - legTop;
  ctx.fillStyle = '#4a3a30';
  roundRectPath(ctx, cx - 32 * u, legTop, 26 * u, legH, 6 * u);
  ctx.fill();
  roundRectPath(ctx, cx + 6 * u, legTop, 26 * u, legH, 6 * u);
  ctx.fill();
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.ellipse(cx - 19 * u, baseY - 4 * u, 15 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 19 * u, baseY - 4 * u, 15 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // left arm resting on the counter
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 13 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 44 * u, top + 128 * u);
  ctx.quadraticCurveTo(cx - 62 * u, top + 168 * u, cx - 52 * u, top + 200 * u);
  ctx.stroke();
  // right arm holding a spatula up
  ctx.beginPath();
  ctx.moveTo(cx + 44 * u, top + 128 * u);
  ctx.quadraticCurveTo(cx + 66 * u, top + 158 * u, cx + 58 * u, top + 116 * u);
  ctx.stroke();
  // spatula: handle + flat head
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 5 * u;
  ctx.beginPath();
  ctx.moveTo(cx + 58 * u, top + 116 * u);
  ctx.lineTo(cx + 74 * u, top + 84 * u);
  ctx.stroke();
  ctx.fillStyle = '#c0c0c0';
  roundRectPath(ctx, cx + 66 * u, top + 58 * u, 18 * u, 28 * u, 4 * u);
  ctx.fill();
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 1.6 * u;
  ctx.stroke();
  ctx.restore();
}

function drawSpeechBubble(ctx, x, y, w, h, text, tailX) {
  // A small rounded bubble with a tail pointing down at tailX.
  drawPanel(ctx, x, y, w, h, '#ffffff', '#d9b380', 12);
  ctx.beginPath();
  ctx.moveTo(tailX - 9, y + h - 1);
  ctx.lineTo(tailX + 9, y + h - 1);
  ctx.lineTo(tailX, y + h + 12);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#d9b380';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, text, x + w / 2, y + h / 2 + 1, 15, '#2b1a0e', 'center');
}

// ------------------------------------------------------------ top-down view
// Round 3: the camera moved overhead. Everything below is drawn as it
// looks from directly above — the floor fills the room, the counter is a
// worktop seen from above, and the chef is a head-and-shoulders figure
// standing on the floor. The old side-view helpers above stay in the file
// unused; nothing else references them.

function drawWorktop(ctx, x, y, w, h) {
  // One long kitchen counter seen from above: a wood worktop slab with a
  // soft shadow, a lighter top edge and faint grain lines.
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  roundRectPath(ctx, x + 2, y + 7, w, h, 14);
  ctx.fill();
  // Front face: the slab's front edge steps down and in, so the counter
  // reads as a solid slab with depth instead of a flat strip. The slanted
  // sides are the diagonal; paint only, nothing moves.
  ctx.fillStyle = 'rgba(90,50,25,0.35)';
  ctx.beginPath();
  ctx.moveTo(x + 10, y + h - 2);
  ctx.lineTo(x + w - 10, y + h - 2);
  ctx.lineTo(x + w - 22, y + h + 9);
  ctx.lineTo(x + 22, y + h + 9);
  ctx.closePath();
  ctx.fill();
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#e0b47e');
  grad.addColorStop(1, '#c98f4e');
  drawPanel(ctx, x, y, w, h, grad, '#8a5a2b', 14);
  ctx.fillStyle = '#f2d9a0';
  ctx.fillRect(x + 10, y + 5, w - 20, 4);
  ctx.strokeStyle = 'rgba(90,50,25,0.18)';
  ctx.lineWidth = 2;
  for (const gy of [y + h * 0.3, y + h * 0.55, y + h * 0.8]) {
    ctx.beginPath();
    ctx.moveTo(x + 16, gy);
    ctx.lineTo(x + w - 16, gy);
    ctx.stroke();
  }
}

function drawFridgeTop(ctx, x, y, w, h) {
  // Fridge footprint seen from above: light steel block, door split line,
  // two handles and a magnet.
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  roundRectPath(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, '#eef1f3');
  grad.addColorStop(0.5, '#dde1e5');
  grad.addColorStop(1, '#c2c8ce');
  drawPanel(ctx, x, y, w, h, grad, '#8a9097', 8);
  ctx.strokeStyle = '#8a9097';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h * 0.4);
  ctx.lineTo(x + w - 4, y + h * 0.4);
  ctx.stroke();
  ctx.fillStyle = '#7d838a';
  roundRectPath(ctx, x + 6, y + 8, 5, h * 0.25, 2);
  ctx.fill();
  roundRectPath(ctx, x + 6, y + h * 0.48, 5, h * 0.3, 2);
  ctx.fill();
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.arc(x + w * 0.65, y + h * 0.2, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawSinkTop(ctx, x, y, w, h) {
  // Sink basin seen from above, set into the worktop, with a small tap.
  drawPanel(ctx, x, y, w, h, '#c9ced4', '#8a9097', 10);
  drawPanel(ctx, x + 6, y + 5, w - 12, h - 10, '#5a6068', null, 8);
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9aa1a8';
  ctx.beginPath();
  ctx.arc(x + w - 8, y - 2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9aa1a8';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w - 8, y - 2);
  ctx.lineTo(x + w - 22, y + 2);
  ctx.stroke();
}

function drawPotTop(ctx, cx, cy, r) {
  // Pot seen from above: a round lid with a knob, handles at the sides.
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.25, r + 3, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8ebee';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#9aa1a8';
  ctx.stroke();
  ctx.fillStyle = '#d5d9de';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a1e';
  roundRectPath(ctx, cx - r - 9, cy - 4, 10, 8, 3);
  ctx.fill();
  roundRectPath(ctx, cx + r - 1, cy - 4, 10, 8, 3);
  ctx.fill();
}

function drawHerbPot(ctx, cx, cy, r) {
  // Small potted herb plant on the floor, seen from above.
  ctx.fillStyle = '#b06a42';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a4a2a';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#58b368';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.45, cy + Math.sin(a) * r * 0.45, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7ed491';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFloorRug(ctx, x, y, w, h) {
  // Woven rug on the floor: warm stripes with a border.
  drawPanel(ctx, x, y, w, h, '#d9a05b', '#8a5a2b', 10);
  ctx.fillStyle = '#c67b4e';
  ctx.fillRect(x + 8, y + h * 0.28, w - 16, h * 0.18);
  ctx.fillRect(x + 8, y + h * 0.56, w - 16, h * 0.18);
  ctx.fillStyle = '#f2d9a0';
  ctx.fillRect(x + 8, y + h * 0.1, w - 16, 3);
  ctx.fillRect(x + 8, y + h * 0.82, w - 16, 3);
}

function drawVegCrate(ctx, x, y, w, h) {
  // Wooden crate of vegetables on the floor, seen from above.
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  roundRectPath(ctx, x + 3, y + 4, w, h, 6);
  ctx.fill();
  drawPanel(ctx, x, y, w, h, '#8a5a2b', '#5b3a1e', 6);
  drawPanel(ctx, x + 6, y + 6, w - 12, h - 12, '#6b4423', null, 4);
  drawIngredient(ctx, 'tomato', x + w * 0.28, y + h * 0.5, 34);
  drawIngredient(ctx, 'lettuce', x + w * 0.55, y + h * 0.42, 36);
  drawIngredient(ctx, 'onion', x + w * 0.8, y + h * 0.55, 30);
}

function drawTrolley(ctx, x, y, w, h) {
  // Small serving trolley on the floor: steel frame, stacked plates on top,
  // two wheels below.
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  roundRectPath(ctx, x + 3, y + 4, w, h, 8);
  ctx.fill();
  drawPanel(ctx, x, y, w, h - 12, '#c9ced4', '#8a9097', 8);
  for (let i = 0; i < 3; i++) {
    const px = x + 30 + i * 42;
    const py = y + (h - 12) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d9b380';
    ctx.stroke();
    ctx.fillStyle = '#f3e2c7';
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(x + 24, y + h - 4, 7, 0, Math.PI * 2);
  ctx.arc(x + w - 24, y + h - 4, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawChefTop(ctx, cx, baseY, s, bob) {
  // The cook seen from above (a slight 3/4 tilt so the face still reads):
  // toque from above, face peeking below it, shoulders, apron, arms, feet
  // on the floor. (cx, baseY) is the bottom center; s is the figure height.
  // bob: small vertical idle offset in pixels.
  const u = s / 240;
  const by = baseY + (bob || 0);
  ctx.save();
  // soft floor shadow (stays put while the figure bobs)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 4 * u, 50 * u, 9 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // feet + legs (trousers), standing on the floor
  ctx.fillStyle = '#4a3a30';
  roundRectPath(ctx, cx - 30 * u, by - 32 * u, 24 * u, 30 * u, 6 * u);
  ctx.fill();
  roundRectPath(ctx, cx + 6 * u, by - 32 * u, 24 * u, 30 * u, 6 * u);
  ctx.fill();
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.ellipse(cx - 18 * u, by - 3 * u, 14 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 18 * u, by - 3 * u, 14 * u, 6 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // shoulders / jacket
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, cx - 46 * u, by - 74 * u, 92 * u, 54 * u, 16 * u);
  ctx.fill();
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  // apron
  ctx.fillStyle = '#3d7ea6';
  roundRectPath(ctx, cx - 30 * u, by - 64 * u, 60 * u, 36 * u, 8 * u);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold ' + Math.round(11 * u) + "px 'Trebuchet MS', Verdana, sans-serif";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KILAT', cx, by - 46 * u);
  // neckerchief
  ctx.fillStyle = '#d94f3d';
  ctx.beginPath();
  ctx.moveTo(cx - 13 * u, by - 76 * u);
  ctx.lineTo(cx + 13 * u, by - 76 * u);
  ctx.lineTo(cx, by - 60 * u);
  ctx.closePath();
  ctx.fill();
  // arms: white sleeves at the sides
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 48 * u, by - 54 * u, 11 * u, 0, Math.PI * 2);
  ctx.arc(cx + 48 * u, by - 54 * u, 11 * u, 0, Math.PI * 2);
  ctx.fill();
  // right arm holds a spatula, lying flat (seen from above)
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4 * u;
  ctx.beginPath();
  ctx.moveTo(cx + 48 * u, by - 54 * u);
  ctx.lineTo(cx + 66 * u, by - 82 * u);
  ctx.stroke();
  ctx.fillStyle = '#c0c0c0';
  roundRectPath(ctx, cx + 58 * u, by - 100 * u, 16 * u, 22 * u, 4 * u);
  ctx.fill();
  ctx.strokeStyle = '#8a8a8a';
  ctx.lineWidth = 1.5 * u;
  ctx.stroke();
  // face, peeking below the toque
  const faceY = by - 72 * u;
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(cx, faceY, 20 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = '#7a4a21';
  ctx.stroke();
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.arc(cx - 8 * u, faceY - 3 * u, 2.6 * u, 0, Math.PI * 2);
  ctx.arc(cx + 8 * u, faceY - 3 * u, 2.6 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a2d1a';
  ctx.lineWidth = 2.2 * u;
  ctx.beginPath();
  ctx.arc(cx, faceY + 7 * u, 8 * u, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#4a2c14';
  ctx.beginPath();
  ctx.ellipse(cx - 6 * u, faceY + 11 * u, 6 * u, 2.4 * u, -0.25, 0, Math.PI * 2);
  ctx.ellipse(cx + 6 * u, faceY + 11 * u, 6 * u, 2.4 * u, 0.25, 0, Math.PI * 2);
  ctx.fill();
  // toque from above: a big white scalloped disc on top of the head
  const tqY = by - 104 * u;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - 20 * u, tqY - 4 * u, 17 * u, 0, Math.PI * 2);
  ctx.arc(cx, tqY - 10 * u, 20 * u, 0, Math.PI * 2);
  ctx.arc(cx + 20 * u, tqY - 4 * u, 17 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cbb2';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, cx - 28 * u, tqY + 4 * u, 56 * u, 16 * u, 7 * u);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawWaitingCustomer(ctx, cx, baseY, s, shirt, hair) {
  // A waiting customer at the serving pass: an original Dapur Kilat
  // figure in the same code-drawn style as the chef — shoes, trousers,
  // shirt, head and hair — standing on the floor facing the counter.
  // (cx, baseY) is the bottom center; s is the figure height in pixels.
  const u = s / 110;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 3 * u, 34 * u, 7 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  // shoes + trousers
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.ellipse(cx - 14 * u, baseY - 2 * u, 11 * u, 5 * u, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 14 * u, baseY - 2 * u, 11 * u, 5 * u, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3a30';
  roundRectPath(ctx, cx - 22 * u, baseY - 28 * u, 18 * u, 24 * u, 5 * u);
  ctx.fill();
  roundRectPath(ctx, cx + 4 * u, baseY - 28 * u, 18 * u, 24 * u, 5 * u);
  ctx.fill();
  // shirt / shoulders
  ctx.fillStyle = shirt;
  roundRectPath(ctx, cx - 32 * u, baseY - 66 * u, 64 * u, 42 * u, 13 * u);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  // arms at the sides
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.arc(cx - 34 * u, baseY - 46 * u, 8 * u, 0, Math.PI * 2);
  ctx.arc(cx + 34 * u, baseY - 46 * u, 8 * u, 0, Math.PI * 2);
  ctx.fill();
  // head + hair, looking up toward the counter
  const headY = baseY - 80 * u;
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(cx, headY, 17 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = '#7a4a21';
  ctx.stroke();
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(cx, headY - 17 * u * 0.45, 16 * u, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.arc(cx - 6 * u, headY - 2 * u, 2.2 * u, 0, Math.PI * 2);
  ctx.arc(cx + 6 * u, headY - 2 * u, 2.2 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a2d1a';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.arc(cx, headY + 6 * u, 7 * u, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.restore();
}
