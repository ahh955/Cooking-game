// orders.js — the menu, the order tickets and the scoring rules.
// Dapur Kilat serves four warung dishes. Every order has a patience timer;
// the customer's face on the ticket shows how patient they still are, and
// serving fast earns a tip and builds a combo streak.

const MENU = [
  { name: 'Burger Kilat', recipe: ['bun', 'patty', 'lettuce', 'tomato'], base: 100 },
  { name: 'Cheese Burger', recipe: ['bun', 'patty', 'cheese'], base: 100 },
  { name: 'Veggie Delight', recipe: ['bun', 'lettuce', 'tomato', 'cheese'], base: 110 },
  { name: 'Onion Smash', recipe: ['bun', 'patty', 'onion', 'cheese'], base: 120 },
];

const ORDER_TIME = 45; // seconds of patience per order
const MAX_ORDERS = 4;

let orderIdCounter = 1;
const HAIR_COLORS = ['#4a2c14', '#1a1a1a', '#8a5a2b', '#5a3a6b', '#2f4a2f'];

function makeOrder(now) {
  const dish = MENU[Math.floor(Math.random() * MENU.length)];
  const id = orderIdCounter++;
  return {
    id: id,
    dish: dish,
    bornAt: now,
    expiresAt: now + ORDER_TIME,
    served: false,
    expired: false,
    look: HAIR_COLORS[id % HAIR_COLORS.length],
  };
}

function orderTimeLeft(order, now) {
  return Math.max(0, order.expiresAt - now);
}

function orderTimeFraction(order, now) {
  return orderTimeLeft(order, now) / ORDER_TIME;
}

// The Diner Dash patience face: happy while there is plenty of time,
// annoyed in the middle, angry when the order is about to walk out.
function orderMood(order, now) {
  const f = orderTimeFraction(order, now);
  if (f > 0.6) return 'happy';
  if (f > 0.3) return 'annoyed';
  return 'angry';
}

function spawnOrder(state, now) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const order = makeOrder(now);
  state.orders.push(order);
  return order;
}

function removeOrder(state, order) {
  const i = state.orders.indexOf(order);
  if (i >= 0) state.orders.splice(i, 1);
}

// Score for serving an order: base + a bonus for time left, a tip when the
// customer is still happy, all multiplied by the current combo streak.
function scoreForServe(order, now, combo) {
  const left = orderTimeLeft(order, now);
  const frac = orderTimeFraction(order, now);
  const fast = frac > 0.5;
  const tip = frac > 0.6 ? 50 : 0;
  const points = Math.round((order.dish.base + Math.ceil(left) * 5 + tip) * combo);
  return { points: points, tip: tip, fast: fast };
}

function dishByName(name) {
  for (const d of MENU) if (d.name === name) return d;
  return null;
}
