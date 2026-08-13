export const AIR = 0;

export const BLOCKS = {
  0: { id: 0, key: "air", solid: false, transparent: true, hardness: 0, drop: null },
};

let nextId = 1;

function blk(def) {
  const id = def.id ?? nextId++;
  def.id = id;
  def.solid = def.solid !== false;
  def.transparent = !!def.transparent;
  def.cutout = !!def.cutout;
  def.fluid = !!def.fluid;
  def.hardness = def.hardness ?? 1;
  def.tool = def.tool ?? "any";
  def.harvest = def.harvest ?? 0;
  def.stack = def.stack ?? 64;
  def.light = def.light ?? 0;
  def.plant = !!def.plant;
  def.web = !!def.web;
  def.slow = !!def.slow;
  def.magma = !!def.magma;
  def.portal = !!def.portal;
  def.crop = def.crop ?? null;
  def.hidden = !!def.hidden;
  def.category = def.category ?? "building";
  BLOCKS[id] = def;
  return id;
}

export const STONE = blk({ key: "stone", hardness: 1.5, tool: "pickaxe", harvest: 1, drop: "cobblestone", name: { zh_cn: "石头", en_us: "Stone" } });
export const GRASS = blk({ key: "grass_block", hardness: 0.6, tool: "shovel", drop: "dirt", name: { zh_cn: "草方块", en_us: "Grass Block" }, faces: { top: "grass_top", bottom: "dirt", side: "grass_side" } });
export const DIRT = blk({ key: "dirt", hardness: 0.5, tool: "shovel", name: { zh_cn: "泥土", en_us: "Dirt" } });
export const COBBLE = blk({ key: "cobblestone", hardness: 2, tool: "pickaxe", harvest: 1, name: { zh_cn: "圆石", en_us: "Cobblestone" } });
export const PLANKS = blk({ key: "oak_planks", hardness: 2, tool: "axe", name: { zh_cn: "橡木木板", en_us: "Oak Planks" } });
export const BEDROCK = blk({ key: "bedrock", hardness: -1, tool: "none", drop: null, name: { zh_cn: "基岩", en_us: "Bedrock" } });
export const SAND = blk({ key: "sand", hardness: 0.5, tool: "shovel", gravity: true, name: { zh_cn: "沙子", en_us: "Sand" } });
export const GRAVEL = blk({ key: "gravel", hardness: 0.6, tool: "shovel", gravity: true, name: { zh_cn: "砂砾", en_us: "Gravel" } });
export const LOG = blk({ key: "oak_log", hardness: 2, tool: "axe", name: { zh_cn: "橡木原木", en_us: "Oak Log" }, faces: { top: "log_top", bottom: "log_top", side: "log_side" } });
export const LEAVES = blk({ key: "oak_leaves", hardness: 0.2, tool: "any", transparent: true, cutout: true, drop: "oak_leaves", name: { zh_cn: "橡木树叶", en_us: "Oak Leaves" } });
export const GLASS = blk({ key: "glass", hardness: 0.3, transparent: true, cutout: true, drop: null, name: { zh_cn: "玻璃", en_us: "Glass" } });
export const WATER = blk({ key: "water", solid: false, transparent: true, fluid: true, hardness: 100, drop: null, name: { zh_cn: "水", en_us: "Water" }, category: "misc" });
export const LAVA = blk({ key: "lava", solid: false, transparent: true, fluid: true, hardness: 100, light: 15, drop: null, name: { zh_cn: "岩浆", en_us: "Lava" }, category: "misc" });
export const COAL_ORE = blk({ key: "coal_ore", hardness: 3, tool: "pickaxe", harvest: 1, drop: "coal", name: { zh_cn: "煤矿石", en_us: "Coal Ore" } });
export const IRON_ORE = blk({ key: "iron_ore", hardness: 3, tool: "pickaxe", harvest: 2, drop: "iron_ore", name: { zh_cn: "铁矿石", en_us: "Iron Ore" } });
export const GOLD_ORE = blk({ key: "gold_ore", hardness: 3, tool: "pickaxe", harvest: 3, drop: "gold_ore", name: { zh_cn: "金矿石", en_us: "Gold Ore" } });
export const DIAMOND_ORE = blk({ key: "diamond_ore", hardness: 3, tool: "pickaxe", harvest: 3, drop: "diamond", name: { zh_cn: "钻石矿石", en_us: "Diamond Ore" } });
export const CRAFTING = blk({ key: "crafting_table", hardness: 2.5, tool: "axe", name: { zh_cn: "工作台", en_us: "Crafting Table" }, faces: { top: "craft_top", bottom: "planks", side: "craft_side", front: "craft_front" }, category: "decoration" });
export const FURNACE = blk({ key: "furnace", hardness: 3.5, tool: "pickaxe", harvest: 1, name: { zh_cn: "熔炉", en_us: "Furnace" }, faces: { top: "furnace_top", bottom: "furnace_top", side: "furnace_side", front: "furnace_front" }, category: "decoration" });
export const CHEST = blk({ key: "chest", hardness: 2.5, tool: "axe", name: { zh_cn: "箱子", en_us: "Chest" }, faces: { top: "chest_top", bottom: "chest_top", side: "chest_side", front: "chest_front" }, category: "decoration" });
export const BRICKS = blk({ key: "bricks", hardness: 2, tool: "pickaxe", harvest: 1, name: { zh_cn: "砖块", en_us: "Bricks" } });
export const STONEBRICK = blk({ key: "stone_bricks", hardness: 1.5, tool: "pickaxe", harvest: 1, name: { zh_cn: "石砖", en_us: "Stone Bricks" } });
export const SNOW = blk({ key: "snow_block", hardness: 0.2, tool: "shovel", name: { zh_cn: "雪块", en_us: "Snow Block" } });
export const ICE = blk({ key: "ice", hardness: 0.5, tool: "pickaxe", transparent: true, drop: null, name: { zh_cn: "冰", en_us: "Ice" } });
export const CACTUS = blk({ key: "cactus", hardness: 0.4, transparent: true, cutout: true, name: { zh_cn: "仙人掌", en_us: "Cactus" }, faces: { top: "cactus_top", bottom: "cactus_top", side: "cactus_side" }, category: "decoration" });
export const CLAY = blk({ key: "clay", hardness: 0.6, tool: "shovel", drop: "clay_ball", name: { zh_cn: "黏土块", en_us: "Clay" } });
export const GLOWSTONE = blk({ key: "glowstone", hardness: 0.3, light: 15, drop: "glowstone", name: { zh_cn: "荧石", en_us: "Glowstone" }, category: "decoration" });
export const OBSIDIAN = blk({ key: "obsidian", hardness: 50, tool: "pickaxe", harvest: 4, name: { zh_cn: "黑曜石", en_us: "Obsidian" } });
export const NETHERRACK = blk({ key: "netherrack", hardness: 0.4, tool: "pickaxe", harvest: 1, name: { zh_cn: "下界岩", en_us: "Netherrack" } });
export const BOOKSHELF = blk({ key: "bookshelf", hardness: 1.5, tool: "axe", name: { zh_cn: "书架", en_us: "Bookshelf" }, faces: { top: "planks", bottom: "planks", side: "bookshelf" }, category: "decoration" });
export const MELON = blk({ key: "melon", hardness: 1, tool: "axe", name: { zh_cn: "西瓜", en_us: "Melon" }, faces: { top: "melon_top", bottom: "melon_top", side: "melon_side" }, category: "decoration" });
export const PUMPKIN = blk({ key: "pumpkin", hardness: 1, tool: "axe", name: { zh_cn: "南瓜", en_us: "Pumpkin" }, faces: { top: "pumpkin_top", bottom: "pumpkin_top", side: "pumpkin_side", front: "pumpkin_front" }, category: "decoration" });
export const WOOL = blk({ key: "white_wool", hardness: 0.8, name: { zh_cn: "白色羊毛", en_us: "White Wool" }, category: "decoration" });
export const TNT = blk({ key: "tnt", hardness: 0, name: { zh_cn: "TNT", en_us: "TNT" }, faces: { top: "tnt_top", bottom: "tnt_bottom", side: "tnt_side" }, category: "redstone" });
export const MOSSY = blk({ key: "mossy_cobblestone", hardness: 2, tool: "pickaxe", harvest: 1, name: { zh_cn: "苔石", en_us: "Mossy Cobblestone" } });
export const FARMLAND = blk({ key: "farmland", hardness: 0.6, tool: "shovel", drop: "dirt", name: { zh_cn: "耕地", en_us: "Farmland" }, faces: { top: "farmland", bottom: "dirt", side: "dirt" } });
export const COAL_BLOCK = blk({ key: "coal_block", hardness: 5, tool: "pickaxe", harvest: 1, name: { zh_cn: "煤炭块", en_us: "Block of Coal" } });
export const IRON_BLOCK = blk({ key: "iron_block", hardness: 5, tool: "pickaxe", harvest: 2, name: { zh_cn: "铁块", en_us: "Block of Iron" } });
export const GOLD_BLOCK = blk({ key: "gold_block", hardness: 3, tool: "pickaxe", harvest: 3, name: { zh_cn: "金块", en_us: "Block of Gold" } });
export const DIAMOND_BLOCK = blk({ key: "diamond_block", hardness: 5, tool: "pickaxe", harvest: 3, name: { zh_cn: "钻石块", en_us: "Block of Diamond" } });
export const SANDSTONE = blk({ key: "sandstone", hardness: 0.8, tool: "pickaxe", harvest: 1, name: { zh_cn: "砂岩", en_us: "Sandstone" }, faces: { top: "sandstone_top", bottom: "sandstone_bottom", side: "sandstone_side" } });
export const LAPIS_ORE = blk({ key: "lapis_ore", hardness: 3, tool: "pickaxe", harvest: 2, drop: "lapis", name: { zh_cn: "青金石矿石", en_us: "Lapis Lazuli Ore" } });
export const REDSTONE_ORE = blk({ key: "redstone_ore", hardness: 3, tool: "pickaxe", harvest: 3, drop: "redstone", name: { zh_cn: "红石矿石", en_us: "Redstone Ore" }, category: "redstone" });
export const PODZOL = blk({ key: "podzol", hardness: 0.5, tool: "shovel", drop: "dirt", name: { zh_cn: "灰化土", en_us: "Podzol" }, faces: { top: "podzol_top", bottom: "dirt", side: "podzol_side" } });
export const ANDESITE = blk({ key: "andesite", hardness: 1.5, tool: "pickaxe", harvest: 1, name: { zh_cn: "安山岩", en_us: "Andesite" } });
export const DIORITE = blk({ key: "diorite", hardness: 1.5, tool: "pickaxe", harvest: 1, name: { zh_cn: "闪长岩", en_us: "Diorite" } });
export const GRANITE = blk({ key: "granite", hardness: 1.5, tool: "pickaxe", harvest: 1, name: { zh_cn: "花岗岩", en_us: "Granite" } });
export const BIRCH_LOG = blk({ key: "birch_log", hardness: 2, tool: "axe", name: { zh_cn: "白桦原木", en_us: "Birch Log" }, faces: { top: "birch_log_top", bottom: "birch_log_top", side: "birch_log_side" } });
export const BIRCH_PLANKS = blk({ key: "birch_planks", hardness: 2, tool: "axe", name: { zh_cn: "白桦木板", en_us: "Birch Planks" } });
export const BIRCH_LEAVES = blk({ key: "birch_leaves", hardness: 0.2, transparent: true, cutout: true, name: { zh_cn: "白桦树叶", en_us: "Birch Leaves" } });
export const SPRUCE_LOG = blk({ key: "spruce_log", hardness: 2, tool: "axe", name: { zh_cn: "云杉原木", en_us: "Spruce Log" }, faces: { top: "spruce_log_top", bottom: "spruce_log_top", side: "spruce_log_side" } });
export const SPRUCE_PLANKS = blk({ key: "spruce_planks", hardness: 2, tool: "axe", name: { zh_cn: "云杉木板", en_us: "Spruce Planks" } });
export const SPRUCE_LEAVES = blk({ key: "spruce_leaves", hardness: 0.2, transparent: true, cutout: true, name: { zh_cn: "云杉树叶", en_us: "Spruce Leaves" } });
export const JUNGLE_LOG = blk({ key: "jungle_log", hardness: 2, tool: "axe", name: { zh_cn: "丛林原木", en_us: "Jungle Log" }, faces: { top: "jungle_log_top", bottom: "jungle_log_top", side: "jungle_log_side" } });
export const JUNGLE_PLANKS = blk({ key: "jungle_planks", hardness: 2, tool: "axe", name: { zh_cn: "丛林木板", en_us: "Jungle Planks" } });
export const JUNGLE_LEAVES = blk({ key: "jungle_leaves", hardness: 0.2, transparent: true, cutout: true, name: { zh_cn: "丛林树叶", en_us: "Jungle Leaves" } });
export const EMERALD_ORE = blk({ key: "emerald_ore", hardness: 3, tool: "pickaxe", harvest: 3, drop: "emerald", name: { zh_cn: "绿宝石矿石", en_us: "Emerald Ore" } });
export const EMERALD_BLOCK = blk({ key: "emerald_block", hardness: 5, tool: "pickaxe", harvest: 3, name: { zh_cn: "绿宝石块", en_us: "Block of Emerald" } });
export const COPPER_ORE = blk({ key: "copper_ore", hardness: 3, tool: "pickaxe", harvest: 2, drop: "copper_ore", name: { zh_cn: "铜矿石", en_us: "Copper Ore" } });
export const COPPER_BLOCK = blk({ key: "copper_block", hardness: 3, tool: "pickaxe", harvest: 2, name: { zh_cn: "铜块", en_us: "Block of Copper" } });
export const LAPIS_BLOCK = blk({ key: "lapis_block", hardness: 3, tool: "pickaxe", harvest: 2, name: { zh_cn: "青金石块", en_us: "Lapis Lazuli Block" } });
export const REDSTONE_BLOCK = blk({ key: "redstone_block", hardness: 5, tool: "pickaxe", harvest: 1, name: { zh_cn: "红石块", en_us: "Block of Redstone" }, category: "redstone" });
export const HAY = blk({ key: "hay_block", hardness: 0.5, name: { zh_cn: "干草块", en_us: "Hay Bale" }, faces: { top: "hay_top", bottom: "hay_top", side: "hay_side" }, category: "decoration" });
export const PACKED_ICE = blk({ key: "packed_ice", hardness: 0.5, tool: "pickaxe", name: { zh_cn: "浮冰", en_us: "Packed Ice" } });
export const MYCELIUM = blk({ key: "mycelium", hardness: 0.6, tool: "shovel", drop: "dirt", name: { zh_cn: "菌丝", en_us: "Mycelium" }, faces: { top: "mycelium_top", bottom: "dirt", side: "mycelium_side" } });
export const RED_WOOL = blk({ key: "red_wool", hardness: 0.8, name: { zh_cn: "红色羊毛", en_us: "Red Wool" }, category: "decoration" });
export const BLUE_WOOL = blk({ key: "blue_wool", hardness: 0.8, name: { zh_cn: "蓝色羊毛", en_us: "Blue Wool" }, category: "decoration" });
export const YELLOW_WOOL = blk({ key: "yellow_wool", hardness: 0.8, name: { zh_cn: "黄色羊毛", en_us: "Yellow Wool" }, category: "decoration" });
export const BLACK_WOOL = blk({ key: "black_wool", hardness: 0.8, name: { zh_cn: "黑色羊毛", en_us: "Black Wool" }, category: "decoration" });
export const GREEN_WOOL = blk({ key: "green_wool", hardness: 0.8, name: { zh_cn: "绿色羊毛", en_us: "Green Wool" }, category: "decoration" });
export const ORANGE_WOOL = blk({ key: "orange_wool", hardness: 0.8, name: { zh_cn: "橙色羊毛", en_us: "Orange Wool" }, category: "decoration" });
export const BROWN_WOOL = blk({ key: "brown_wool", hardness: 0.8, name: { zh_cn: "棕色羊毛", en_us: "Brown Wool" }, category: "decoration" });
export const PINK_WOOL = blk({ key: "pink_wool", hardness: 0.8, name: { zh_cn: "粉红色羊毛", en_us: "Pink Wool" }, category: "decoration" });
export const TERRACOTTA = blk({ key: "terracotta", hardness: 1.25, tool: "pickaxe", harvest: 1, name: { zh_cn: "陶瓦", en_us: "Terracotta" } });
export const RED_TERRACOTTA = blk({ key: "red_terracotta", hardness: 1.25, tool: "pickaxe", harvest: 1, name: { zh_cn: "红色陶瓦", en_us: "Red Terracotta" } });
export const ORANGE_TERRACOTTA = blk({ key: "orange_terracotta", hardness: 1.25, tool: "pickaxe", harvest: 1, name: { zh_cn: "橙色陶瓦", en_us: "Orange Terracotta" } });
export const YELLOW_TERRACOTTA = blk({ key: "yellow_terracotta", hardness: 1.25, tool: "pickaxe", harvest: 1, name: { zh_cn: "黄色陶瓦", en_us: "Yellow Terracotta" } });
export const PRISMARINE = blk({ key: "prismarine", hardness: 1.5, tool: "pickaxe", harvest: 1, name: { zh_cn: "海晶石", en_us: "Prismarine" } });
export const END_STONE = blk({ key: "end_stone", hardness: 3, tool: "pickaxe", harvest: 1, name: { zh_cn: "末地石", en_us: "End Stone" } });
export const QUARTZ = blk({ key: "quartz_block", hardness: 0.8, tool: "pickaxe", harvest: 1, name: { zh_cn: "石英块", en_us: "Block of Quartz" } });
export const JACK_LANTERN = blk({ key: "jack_o_lantern", hardness: 1, tool: "axe", light: 15, name: { zh_cn: "南瓜灯", en_us: "Jack o'Lantern" }, faces: { top: "pumpkin_top", bottom: "pumpkin_top", side: "pumpkin_side", front: "jack_front" }, category: "decoration" });
export const RED_BED = blk({ key: "red_bed", hardness: 0.2, name: { zh_cn: "红色床", en_us: "Red Bed" }, faces: { top: "bed_top", bottom: "oak_planks", side: "bed_side" }, category: "decoration", bed: true });
export const SPONGE = blk({ key: "sponge", hardness: 0.6, name: { zh_cn: "海绵", en_us: "Sponge" }, category: "decoration" });
export const NOTE_BLOCK = blk({ key: "note_block", hardness: 0.8, tool: "axe", name: { zh_cn: "音符盒", en_us: "Note Block" }, category: "redstone" });
export const SUGAR_CANE = blk({ key: "sugar_cane", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, name: { zh_cn: "甘蔗", en_us: "Sugar Cane" }, category: "decoration" });
export const DANDELION = blk({ key: "dandelion", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, name: { zh_cn: "蒲公英", en_us: "Dandelion" }, category: "decoration" });
export const POPPY = blk({ key: "poppy", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, name: { zh_cn: "虞美人", en_us: "Poppy" }, category: "decoration" });
export const MUSHROOM_RED = blk({ key: "red_mushroom", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, name: { zh_cn: "红色蘑菇", en_us: "Red Mushroom" }, category: "decoration" });
export const MUSHROOM_BROWN = blk({ key: "brown_mushroom", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, name: { zh_cn: "棕色蘑菇", en_us: "Brown Mushroom" }, category: "decoration" });
export const TORCH = blk({ key: "torch", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, light: 14, gravity: true, name: { zh_cn: "火把", en_us: "Torch" }, category: "decoration" });
export const COBWEB = blk({ key: "cobweb", hardness: 4, solid: false, transparent: true, cutout: true, plant: true, web: true, drop: "string", name: { zh_cn: "蜘蛛网", en_us: "Cobweb" }, category: "decoration" });
export const TALL_GRASS = blk({ key: "short_grass", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, drop: "wheat_seeds", name: { zh_cn: "短草", en_us: "Short Grass" }, category: "decoration" });
export const OAK_SAPLING = blk({ key: "oak_sapling", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, name: { zh_cn: "橡树树苗", en_us: "Oak Sapling" }, category: "decoration" });
export const OAK_DOOR = blk({
  key: "oak_door", hardness: 3, tool: "axe", door: "lower",
  name: { zh_cn: "橡木门", en_us: "Oak Door" },
  faces: { top: "oak_planks", bottom: "oak_planks", side: "door_lower", front: "door_lower" },
  category: "decoration",
});
export const OAK_DOOR_TOP = blk({
  key: "oak_door_top", hardness: 3, tool: "axe", door: "upper", hidden: true, drop: "oak_door",
  name: { zh_cn: "橡木门", en_us: "Oak Door" },
  faces: { top: "oak_planks", bottom: "oak_planks", side: "door_upper", front: "door_upper" },
  category: "decoration",
});
export const OAK_DOOR_OPEN = blk({
  key: "oak_door_open", hardness: 3, tool: "axe", door: "lower", doorOpen: true,
  solid: false, transparent: true, cutout: true, hidden: true, drop: "oak_door",
  name: { zh_cn: "橡木门", en_us: "Oak Door" },
  faces: { top: "oak_planks", bottom: "oak_planks", side: "door_lower", front: "door_lower" },
  category: "decoration",
});
export const OAK_DOOR_OPEN_TOP = blk({
  key: "oak_door_open_top", hardness: 3, tool: "axe", door: "upper", doorOpen: true,
  solid: false, transparent: true, cutout: true, hidden: true, drop: "oak_door",
  name: { zh_cn: "橡木门", en_us: "Oak Door" },
  faces: { top: "oak_planks", bottom: "oak_planks", side: "door_upper", front: "door_upper" },
  category: "decoration",
});
export const LADDER = blk({
  key: "ladder", hardness: 0.4, tool: "axe", solid: false, transparent: true, cutout: true,
  plant: true, climb: true, name: { zh_cn: "梯子", en_us: "Ladder" }, category: "decoration",
});
export const NETHER_PORTAL = blk({
  key: "nether_portal", hardness: 0, drop: null,
  solid: false, transparent: true, cutout: true, light: 11, portal: true,
  name: { zh_cn: "下界传送门", en_us: "Nether Portal" }, category: "decoration",
});
export const SOUL_SAND = blk({
  key: "soul_sand", hardness: 0.5, tool: "shovel", slow: true,
  name: { zh_cn: "灵魂沙", en_us: "Soul Sand" },
});
export const NETHER_BRICKS = blk({
  key: "nether_bricks", hardness: 2, tool: "pickaxe", harvest: 1,
  name: { zh_cn: "下界砖块", en_us: "Nether Bricks" },
});
export const NETHER_QUARTZ_ORE = blk({
  key: "nether_quartz_ore", hardness: 3, tool: "pickaxe", harvest: 1, drop: "quartz",
  name: { zh_cn: "下界石英矿石", en_us: "Nether Quartz Ore" },
});
export const MAGMA_BLOCK = blk({
  key: "magma_block", hardness: 0.5, tool: "pickaxe", harvest: 1, light: 3, magma: true,
  name: { zh_cn: "岩浆块", en_us: "Magma Block" },
});
export const NETHER_WART = blk({
  key: "nether_wart", hardness: 0, solid: false, transparent: true, cutout: true, plant: true,
  name: { zh_cn: "下界疣", en_us: "Nether Wart" }, category: "decoration",
});
export const CRIMSON_NYLIUM = blk({
  key: "crimson_nylium", hardness: 0.4, tool: "pickaxe", harvest: 1, drop: "netherrack",
  name: { zh_cn: "绯红菌岩", en_us: "Crimson Nylium" },
  faces: { top: "crimson_nylium_top", bottom: "netherrack", side: "crimson_nylium_side" },
});
export const WARPED_NYLIUM = blk({
  key: "warped_nylium", hardness: 0.4, tool: "pickaxe", harvest: 1, drop: "netherrack",
  name: { zh_cn: "诡异菌岩", en_us: "Warped Nylium" },
  faces: { top: "warped_nylium_top", bottom: "netherrack", side: "warped_nylium_side" },
});
export const BLACKSTONE = blk({
  key: "blackstone", hardness: 1.5, tool: "pickaxe", harvest: 1,
  name: { zh_cn: "黑石", en_us: "Blackstone" },
});
export const CRIMSON_STEM = blk({
  key: "crimson_stem", hardness: 2, tool: "axe",
  name: { zh_cn: "绯红菌柄", en_us: "Crimson Stem" },
  faces: { top: "crimson_stem_top", bottom: "crimson_stem_top", side: "crimson_stem_side" },
});
export const WARPED_STEM = blk({
  key: "warped_stem", hardness: 2, tool: "axe",
  name: { zh_cn: "诡异菌柄", en_us: "Warped Stem" },
  faces: { top: "warped_stem_top", bottom: "warped_stem_top", side: "warped_stem_side" },
});
export const CRIMSON_WART = blk({
  key: "nether_wart_block", hardness: 1, tool: "hoe",
  name: { zh_cn: "下界疣块", en_us: "Nether Wart Block" },
});
export const WARPED_WART = blk({
  key: "warped_wart_block", hardness: 1, tool: "hoe",
  name: { zh_cn: "诡异疣块", en_us: "Warped Wart Block" },
});
export const OAK_FENCE = blk({
  key: "oak_fence", hardness: 2, tool: "axe",
  name: { zh_cn: "橡木栅栏", en_us: "Oak Fence" }, category: "decoration",
});
export const OAK_FENCE_GATE = blk({
  key: "oak_fence_gate", hardness: 2, tool: "axe", gate: true,
  name: { zh_cn: "橡木栅栏门", en_us: "Oak Fence Gate" }, category: "decoration",
  faces: { top: "oak_planks", bottom: "oak_planks", side: "oak_fence_gate", front: "oak_fence_gate" },
});
export const OAK_FENCE_GATE_OPEN = blk({
  key: "oak_fence_gate_open", hardness: 2, tool: "axe", gate: true, gateOpen: true,
  solid: false, transparent: true, cutout: true, doorOpen: true, hidden: true, drop: "oak_fence_gate",
  name: { zh_cn: "橡木栅栏门", en_us: "Oak Fence Gate" }, category: "decoration",
  faces: { top: "oak_planks", bottom: "oak_planks", side: "oak_fence_gate", front: "oak_fence_gate" },
});
export const END_PORTAL_FRAME = blk({
  key: "end_portal_frame", hardness: -1, tool: "none", drop: null,
  name: { zh_cn: "末地传送门框架", en_us: "End Portal Frame" }, category: "decoration",
  faces: { top: "end_portal_frame_top", bottom: "end_stone", side: "end_portal_frame_side" },
});
export const END_PORTAL_FRAME_EYE = blk({
  key: "end_portal_frame_eye", hardness: -1, tool: "none", drop: null, hidden: true,
  name: { zh_cn: "末地传送门框架", en_us: "End Portal Frame" }, category: "decoration",
  faces: { top: "end_portal_frame_eye", bottom: "end_stone", side: "end_portal_frame_side" },
});
export const END_PORTAL = blk({
  key: "end_portal", hardness: 0, drop: null, hidden: true,
  solid: false, transparent: true, cutout: true, light: 15, portal: true, endPortal: true,
  name: { zh_cn: "末地传送门", en_us: "End Portal" }, category: "decoration",
});
export const CHORUS_PLANT = blk({
  key: "chorus_plant", hardness: 0.4, solid: false, transparent: true, cutout: true, plant: true,
  drop: "chorus_fruit",
  name: { zh_cn: "紫颂植株", en_us: "Chorus Plant" }, category: "decoration",
});
export const CHORUS_FLOWER = blk({
  key: "chorus_flower", hardness: 0.4, solid: false, transparent: true, cutout: true, plant: true,
  drop: "chorus_flower",
  name: { zh_cn: "紫颂花", en_us: "Chorus Flower" }, category: "decoration",
});
export const PURPUR = blk({
  key: "purpur_block", hardness: 1.5, tool: "pickaxe", harvest: 1,
  name: { zh_cn: "紫珀块", en_us: "Purpur Block" },
});
export const END_ROD = blk({
  key: "end_rod", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, light: 14,
  name: { zh_cn: "末地烛", en_us: "End Rod" }, category: "decoration",
});
export const DRAGON_EGG = blk({
  key: "dragon_egg", hardness: 3, name: { zh_cn: "龙蛋", en_us: "Dragon Egg" }, category: "decoration",
});
export const WHEAT_0 = blk({ key: "wheat_0", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, crop: 0, hidden: true, drop: "wheat_seeds", name: { zh_cn: "小麦", en_us: "Wheat" }, category: "decoration" });
export const WHEAT_1 = blk({ key: "wheat_1", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, crop: 1, hidden: true, drop: "wheat_seeds", name: { zh_cn: "小麦", en_us: "Wheat" }, category: "decoration" });
export const WHEAT_2 = blk({ key: "wheat_2", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, crop: 2, hidden: true, drop: "wheat_seeds", name: { zh_cn: "小麦", en_us: "Wheat" }, category: "decoration" });
export const WHEAT_3 = blk({ key: "wheat_3", hardness: 0, solid: false, transparent: true, cutout: true, plant: true, crop: 3, hidden: true, drop: "wheat", name: { zh_cn: "小麦", en_us: "Wheat" }, category: "decoration" });
export const WATER_STILL = WATER;

export const ITEM_DEFS = [];

function item(def) {
  ITEM_DEFS.push(def);
  return def.id;
}

export const ITEMS = {};

function addItem(def) {
  ITEMS[def.id] = def;
  def.stack = def.stack ?? 64;
  def.category = def.category ?? "misc";
  if (def.armor && !def.uses) def.uses = 80 + def.armor * 42;
  return def.id;
}

for (const b of Object.values(BLOCKS)) {
  if (b.id === 0) continue;
  addItem({
    id: b.key,
    blockId: b.id,
    name: b.name,
    stack: b.stack,
    category: b.category,
    isBlock: true,
    hidden: b.hidden,
    crop: b.crop,
  });
}

addItem({ id: "stick", name: { zh_cn: "木棍", en_us: "Stick" }, category: "misc" });
addItem({ id: "coal", name: { zh_cn: "煤炭", en_us: "Coal" }, category: "misc" });
addItem({ id: "charcoal", name: { zh_cn: "木炭", en_us: "Charcoal" }, category: "misc" });
addItem({ id: "iron_ingot", name: { zh_cn: "铁锭", en_us: "Iron Ingot" }, category: "misc" });
addItem({ id: "gold_ingot", name: { zh_cn: "金锭", en_us: "Gold Ingot" }, category: "misc" });
addItem({ id: "diamond", name: { zh_cn: "钻石", en_us: "Diamond" }, category: "misc" });
addItem({ id: "lapis", name: { zh_cn: "青金石", en_us: "Lapis Lazuli" }, category: "misc" });
addItem({ id: "redstone", name: { zh_cn: "红石粉", en_us: "Redstone Dust" }, category: "redstone" });
addItem({ id: "clay_ball", name: { zh_cn: "黏土球", en_us: "Clay Ball" }, category: "misc" });
addItem({ id: "brick", name: { zh_cn: "红砖", en_us: "Brick" }, category: "misc" });
addItem({ id: "flint", name: { zh_cn: "燧石", en_us: "Flint" }, category: "misc" });
addItem({ id: "wheat", name: { zh_cn: "小麦", en_us: "Wheat" }, category: "misc" });
addItem({ id: "wheat_seeds", name: { zh_cn: "小麦种子", en_us: "Wheat Seeds" }, category: "misc" });
addItem({ id: "apple", name: { zh_cn: "苹果", en_us: "Apple" }, category: "food", food: 4, sat: 2.4 });
addItem({ id: "bread", name: { zh_cn: "面包", en_us: "Bread" }, category: "food", food: 5, sat: 6 });
addItem({ id: "porkchop", name: { zh_cn: "生猪排", en_us: "Raw Porkchop" }, category: "food", food: 3, sat: 1.8 });
addItem({ id: "cooked_porkchop", name: { zh_cn: "熟猪排", en_us: "Cooked Porkchop" }, category: "food", food: 8, sat: 12.8 });
addItem({ id: "beef", name: { zh_cn: "生牛肉", en_us: "Raw Beef" }, category: "food", food: 3, sat: 1.8 });
addItem({ id: "steak", name: { zh_cn: "牛排", en_us: "Steak" }, category: "food", food: 8, sat: 12.8 });
addItem({ id: "golden_apple", name: { zh_cn: "金苹果", en_us: "Golden Apple" }, category: "food", food: 4, sat: 9.6, rare: true });
addItem({ id: "emerald", name: { zh_cn: "绿宝石", en_us: "Emerald" }, category: "misc" });
addItem({ id: "copper_ingot", name: { zh_cn: "铜锭", en_us: "Copper Ingot" }, category: "misc" });
addItem({ id: "feather", name: { zh_cn: "羽毛", en_us: "Feather" }, category: "misc" });
addItem({ id: "string", name: { zh_cn: "线", en_us: "String" }, category: "misc" });
addItem({ id: "bone", name: { zh_cn: "骨头", en_us: "Bone" }, category: "misc" });
addItem({ id: "egg", name: { zh_cn: "鸡蛋", en_us: "Egg" }, category: "food" });
addItem({ id: "chicken", name: { zh_cn: "生鸡肉", en_us: "Raw Chicken" }, category: "food", food: 2, sat: 1.2 });
addItem({ id: "cooked_chicken", name: { zh_cn: "熟鸡肉", en_us: "Cooked Chicken" }, category: "food", food: 6, sat: 7.2 });
addItem({ id: "mutton", name: { zh_cn: "生羊肉", en_us: "Raw Mutton" }, category: "food", food: 2, sat: 1.2 });
addItem({ id: "cooked_mutton", name: { zh_cn: "熟羊肉", en_us: "Cooked Mutton" }, category: "food", food: 6, sat: 9.6 });
addItem({ id: "carrot", name: { zh_cn: "胡萝卜", en_us: "Carrot" }, category: "food", food: 3, sat: 3.6 });
addItem({ id: "potato", name: { zh_cn: "马铃薯", en_us: "Potato" }, category: "food", food: 1, sat: 0.6 });
addItem({ id: "baked_potato", name: { zh_cn: "烤马铃薯", en_us: "Baked Potato" }, category: "food", food: 5, sat: 6 });
addItem({ id: "sugar", name: { zh_cn: "糖", en_us: "Sugar" }, category: "misc" });
addItem({ id: "shears", name: { zh_cn: "剪刀", en_us: "Shears" }, stack: 1, category: "tools", tool: "shears", uses: 238 });
addItem({ id: "leather", name: { zh_cn: "皮革", en_us: "Leather" }, category: "misc" });
addItem({ id: "paper", name: { zh_cn: "纸", en_us: "Paper" }, category: "misc" });
addItem({ id: "book", name: { zh_cn: "书", en_us: "Book" }, category: "misc" });
addItem({ id: "bowl", name: { zh_cn: "碗", en_us: "Bowl" }, category: "misc" });
addItem({ id: "mushroom_stew", name: { zh_cn: "蘑菇煲", en_us: "Mushroom Stew" }, stack: 1, category: "food", food: 6, sat: 7.2 });
addItem({ id: "cookie", name: { zh_cn: "曲奇", en_us: "Cookie" }, category: "food", food: 2, sat: 0.4 });
addItem({ id: "pumpkin_pie", name: { zh_cn: "南瓜派", en_us: "Pumpkin Pie" }, category: "food", food: 8, sat: 4.8 });
addItem({ id: "gunpowder", name: { zh_cn: "火药", en_us: "Gunpowder" }, category: "misc" });
addItem({ id: "bone_meal", name: { zh_cn: "骨粉", en_us: "Bone Meal" }, category: "misc" });
addItem({ id: "yellow_dye", name: { zh_cn: "黄色染料", en_us: "Yellow Dye" }, category: "misc" });
addItem({ id: "red_dye", name: { zh_cn: "红色染料", en_us: "Red Dye" }, category: "misc" });
addItem({ id: "blue_dye", name: { zh_cn: "蓝色染料", en_us: "Blue Dye" }, category: "misc" });
addItem({ id: "black_dye", name: { zh_cn: "黑色染料", en_us: "Black Dye" }, category: "misc" });
addItem({ id: "green_dye", name: { zh_cn: "绿色染料", en_us: "Green Dye" }, category: "misc" });
addItem({ id: "white_dye", name: { zh_cn: "白色染料", en_us: "White Dye" }, category: "misc" });
addItem({ id: "orange_dye", name: { zh_cn: "橙色染料", en_us: "Orange Dye" }, category: "misc" });
addItem({ id: "pink_dye", name: { zh_cn: "粉红色染料", en_us: "Pink Dye" }, category: "misc" });
addItem({ id: "brown_dye", name: { zh_cn: "棕色染料", en_us: "Brown Dye" }, category: "misc" });
addItem({ id: "bow", name: { zh_cn: "弓", en_us: "Bow" }, stack: 1, category: "combat", damage: 6, uses: 384 });
addItem({ id: "arrow", name: { zh_cn: "箭", en_us: "Arrow" }, category: "combat" });
addItem({ id: "flint_and_steel", name: { zh_cn: "打火石", en_us: "Flint and Steel" }, stack: 1, category: "tools", uses: 64 });
addItem({ id: "bucket", name: { zh_cn: "桶", en_us: "Bucket" }, stack: 16, category: "tools" });
addItem({ id: "water_bucket", name: { zh_cn: "水桶", en_us: "Water Bucket" }, stack: 1, category: "tools" });
addItem({ id: "lava_bucket", name: { zh_cn: "熔岩桶", en_us: "Lava Bucket" }, stack: 1, category: "tools" });
addItem({ id: "fishing_rod", name: { zh_cn: "钓鱼竿", en_us: "Fishing Rod" }, stack: 1, category: "tools", uses: 64 });
addItem({ id: "compass", name: { zh_cn: "指南针", en_us: "Compass" }, stack: 1, category: "tools" });
addItem({ id: "ender_pearl", name: { zh_cn: "末影珍珠", en_us: "Ender Pearl" }, category: "misc" });
addItem({ id: "oak_boat", name: { zh_cn: "橡木船", en_us: "Oak Boat" }, stack: 1, category: "tools" });
addItem({ id: "clock", name: { zh_cn: "时钟", en_us: "Clock" }, stack: 1, category: "tools" });
addItem({ id: "golden_carrot", name: { zh_cn: "金胡萝卜", en_us: "Golden Carrot" }, category: "food", food: 6, sat: 14.4 });
addItem({ id: "cod", name: { zh_cn: "生鳕鱼", en_us: "Raw Cod" }, category: "food", food: 2, sat: 0.4 });
addItem({ id: "salmon", name: { zh_cn: "生鲑鱼", en_us: "Raw Salmon" }, category: "food", food: 2, sat: 0.4 });
addItem({ id: "cooked_cod", name: { zh_cn: "熟鳕鱼", en_us: "Cooked Cod" }, category: "food", food: 5, sat: 6 });
addItem({ id: "cooked_salmon", name: { zh_cn: "熟鲑鱼", en_us: "Cooked Salmon" }, category: "food", food: 6, sat: 9.6 });
addItem({ id: "quartz", name: { zh_cn: "下界石英", en_us: "Nether Quartz" }, category: "misc" });
addItem({ id: "nether_brick", name: { zh_cn: "下界砖", en_us: "Nether Brick" }, category: "misc" });
addItem({ id: "blaze_rod", name: { zh_cn: "烈焰棒", en_us: "Blaze Rod" }, category: "misc" });
addItem({ id: "blaze_powder", name: { zh_cn: "烈焰粉", en_us: "Blaze Powder" }, category: "misc" });
addItem({ id: "ghast_tear", name: { zh_cn: "恶魂之泪", en_us: "Ghast Tear" }, category: "misc" });
addItem({ id: "magma_cream", name: { zh_cn: "岩浆膏", en_us: "Magma Cream" }, category: "misc" });
addItem({ id: "gold_nugget", name: { zh_cn: "金粒", en_us: "Gold Nugget" }, category: "misc" });
addItem({ id: "ender_eye", name: { zh_cn: "末影之眼", en_us: "Eye of Ender" }, category: "misc" });
addItem({ id: "chorus_fruit", name: { zh_cn: "紫颂果", en_us: "Chorus Fruit" }, category: "food", food: 4, sat: 2.4 });
addItem({
  id: "shield",
  name: { zh_cn: "盾牌", en_us: "Shield" },
  stack: 1,
  category: "combat",
  uses: 336,
});
addItem({
  id: "totem_of_undying",
  name: { zh_cn: "不死图腾", en_us: "Totem of Undying" },
  stack: 1,
  category: "combat",
  rare: true,
});

const TIERS = [
  { prefix: "wooden", zh: "木", en: "Wooden", speed: 2, harvest: 1, uses: 59, dmg: 4, mat: "planks" },
  { prefix: "stone", zh: "石", en: "Stone", speed: 4, harvest: 2, uses: 131, dmg: 5, mat: "cobble" },
  { prefix: "iron", zh: "铁", en: "Iron", speed: 6, harvest: 3, uses: 250, dmg: 6, mat: "iron" },
  { prefix: "golden", zh: "金", en: "Golden", speed: 12, harvest: 1, uses: 32, dmg: 4, mat: "gold" },
  { prefix: "diamond", zh: "钻石", en: "Diamond", speed: 8, harvest: 4, uses: 1561, dmg: 7, mat: "diamond" },
];

const TOOLS = [
  { kind: "pickaxe", zh: "镐", en: "Pickaxe", tool: "pickaxe", category: "tools" },
  { kind: "axe", zh: "斧", en: "Axe", tool: "axe", category: "tools" },
  { kind: "shovel", zh: "锹", en: "Shovel", tool: "shovel", category: "tools" },
  { kind: "hoe", zh: "锄", en: "Hoe", tool: "hoe", category: "tools" },
  { kind: "sword", zh: "剑", en: "Sword", tool: "sword", category: "combat" },
];

for (const t of TIERS) {
  for (const k of TOOLS) {
    addItem({
      id: `${t.prefix}_${k.kind}`,
      name: { zh_cn: `${t.zh}${k.zh}`, en_us: `${t.en} ${k.en}` },
      stack: 1,
      category: k.category,
      tool: k.tool,
      harvest: t.harvest,
      speed: t.speed,
      uses: t.uses,
      damage: k.kind === "sword" ? t.dmg : t.dmg - 2,
      isTool: true,
    });
  }
}

addItem({
  id: "leather_helmet",
  name: { zh_cn: "皮革帽子", en_us: "Leather Cap" },
  stack: 1,
  category: "combat",
  armor: 1,
  slot: "head",
});
addItem({
  id: "leather_chestplate",
  name: { zh_cn: "皮革外套", en_us: "Leather Tunic" },
  stack: 1,
  category: "combat",
  armor: 3,
  slot: "chest",
});
addItem({
  id: "leather_leggings",
  name: { zh_cn: "皮革裤子", en_us: "Leather Pants" },
  stack: 1,
  category: "combat",
  armor: 2,
  slot: "legs",
});
addItem({
  id: "leather_boots",
  name: { zh_cn: "皮革靴子", en_us: "Leather Boots" },
  stack: 1,
  category: "combat",
  armor: 1,
  slot: "feet",
});
addItem({
  id: "iron_helmet",
  name: { zh_cn: "铁头盔", en_us: "Iron Helmet" },
  stack: 1,
  category: "combat",
  armor: 2,
  slot: "head",
});
addItem({
  id: "iron_chestplate",
  name: { zh_cn: "铁胸甲", en_us: "Iron Chestplate" },
  stack: 1,
  category: "combat",
  armor: 6,
  slot: "chest",
});
addItem({
  id: "iron_leggings",
  name: { zh_cn: "铁护腿", en_us: "Iron Leggings" },
  stack: 1,
  category: "combat",
  armor: 5,
  slot: "legs",
});
addItem({
  id: "iron_boots",
  name: { zh_cn: "铁靴子", en_us: "Iron Boots" },
  stack: 1,
  category: "combat",
  armor: 2,
  slot: "feet",
});
addItem({
  id: "diamond_helmet",
  name: { zh_cn: "钻石头盔", en_us: "Diamond Helmet" },
  stack: 1,
  category: "combat",
  armor: 3,
  slot: "head",
});
addItem({
  id: "diamond_chestplate",
  name: { zh_cn: "钻石胸甲", en_us: "Diamond Chestplate" },
  stack: 1,
  category: "combat",
  armor: 8,
  slot: "chest",
});
addItem({
  id: "diamond_leggings",
  name: { zh_cn: "钻石护腿", en_us: "Diamond Leggings" },
  stack: 1,
  category: "combat",
  armor: 6,
  slot: "legs",
});
addItem({
  id: "diamond_boots",
  name: { zh_cn: "钻石靴子", en_us: "Diamond Boots" },
  stack: 1,
  category: "combat",
  armor: 3,
  slot: "feet",
});

export const BLOCK_BY_KEY = {};
for (const b of Object.values(BLOCKS)) BLOCK_BY_KEY[b.key] = b;

export function itemName(id, lang) {
  const it = ITEMS[id];
  if (!it) return id;
  return it.name?.[lang] || it.name?.en_us || id;
}

export function blockById(id) {
  return BLOCKS[id] || BLOCKS[0];
}

export const CREATIVE_TABS = [
  { id: "building", icon: "stone" },
  { id: "decoration", icon: "oak_leaves" },
  { id: "redstone", icon: "redstone" },
  { id: "misc", icon: "lava" },
  { id: "food", icon: "apple" },
  { id: "tools", icon: "diamond_pickaxe" },
  { id: "combat", icon: "diamond_sword" },
  { id: "survival", icon: "chest" },
];

export function itemsInTab(tab) {
  return Object.values(ITEMS).filter((it) => {
    if (it.hidden || it.crop != null) return false;
    if (tab === "survival") return false;
    if (tab === "misc") return it.category === "misc" || it.category === "transport";
    return it.category === tab;
  });
}

export const TOOL_SPEED = {
  none: 1,
  any: 1,
  pickaxe: 1,
  axe: 1,
  shovel: 1,
  sword: 1.5,
};
