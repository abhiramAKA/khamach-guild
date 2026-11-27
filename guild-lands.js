/* ==========================================================================
   ОРДЕН КХАМАЧА — ВЛАДЕНИЯ ОРДЕНА: ГЕКСЫ, НАБЕГИ И ОТКАТ УРОВНЯ (v2.7.1)
   ========================================================================== */

const HEX_TOTAL = 19;
const HEX_ROW_COUNTS = '3,4,5,4,3';
const LAND_MAX_ENERGY = 10;
const LAND_ENERGY_REGEN_MS = 900000;

let hexHoldTimer = null;

function stopHexHoldLoop() {
    if (hexHoldTimer) {
        clearInterval(hexHoldTimer);
        hexHoldTimer = null;
    }
}

function getBarbarianRaidIntervalMs(level) {
    const mins = Math.max(6, 30 - (level - 1) * 3);
    return mins * 60000;
}

function getGuildLandsState() {
    const now = Date.now();
    let st = null;
    try { st = JSON.parse(localStorage.getItem('khamach_guild_lands_v1')); } catch (e) {}

    if (!st || !Array.isArray(st.hexes) || st.hexes.length !== HEX_TOTAL) {
        st = {
            level: 1,
            hexes: new Array(HEX_TOTAL).fill(false),
            energy: LAND_MAX_ENERGY,
            lastEnergyTs: now,
            lastRaidTs: now
        };
    }

    if (st.energy < LAND_MAX_ENERGY) {
        const gained = Math.floor((now - st.lastEnergyTs) / LAND_ENERGY_REGEN_MS);
        if (gained > 0) {
            st.energy = Math.min(LAND_MAX_ENERGY, st.energy + gained);
            st.lastEnergyTs += gained * LAND_ENERGY_REGEN_MS;
        }
    } else {
        st.lastEnergyTs = now;
    }

    const raidInterval = getBarbarianRaidIntervalMs(st.level);
    const raids = Math.floor((now - st.lastRaidTs) / raidInterval);
    if (raids > 0) {
        st.lastRaidTs += raids * raidInterval;
        const ownedIndices = st.hexes.map((v, i) => v ? i : -1).filter(i => i !== -1);
        if (ownedIndices.length > 0) {
            const attackCount = Math.min(ownedIndices.length, raids * 2);
            for (let k = 0; k < attackCount; k++) {
                const pickPos = Math.floor(Math.random() * ownedIndices.length);
                const hexIdx = ownedIndices.splice(pickPos, 1).at(0);
                st.hexes[hexIdx] = false;
            }
            if (st.hexes.every(v => !v) && st.level > 1) {
                st.level = 1;
            }
        }
    }

    localStorage.setItem('khamach_guild_lands_v1', JSON.stringify(st));
    return st;
}

function saveGuildLandsState(st) {
    localStorage.setItem('khamach_guild_lands_v1', JSON.stringify(st));
}

function showLandsHelpModal() {
    const st = getGuildLandsState();
    const raidMins = Math.round(getBarbarianRaidIntervalMs(st.level) / 60000);
    const dropPct = Math.min(70, 25 + (st.level - 1) * 5);
    alert(
        "🗺️ ВЛАДЕНИЯ ОРДЕНА КХАМАЧА\n\n" +
        "Ваши земли состоят из 19 гексов. Варвары регулярно совершают набеги и захватывают сектора (красные гексы).\n\n" +
        `• Шанс трофея с гекса сейчас: ${dropPct}% (🔩 Лом, 💎 Самоцветы или снаряжение Питомца/Корабля).\n` +
        `• Набеги варваров (Ур.${st.level}): каждые ${raidMins} мин. Чем выше уровень укреплений, тем чаще нападают варвары.\n` +
        "• Откат уровня: если варвары захватят все 19 клеток обратно, укрепления падают на 1-й уровень!"
    );
}

function renderGuildLandsView() {
    stopHexHoldLoop();
    setSubViewBack('main', 'Назад в Орден');
    const st = getGuildLandsState();
    const ownedCount = st.hexes.filter(Boolean).length;
    const dropPct = Math.min(70, 25 + (st.level - 1) * 5);
    const raidMins = Math.round(getBarbarianRaidIntervalMs(st.level) / 60000);

    document.getElementById('sub-view-title').innerText = "🗺️ ВЛАДЕНИЯ ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = `Укрепление Ур.${st.level} | Очищено: ${ownedCount}/${HEX_TOTAL}`;

    let rowsHTML = '';
    let curIdx = 0;
    HEX_ROW_COUNTS.split(',').map(Number).forEach(count => {
        let cells = '';
        for (let i = 0; i < count; i++) {
            const idx = curIdx++;
            const isOwned = st.hexes[idx];
            const cls = isOwned ? 'hex-owned' : 'hex-enemy';
            const icon = isOwned ? '🛡️' : '⚔️';
            const clickAttr = isOwned ? '' : `onclick="openHexCaptureView(${idx})"`;
            cells += `<div class="hex-cell ${cls}" ${clickAttr}><span>${icon}</span></div>`;
        }
        rowsHTML += `<div class="hex-row">${cells}</div>`;
    });

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="position:relative; text-align:center;">
            <button class="mini-btn" onclick="showLandsHelpModal()" style="position:absolute; top:7px; right:7px; font-size:12px; padding:3px 7px;">❓</button>
            <div style="font-size:12px; color:#ffd700; font-weight:bold;">⚡ Энергия: ${st.energy} / ${LAND_MAX_ENERGY}</div>
            <div style="font-size:10px; color:#cdb38c; margin-top:2px;">Шанс трофея: <strong>${dropPct}%</strong> | Набег варваров: каждые <strong>${raidMins} мин.</strong></div>
        </div>
        <div class="card-box">
            <div class="hex-board">${rowsHTML}</div>
        </div>
    `;
}

function openHexCaptureView(hexIdx) {
    stopHexHoldLoop();
    const st = getGuildLandsState();
    if (st.hexes[hexIdx]) { renderGuildLandsView(); return; }
    if (st.energy <= 0) {
        alert("Недостаточно ⚡ Энергии! Она восстанавливается по 1 ед. каждые 15 минут.");
        return;
    }

    setSubViewBack('lands', '↩️ Назад к карте земель');
    document.getElementById('sub-view-title').innerText = `⚔️ СЕКТОР #${hexIdx + 1}`;
    document.getElementById('sub-view-subtitle').innerText = `Зажмите и удерживайте гекс для захвата (1 ⚡)`;

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="text-align:center; padding:14px 10px;">
            <div id="hex-capture-visual" class="hex-big hex-enemy">⚔️</div>
            <div style="font-size:12px; color:#e6c280; font-weight:bold; margin-bottom:6px;">
                Прогресс зачистки: <span id="hex-pct-label">0%</span>
            </div>
            <div style="width:100%; height:14px; background:#14100e; border:1px solid #544432; border-radius:4px; overflow:hidden; margin-bottom:10px;">
                <div id="hex-progress-bar" style="width:0%; height:100%; background:linear-gradient(to right, #2ecc71, #ffd700);"></div>
            </div>
            <button id="hex-hold-btn" class="menu-btn green-btn">👇 ЗАЖАТЬ И УДЕРЖИВАТЬ</button>
        </div>
    `;

    let progress = 0;
    let holding = false;
    const stepPerTick = Math.max(1.4, 3.2 - (st.level - 1) * 0.25);

    const holdBtn = document.getElementById('hex-hold-btn');
    const bigHex = document.getElementById('hex-capture-visual');
    const barEl = document.getElementById('hex-progress-bar');
    const pctEl = document.getElementById('hex-pct-label');

    const startHold = (e) => { if (e) e.preventDefault(); holding = true; };
    const endHold = () => { holding = false; };

    [holdBtn, bigHex].forEach(el => {
        if (!el) return;
        el.onmousedown = el.ontouchstart = startHold;
        el.onmouseup = el.ontouchend = el.onmouseleave = el.ontouchcancel = endHold;
    });

    hexHoldTimer = setInterval(() => {
        if (holding) {
            progress = Math.min(100, progress + stepPerTick);
        } else if (progress > 0 && progress < 100) {
            progress = Math.max(0, progress - 1.2);
        }

        if (barEl) barEl.style.width = progress.toFixed(0) + '%';
        if (pctEl) pctEl.innerText = progress.toFixed(0) + '%';

        if (progress >= 100) {
            stopHexHoldLoop();
            completeHexCapture(hexIdx);
        }
    }, 40);
}

function completeHexCapture(hexIdx) {
    const st = getGuildLandsState();
    let dropText = '';
    if (!st.hexes[hexIdx] && st.energy > 0) {
        st.hexes[hexIdx] = true;
        st.energy -= 1;
        if (st.energy === LAND_MAX_ENERGY - 1) st.lastEnergyTs = Date.now();
        if (typeof rollHexCaptureDrop === 'function') {
            const loot = rollHexCaptureDrop(st.level);
            if (loot) dropText = `\n🎁 Трофей в секторе: ${loot}`;
        }
    }

    if (st.hexes.every(Boolean)) {
        const rewardScrap = 15 + st.level * 10;
        setScrapMetal(getScrapMetal() + rewardScrap);
        st.level += 1;
        st.hexes = new Array(HEX_TOTAL).fill(false);
        st.lastRaidTs = Date.now();
        saveGuildLandsState(st);
        const nextRaidMins = Math.round(getBarbarianRaidIntervalMs(st.level) / 60000);
        alert(`🎉 ВСЕ ЗЕМЛИ УКРЕПЛЕНЫ!\nУровень владений повышен до Ур.${st.level}!\nНаграда: +${rewardScrap} 🔩 Лома${dropText}\n\nВнимание: варвары теперь нападают каждые ${nextRaidMins} мин., но шанс трофеев в клетках вырос!`);
    } else {
        saveGuildLandsState(st);
        if (dropText) alert(`Сектор #${hexIdx + 1} освобождён!${dropText}`);
    }
    renderGuildLandsView();
}
