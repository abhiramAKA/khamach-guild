/* ==========================================================================
   ОРДЕН КХАМАЧА — ДАННЫЕ ЭКИПИРОВКИ, СЕТОВ, КАМНЕЙ И РАСЧЁТ СТАТОВ (v1.2.0)
   ========================================================================== */

const EQUIP_SLOTS = {
    pet: [
        { key: 'claw',   name: 'Когти',   icon: '🐾', baseStat: 'atk', baseVal: 8,  subStat: 'reg', subVal: 1 },
        { key: 'collar', name: 'Ошейник', icon: '📿', baseStat: 'def', baseVal: 4,  subStat: 'hp',  subVal: 20 },
        { key: 'wings',  name: 'Крылья',  icon: '🪽', baseStat: 'reg', baseVal: 2,  subStat: 'atk', subVal: 5 },
        { key: 'amulet', name: 'Амулет',  icon: '🧿', baseStat: 'hp',  baseVal: 25, subStat: 'reg', subVal: 1 },
        { key: 'scales', name: 'Панцирь', icon: '🛡️', baseStat: 'def', baseVal: 5,  subStat: 'hp',  subVal: 25 },
        { key: 'crown',  name: 'Венец',   icon: '👑', baseStat: 'atk', baseVal: 10, subStat: 'def', subVal: 3 }
    ],
    ship: [
        { key: 'cannon',  name: 'Орудия',   icon: '🔫', baseStat: 'atk', baseVal: 12, subStat: 'def', subVal: 2 },
        { key: 'hull',    name: 'Обшивка',  icon: '🛡️', baseStat: 'hp',  baseVal: 40, subStat: 'def', subVal: 4 },
        { key: 'reactor', name: 'Реактор',  icon: '⚡', baseStat: 'reg', baseVal: 2,  subStat: 'atk', subVal: 6 },
        { key: 'engine',  name: 'Двигатель',icon: '🚀', baseStat: 'def', baseVal: 4,  subStat: 'reg', subVal: 1 },
        { key: 'shield',  name: 'Барьер',   icon: '💠', baseStat: 'hp',  baseVal: 35, subStat: 'reg', subVal: 2 },
        { key: 'core',    name: 'Ядро',     icon: '☄️', baseStat: 'atk', baseVal: 10, subStat: 'hp',  subVal: 30 }
    ]
};

const EQUIP_SETS = {
    flame: { id: 'flame', name: 'Пламени', icon: '🔥', color: '#ff8c8c' },
    abyss: { id: 'abyss', name: 'Бездны',  icon: '🔮', color: '#e58cff' },
    storm: { id: 'storm', name: 'Бури',    icon: '⚡', color: '#ffe88c' }
};

const GEMS_META = {
    ruby:     { key: 'ruby',     name: 'Рубин',    icon: '🔴', stat: 'atk', val: 6,  label: '+6 ⚔️' },
    emerald:  { key: 'emerald',  name: 'Изумруд',  icon: '🟢', stat: 'hp',  val: 25, label: '+25 ❤️' },
    sapphire: { key: 'sapphire', name: 'Сапфир',   icon: '🔵', stat: 'def', val: 3,  label: '+3 🛡️' },
    topaz:    { key: 'topaz',    name: 'Топаз',    icon: '🟡', stat: 'reg', val: 2,  label: '+2 💚' }
};

const STAT_LABELS = {
    atk: '⚔️ Атака',
    hp:  '❤️ Жизнь',
    def: '🛡️ Броня',
    reg: '💚 Реген'
};

function getEquipStorage(owner) {
    try {
        return JSON.parse(localStorage.getItem(`khamach_${owner}_equip`)) || {};
    } catch (e) {
        return {};
    }
}

function saveEquipStorage(owner, data) {
    localStorage.setItem(`khamach_${owner}_equip`, JSON.stringify(data));
}

function getBagItems() {
    try {
        return JSON.parse(localStorage.getItem('khamach_guild_bag')) || [];
    } catch (e) {
        return [];
    }
}

function saveBagItems(arr) {
    localStorage.setItem('khamach_guild_bag', JSON.stringify(arr));
}

function getGemsStorage() {
    try {
        return JSON.parse(localStorage.getItem('khamach_guild_gems')) || { ruby: 0, emerald: 0, sapphire: 0, topaz: 0 };
    } catch (e) {
        return { ruby: 0, emerald: 0, sapphire: 0, topaz: 0 };
    }
}

function saveGemsStorage(g) {
    localStorage.setItem('khamach_guild_gems', JSON.stringify(g));
}

function calculateOwnerStats(owner) {
    const base = owner === 'ship'
        ? { atk: 15, hp: 100, def: 2, reg: 1 }
        : { atk: 8,  hp: 40,  def: 1, reg: 1 };

    const equip = getEquipStorage(owner);
    const setCounts = { flame: 0, abyss: 0, storm: 0 };

    EQUIP_SLOTS[owner].forEach(slotMeta => {
        const item = equip[slotMeta.key];
        if (!item || item.lvl < 1) return;

        const lvlMult = 1 + (item.lvl - 1) * 0.35;
        base[slotMeta.baseStat] += Math.round(slotMeta.baseVal * lvlMult);
        base[slotMeta.subStat] += Math.round(slotMeta.subVal * lvlMult);

        if (item.set && setCounts[item.set] !== undefined) setCounts[item.set]++;

        // Камни в гнёздах
        if (Array.isArray(item.gems)) {
            item.gems.forEach(gKey => {
                const gm = GEMS_META[gKey];
                if (gm) base[gm.stat] += gm.val;
            });
        }

        // Чары Шамана (+15% к выбранному стату за ранг чар)
        if (item.enchant && item.enchant.stat && item.enchant.rank > 0) {
            base[item.enchant.stat] = Math.round(base[item.enchant.stat] * (1 + item.enchant.rank * 0.12));
        }
    });

    // Бонус сетов (2 / 4 / 6 одинаковых вещей дают +10% / +25% / +50% ко всем статам)
    let bestSetCount = 0;
    Object.values(setCounts).forEach(cnt => { if (cnt > bestSetCount) bestSetCount = cnt; });
    const setMult = bestSetCount >= 6 ? 1.50 : (bestSetCount >= 4 ? 1.25 : (bestSetCount >= 2 ? 1.10 : 1.0));

    return {
        atk: Math.round(base.atk * setMult),
        hp:  Math.round(base.hp * setMult),
        def: Math.round(base.def * setMult),
        reg: Math.round(base.reg * setMult),
        bestSetCount: bestSetCount
    };
}

function getOwnerPowerScore(stats) {
    return Math.round(stats.atk + stats.hp / 5 + stats.def * 2 + stats.reg * 3);
}
