// game.js — Dapur Kilat: state, main loop, input, rendering and demo staging.
// A warung cooking game: chop, grill, build the plate, serve fast.
// Layout is one clean grid: header, order board, kitchen stations, bins,
// hints, footer. One font, one warm palette, big readable labels.

const W = 1280;
const H = 800;
const SHIFT_SECONDS = 120;
const FONT = "'Trebuchet MS', Verdana, sans-serif";

const INGREDIENTS = [
  { kind: 'bun', key: '1', label: 'Bun', tag: 'DIRECT', tagColor: '#3d7ea6' },
  { kind: 'patty', key: '2', label: 'Patty', tag: 'GRILL', tagColor: '#e8823a' },
  { kind: 'tomato', key: '3', label: 'Tomato', tag: 'CHOP x3', tagColor: '#4c9a4c' },
  { kind: 'lettuce', key: '4', label: 'Lettuce', tag: 'CHOP x3', tagColor: '#4c9a4c' },
  { kind: 'cheese', key: '5', label: 'Cheese', tag: 'DIRECT', tagColor: '#3d7ea6' },
  { kind: 'onion', key: '6', label: 'Onion', tag: 'CHOP x3', tagColor: '#4c9a4c' },
];

// Every zone on the screen, measured once so nothing overlaps or drifts.
const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 58 },
  orders: { x: 32, y: 68, w: 296, h: 120, gap: 10 },
  kitchen: { x: 32, y: 200, w: 1216, h: 324 },
  grillSlots: [
    { x: 48, y: 280, w: 128, h: 150 },
    { x: 188, y: 280, w: 128, h: 150 },
  ],
  board: { x: 332, y: 280, w: 280, h: 150 },
  chef: { cx: 664, baseY: 522, s: 250 },
  bubble: { x: 596, y: 330, w: 148, h: 40, tailX: 664 },
  plate: { cx: 856, cy: 366, rx: 100, ry: 64 },
  serveBtn: { x: 776, y: 436, w: 160, h: 44 },
  trashBtn: { x: 944, y: 436, w: 36, h: 44 },
  passShelf: { x: 1028, y: 340, w: 188, h: 14 },
  bins: { x: 32, y: 540, w: 194, h: 160, gap: 10 },
  hints: { y: 730 },
  footer: { x: 0, y: 760, w: 1280, h: 40 },
};

function makeState() {
  const kitchen = makeKitchen();
  return {
    screen: 'title', // 'title' | 'playing' | 'over'
    now: 0,
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    lost: 0,
    combo: 1,
    bestCombo: 1,
    tips: 0,
    hearts: 3,
    orders: [],
    grill: kitchen.grill,
    board: kitchen.board,
    plate: kitchen.plate,
    lastServed: null,
    nextSpawnAt: 0,
    rush: false,
    rushAnnounced: false,
    overReason: '',
    popups: [],
    particles: [],
    bubble: null,
    flash: 0, // red flash timer after a wrong ingredient
    demo: null,
    started: false,
  };
}

let state = makeState();
let canvas = null;
let ctx = null;
let lastFrame = 0;
let steamAccumulator = 0;

function resetGame() {
  state = makeState();
  state.screen = 'playing';
  state.started = true;
  state.nextSpawnAt = 0.5;
  spawnOrder(state, 0);
}

function startGame() {
  AudioEngine.ensureAudio();
  resetGame();
}

function endGame(reason) {
  state.screen = 'over';
  state.overReason = reason;
  AudioEngine.stopSizzle();
  if (reason === 'shift complete') AudioEngine.playJingle();
  else AudioEngine.playSad();
}

function addPopup(x, y, text, color, big) {
  state.popups.push({ x: x, y: y, text: text, color: color, born: state.now, life: 1.4, big: !!big });
}

function showBubble(text, seconds) {
  state.bubble = { text: text, until: state.now + (seconds || 2.5) };
}

function addSteam(x, y) {
  if (state.particles.length > 80) return;
  state.particles.push({
    kind: 'steam', x: x + (Math.random() * 40 - 20), y: y,
    vy: -28 - Math.random() * 18, r: 3 + Math.random() * 4, born: state.now, life: 1.1,
  });
}

function addSparkles(x, y) {
  for (let i = 0; i < 14; i++) {
    state.particles.push({
      kind: 'spark', x: x + (Math.random() * 120 - 60), y: y + (Math.random() * 30 - 15),
      vy: -40 - Math.random() * 40, r: 2 + Math.random() * 3, born: state.now, life: 0.9,
    });
  }
}

function update(dt) {
  if (state.screen !== 'playing' || state.demo) return;
  state.now += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.now);
  state.flash = Math.max(0, state.flash - dt);

  // Rush hour: the middle of the shift, orders arrive almost twice as fast.
  const inRush = state.timeLeft <= 75 && state.timeLeft > 45;
  if (inRush && !state.rush) {
    state.rush = true;
    if (!state.rushAnnounced) {
      state.rushAnnounced = true;
      addPopup(640, 300, 'RUSH HOUR! Orders coming fast!', '#e8823a', true);
      showBubble('Rush hour! Faster!');
      AudioEngine.playDing();
    }
  } else if (!inRush) {
    state.rush = false;
  }

  // Spawn orders on a timer.
  if (state.now >= state.nextSpawnAt) {
    const spawned = spawnOrder(state, state.now);
    if (spawned) state.nextSpawnAt = state.now + (state.rush ? 6 : 11);
    else state.nextSpawnAt = state.now + 2;
  }

  // Expire orders whose patience ran out.
  for (const order of state.orders.slice()) {
    if (state.now >= order.expiresAt) {
      removeOrder(state, order);
      state.hearts -= 1;
      state.lost += 1;
      state.combo = 1;
      addPopup(640, 240, 'Order expired! -1 heart', '#d94f3d', true);
      showBubble('Too slow...');
      AudioEngine.playSad();
      if (state.hearts <= 0) {
        endGame('out of hearts');
        return;
      }
    }
  }

  // Grill progress and burning.
  const events = updateGrill(state, state.now);
  for (const e of events) {
    if (e.type === 'cooked') {
      showBubble("Patty's ready!");
      AudioEngine.playPop();
    } else if (e.type === 'burnt') {
      addPopup(112, 458, 'Burnt! Click it to trash it', '#d94f3d', false);
      showBubble('Oh no, it burnt!');
      AudioEngine.playBuzz();
    }
  }

  // Sizzle steam over cooking patties.
  steamAccumulator += dt;
  while (steamAccumulator > 0.12) {
    steamAccumulator -= 0.12;
    state.grill.forEach((slot, i) => {
      if (slot.kind !== null && !slot.burnt) {
        const r = LAYOUT.grillSlots[i];
        addSteam(r.x + r.w / 2, r.y + 30);
      }
    });
  }

  // Age popups and particles.
  state.popups = state.popups.filter((p) => state.now - p.born < p.life);
  state.particles = state.particles.filter((p) => state.now - p.born < p.life);

  if (state.timeLeft <= 0) endGame('shift complete');
}

function frame(t) {
  const dt = Math.min(0.1, Math.max(0, (t - lastFrame) / 1000 || 0));
  lastFrame = t;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------ rendering

function drawBackground() {
  // Top-down: the whole room is terracotta floor, seen from above.
  drawFloorTiles(ctx, 0, 58, W, 702, 64);
  // a woven rug under the hints line so the text stays readable
  ctx.fillStyle = 'rgba(255,248,236,0.80)';
  roundRectPath(ctx, 210, 716, 860, 28, 10);
  ctx.fill();
  ctx.strokeStyle = '#c67b4e';
  ctx.lineWidth = 2;
  roundRectPath(ctx, 216, 721, 848, 18, 7);
  ctx.stroke();
  drawWarmLight(ctx, W, H);
}

function drawHeader() {
  const h = LAYOUT.header;
  ctx.fillStyle = '#a83226';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(h.x, h.y + h.h - 4, h.w, 4);
  // small toque icon
  ctx.fillStyle = '#fff8ec';
  ctx.beginPath();
  ctx.arc(46, 24, 10, 0, Math.PI * 2);
  ctx.arc(58, 20, 11, 0, Math.PI * 2);
  ctx.arc(70, 24, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(38, 28, 40, 10);
  drawText(ctx, 'DAPUR KILAT', 88, 26, 30, '#fff8ec', 'left');
  drawText(ctx, 'WARUNG LIGHTNING KITCHEN', 88, 47, 11, '#f7cf8e', 'left');
  // shift timer
  drawText(ctx, 'SHIFT', 500, 20, 12, '#f7cf8e', 'left');
  drawTimerBar(ctx, 500, 30, 340, 16, state.timeLeft / SHIFT_SECONDS);
  const mins = Math.floor(state.timeLeft / 60);
  const secs = Math.floor(state.timeLeft % 60);
  const timeText = mins + ':' + (secs < 10 ? '0' : '') + secs;
  ctx.font = 'bold 15px ' + FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2b1a0e';
  ctx.strokeText(timeText, 670, 39);
  drawText(ctx, timeText, 670, 39, 15, '#ffffff', 'center');
  if (state.rush) {
    drawText(ctx, 'RUSH HOUR!', 860, 39, 15, '#f2c14e', 'left');
  }
  // score, combo, tips, hearts, served/lost
  drawText(ctx, 'SCORE', 960, 18, 11, '#f7cf8e', 'left');
  drawText(ctx, String(state.score), 960, 35, 22, '#ffffff', 'left');
  drawText(ctx, 'Served ' + state.served + ' • Lost ' + state.lost, 960, 52, 10, '#f7cf8e', 'left');
  const comboColor = state.combo > 1 ? '#f2c14e' : '#e8dcc8';
  drawText(ctx, 'COMBO x' + state.combo, 1060, 28, 18, comboColor, 'left');
  drawText(ctx, 'TIPS $' + state.tips, 1060, 48, 12, '#f7cf8e', 'left');
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 1170 + i * 32, 30, 22, i < state.hearts);
  }
}

function drawOrderTicket(order, x, y, w, h) {
  const frac = orderTimeFraction(order, state.now);
  const mood = orderMood(order, state.now);
  const urgent = frac < 0.3;
  drawPanel(ctx, x, y, w, h, '#ffffff', urgent ? '#d94f3d' : '#d9b380', 12);
  if (urgent) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(state.now * 6);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d94f3d';
    roundRectPath(ctx, x + 1, y + 1, w - 2, h - 2, 12);
    ctx.stroke();
    ctx.restore();
  }
  drawCustomerFace(ctx, mood, x + 42, y + 48, 26, order.look);
  drawText(ctx, order.dish.name, x + 78, y + 26, 17, '#2b1a0e', 'left');
  const left = Math.ceil(orderTimeLeft(order, state.now));
  drawText(ctx, left + 's', x + w - 14, y + 26, 15, urgent ? '#d94f3d' : '#7a5a3a', 'right');
  // recipe icons
  order.dish.recipe.forEach((kind, i) => {
    drawIngredient(ctx, kind, x + 92 + i * 32, y + 58, 26, kind === 'patty' ? 1 : undefined);
  });
  const moodWord = mood === 'happy' ? 'HAPPY' : mood === 'annoyed' ? 'HURRY!' : 'ANGRY!';
  const moodColor = mood === 'happy' ? '#4c9a4c' : mood === 'annoyed' ? '#e8823a' : '#d94f3d';
  drawText(ctx, moodWord, x + 42, y + 90, 11, moodColor, 'center');
  drawTimerBar(ctx, x + 16, y + 100, w - 32, 10, frac);
}

function drawOrderBoard() {
  const o = LAYOUT.orders;
  for (let i = 0; i < 4; i++) {
    const x = o.x + i * (o.w + o.gap);
    const order = state.orders[i];
    if (order) {
      drawOrderTicket(order, x, o.y, o.w, o.h);
    } else {
      drawPanel(ctx, x, o.y, o.w, o.h, 'rgba(255,255,255,0.45)', '#d9b380', 12);
      drawText(ctx, 'waiting for', x + o.w / 2, o.y + 48, 14, '#a08a6a', 'center');
      drawText(ctx, 'the next order...', x + o.w / 2, o.y + 70, 14, '#a08a6a', 'center');
    }
  }
}

function drawGrillSlot(slot, rect) {
  // One burner seen from above: a round grate on the worktop, the patty
  // cooking on it as a round disc. Status shows below the burner.
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 62;
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#7d838a';
  ctx.stroke();
  // grate: inner ring + cross spokes
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 50, cy);
  ctx.lineTo(cx + 50, cy);
  ctx.moveTo(cx, cy - 50);
  ctx.lineTo(cx, cy + 50);
  ctx.stroke();
  if (slot.kind === null) {
    drawText(ctx, 'empty', cx, cy, 14, '#999999', 'center');
    return;
  }
  const age = state.now - slot.startedAt;
  const cooked = slot.burnt ? 2 : age >= GRILL_COOK_TIME ? 1 : age / GRILL_COOK_TIME;
  drawIngredient(ctx, 'patty', cx, cy, 84, cooked);
  if (slot.burnt) {
    drawText(ctx, 'BURNT!', cx, rect.y + rect.h - 22, 15, '#a83226', 'center');
  } else if (slot.done) {
    drawText(ctx, 'READY! click it', cx, rect.y + rect.h - 22, 13, '#2f6b2f', 'center');
  } else {
    const left = Math.ceil(GRILL_COOK_TIME - age);
    drawTimerBar(ctx, rect.x + 14, rect.y + rect.h - 34, rect.w - 28, 8, age / GRILL_COOK_TIME);
    drawText(ctx, 'cooking ' + left + 's', cx, rect.y + rect.h - 16, 12, '#2b1a0e', 'center');
  }
}

function drawChoppingBoard() {
  const b = LAYOUT.board;
  // Flat board seen from above: a pale wood slab on the worktop.
  drawPanel(ctx, b.x, b.y, b.w, b.h, '#e0aa6a', '#8a5a2b', 10);
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(b.x + 10, b.y + b.h - 18, b.w - 20, 8);
  if (state.board.kind) {
    drawIngredient(ctx, state.board.kind, b.x + b.w / 2, b.y + 62, 88);
    // knife lying flat on the board, seen from above
    ctx.save();
    ctx.translate(b.x + b.w - 62, b.y + 52);
    ctx.fillStyle = '#c0c0c0';
    roundRectPath(ctx, -30, -5, 34, 10, 4);
    ctx.fill();
    ctx.fillStyle = '#5b3a1e';
    roundRectPath(ctx, 4, -6, 22, 12, 4);
    ctx.fill();
    ctx.restore();
    drawChopMarks(ctx, b.x + 60, b.y + b.h - 34, b.w - 120, 18, state.board.chops);
    // cream chip so the hint reads on the wooden worktop
    drawPanel(ctx, b.x + b.w / 2 - 80, b.y + b.h + 13, 160, 22, 'rgba(255,248,236,0.92)', null, 8);
    drawText(ctx, 'Click to chop (' + state.board.chops + '/3)', b.x + b.w / 2, b.y + b.h + 24, 13, '#7a5a3a', 'center');
  } else {
    drawText(ctx, 'empty — click a veggie bin', b.x + b.w / 2, b.y + b.h / 2, 14, '#8a6a45', 'center');
  }
}

function drawPrepPlate() {
  const p = LAYOUT.plate;
  // plate shadow + plate
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(p.cx, p.cy + 8, p.rx + 6, p.ry + 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d9b380';
  ctx.stroke();
  ctx.fillStyle = '#f3e2c7';
  ctx.beginPath();
  ctx.ellipse(p.cx, p.cy, p.rx - 22, p.ry - 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // stacked ingredients, each layer slightly offset so the pile reads
  // from above instead of a flat stack; drawn ~25% bigger than before
  // so the finished dish is the hero of the counter
  state.plate.forEach((kind, i) => {
    const dx = (i % 2 === 0 ? -7 : 7);
    const y = p.cy - 2 - i * 8;
    drawIngredient(ctx, kind, p.cx + dx, y, 80, kind === 'patty' ? 1 : undefined);
  });
  if (state.plate.length === 0) {
    drawText(ctx, 'plate is empty', p.cx, p.cy - 2, 14, '#b09a78', 'center');
  }
  // serve button
  const btn = LAYOUT.serveBtn;
  const matching = findMatchingOrder(state);
  const ready = !!matching;
  const pulse = ready ? 1 + 0.06 * Math.sin(state.now * 6) : 1;
  ctx.save();
  ctx.translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
  ctx.scale(pulse, pulse);
  ctx.translate(-(btn.x + btn.w / 2), -(btn.y + btn.h / 2));
  drawPanel(ctx, btn.x, btn.y, btn.w, btn.h, ready ? '#4c9a4c' : '#b9b0a0', ready ? '#2f6b2f' : '#8a8a8a', 10);
  drawText(ctx, ready ? 'SERVE!' : 'SERVE', btn.x + btn.w / 2, btn.y + btn.h / 2 + 1, 20, '#ffffff', 'center');
  ctx.restore();
  // Recipe card: the dish the plate is building toward (partial or full
  // match), with a mini bun icon and a done/total count, so the target
  // reads at a glance instead of only as dots on the ticket.
  const target = findTargetOrder(state);
  if (target) {
    const done = state.plate.length;
    const total = target.dish.recipe.length;
    const complete = done === total;
    const cardX = p.cx - 105, cardY = 272, cardW = 210, cardH = 26;
    drawPanel(ctx, cardX, cardY, cardW, cardH, 'rgba(255,248,236,0.95)', complete ? '#2f6b2f' : '#d9b380', 8);
    drawIngredient(ctx, 'bun', cardX + 20, cardY + cardH / 2, 20);
    drawText(ctx, target.dish.name + '  ' + done + '/' + total + (complete ? '  READY!' : ''), cardX + 38, cardY + cardH / 2 + 1, 13, complete ? '#2f6b2f' : '#2b1a0e', 'left');
  }
  // trash can
  const t = LAYOUT.trashBtn;
  drawPanel(ctx, t.x, t.y, t.w, t.h, '#e8dcc8', '#b09a78', 8);
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(t.x + 12, t.y + 12, 12, 20);
  ctx.fillRect(t.x + 9, t.y + 8, 18, 5);
  // cream chip behind the label so it stays readable on the floor
  drawPanel(ctx, t.x - 2, t.y + t.h + 5, t.w + 4, 18, 'rgba(255,248,236,0.85)', null, 8);
  drawText(ctx, 'trash', t.x + t.w / 2, t.y + t.h + 14, 11, '#7a5a3a', 'center');
}

function drawPass() {
  const s = LAYOUT.passShelf;
  // The serving pass: a ledge strip on the worktop where finished dishes
  // wait to be picked up.
  ctx.fillStyle = '#8a5a2b';
  roundRectPath(ctx, s.x, s.y, s.w, s.h, 6);
  ctx.fill();
  if (state.lastServed) {
    drawIngredient(ctx, 'bun', s.x + s.w / 2, s.y - 26, 64);
    drawText(ctx, 'LAST SERVED', s.x + s.w / 2, s.y + 34, 12, '#7a5a3a', 'center');
    drawText(ctx, state.lastServed.dish, s.x + s.w / 2, s.y + 54, 15, '#2b1a0e', 'center');
    drawText(ctx, '+' + state.lastServed.points + ' pts', s.x + s.w / 2, s.y + 76, 15, '#2f6b2f', 'center');
  } else {
    drawText(ctx, '— empty —', s.x + s.w / 2, s.y + 44, 14, '#b09a78', 'center');
  }
}

function drawKitchen() {
  // --- top-down: the whole room is floor; one long worktop seen from
  // above; the fridge, sink and pot are footprints on it; the chef stands
  // on the floor below the counter. No wall, no hood, no window — from
  // above there is no wall to hang them on.
  // fridge footprint, back-right corner (above the worktop)
  drawFridgeTop(ctx, 1188, 206, 60, 52);
  // herb pot on the floor between the label chips
  drawHerbPot(ctx, 975, 232, 20);
  // tagline pill, top-right above the serving pass
  drawPanel(ctx, 872, 188, 308, 22, 'rgba(255,248,236,0.92)', '#d9b380', 11);
  drawText(ctx, 'Serve the lunch rush before the timer runs out!', 1026, 199, 11, '#7a5a3a', 'center');
  // --- ONE LONG WORKTOP seen from above.
  drawWorktop(ctx, 32, 262, 1216, 208);
  // sink basin set into the worktop, right end + pot on the worktop
  drawSinkTop(ctx, 1090, 430, 80, 34);
  drawPotTop(ctx, 999, 410, 24);
  // floor props on the strip below the counter
  drawFloorRug(ctx, 590, 472, 150, 64);
  drawVegCrate(ctx, 48, 478, 150, 56);
  drawTrolley(ctx, 330, 478, 150, 56);
  // station labels on soft cream chips so they read on the floor
  const chips = [
    { x: 40, w: 220 },
    { x: 324, w: 170 },
    { x: 744, w: 190 },
    { x: 1020, w: 160 },
  ];
  for (const c of chips) {
    drawPanel(ctx, c.x, 214, c.w, 44, 'rgba(255,248,236,0.88)', null, 8);
  }
  drawText(ctx, 'GRILL', 48, 222, 15, '#5b3a1e', 'left');
  drawText(ctx, 'patty cooks 6s — don\'t burn it', 48, 244, 12, '#a08a6a', 'left');
  drawText(ctx, 'CHOPPING BOARD', 332, 222, 15, '#5b3a1e', 'left');
  drawText(ctx, 'click the board 3 times', 332, 244, 12, '#a08a6a', 'left');
  drawText(ctx, 'PREP PLATE', 752, 222, 15, '#5b3a1e', 'left');
  drawText(ctx, 'match an order, then serve', 752, 244, 12, '#a08a6a', 'left');
  drawText(ctx, 'SERVING PASS', 1028, 222, 15, '#5b3a1e', 'left');
  drawText(ctx, 'served dishes land here', 1028, 244, 12, '#a08a6a', 'left');
  // stations
  LAYOUT.grillSlots.forEach((rect, i) => drawGrillSlot(state.grill[i], rect));
  drawChoppingBoard();
  // chef stands on the floor below the counter, seen from above
  const bob = state.demo ? 0 : Math.sin(state.now * 2) * 2;
  drawChefTop(ctx, LAYOUT.chef.cx, LAYOUT.chef.baseY, LAYOUT.chef.s, bob);
  if (state.bubble && state.now < state.bubble.until) {
    const b = LAYOUT.bubble;
    drawSpeechBubble(ctx, b.x, b.y, b.w, b.h, state.bubble.text, b.tailX);
  }
  drawPrepPlate();
  drawPass();
  // Two waiting customers at the end of the serving pass, facing the
  // counter. Original Dapur Kilat figures, drawn in code like the chef.
  drawWaitingCustomer(ctx, 1055, 532, 110, '#3d7ea6', '#1a1a1a');
  drawWaitingCustomer(ctx, 1165, 532, 110, '#d9a441', '#4a2c14');
}

function drawBins() {
  const b = LAYOUT.bins;
  INGREDIENTS.forEach((ing, i) => {
    const x = b.x + i * (b.w + b.gap);
    // soft shadow on the floor under the bin so it sits in the room
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath();
    ctx.ellipse(x + b.w / 2, b.y + b.h + 4, b.w / 2 - 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    drawPanel(ctx, x, b.y, b.w, b.h, '#ffffff', '#d9b380', 12);
    drawIngredient(ctx, ing.kind, x + b.w / 2, b.y + 58, 84, ing.kind === 'patty' ? 0 : undefined);
    drawText(ctx, ing.label, x + b.w / 2, b.y + 112, 16, '#2b1a0e', 'center');
    // station tag pill
    const tagW = 76;
    drawPanel(ctx, x + b.w / 2 - tagW / 2, b.y + 128, tagW, 20, ing.tagColor, null, 10);
    drawText(ctx, ing.tag, x + b.w / 2, b.y + 139, 11, '#ffffff', 'center');
    // key badge
    ctx.fillStyle = '#a83226';
    ctx.beginPath();
    ctx.arc(x + b.w - 20, b.y + 20, 13, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, ing.key, x + b.w - 20, b.y + 21, 14, '#ffffff', 'center');
  });
}

function drawHints() {
  drawText(ctx, 'Click an ingredient or press 1–6  •  Space = serve  •  R = restart  •  Wrong ingredient −50 pts  •  Burnt patty = click to trash it', 640, LAYOUT.hints.y, 13, '#7a5a3a', 'center');
}

function drawFooter() {
  const f = LAYOUT.footer;
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(f.x, f.y, f.w, f.h);
  drawText(ctx, 'DAPUR KILAT — a warung cooking game  •  Made for make.fun', 640, f.y + 21, 12, '#f7cf8e', 'center');
}

function drawPopupsAndParticles() {
  for (const p of state.particles) {
    const age = state.now - p.born;
    const f = 1 - age / p.life;
    ctx.globalAlpha = Math.max(0, f);
    if (p.kind === 'steam') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y + age * p.vy, p.r * (1 + age), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.arc(p.x, p.y + age * p.vy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  for (const p of state.popups) {
    const age = state.now - p.born;
    const f = 1 - age / p.life;
    ctx.globalAlpha = Math.max(0, f);
    drawText(ctx, p.text, p.x, p.y - age * 34, p.big ? 22 : 16, p.color, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawTitle() {
  ctx.fillStyle = 'rgba(43,26,14,0.88)';
  ctx.fillRect(0, 0, W, H);
  drawPanel(ctx, 240, 100, 800, 580, '#fff8ec', '#d9b380', 20);
  drawText(ctx, 'DAPUR KILAT', 640, 180, 56, '#a83226', 'center');
  drawText(ctx, 'WARUNG LIGHTNING KITCHEN — a fast cooking game', 640, 222, 16, '#7a5a3a', 'center');
  drawChefTop(ctx, 400, 560, 210, 0);
  const lines = [
    '1. Click ingredients (or press 1–6) to cook',
    '2. Chop veggies on the board • grill the patty',
    '3. Build the plate to match an order ticket',
    '4. Serve fast for tips and a combo streak',
    '   3 hearts • 120 second shift • watch the faces!',
  ];
  lines.forEach((line, i) => {
    drawText(ctx, line, 560, 320 + i * 34, 17, '#2b1a0e', 'left');
  });
  const pulse = 1 + 0.04 * Math.sin(state.now * 4);
  ctx.save();
  ctx.translate(640, 612);
  ctx.scale(pulse, pulse);
  drawPanel(ctx, -150, -28, 300, 56, '#4c9a4c', '#2f6b2f', 12);
  drawText(ctx, 'CLICK TO START', 0, 1, 22, '#ffffff', 'center');
  ctx.restore();
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(43,26,14,0.85)';
  ctx.fillRect(0, 0, W, H);
  drawPanel(ctx, 340, 170, 600, 440, '#fff8ec', '#d9b380', 20);
  const title = state.overReason === 'out of hearts' ? 'OUT OF HEARTS!' : 'SHIFT COMPLETE!';
  drawText(ctx, title, 640, 240, 38, '#a83226', 'center');
  drawText(ctx, state.overReason === 'out of hearts' ? 'Too many orders walked out...' : 'The warung closes for today.', 640, 282, 16, '#7a5a3a', 'center');
  const rows = [
    ['Final score', String(state.score)],
    ['Dishes served', String(state.served)],
    ['Orders lost', String(state.lost)],
    ['Best combo', 'x' + state.bestCombo],
    ['Tips earned', '$' + state.tips],
  ];
  rows.forEach((row, i) => {
    const y = 350 + i * 42;
    drawText(ctx, row[0], 440, y, 20, '#2b1a0e', 'left');
    drawText(ctx, row[1], 840, y, 20, '#a83226', 'right');
  });
  drawText(ctx, 'Press R or click to play again', 640, 550, 17, '#4c9a4c', 'center');
}

function render() {
  drawBackground();
  if (state.screen === 'title') {
    drawHeader();
    drawOrderBoard();
    drawKitchen();
    drawBins();
    drawHints();
    drawFooter();
    drawTitle();
    return;
  }
  if (state.flash > 0) {
    ctx.fillStyle = 'rgba(217,79,61,' + (state.flash * 0.25) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  drawHeader();
  drawOrderBoard();
  drawKitchen();
  drawBins();
  drawHints();
  drawFooter();
  drawPopupsAndParticles();
  if (state.screen === 'over') drawGameOver();
}

// ------------------------------------------------------------ input

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function handleWrong(reason) {
  if (reason === 'not-needed') {
    state.score = Math.max(0, state.score - WRONG_PENALTY);
    state.flash = 0.5;
    addPopup(856, 330, 'Wrong ingredient! -50', '#d94f3d', false);
    AudioEngine.playBuzz();
  } else if (reason === 'grill-full') {
    addPopup(112, 458, 'Grill is full!', '#e8823a', false);
    AudioEngine.playBuzz();
  } else if (reason === 'board-busy') {
    addPopup(472, 458, 'Board is busy!', '#e8823a', false);
    AudioEngine.playBuzz();
  }
}

function onCanvasClick(clientX, clientY) {
  AudioEngine.ensureAudio();
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (W / rect.width);
  const y = (clientY - rect.top) * (H / rect.height);
  if (state.screen === 'title') {
    startGame();
    return;
  }
  if (state.screen === 'over') {
    startGame();
    return;
  }
  if (state.demo) return;
  // serve button
  if (pointInRect(x, y, LAYOUT.serveBtn)) {
    const res = servePlate(state, state.now);
    if (res.ok) {
      state.lastServed = { dish: res.order.dish.name, points: res.points };
      addPopup(1090, 272, '+' + res.points, '#2f6b2f', true);
      if (res.tip > 0 || state.combo > 1) {
        addPopup(1090, 300, (res.tip > 0 ? 'TIP +$' + res.tip : '') + (state.combo > 1 ? (res.tip > 0 ? '  •  ' : '') + 'COMBO x' + state.combo : ''), '#e8823a', false);
      }
      addSparkles(1090, 320);
      showBubble('Nice serve!');
    } else {
      addPopup(856, 330, 'Plate does not match any order', '#d94f3d', false);
      AudioEngine.playBuzz();
    }
    return;
  }
  // trash
  if (pointInRect(x, y, LAYOUT.trashBtn)) {
    if (state.plate.length > 0) {
      clearPlate(state);
      AudioEngine.playClick();
    }
    return;
  }
  // grill slots
  for (let i = 0; i < LAYOUT.grillSlots.length; i++) {
    if (pointInRect(x, y, LAYOUT.grillSlots[i])) {
      const res = takeFromGrill(state, i);
      if (res.ok && res.what === 'trashed-burnt') {
        addPopup(112, 458, 'Burnt patty trashed', '#7a5a3a', false);
      } else if (!res.ok && res.reason === 'not-ready') {
        addPopup(112, 458, 'Still cooking...', '#7a5a3a', false);
      }
      return;
    }
  }
  // chopping board
  if (pointInRect(x, y, LAYOUT.board)) {
    chopOnce(state);
    return;
  }
  // ingredient bins
  const b = LAYOUT.bins;
  for (let i = 0; i < INGREDIENTS.length; i++) {
    const r = { x: b.x + i * (b.w + b.gap), y: b.y, w: b.w, h: b.h };
    if (pointInRect(x, y, r)) {
      const res = pickIngredient(state, INGREDIENTS[i].kind, state.now);
      if (!res.ok) handleWrong(res.reason);
      else AudioEngine.playClick();
      return;
    }
  }
}

function onKeyDown(e) {
  if (e.key === 'm' || e.key === 'M') {
    AudioEngine.muted = !AudioEngine.muted;
    return;
  }
  if (state.screen === 'title' || state.screen === 'over') {
    if (e.key === 'r' || e.key === 'R' || e.key === ' ' || e.key === 'Enter') startGame();
    return;
  }
  if (state.demo) return;
  if (e.key === 'r' || e.key === 'R') {
    startGame();
    return;
  }
  if (e.key === ' ') {
    e.preventDefault();
    const res = servePlate(state, state.now);
    if (res.ok) {
      state.lastServed = { dish: res.order.dish.name, points: res.points };
      addPopup(1090, 272, '+' + res.points, '#2f6b2f', true);
      if (res.tip > 0 || state.combo > 1) {
        addPopup(1090, 300, (res.tip > 0 ? 'TIP +$' + res.tip : '') + (state.combo > 1 ? (res.tip > 0 ? '  •  ' : '') + 'COMBO x' + state.combo : ''), '#e8823a', false);
      }
      addSparkles(1090, 320);
      showBubble('Nice serve!');
    } else {
      AudioEngine.playBuzz();
    }
    return;
  }
  const ing = INGREDIENTS.find((g) => g.key === e.key);
  if (ing) {
    const res = pickIngredient(state, ing.kind, state.now);
    if (!res.ok) handleWrong(res.reason);
    else AudioEngine.playClick();
  }
}

// ------------------------------------------------------------ demo staging

function stageDemo(name) {
  // Sets up a fixed, readable state for screenshots. Timers are frozen.
  const s = makeState();
  s.demo = name;
  s.screen = 'playing';
  s.started = true;
  if (name === 'cover') {
    s.now = 35;
    s.timeLeft = 85;
    s.score = 450;
    s.combo = 2;
    s.bestCombo = 2;
    s.tips = 120;
    s.hearts = 3;
    s.served = 3;
    s.lost = 0;
    s.orders = [
      { id: 1, dish: MENU[0], bornAt: 0, expiresAt: 35 + 36, served: false, expired: false, look: '#4a2c14' },
      { id: 2, dish: MENU[1], bornAt: 0, expiresAt: 35 + 20, served: false, expired: false, look: '#1a1a1a' },
      { id: 3, dish: MENU[3], bornAt: 0, expiresAt: 35 + 8, served: false, expired: false, look: '#5a3a6b' },
      { id: 4, dish: MENU[2], bornAt: 0, expiresAt: 35 + 28, served: false, expired: false, look: '#2f4a2f' },
    ];
    s.plate = ['bun', 'patty', 'lettuce'];
    s.grill = [
      { kind: 'patty', startedAt: 35 - 4.2, done: false, burnt: false },
      { kind: null, startedAt: 0, done: false, burnt: false },
    ];
    s.board = { kind: 'tomato', chops: 2 };
    s.lastServed = { dish: 'Cheese Burger', points: 200 };
    s.bubble = { text: 'Order up!', until: 999 };
    s.popups = [];
    s.particles = [
      { kind: 'steam', x: 100, y: 300, vy: -30, r: 5, born: 35, life: 999 },
      { kind: 'steam', x: 120, y: 290, vy: -26, r: 4, born: 35, life: 999 },
    ];
  } else if (name === 'grill') {
    s.now = 25;
    s.timeLeft = 95;
    s.score = 320;
    s.combo = 1;
    s.tips = 40;
    s.hearts = 3;
    s.served = 2;
    s.lost = 0;
    s.orders = [
      { id: 1, dish: MENU[0], bornAt: 0, expiresAt: 25 + 31, served: false, expired: false, look: '#8a5a2b' },
      { id: 2, dish: MENU[2], bornAt: 0, expiresAt: 25 + 25, served: false, expired: false, look: '#2f4a2f' },
      { id: 3, dish: MENU[3], bornAt: 0, expiresAt: 25 + 15, served: false, expired: false, look: '#5a3a6b' },
      { id: 4, dish: MENU[1], bornAt: 0, expiresAt: 25 + 35, served: false, expired: false, look: '#1a1a1a' },
    ];
    s.plate = ['bun', 'cheese'];
    s.grill = [
      { kind: 'patty', startedAt: 25 - 7, done: true, burnt: false },
      { kind: 'patty', startedAt: 25 - 2.4, done: false, burnt: false },
    ];
    s.board = { kind: 'onion', chops: 1 };
    s.bubble = { text: "Patty's ready!", until: 999 };
    s.particles = [
      { kind: 'steam', x: 100, y: 300, vy: -30, r: 5, born: 25, life: 999 },
      { kind: 'steam', x: 240, y: 300, vy: -28, r: 5, born: 25, life: 999 },
      { kind: 'steam', x: 250, y: 285, vy: -24, r: 4, born: 25, life: 999 },
    ];
  } else if (name === 'serve') {
    s.now = 58;
    s.timeLeft = 62;
    s.score = 620;
    s.combo = 3;
    s.bestCombo = 3;
    s.tips = 200;
    s.hearts = 3;
    s.served = 5;
    s.lost = 0;
    s.orders = [
      { id: 1, dish: MENU[0], bornAt: 0, expiresAt: 58 + 29, served: false, expired: false, look: '#4a2c14' },
      { id: 2, dish: MENU[1], bornAt: 0, expiresAt: 58 + 18, served: false, expired: false, look: '#1a1a1a' },
      { id: 3, dish: MENU[2], bornAt: 0, expiresAt: 58 + 22, served: false, expired: false, look: '#2f4a2f' },
      { id: 4, dish: MENU[3], bornAt: 0, expiresAt: 58 + 12, served: false, expired: false, look: '#5a3a6b' },
    ];
    s.plate = ['bun', 'patty', 'lettuce', 'tomato'];
    s.grill = [
      { kind: null, startedAt: 0, done: false, burnt: false },
      { kind: null, startedAt: 0, done: false, burnt: false },
    ];
    s.board = { kind: null, chops: 0 };
    s.lastServed = { dish: 'Veggie Delight', points: 180 };
    s.bubble = { text: 'Serve it fast!', until: 999 };
    s.popups = [
      { x: 1090, y: 270, text: 'TIP +$50  •  COMBO x3', color: '#e8823a', born: 58, life: 999, big: false },
    ];
    s.particles = [];
    for (let i = 0; i < 10; i++) {
      s.particles.push({ kind: 'spark', x: 1060 + Math.random() * 120, y: 300 + Math.random() * 40, vy: -30, r: 3, born: 58, life: 999 });
    }
  } else if (name === 'over') {
    s.now = 120;
    s.timeLeft = 0;
    s.score = 1240;
    s.served = 9;
    s.lost = 1;
    s.combo = 1;
    s.bestCombo = 4;
    s.tips = 350;
    s.hearts = 2;
    s.screen = 'over';
    s.overReason = 'shift complete';
    s.orders = [];
  }
  state = s;
  render();
}

// ------------------------------------------------------------ boot

function boot() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  canvas.addEventListener('click', (e) => onCanvasClick(e.clientX, e.clientY));
  window.addEventListener('keydown', onKeyDown);
  const demo = new URLSearchParams(window.location.search).get('demo');
  if (demo) {
    stageDemo(demo);
  } else {
    spawnOrder(state, 0);
    state.nextSpawnAt = 11;
  }
  requestAnimationFrame(frame);
}

window.__dapur = {
  get state() { return state; },
  startGame: startGame,
  stageDemo: stageDemo,
  pickIngredient: pickIngredient,
  chopOnce: chopOnce,
  servePlate: servePlate,
  takeFromGrill: takeFromGrill,
};

document.addEventListener('DOMContentLoaded', boot);
