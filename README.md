# Dapur Kilat — Warung Lightning Kitchen

[![make.fun competition](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun rank](https://make.fun/badge/best-cooking-game-20261125-0137/ahh955/Cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![make.fun reward](https://make.fun/badge/best-cooking-game-20261125-0137/ahh955/Cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original 2D cooking game that plays offline in a desktop browser. You run a small Indonesian warung kitchen during a 120-second shift: chop vegetables, grill patties (don't let them burn!), build plates to match the order board, and serve fast for tips and a combo streak. Customers grow impatient — their faces tell you — and the middle of the shift is a rush hour.

## How to play

- **Orders** appear on the board at the top. Each ticket shows the dish, its recipe, and a patience timer. The customer's face changes as time runs out: happy, then annoyed, then angry.
- **Ingredients** sit in bins along the bottom. Click a bin (or press **1–6**):
  - **Bun** and **Cheese** go straight onto the plate.
  - **Tomato**, **Lettuce** and **Onion** go to the chopping board first — click the board **3 times** to chop them, then they jump onto the plate.
  - **Patty** goes on the grill — it cooks in 6 seconds. Click it when it says READY! to put it on the plate. Leave it past 11 seconds and it burns; click the burnt patty to trash it.
- **Serve** when the plate matches an order exactly: click the green **SERVE!** button or press **Space**. Serving with time to spare earns a **tip (+$50)** and builds your **combo**; serving slowly pays the base points only.
- A **wrong ingredient** costs 50 points. An **expired order** costs one of your 3 hearts. The shift ends after 120 seconds or when the hearts run out — then the game-over screen shows your score, dishes served, best combo and tips.
- **R** restarts, **M** mutes the sounds. All sounds are synthesized in code with WebAudio — no audio files.

## The dishes

- **Burger Kilat** — bun + patty + lettuce + tomato
- **Cheese Burger** — bun + patty + cheese
- **Veggie Delight** — bun + lettuce + tomato + cheese
- **Onion Smash** — bun + patty + onion + cheese

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome:

```sh
cd game && python3 -m http.server 8080
```

No network requests, no libraries, no build step — plain canvas 2D and vanilla JavaScript, split into one file per job (`art.js`, `audio.js`, `orders.js`, `kitchen.js`, `game.js`).

## License

MIT — see `LICENSE`.
