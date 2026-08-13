export const TAGS = {
  planks: ["oak_planks", "birch_planks", "spruce_planks", "jungle_planks"],
  logs: ["oak_log", "birch_log", "spruce_log", "jungle_log"],
  wool: ["white_wool", "red_wool", "blue_wool", "yellow_wool", "black_wool", "green_wool", "orange_wool", "brown_wool", "pink_wool"],
  coal: ["coal", "charcoal"],
};

function idsMatch(got, want) {
  if (!want) return !got;
  if (typeof want === "string" && want.startsWith("#")) return (TAGS[want.slice(1)] || []).includes(got);
  if (Array.isArray(want)) return want.includes(got);
  return got === want;
}

function toolRecipes(head, prefix) {
  return [
    { map: { "#": head, s: "stick" }, rows: ["###", " s ", " s "], out: `${prefix}_pickaxe`, count: 1 },
    { map: { "#": head, s: "stick" }, rows: ["##", "#s", " s"], out: `${prefix}_axe`, count: 1 },
    { map: { "#": head, s: "stick" }, rows: ["#", "s", "s"], out: `${prefix}_shovel`, count: 1 },
    { map: { "#": head, s: "stick" }, rows: ["##", " s", " s"], out: `${prefix}_hoe`, count: 1 },
    { map: { "#": head, s: "stick" }, rows: ["#", "#", "s"], out: `${prefix}_sword`, count: 1 },
  ];
}

function armorRecipes(mat, prefix) {
  return [
    { map: { "#": mat }, rows: ["###", "# #"], out: `${prefix}_helmet`, count: 1 },
    { map: { "#": mat }, rows: ["# #", "###", "###"], out: `${prefix}_chestplate`, count: 1 },
    { map: { "#": mat }, rows: ["###", "# #", "# #"], out: `${prefix}_leggings`, count: 1 },
    { map: { "#": mat }, rows: ["# #", "# #"], out: `${prefix}_boots`, count: 1 },
  ];
}

function unpack(block, item, n = 9) {
  return { shapeless: [block], out: item, count: n };
}

export const ALL_RECIPES = [
  { map: { "#": "#logs" }, rows: ["#"], out: "oak_planks", count: 4, remap: { birch_log: "birch_planks", spruce_log: "spruce_planks", jungle_log: "jungle_planks", oak_log: "oak_planks" } },
  { map: { "#": "#planks" }, rows: ["#", "#"], out: "stick", count: 4 },
  { map: { "#": "#planks" }, rows: ["##", "##"], out: "crafting_table", count: 1 },
  ...toolRecipes("#planks", "wooden"),
  ...toolRecipes("cobblestone", "stone"),
  ...toolRecipes("iron_ingot", "iron"),
  ...toolRecipes("gold_ingot", "golden"),
  ...toolRecipes("diamond", "diamond"),
  { map: { "#": "#planks" }, rows: ["###", "# #", "###"], out: "chest", count: 1 },
  { map: { "#": "cobblestone" }, rows: ["###", "# #", "###"], out: "furnace", count: 1 },
  { map: { "#": "sand" }, rows: ["##", "##"], out: "sandstone", count: 1 },
  { map: { "#": "stone" }, rows: ["##", "##"], out: "stone_bricks", count: 4 },
  { map: { "#": "wheat" }, rows: ["###"], out: "bread", count: 1 },
  { map: { "#": "iron_ingot" }, rows: ["###", "###", "###"], out: "iron_block", count: 1 },
  { map: { "#": "gold_ingot" }, rows: ["###", "###", "###"], out: "gold_block", count: 1 },
  { map: { "#": "diamond" }, rows: ["###", "###", "###"], out: "diamond_block", count: 1 },
  { map: { "#": "coal" }, rows: ["###", "###", "###"], out: "coal_block", count: 1 },
  { map: { "#": "emerald" }, rows: ["###", "###", "###"], out: "emerald_block", count: 1 },
  { map: { "#": "copper_ingot" }, rows: ["###", "###", "###"], out: "copper_block", count: 1 },
  { map: { "#": "lapis" }, rows: ["###", "###", "###"], out: "lapis_block", count: 1 },
  { map: { "#": "redstone" }, rows: ["###", "###", "###"], out: "redstone_block", count: 1 },
  { map: { "#": "gold_ingot", A: "apple" }, rows: ["###", "#A#", "###"], out: "golden_apple", count: 1 },
  { map: { "#": "gold_ingot", C: "carrot" }, rows: ["###", "#C#", "###"], out: "golden_carrot", count: 1 },
  { map: { P: "#planks", B: "book" }, rows: ["PPP", "BBB", "PPP"], out: "bookshelf", count: 1 },
  { map: { "#": "string" }, rows: ["##", "##"], out: "white_wool", count: 1 },
  { map: { "#": "iron_ingot" }, rows: ["# ", " #"], out: "shears", count: 1 },
  { map: { W: "#wool", P: "#planks" }, rows: ["WWW", "PPP"], out: "red_bed", count: 1 },
  { map: { "#": "wheat" }, rows: ["###", "###", "###"], out: "hay_block", count: 1 },
  { map: { P: "pumpkin", T: "torch" }, rows: ["T", "P"], out: "jack_o_lantern", count: 1 },
  { map: { C: "#coal", s: "stick" }, rows: ["C", "s"], out: "torch", count: 4 },
  { map: { "#": "sugar_cane" }, rows: ["###"], out: "paper", count: 3 },
  { map: { P: "paper", L: "leather" }, rows: ["P", "P", "L"], out: "book", count: 1 },
  { map: { "#": "#planks" }, rows: ["# #", " #"], out: "bowl", count: 4 },
  { map: { "#": "wheat", S: "sugar" }, rows: ["#S#"], out: "cookie", count: 8 },
  { map: { P: "pumpkin", S: "sugar", E: "egg" }, rows: ["P", "S", "E"], out: "pumpkin_pie", count: 1 },
  { map: { s: "stick", S: "string" }, rows: [" sS", "sS ", "s  "], out: "bow", count: 1 },
  { map: { F: "flint", s: "stick", E: "feather" }, rows: ["F", "s", "E"], out: "arrow", count: 4 },
  { map: { I: "iron_ingot", F: "flint" }, rows: ["I ", " F"], out: "flint_and_steel", count: 1 },
  { map: { "#": "iron_ingot" }, rows: ["# #", " #"], out: "bucket", count: 1 },
  { map: { s: "stick", S: "string" }, rows: ["  s", " sS", "s S"], out: "fishing_rod", count: 1 },
  { map: { "#": "#planks" }, rows: ["##", "##", "##"], out: "oak_door", count: 3 },
  { map: { "#": "#planks" }, rows: ["# #", "###"], out: "oak_boat", count: 1 },
  { map: { "#": "stick" }, rows: ["# #", "###", "# #"], out: "ladder", count: 3 },
  { map: { s: "stick", P: "#planks" }, rows: ["sPs", "sPs"], out: "oak_fence", count: 3 },
  { map: { s: "stick", P: "#planks" }, rows: ["s s", "sPs", "sPs"], out: "oak_fence_gate", count: 1 },
  { map: { I: "iron_ingot", R: "redstone" }, rows: [" I ", "IRI", " I "], out: "compass", count: 1 },
  { map: { G: "gold_ingot", R: "redstone" }, rows: [" G ", "GRG", " G "], out: "clock", count: 1 },
  { map: { S: "sand", G: "gunpowder" }, rows: ["GSG", "SGS", "GSG"], out: "tnt", count: 1 },
  { map: { "#": "clay_ball" }, rows: ["##", "##"], out: "clay", count: 1 },
  { map: { "#": "brick" }, rows: ["##", "##"], out: "bricks", count: 1 },
  { map: { "#": "nether_brick" }, rows: ["##", "##"], out: "nether_bricks", count: 1 },
  { map: { "#": "quartz" }, rows: ["##", "##"], out: "quartz_block", count: 1 },
  { map: { "#": "gold_nugget" }, rows: ["###", "###", "###"], out: "gold_ingot", count: 1 },
  { map: { "#": "nether_wart" }, rows: ["##", "##"], out: "nether_wart_block", count: 1 },
  ...armorRecipes("leather", "leather"),
  ...armorRecipes("iron_ingot", "iron"),
  ...armorRecipes("diamond", "diamond"),
];

export const SHAPELESS = [
  unpack("iron_block", "iron_ingot"),
  unpack("gold_block", "gold_ingot"),
  unpack("diamond_block", "diamond"),
  unpack("coal_block", "coal"),
  unpack("emerald_block", "emerald"),
  unpack("copper_block", "copper_ingot"),
  unpack("lapis_block", "lapis"),
  unpack("redstone_block", "redstone"),
  unpack("hay_block", "wheat"),
  { shapeless: ["sugar_cane", "sugar_cane", "sugar_cane"], out: "paper", count: 3 },
  { shapeless: ["paper", "paper", "paper", "leather"], out: "book", count: 1 },
  { shapeless: ["sugar_cane"], out: "sugar", count: 1 },
  { shapeless: ["bone"], out: "bone_meal", count: 3 },
  { shapeless: ["dandelion"], out: "yellow_dye", count: 1 },
  { shapeless: ["poppy"], out: "red_dye", count: 1 },
  { shapeless: ["charcoal"], out: "black_dye", count: 1 },
  { shapeless: ["brown_mushroom"], out: "brown_dye", count: 1 },
  { shapeless: ["bone_meal"], out: "white_dye", count: 1 },
  { shapeless: ["red_dye", "yellow_dye"], out: "orange_dye", count: 2 },
  { shapeless: ["red_dye", "white_dye"], out: "pink_dye", count: 2 },
  { shapeless: ["bowl", "red_mushroom", "brown_mushroom"], out: "mushroom_stew", count: 1 },
  { shapeless: ["white_wool", "red_dye"], out: "red_wool", count: 1 },
  { shapeless: ["white_wool", "blue_dye"], out: "blue_wool", count: 1 },
  { shapeless: ["white_wool", "yellow_dye"], out: "yellow_wool", count: 1 },
  { shapeless: ["white_wool", "black_dye"], out: "black_wool", count: 1 },
  { shapeless: ["white_wool", "green_dye"], out: "green_wool", count: 1 },
  { shapeless: ["white_wool", "orange_dye"], out: "orange_wool", count: 1 },
  { shapeless: ["white_wool", "pink_dye"], out: "pink_wool", count: 1 },
  { shapeless: ["white_wool", "brown_dye"], out: "brown_wool", count: 1 },
  { shapeless: ["white_wool", "white_dye"], out: "white_wool", count: 1 },
  { shapeless: ["blaze_rod"], out: "blaze_powder", count: 2 },
  { shapeless: ["ender_pearl", "blaze_powder"], out: "ender_eye", count: 1 },
  { shapeless: ["chorus_fruit", "chorus_fruit", "chorus_fruit", "chorus_fruit"], out: "purpur_block", count: 1 },
  unpack("quartz_block", "quartz"),
  unpack("gold_ingot", "gold_nugget"),
];

function normalizeGrid(slots, size) {
  const g = [];
  for (let i = 0; i < size * size; i++) g.push(slots[i]?.id || null);
  let minR = size, maxR = -1, minC = size, maxC = -1;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (g[r * size + c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR < 0) return [];
  const rows = [];
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) row.push(g[r * size + c]);
    rows.push(row);
  }
  return rows;
}

function recipeRows(recipe) {
  const max = Math.max(...recipe.rows.map((r) => r.length));
  return recipe.rows.map((row) => {
    const cells = [];
    for (let i = 0; i < max; i++) {
      const ch = row[i] || " ";
      if (ch === " ") cells.push(null);
      else cells.push(recipe.map[ch] || null);
    }
    return cells;
  });
}

function matchShaped(grid, recipe) {
  const want = recipeRows(recipe);
  if (grid.length !== want.length) return false;
  if ((grid[0]?.length || 0) !== (want[0]?.length || 0)) return false;
  for (let r = 0; r < want.length; r++) {
    for (let c = 0; c < want[r].length; c++) {
      if (!idsMatch(grid[r][c] || null, want[r][c] || null)) return false;
    }
  }
  return true;
}

function matchShapeless(grid, recipe) {
  const have = [];
  for (const row of grid) {
    for (const id of row) if (id) have.push(id);
  }
  const need = recipe.shapeless.slice();
  if (have.length !== need.length) return false;
  const used = new Array(need.length).fill(false);
  for (const id of have) {
    let ok = false;
    for (let i = 0; i < need.length; i++) {
      if (used[i]) continue;
      if (idsMatch(id, need[i])) {
        used[i] = true;
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

function remapOut(recipe, grid) {
  if (!recipe.remap) return recipe.out;
  for (const row of grid) {
    for (const id of row) {
      if (id && recipe.remap[id]) return recipe.remap[id];
    }
  }
  return recipe.out;
}

export function craftResult(slots, size) {
  const grid = normalizeGrid(slots, size);
  if (!grid.length) return null;
  for (const r of SHAPELESS) {
    if (matchShapeless(grid, r)) return { id: r.out, count: r.count };
  }
  for (const r of ALL_RECIPES) {
    if (matchShaped(grid, r)) return { id: remapOut(r, grid), count: r.count };
  }
  return null;
}

export function consumeCraft(slots, size) {
  for (let i = 0; i < size * size; i++) {
    if (!slots[i]) continue;
    slots[i].count--;
    if (slots[i].count <= 0) slots[i] = null;
  }
}

export const SMELT = {
  iron_ore: { id: "iron_ingot", xp: 0.7 },
  gold_ore: { id: "gold_ingot", xp: 1 },
  copper_ore: { id: "copper_ingot", xp: 0.7 },
  cobblestone: { id: "stone", xp: 0.1 },
  sand: { id: "glass", xp: 0.1 },
  oak_log: { id: "charcoal", xp: 0.15 },
  birch_log: { id: "charcoal", xp: 0.15 },
  spruce_log: { id: "charcoal", xp: 0.15 },
  jungle_log: { id: "charcoal", xp: 0.15 },
  porkchop: { id: "cooked_porkchop", xp: 0.35 },
  beef: { id: "steak", xp: 0.35 },
  chicken: { id: "cooked_chicken", xp: 0.35 },
  mutton: { id: "cooked_mutton", xp: 0.35 },
  potato: { id: "baked_potato", xp: 0.35 },
  clay: { id: "bricks", xp: 0.3 },
  clay_ball: { id: "brick", xp: 0.3 },
  cactus: { id: "green_dye", xp: 0.2 },
  cod: { id: "cooked_cod", xp: 0.35 },
  salmon: { id: "cooked_salmon", xp: 0.35 },
  netherrack: { id: "nether_brick", xp: 0.1 },
  nether_quartz_ore: { id: "quartz", xp: 0.7 },
};

export function canSmelt(id) {
  return SMELT[id] || null;
}
