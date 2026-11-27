/* ==========================================================================
   ОРДЕН КХАМАЧА — ВЛАДЕНИЯ: 37 ГЕКСОВ, НАБЕГИ И ОСОБЫЕ СЕКТОРА (v2.8.2)
   ========================================================================== */

const HEX_TOTAL = 37;
const HEX_ROW_COUNTS = '4,5,6,7,6,5,4';
const SPECIAL_HEXES = { 18: 'castle', 4: 'tower', 14: 'mine', 22: 'shrine' };
const BASE_ENERGY_CAP = 20;
const LAND_ENERGY_REGEN_MS = 600000;

let hexHoldTimer = null;

function stopHexHoldLoop() {
    if (hexHoldTimer) {
        clearInterval(hexHoldTimer);
        hexHoldTimer = null;
    }
}

function getMaxLandEnergy(hexes) {
    const hasShrine = Array.isArray(hexes) && hexes[22] === true;
    return hasShrine ? BASE_ENERGY_CAP + 5 : BASE_ENERGY_CAP;
}

function getBarbarianRaidIntervalMs(st) {
    let mins = Math.max(8, 30 - (st.level - 1) * 2.5);
    if (Array.isArray(st.hexes) && st.hexes[4] === true) {
        mins = Math.round(mins * 1.3);
    }
    return Math.round(mins) * 60000;
}

function getGuildLandsState() {
    const now = Date.now();
    let st = null;
    try { st = JSON.parse(localStorage.getItem('khamach_guild_lands_37')); } catch (e) {}

    if (!st || !Array.isArray(st.hexes) || st.hexes.length !== HEX_TOTAL) {
        st = {
            level: 1,
            hexes: new Array(HEX_TOTAL).fill(false),
            energy: BASE_ENERGY_CAP,
            lastEnergyTs: now,
            lastRaidTs: now,
            lastMineTs: now,
            chieftainIdx: -1,
            bld: { walls: 0, militia: 0, scout: 0 }
        };
    }
    st.bld = st.bld || { walls: 0, militia: 0, scout: 0 };

    const maxEn = getMaxLandEnergy(st.hexes);
    if (st.energy < maxEn) {
        const gained = Math.floor((now - st.lastEnergyTs) / LAND_ENERGY_REGEN_MS);
        if (gained > 0) {
            st.energy = Math.min(maxEn, st.energy + gained);
            st.lastEnergyTs += gained * LAND_ENERGY_REGEN_MS;
        }
    } else {
        st.lastEnergyTs = now;
    }

    const mineHours = Math.floor((now - (st.lastMineTs || now)) / 3600000);
    if (mineHours > 0) {
        st.lastMineTs += mineHours * 3600000;
        if (st.hexes[14] === true) {
            setScrapMetal(getScrapMetal() + mineHours * 3);
        }
    }

    const raidInterval = getBarbarianRaidIntervalMs(st);
    const raids = Math.floor((now - st.lastRaidTs) / raidInterval);
    if (raids > 0) {
        st.lastRaidTs += raids * raidInterval;
        const ownedCount = st.hexes.filter(Boolean).length;
        const candidates = st.hexes.map((v, i) => (v && !(i === 18 && ownedCount > 10)) ? i : -1).filter(i => i !== -1);

        if (candidates.length > 0) {
            const perRaid = Math.max(1, 3 - Math.floor((st.bld.walls || 0) / 2));
            const attackCount = Math.min(candidates.length, raids * perRaid);
            for (let k = 0; k < attackCount; k++) {
                const pos = Math.floor(Math.random() * candidates.length);
                const hIdx = candidates.splice(pos, 1).at(0);
                st.hexes[hIdx] = false;
            }
            if (Math.random() < 0.45) {
                const activeBld = ['walls', 'militia', 'scout'].filter(k => st.bld[k] > 0);
                if (activeBld.length > 0) {
                    const hitKey = activeBld[Math.floor(Math.random() * activeBld.length)];
                    st.bld[hitKey] = Math.max(0, st.bld[hitKey] - 1);
                }
            }
            if (st.hexes.every(v => !v) && st.level > 1) st.level = 1;
        }
    }

    const enemyIndices = st.hexes.map((v, i) => !v ? i : -1).filter(i => i !== -1);
    if (enemyIndices.length >= 5) {
        if (st.chieftainIdx < 0 || st.hexes[st.chieftainIdx]) {
            st.chieftainIdx = enemyIndices[Math.floor(Math.random() * enemyIndices.length)];
        }
    } else {
        st.chieftainIdx = -1;
    }

    localStorage.setItem('khamach_guild_lands_37', JSON.stringify(st));
    return st;
}

function saveGuildLandsState(st) {
    localStorage.setItem('khamach_guild_lands_37', JSON.stringify(st));
}
