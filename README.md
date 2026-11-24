# Neon Arena · 霓虹竞技场

> ✨ **寄语 · A Note for the Young Creator**
>
> 愿你一直玩得开心，永远保持这份好奇心，去探索这个世界，也去创造属于你自己的世界。
>
> *May you always have fun, stay curious, explore this big wide world, and keep building worlds of your own.*

🎮 **在线试玩 / Play Online (GitHub Pages)**: <https://xavierliang.github.io/neon-arena/>

Single-player 3D first-person shooter for the browser, built with Three.js (r180, vendored in `vendor/` so it runs offline).

## Run

```sh
cd ~/AI-projects/neon-arena
python3 -m http.server 8765 --bind 127.0.0.1
```

Open <http://127.0.0.1:8765/> in Chrome / Edge / Safari. (A local server is needed because ES modules don't load from `file://`.)

## Modes

- **竞技场 Arena**: endless waves on a walled 80×80 m neon map. Pick a reward card after every wave. A monster boss every 2 waves (two at once from wave 8, three from wave 16).
- **荒野探险 Wilds**: a 400×400 m realistic daytime world: physical sky with sun, rolling hills, pine and leafy trees, grass, flowers, rocks, clear view to the horizon. Find and defeat 12 monsters (Lava Golem, Venom Spider, Abyss Eye, Necromancer, Crystal Spider, Frost Giant, Blood Moon Eye, Fire Dragon, Lich King, Titan Mech, Thunder Dragon, Robot King); then the final boss, the Emperor, appears. A red arrow at the top and light beams in the sky point the way. Blue supply crates give normal rewards; each monster drops a gold legendary chest.
- **太空冒险 Space**: 5 planets floating in space (Moon Base, Mars, Ice Planet, Toxic Planet, Dark Star), each with its own bosses. Low gravity and a free jetpack, so you can fly. Each planet has a rocket on a launch pad: stand next to it, press **E**, pick a planet, and fly there with your team. Falling off a planet brings you back to the pad (−20 HP). Beat all 12 bosses and the Emperor appears on the Dark Star.
- **Map size** (start screen): Normal / Big / Huge. Makes the Wilds and the Space planets bigger.
- Choose 0–8 AI teammates on the start screen (up to 12 with rewards).

## Monsters

- All monsters get angry at half health (faster, more shots, call for backup). Their HP scales with team size.
- Golem: slams and throws exploding boulders. Spider: leaps and spits venom. Eye: orb volleys. Necromancer: raises skeletons and teleports away. Dragon: fireballs and diving attacks. Titan Mech: missile strikes (red circles on the ground: move!). Robot King: slams and volleys.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Mouse | Aim |
| Left click (hold) | Shoot / slash / place wall |
| Right click (hold) | Sniper scope |
| 1–6 / mouse wheel | Switch weapon (Rifle, Shotgun, Sniper, Rocket, Sword, Lightning) |
| V (or F) | Quick sword slash with any weapon |
| Q (or B) | Toggle build mode (walls cost 5 bricks) |
| E | Board the rocket (Space, next to a launch pad); otherwise shield bubble (legendary) |
| R | Reload |
| Space | Jump (about 2.5 m); hold in the air to fly with the Jetpack (legendary) |
| Shift | Sprint |
| Esc | Pause |

## Gameplay

- **Ghazghkull Thraka** (giant ork warboss in mega armor, 600 HP, triple damage) always fights on your side.
- **AI teammates** (gritty ork boyz: Bolt, Nova, Rex, ...) follow you, shoot enemies, and draw enemy fire. When knocked down they come back after 10 s. They grab ⭐ power stars to level up (more damage and HP); the "Team Upgrade" / "Recruit" / "Robot Army" rewards make the team stronger or bigger.
- **⭐ Power stars**: if you grab one, you get 10 s of double damage and extra speed.
- **Rewards**: new weapons (Shotgun, Sniper, Rocket Launcher), armor, max HP, damage up, bricks, extra life, flame sword, speed, stronger walls, recruit teammate, team upgrade.
- **Legendary loot** (from monsters): Jetpack, Lightning Gun, Golden Guns (×2 damage), Infinite Ammo, Shield Bubble, Robot Army, Giant Sword, Regeneration.
- **Building**: press Q, a wall preview appears in front of you; click to place. Walls block enemies and orbs; walkers punch through them.
- **Armor** (blue bar) absorbs damage before HP. **Extra life** revives you with a shockwave.
- Enemies: Necron Warriors and Space Marines, Canoptek Scarabs (flying, wave 2+), heavy Space Marines (wave 3+), plus the monsters. The final boss is the Emperor (golden armor, halo, flaming sword).
- Warhammer 40k names and looks are fan references for a private, personal game only; rename them before sharing publicly. Defeated enemies break apart into pieces.
- Best score is saved in `localStorage`.

## Files

- `index.html`: HUD and menus
- `style.css`: neon UI styling
- `game.js`: all game logic (both maps, weapons, building, enemies and monsters, AI teammates, waves, rewards, synthesized sound, radar, bloom)
- `vendor/`: Three.js build + bloom post-processing + Sky addons + license
