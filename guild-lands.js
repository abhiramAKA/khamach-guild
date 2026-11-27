/* ==========================================================================
   ОРДЕН КХАМАЧА — ВЛАДЕНИЯ: ВЫТЯНУТАЯ КАРТА 63 ГЕКСА (11 РЯДОВ) (v2.9.2)
   ========================================================================== */

const HEX_TOTAL = 63;
const HEX_ROW_COUNTS = '4,5,6,7,6,7,6,7,6,5,4';
const BASE_ENERGY_CAP = 25;

let hexHoldTimer = null;

function stopHexHoldLoop() {
    if (hexHoldTimer) { clearInterval(hexHoldTimer); hexHoldTimer = null; }
}

function getSpecialHexType(idx) {
    if (idx === 31) return 'castle';               // Центр карты — Цитадель
    if (idx === 15 || idx === 47) return 'tower';  // 2 Сторожевые башни
    if (idx === 22 || idx === 40) return 'mine';   // 2 Рудные жилы
    if (idx === 10) return 'shrine';               // Источник силы
    return '';
}

function isHexOwnedAt(hexes, idx) {
    return Array.isArray(hexes) && hexes.at(idx) === true;
}

function setHexOwnedAt(hexes, idx, val) {
    if (Array.isArray(hexes) && idx >= 0 && idx < hexes.length) {
        hexes.splice(idx, 1, Boolean(val));
    }
}

function getHexCoordsList() {
    const counts = HEX_ROW_COUNTS.split(',').map(Number);
    const list = [];
    counts.forEach((cnt, r) => {
        const startX = -(cnt - 1);
        for (let i = 0; i < cnt; i++) {
            list.push({ r: r, x: startX + i * 2 });
        }
    });
    return list;
}

function areHexesAdjacent(idxA, idxB) {
    if (idxA === idxB) return false;
    const coords = getHexCoordsList();
    const a = coords.at(idxA);
    const b = coords.at(idxB);
    if (!a || !b) return false;
    const dr = Math.abs(a.r - b.r);
    const dx = Math.abs(a.x - b.x);
    return (dr === 0 && dx === 2) || (dr === 1 && dx === 1);
}

// Старт с самого нижнего ряда (индексы 59..62) или от любой соседней захваченной клетки
function isHexReachable(hexes, idx) {
    if (isHexOwnedAt(hexes, idx)) return false;
    if (idx >= 59 && idx <= 62) return true;
    for (let i = 0; i < HEX_TOTAL; i++) {
        if (isHexOwnedAt(hexes, i) && areHexesAdjacent(i, idx)) return true;
    }
    return false;
}

function getMaxLandEnergy(hexes) {
    return isHexOwnedAt(hexes, 10) ? BASE_ENERGY_CAP + 5 : BASE_ENERGY_CAP;
}

function getEnergyRegenIntervalMs(st) {
    const condLvl = (st && st.bld && st.bld.condenser) ? st.bld.condenser : 0;
    const mins = Math.max(5, 10 - condLvl);
    return mins * 60000;
}

function getBarbarianRaidIntervalMs(st) {
    let mins = Math.max(8, 30 - (st.level - 1) * 2.5);
    const towers = (isHexOwnedAt(st.hexes, 15) ? 1 : 0) + (isHexOwnedAt(st.hexes, 47) ? 1 : 0);
    if (towers > 0) mins = Math.round(mins * (1 + towers * 0.2));
    return Math.round(mins) * 60000;
}

function getGuildLandsState() {
    const now = Date.now();
    let st = null;
    try { st = JSON.parse(localStorage.getItem('khamach_guild_lands_63')); } catch (e) {}

    if (!st || !Array.isArray(st.hexes) || st.hexes.length !== HEX_TOTAL) {
        st = {
            level: 1,
            hexes: new Array(HEX_TOTAL).fill(false),
            energy: BASE_ENERGY_CAP,
            lastEnergyTs: now,
            lastRaidTs: now,
            lastMineTs: now,
            chieftainIdx: -1,
            bld: { walls: 0, militia: 0, scout: 0, condenser: 0, traps: 0 }
        };
    }
    st.bld = Object.assign({ walls: 0, militia: 0, scout: 0, condenser: 0, traps: 0 }, st.bld || {});

    const maxEn = getMaxLandEnergy(st.hexes);
    const regenMs = getEnergyRegenIntervalMs(st);
    if (st.energy < maxEn) {
        const gained = Math.floor((now - st.lastEnergyTs) / regenMs);
        if (gained > 0) {
            st.energy = Math.min(maxEn, st.energy + gained);
            st.lastEnergyTs += gained * regenMs;
        }
    } else {
        st.lastEnergyTs = now;
    }

    const mineHours = Math.floor((now - (st.lastMineTs || now)) / 3600000);
    if (mineHours > 0) {
        st.lastMineTs += mineHours * 3600000;
        const activeMines = (isHexOwnedAt(st.hexes, 22) ? 1 : 0) + (isHexOwnedAt(st.hexes, 40) ? 1 : 0);
        if (activeMines > 0) setScrapMetal(getScrapMetal() + mineHours * 3 * activeMines);
    }

    const raidInterval = getBarbarianRaidIntervalMs(st);
    const raids = Math.floor((now - st.lastRaidTs) / raidInterval);
    if (raids > 0) {
        st.lastRaidTs += raids * raidInterval;
        const trapChance = (st.bld.traps || 0) * 0.12;
        for (let rIdx = 0; rIdx < raids; rIdx++) {
            if (Math.random() < trapChance) continue;
            const ownedCount = st.hexes.filter(Boolean).length;
            const candidates = st.hexes.map((v, i) => (v && !(i === 31 && ownedCount > 15)) ? i : -1).filter(i => i !== -1);
            if (candidates.length === 0) break;

            const perRaid = Math.max(1, 3 - Math.floor((st.bld.walls || 0) / 2));
            const attackCount = Math.min(candidates.length, perRaid);
            for (let k = 0; k < attackCount; k++) {
                const pos = Math.floor(Math.random() * candidates.length);
                const hIdx = candidates.splice(pos, 1).at(0);
                setHexOwnedAt(st.hexes, hIdx, false);
            }
            if (Math.random() < 0.4) {
                const keys = ['walls', 'militia', 'scout', 'condenser', 'traps'].filter(k => (st.bld.walls || 0) > 0 || (st.bld.militia || 0) > 0 || (st.bld.scout || 0) > 0 || (st.bld.condenser || 0) > 0 || (st.bld.traps || 0) > 0);
                if (keys.length > 0) {
                    const hitKey = keys.at(Math.floor(Math.random() * keys.length));
                    if (st.bld[hitKey] > 0) st.bld[hitKey] -= 1;
                }
            }
        }
        if (st.hexes.every(v => !v) && st.level > 1) st.level = 1;
    }

    const enemyIndices = st.hexes.map((v, i) => !v ? i : -1).filter(i => i !== -1);
    if (enemyIndices.length >= 5) {
        if (st.chieftainIdx < 0 || isHexOwnedAt(st.hexes, st.chieftainIdx)) {
            st.chieftainIdx = enemyIndices.at(Math.floor(Math.random() * enemyIndices.length));
        }
    } else {
        st.chieftainIdx = -1;
    }

    localStorage.setItem('khamach_guild_lands_63', JSON.stringify(st));
    return st;
}

function saveGuildLandsState(st) {
    localStorage.setItem('khamach_guild_lands_63', JSON.stringify(st));
}
