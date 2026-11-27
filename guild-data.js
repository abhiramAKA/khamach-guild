/* ==========================================================================
   ОРДЕН КХАМАЧА — 3 СТАТА (5/5/5), 3 КАМНЯ, 4 СЕТА И ЗЕЛЬЯ (v1.6.0-BETA)
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

const GEM_RARITIES = {
    1: { rank: 1, name: 'Базовый',     tag: '⬜', bonus: 2 },
    2: { rank: 2, name: 'Редкий',      tag: '🟦', bonus: 4 },
    3: { rank: 3, name: 'Эпический',   tag: '🟪', bonus: 6 },
    4: { rank: 4, name: 'Легендарный', tag: '🟨', bonus: 8 }
};

const GEMS_META = {
    ruby:    { key: 'ruby',    name: 'Рубин',   icon: '🔴', stat: 'atk' },
    emerald: { key: 'emerald', name: 'Изумруд', icon: '🟢', stat: 'hp' },
    topaz:   { key: 'topaz',   name: 'Топаз',   icon: '🟡', stat: 'reg' }
};

const STAT_LABELS = {
    atk: '⚔️ Атака',
    hp:  '❤️ Жизнь',
    reg: '💚 Реген'
};

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
        const raw = JSON.parse(localStorage.getItem('khamach_guild_gems_v3'));
        return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
}

function saveGemsList(arr) {
    localStorage.setItem('khamach_guild_gems_v3', JSON.stringify(arr));
}

function getHealPotions() {
    return parseInt(localStorage.getItem('khamach_heal_potions') || '0');
}

function setHealPotions(val) {
    localStorage.setItem('khamach_heal_potions', String(Math.max(0, val)));
}

function getGemBonusValue(type, rank) {
    const rm = GEM_RARITIES[rank] || GEM_RARITIES[1];
    return rm.bonus;
}

function calculateOwnerStats(owner) {
    const base = { atk: 5, hp: 5, reg: 5 };
    const equip = getEquipStorage(owner);
    const setCounts = { flame: 0, abyss: 0, storm: 0, frost: 0 };

    EQUIP_SLOTS[owner].forEach(slotMeta => {
        const item = equip[slotMeta.key];
        if (!item || item.lvl < 1) return;

        const lvlMult = 1 + (item.lvl - 1) * 0.4;
        base[slotMeta.baseStat] += Math.round(slotMeta.baseVal * lvlMult);
        base[slotMeta.subStat] += Math.round(slotMeta.subVal * lvlMult);

        if (item.set && setCounts[item.set] !== undefined) setCounts[item.set]++;

        if (Array.isArray(item.gems)) {
            item.gems.forEach(gObj => {
                const gm = GEMS_META[gObj.type];
                if (gm) base[gm.stat] += getGemBonusValue(gObj.type, gObj.rank || 1);
            });
        }

        if (item.enchant && item.enchant.stat && item.enchant.rank > 0) {
            base[item.enchant.stat] = Math.round(base[item.enchant.stat] * (1 + item.enchant.rank * 0.15));
        }
    });

    return { atk: base.atk, hp: base.hp, reg: base.reg, setCounts: setCounts };
}

function getOwnerPowerScore(stats) {
    return stats.atk + stats.hp + stats.reg;
}
