/* ==========================================================================
   ОРДЕН КХАМАЧА — 6 РЕДКОСТЕЙ, УРОВНИ И ШКАЛА ОПЫТА ПИТОМЦА/КОРАБЛЯ (v2.8.0)
   ========================================================================== */

const EQUIP_SLOTS = {
    pet: [
        { key: 'claw',   name: 'Когти',   icon: '🐾', baseStat: 'atk', subStat: 'reg', baseVal: 3, subVal: 1 },
        { key: 'collar', name: 'Ошейник', icon: '📿', baseStat: 'hp',  subStat: 'reg', baseVal: 3, subVal: 1 },
        { key: 'wings',  name: 'Крылья',  icon: '🪽', baseStat: 'reg', subStat: 'atk', baseVal: 3, subVal: 1 },
        { key: 'amulet', name: 'Амулет',  icon: '🧿', baseStat: 'hp',  subStat: 'atk', baseVal: 3, subVal: 1 },
        { key: 'scales', name: 'Панцирь', icon: '🛡️', baseStat: 'hp',  subStat: 'reg', baseVal: 3, subVal: 1 },
        { key: 'crown',  name: 'Венец',   icon: '👑', baseStat: 'atk', subStat: 'hp',  baseVal: 3, subVal: 1 }
    ],
    ship: [
        { key: 'cannon',  name: 'Орудия',   icon: '🔫', baseStat: 'atk', subStat: 'reg', baseVal: 4, subVal: 1 },
        { key: 'hull',    name: 'Обшивка',  icon: '🛡️', baseStat: 'hp',  subStat: 'reg', baseVal: 4, subVal: 1 },
        { key: 'reactor', name: 'Реактор',  icon: '⚡', baseStat: 'reg', subStat: 'atk', baseVal: 4, subVal: 1 },
        { key: 'engine',  name: 'Двигатель',icon: '🚀', baseStat: 'reg', subStat: 'hp',  baseVal: 4, subVal: 1 },
        { key: 'shield',  name: 'Барьер',   icon: '💠', baseStat: 'hp',  subStat: 'atk', baseVal: 4, subVal: 1 },
        { key: 'core',    name: 'Ядро',     icon: '☄️', baseStat: 'atk', subStat: 'hp',  baseVal: 4, subVal: 1 }
    ]
};

const EQUIP_SETS = {
    flame: { id: 'flame', name: 'Пламени', icon: '🔥', color: '#ff8c8c', skill: 'Ожог' },
    abyss: { id: 'abyss', name: 'Бездны',  icon: '🔮', color: '#e58cff', skill: 'Вампиризм' },
    storm: { id: 'storm', name: 'Бури',    icon: '⚡', color: '#ffe88c', skill: 'Крит' },
    frost: { id: 'frost', name: 'Льда',    icon: '❄️', color: '#8cd1ff', skill: 'Барьер' }
};

const RARITY_TIERS = {
    1: { rank: 1, name: 'Обычный',     tag: '⬜', mult: 1.0, gemBonus: 2,  itemScrap: 5,  gemScrap: 2 },
    2: { rank: 2, name: 'Необычный',   tag: '🟩', mult: 1.3, gemBonus: 4,  itemScrap: 10, gemScrap: 4 },
    3: { rank: 3, name: 'Редкий',      tag: '🟦', mult: 1.6, gemBonus: 6,  itemScrap: 15, gemScrap: 6 },
    4: { rank: 4, name: 'Эпический',   tag: '🟪', mult: 2.0, gemBonus: 8,  itemScrap: 20, gemScrap: 8 },
    5: { rank: 5, name: 'Легендарный', tag: '🟨', mult: 2.5, gemBonus: 10, itemScrap: 25, gemScrap: 10 },
    6: { rank: 6, name: 'Мифический',  tag: '🟥', mult: 3.2, gemBonus: 12, itemScrap: 30, gemScrap: 12 }
};

const GEMS_META = {
    amber: { key: 'amber', name: 'Янтарь ярости',    icon: '🟠', stat: 'atk' },
    pearl: { key: 'pearl', name: 'Лунный жемчуг',   icon: '⚪', stat: 'hp' },
    onyx:  { key: 'onyx',  name: 'Чёрный обсидиан', icon: '⚫', stat: 'reg' }
};

const STAT_LABELS = { atk: '⚔️ Атака', hp: '❤️ Жизнь', reg: '💚 Реген' };
const OWNER_XP_TABLE = { 1: 100, 2: 200, 3: 350, 4: 550, 5: 800, 6: 1100 };

function getOwnerLevelInfo(owner) {
    let data = { lvl: 1, xp: 0 };
    try {
        const raw = JSON.parse(localStorage.getItem(`khamach_${owner}_lvl_xp`));
        if (raw && raw.lvl >= 1) data = raw;
    } catch (e) {}
    const req = data.lvl >= 7 ? 0 : (OWNER_XP_TABLE[data.lvl] || 1100);
    return { lvl: Math.min(7, data.lvl), xp: data.xp, req: req };
}

function addOwnerXp(owner, amount) {
    const info = getOwnerLevelInfo(owner);
    if (info.lvl >= 7) return info;
    info.xp += amount;
    while (info.lvl < 7) {
        const need = OWNER_XP_TABLE[info.lvl] || 1100;
        if (info.xp >= need) {
            info.xp -= need;
            info.lvl += 1;
        } else {
            break;
        }
    }
    if (info.lvl >= 7) info.xp = 0;
    localStorage.setItem(`khamach_${owner}_lvl_xp`, JSON.stringify({ lvl: info.lvl, xp: info.xp }));
    return getOwnerLevelInfo(owner);
}

function getUpgradeTokens(owner) {
    const key = owner === 'pet' ? 'khamach_pet_food_cnt' : 'khamach_ship_bp_cnt';
    return parseInt(localStorage.getItem(key) || '0');
}

function setUpgradeTokens(owner, val) {
    const key = owner === 'pet' ? 'khamach_pet_food_cnt' : 'khamach_ship_bp_cnt';
    localStorage.setItem(key, String(Math.max(0, val)));
}

function rollPetTripRarity() {
    const r = Math.random() * 100;
    if (r < 45) return 1;
    if (r < 75) return 2;
    if (r < 90) return 3;
    if (r < 97) return 4;
    if (r < 99.5) return 5;
    return 6;
}

function getEquipStorage(owner) {
    try { return JSON.parse(localStorage.getItem(`khamach_${owner}_equip`)) || {}; } catch (e) { return {}; }
}

function saveEquipStorage(owner, data) {
    localStorage.setItem(`khamach_${owner}_equip`, JSON.stringify(data));
}

function getBagItems() {
    try { return JSON.parse(localStorage.getItem('khamach_guild_bag')) || []; } catch (e) { return []; }
}

function saveBagItems(arr) {
    localStorage.setItem('khamach_guild_bag', JSON.stringify(arr));
}

function getGemsList() {
    try {
        const raw = JSON.parse(localStorage.getItem('khamach_guild_gems_v4'));
        return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
}

function saveGemsList(arr) {
    localStorage.setItem('khamach_guild_gems_v4', JSON.stringify(arr));
}

function getScrapMetal() { return parseInt(localStorage.getItem('khamach_scrap_metal') || '0'); }
function setScrapMetal(val) { localStorage.setItem('khamach_scrap_metal', String(Math.max(0, val))); }
function getHealPotions() { return parseInt(localStorage.getItem('khamach_heal_potions') || '0'); }
function setHealPotions(val) { localStorage.setItem('khamach_heal_potions', String(Math.max(0, val))); }
function getGemBonusValue(rank) { return (RARITY_TIERS[rank] || RARITY_TIERS).gemBonus; }

function calculateOwnerStats(owner) {
    const base = { atk: 5, hp: 5, reg: 5 };
    const equip = getEquipStorage(owner);
    const setCounts = { flame: 0, abyss: 0, storm: 0, frost: 0 };

    EQUIP_SLOTS[owner].forEach(slotMeta => {
        const item = equip[slotMeta.key];
        if (!item || item.lvl < 1) return;
        const dur = item.durability !== undefined ? item.durability : 100;
        if (dur <= 0) return;

        const rarMult = (RARITY_TIERS[item.rarity || 1] || RARITY_TIERS).mult;
        const lvlMult = (1 + (item.lvl - 1) * 0.4) * rarMult;
        base[slotMeta.baseStat] += Math.round(slotMeta.baseVal * lvlMult);
        base[slotMeta.subStat] += Math.round(slotMeta.subVal * lvlMult);
        if (item.set && setCounts[item.set] !== undefined) setCounts[item.set]++;

        if (Array.isArray(item.gems)) {
            item.gems.forEach(gObj => {
                if (!gObj) return;
                const gm = GEMS_META[gObj.type];
                if (gm) base[gm.stat] += getGemBonusValue(gObj.rank || 1);
            });
        }
        if (item.enchant && item.enchant.stat && item.enchant.rank > 0) {
            const effRank = Math.min(item.lvl, item.enchant.rank);
            base[item.enchant.stat] = Math.round(base[item.enchant.stat] * (1 + effRank * 0.05));
        }
    });
    return { atk: base.atk, hp: base.hp, reg: base.reg, setCounts: setCounts };
}

function getOwnerPowerScore(stats) { return stats.atk + stats.hp + stats.reg; }
