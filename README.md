# Minecrafts (mc-grok)

**English** | [中文](README.zh-CN.md)

**A 100% Grok 4.6–written, pure-frontend Minecraft recreation.** (Minecrafts 1.22)

A voxel sandbox that runs in the browser: Vite + Three.js, procedurally painted pixel textures, **no Mojang / Microsoft assets, sounds, or code**. Unofficial fan project. Not affiliated with Mojang.

---

## Run locally

You need [Node.js](https://nodejs.org/) (18+ recommended) and npm.

```bash
git clone https://github.com/FoyonaCZY/mc-grok.git
cd mc-grok
npm install
npm run dev
```

Vite prints a local URL. The default is:

```
http://127.0.0.1:5173/
```

Open it in a browser. The first click requests fullscreen and pointer lock.

Other commands:

```bash
npm run build      # bundle into dist/
npm run preview    # preview the production build
```

Saves live in this browser’s `localStorage`. They are not uploaded. Changing device or clearing site data wipes them.

---

## What this is

- Language: JavaScript (ES modules)
- Rendering: Three.js chunk meshes, day/night sky, fog, particles
- Textures: 16×16 pixel atlas drawn at runtime, no external packs
- World: seeded noise terrain, 16×96×16 chunks, Overworld / Nether / The End
- Authorship: **all gameplay and code were written by Grok 4.6 in Cursor**

The simplifications are intentional: no redstone circuitry, enchanting, or elytra / end ships. The dragon fight is a playable reduced version. The goal is explore, craft, mine, and kill the dragon — not a 1:1 vanilla clone.

---

## Dimensions and terrain

| Dimension | Notes |
| --- | --- |
| Overworld | Sea level ~y=42, world height 96. Caves, ravines, ores, river banks. Weather: clear / rain; snow particles in cold biomes |
| Nether | Bedrock ceiling and floor, lava seas, nylium, fortresses. No day/night, no rain. Water evaporates. Beds explode |
| The End | Void + end-stone main island (near origin), outer islets, chorus plants, obsidian pillars and crystals. No day/night, no rain. Beds explode |

World types: `default`, `superflat`, `largeBiomes`.

Optional bonus chest. The seed drives terrain and structure placement.

### Overworld biomes (18)

Ocean, warm ocean, frozen ocean, beach, plains, forest, birch forest, flower forest, taiga, jungle, swamp, desert, savanna, badlands, mushroom fields, snowy peaks, snowy plains, mountains.

### Nether biomes (5)

Nether wastes, soul sand valley, crimson forest, warped forest, basalt deltas.

### The End

A single End-style biome: main island radius ~90 blocks, noisy outer islets.

### Underground and surface features

- Caves, ravines
- Ore veins: coal, iron, copper, gold, redstone, lapis, diamond, emerald (mountains)
- Andesite / diorite / granite blobs
- Cave lava and water
- Trees: oak, birch, spruce, jungle
- Flowers, grass, cactus, sugar cane, mushrooms, pumpkins, melons, clay
- Icebergs / simplified prismarine columns in warm oceans

---

## Structures

Structures generate only in **chunks that have never been created**. Already-explored save chunks are not backfilled.

| Structure | Dimension | Notes |
| --- | --- | --- |
| Village | Overworld | Well, farms, houses, smith, villagers, iron golem. `/locate village` |
| Stronghold | Overworld (underground) | Stone-brick halls + end-portal-frame room + chest. `/locate stronghold` |
| Ruined portal | Overworld | Broken obsidian frame + chest |
| Dungeon | Overworld | Spawner-style room + chest |
| Mineshaft | Overworld | Timbered corridors + chest |
| Shipwreck | Ocean | Wooden wreck + chest |
| Hut | Overworld | Small cabin + chest |
| Nether fortress | Nether | Nether-brick halls, blazes, nether wart, chest |
| Obsidian pillars | The End | End crystals on top (not respawned after the dragon dies) |
| Exit portal / dragon egg | The End | Spawned at the center after the dragon is killed |

Chest loot is pooled by structure type (village, smith, dungeon, mineshaft, shipwreck, stronghold, fortress, ruined portal, …).

---

## Blocks

Procedural textures. Hidden state blocks (open doors, eyed frames, crop stages, …) stay out of the creative tabs.

**Nature / building:** stone, cobblestone, mossy cobblestone, stone bricks, andesite, diorite, granite, bedrock, dirt, grass, farmland, podzol, mycelium, sand, gravel, sandstone, clay, terracotta (incl. red/orange/yellow), snow, ice, packed ice, prismarine, glass, bricks, obsidian.

**Wood:** oak / birch / spruce / jungle logs, planks, leaves; oak door, ladder, fence, fence gate (toggle); crafting table, chest, bookshelf, note block, hay bale.

**Ores and storage blocks:** coal, iron, gold, diamond, redstone, lapis, emerald, copper ores and their compact blocks.

**Nether:** netherrack, soul sand, magma, blackstone, nether bricks, nether quartz ore, glowstone, crimson/warped nylium and stems, nether wart and wart blocks, nether portal.

**End:** end stone, end portal frames (empty / with eye), end portal, chorus plant/flower, purpur, end rod, dragon egg.

**Plants and utility:** torch, cactus, sugar cane, wheat (4 stages), sapling, short grass, dandelion, poppy, red/brown mushrooms, pumpkin, jack o’lantern, melon, cobweb, bed, TNT, sponge, wool (white and dyed).

Fluids: water, lava. Sand / gravel / torches have gravity.

---

## Items

**Tools (wood / stone / iron / gold / diamond):** pickaxe, axe, shovel, hoe, sword. Also shears, flint and steel, buckets (water / lava), fishing rod, compass, clock, boat.

**Armor:** leather / iron / diamond helmet, chestplate, leggings, boots.

**Food:** apple, golden apple, bread, raw and cooked meats, carrot, golden carrot, potato, baked potato, cookie, pumpkin pie, mushroom stew, cod/salmon (raw and cooked), chorus fruit (random teleport).

**Materials:** stick, coal/charcoal, ingots, gems, redstone, clay ball, brick, flint, string, bone/bone meal, feather, leather, paper, book, bowl, gunpowder, dyes, nether quartz/brick, blaze rod/powder, ghast tear, magma cream, gold nugget, ender pearl, eye of ender, wheat/seeds, and more.

**Combat:** bow, arrows, shield (right-click block), Totem of Undying (hotbar / offhand). Tools and armor have durability bars.

---

## Mobs

### Passive / neutral

Pig, cow, sheep (shearable, dyeable wool), chicken (lays eggs), mooshroom, horse, rabbit, parrot, squid, wolf (tame with bones, sit/follow, breed with meat, fights for you), villager (farmer / smith / cleric, tradable), iron golem (T of 4 iron blocks + pumpkin / jack o’lantern, or village spawn).

Breeding: pig (carrot/potato), cow/mooshroom/sheep (wheat), chicken (seeds), rabbit (carrot/golden carrot), horse (golden carrot/apple/wheat), wolf (meat). Heart particles; babies grow in ~80s.

### Hostile (Overworld)

Zombie, husk, drowned, skeleton, stray, spider, creeper, witch, enderman. Some undead burn in daylight. Peaceful does not spawn hostiles.

Polar bears appear in frozen ocean / snowy plains.

### Nether

Ghast (fireballs), blaze, piglin, zombified piglin (pack agro), magma cube, wither skeleton, enderman (warped forest).

### The End

Enderman, Ender Dragon (orbits the island, fireballs, heals from crystals), end crystal.

Kills drop XP orbs. Melee has knockback. The player is knocked back slightly when hit.

---

## Gameplay

- Modes: survival / creative / adventure; difficulty: peaceful / easy / normal / hard
- Health, hunger, armor, XP bar; survival deaths drop items
- 2×2 / 3×3 crafting (table), furnace smelting, chests, creative inventory
- Farming (hoe, wheat, bone meal, saplings grow)
- Sleep (night or thunderstorm; not with monsters nearby; beds explode in the Nether/End; respawn is set on an Overworld bed)
- Fishing, boats, ender-pearl teleport
- Villager trading
- Flint and steel lights an obsidian Nether portal; stand in it ~3s to change dimension
- Eyes of Ender: blaze powder + ender pearl; throw toward the nearest stronghold; right-click empty frames; 12 eyes light the End portal
- Ender Dragon: break crystals, then the dragon; exit portal + dragon egg at the center; stand on the exit ~3s to return to the Overworld spawn; dying in the End/Nether also returns to the Overworld
- Iron golem construction, wolf taming, fence-gate toggle
- Compass HUD, clock HUD, F3 debug (F3+C copies `/tp`), Chinese/English UI
- Advancements with toast popups (pause menu → Advancements)
- Attack cooldown, sprint FOV, water/lava/portal/fire overlays
- Golden apple: regen + absorption; golden carrot: night vision; witch melee can poison
- Autosave about every 40s; optional Keep Inventory in settings
- Brightness slider; Fast graphics skips AO / extra light flood for FPS
- Day/night, rain/snow, procedural audio (not vanilla samples)

---

## Controls

| Key | Action |
| --- | --- |
| W A S D | Move |
| Space | Jump (fly in creative) |
| Sneak | Keep from falling off edges / leave boat |
| Ctrl+W | Sprint; entering the game goes fullscreen and tries Keyboard Lock so the tab is not closed |
| Left / right mouse | Break / use, place |
| Wheel / 1–9 | Hotbar |
| E | Inventory |
| Q | Drop |
| T / Enter | Chat and commands |
| F3 | Debug overlay; F3+C copies teleport coords |
| F5 | Perspective |
| Esc | Pause |

---

## Commands

Prefix with `/` in chat. `/time`, `/seed`, `/help`, `/locate`, `/dim` **do not need cheats**. The rest require Allow Cheats on world create, or Creative mode.

```
/gamemode survival|creative|adventure
/give <item_id> [count]
/time set day|noon|night|midnight|<number>
/tp <x> <y> <z>
/seed
/weather clear|rain
/summon <mob_type>
/kill
/difficulty peaceful|easy|normal|hard
/dim nether|end|overworld
/locate village
/locate stronghold
/effect regen|speed|fire_resist|poison|night_vision|absorption [seconds]
/help
```

`/locate` reports generator coordinates: the village or stronghold only appears after you walk into **unexplored chunks**.

---

## Technical notes

- Chunks: `Uint8Array` block IDs (max 255) + light flood (reduced on Fast graphics)
- Streaming chunk generation and distance-sorted mesh rebuilds
- Player camera: `PerspectiveCamera`, `rotation.order = "YXZ"`, pitch/yaw; do not `lookAt` the player camera
- Save keys: `minecrafts.worlds.v1`, `minecrafts.settings.v1`
- Per-dimension block patches (`patches` / `netherPatches` / `endPatches`)
- Static hosting: nginx, GitHub Pages, or local `vite preview`

---

## Explicitly not implemented

Enchanting, brewing, full redstone, pistons, netherite, shulkers, elytra, end ships / outer end cities, Wither boss, datapacks, multiplayer sync, cloud saves.

---

## License and disclaimer

Use the source as allowed by this repository. **Minecraft is a trademark of Mojang / Microsoft.** This is an independent fan recreation. It does not use official textures, skins, sounds, or the official client. Do not describe it as vanilla Minecraft.
