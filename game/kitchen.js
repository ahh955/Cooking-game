// kitchen.js — the cooking stations of Dapur Kilat.
// The Overcooked-style flow: chop on the board, grill the patty (it burns
// if left too long), build the plate, serve the finished dish to the order
// that matches it. A wrong ingredient costs points and a buzz.

const CHOPPABLE = ['tomato', 'lettuce', 'onion'];
const CHOPS_NEEDED = 3;
const GRILL_COOK_TIME = 6; // seconds until a patty is done
const GRILL_BURN_TIME = 11; // seconds until a done patty burns
const WRONG_PENALTY = 50;

function isChoppable(kind) {
  return CHOPPABLE.indexOf(kind) >= 0;
}

function makeGrillSlot() {
  return { kind: null, startedAt: 0, done: false, burnt: false };
}

function makeKitchen() {
  return {
    grill: [makeGrillSlot(), makeGrillSlot()],
    board: { kind: null, chops: 0 },
    plate: [], // ingredient kinds stacked on the prep plate, bottom first
    trash: 0,
  };
}

// Does any active order still need this ingredient, given the plate?
function ingredientNeeded(state, kind) {
  if (state.plate.indexOf(kind) >= 0) return false; // already on the plate
  for (const order of state.orders) {
    if (order.dish.recipe.indexOf(kind) >= 0) return true;
  }
  return false;
}

function plateMatchesOrder(plate, order) {
  if (plate.length !== order.dish.recipe.length) return false;
  const sortedPlate = plate.slice().sort();
  const sortedRecipe = order.dish.recipe.slice().sort();
  for (let i = 0; i < sortedPlate.length; i++) {
    if (sortedPlate[i] !== sortedRecipe[i]) return false;
  }
  return true;
}

function findMatchingOrder(state) {
  // If the plate completes more than one order, serve the one in most hurry.
  let best = null;
  for (const order of state.orders) {
    if (plateMatchesOrder(state.plate, order)) {
      if (!best || order.expiresAt < best.expiresAt) best = order;
    }
  }
  return best;
}

function findTargetOrder(state) {
  // The order the current plate is building toward: every ingredient on
  // the plate is in its recipe. Earliest expiry wins when several fit.
  if (state.plate.length === 0) return null;
  let best = null;
  for (const order of state.orders) {
    const fits = state.plate.every((kind) => order.dish.recipe.indexOf(kind) >= 0);
    if (fits && (!best || order.expiresAt < best.expiresAt)) best = order;
  }
  return best;
}

// The player picked an ingredient bin. Route it to its station.
function pickIngredient(state, kind, now) {
  if (!ingredientNeeded(state, kind)) {
    return { ok: false, reason: 'not-needed' };
  }
  if (kind === 'patty') {
    const free = state.grill.find((s) => s.kind === null);
    if (!free) return { ok: false, reason: 'grill-full' };
    free.kind = 'patty';
    free.startedAt = now;
    free.done = false;
    free.burnt = false;
    AudioEngine.startSizzle();
    return { ok: true, where: 'grill' };
  }
  if (isChoppable(kind)) {
    if (state.board.kind !== null) return { ok: false, reason: 'board-busy' };
    state.board.kind = kind;
    state.board.chops = 0;
    return { ok: true, where: 'board' };
  }
  state.plate.push(kind);
  return { ok: true, where: 'plate' };
}

// One click on the chopping board. Three chops finish the ingredient and it
// jumps onto the plate by itself (the Cooking Mama mini-action).
function chopOnce(state) {
  if (state.board.kind === null) return { ok: false };
  state.board.chops += 1;
  AudioEngine.playChop();
  if (state.board.chops >= CHOPS_NEEDED) {
    const kind = state.board.kind;
    state.board.kind = null;
    state.board.chops = 0;
    state.plate.push(kind);
    AudioEngine.playPop();
    return { ok: true, finished: kind };
  }
  return { ok: true, finished: null };
}

// Update the grill: mark patties done, then burnt. Returns events for toasts.
function updateGrill(state, now) {
  const events = [];
  for (const slot of state.grill) {
    if (slot.kind === null) continue;
    const age = now - slot.startedAt;
    if (!slot.burnt && age >= GRILL_BURN_TIME) {
      slot.burnt = true;
      slot.done = false;
      events.push({ type: 'burnt' });
    } else if (!slot.done && !slot.burnt && age >= GRILL_COOK_TIME) {
      slot.done = true;
      events.push({ type: 'cooked' });
    }
  }
  const anyCooking = state.grill.some((s) => s.kind !== null && !s.burnt);
  if (!anyCooking) AudioEngine.stopSizzle();
  return events;
}

// Click a grill slot: take a done patty to the plate, or bin a burnt one.
function takeFromGrill(state, slotIndex) {
  const slot = state.grill[slotIndex];
  if (!slot || slot.kind === null) return { ok: false };
  if (slot.burnt) {
    state.grill[slotIndex] = makeGrillSlot();
    return { ok: true, what: 'trashed-burnt' };
  }
  if (!slot.done) return { ok: false, reason: 'not-ready' };
  if (state.plate.indexOf('patty') >= 0) return { ok: false, reason: 'patty-on-plate' };
  state.grill[slotIndex] = makeGrillSlot();
  state.plate.push('patty');
  AudioEngine.playPop();
  return { ok: true, what: 'patty' };
}

function clearPlate(state) {
  state.plate = [];
  state.trash += 1;
}

// Serve the finished plate to its matching order. Returns the result so the
// game can show the points, tip and combo popups.
function servePlate(state, now) {
  const order = findMatchingOrder(state);
  if (!order) return { ok: false };
  const result = scoreForServe(order, now, state.combo);
  state.score += result.points;
  if (result.tip > 0) state.tips += result.tip;
  if (result.fast) {
    state.combo = Math.min(5, state.combo + 1);
    state.bestCombo = Math.max(state.bestCombo, state.combo);
  } else {
    state.combo = 1;
  }
  state.served += 1;
  removeOrder(state, order);
  state.plate = [];
  AudioEngine.playDing();
  return { ok: true, order: order, points: result.points, tip: result.tip, fast: result.fast };
}
