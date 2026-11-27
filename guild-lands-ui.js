/* ==========================================================================
   ОРДЕН КХАМАЧА — ИНТЕРФЕЙС 37 ГЕКСОВ, ПОСТРОЕК И ЗАХВАТА (v2.8.2)
   ========================================================================== */

function showLandsHelpModal() {
    alert(
        "🗺️ ВЛАДЕНИЯ ОРДЕНА (37 ГЕКСОВ)\n\n" +
        "• Особые сектора: 🏰 Цитадель (держится до последнего), 🗼 Башня (замедляет набеги на 30%), ⛏️ Шахта (+3 🔩/час), ⚡ Источник (+5 к макс. энергии).\n" +
        "• 👹 Вожак варваров: появляется, когда захвачено 5+ клеток. Требует 2 ⚡, но гарантирует трофей (чаще всего 🍖 Корм или 📐 Чертёж!).\n" +
        "• 🏗️ Укрепления: Стены, Ополчение и Разведка строятся за 🔩 Лом, но при набегах варвары могут понизить их на 1 уровень."
    );
}

function renderGuildLandsView() {
    stopHexHoldLoop();
    setSubViewBack('main', 'Назад в Орден');
    const st = getGuildLandsState();
    const ownedCount = st.hexes.filter(Boolean).length;
    const maxEn = getMaxLandEnergy(st.hexes);
    const raidMins = Math.round(getBarbarianRaidIntervalMs(st) / 60000);

    document.getElementById('sub-view-title').innerText = "🗺️ ВЛАДЕНИЯ ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = `Укрепление Ур.${st.level} | Очищено: ${ownedCount}/${HEX_TOTAL}`;

    const specIcons = { castle: '🏰', tower: '🗼', mine: '⛏️', shrine: '⚡' };
    let rowsHTML = '';
    let curIdx = 0;
    HEX_ROW_COUNTS.split(',').map(Number).forEach(count => {
        let cells = '';
        for (let i = 0; i < count; i++) {
            const idx = curIdx++;
            const isOwned = st.hexes[idx];
            const isBoss = !isOwned && idx === st.chieftainIdx;
            const cls = isOwned ? 'hex-owned' : (isBoss ? 'hex-boss' : 'hex-enemy');
            const sp = SPECIAL_HEXES[idx];
            const icon = isBoss ? '👹' : (sp ? specIcons[sp] : (isOwned ? '🛡️' : '⚔️'));
            const clickAttr = isOwned ? '' : `onclick="openHexCaptureView(${idx})"`;
            cells += `<div class="hex-cell ${cls}" ${clickAttr}><span>${icon}</span></div>`;
        }
        rowsHTML += `<div class="hex-row">${cells}</div>`;
    });

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="position:relative; text-align:center; padding:6px;">
            <button class="mini-btn" onclick="showLandsHelpModal()" style="position:absolute; top:6px; right:6px; font-size:11px; padding:3px 6px;">❓</button>
            <div style="font-size:12px; color:#ffd700; font-weight:bold;">⚡ Энергия: ${st.energy}/${maxEn} | Набег: каждые ${raidMins} мин.</div>
            <button class="mini-btn green-btn" style="margin-top:5px; width:85%; padding:5px;" onclick="renderLandsBuildingsView()">🏗️ Постройки (🧱${st.bld.walls} | ⚔️${st.bld.militia} | 🍀${st.bld.scout})</button>
        </div>
        <div class="card-box" style="padding:4px;">
            <div class="hex-board">${rowsHTML}</div>
        </div>
    `;
}

function renderLandsBuildingsView() {
    setSubViewBack('lands', '↩️ Назад к карте земель');
    const st = getGuildLandsState();
    const scrap = getScrapMetal();
    document.getElementById('sub-view-title').innerText = "🏗️ УКРЕПЛЕНИЯ ЗЕМЕЛЬ";
    document.getElementById('sub-view-subtitle').innerText = `Металлолом: ${scrap} 🔩 (Варвары могут понизить на -1 ур.)`;

    const list = [
        { key: 'walls',   icon: '🧱', name: 'Крепостные стены', desc: 'Уменьшают число захватываемых клеток за набег' },
        { key: 'militia', icon: '⚔️', name: 'Ополчение Ордена', desc: 'Ускоряет заполнение шкалы при захвате сектора' },
        { key: 'scout',   icon: '🍀', name: 'Разведка трофеев', desc: 'Повышает шанс найти Корм, Чертежи, Лом и Камни' }
    ];

    const cards = list.map(b => {
        const cur = st.bld[b.key] || 0;
        const cost = (cur + 1) * 15;
        const btn = cur >= 5
            ? `<span style="color:#ffd700; font-size:10px;">МАКС (Ур.5)</span>`
            : `<button class="mini-btn ${scrap >= cost ? 'green-btn' : 'disabled-btn'}" onclick="upgradeLandBuilding('${b.key}')">Улучшить (${cost} 🔩)</button>`;
        return `
            <div class="card-box" style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                <div style="font-size:11px;">
                    <strong style="color:#e6c280;">${b.icon} ${b.name} (Ур.${cur}/5)</strong><br>
                    <span style="font-size:10px; color:#cdb38c;">${b.desc}</span>
                </div>
                <div style="flex-shrink:0;">${btn}</div>
            </div>
        `;
    }).join('');

    document.getElementById('sub-view-body').innerHTML = cards;
}

function upgradeLandBuilding(key) {
    const st = getGuildLandsState();
    const cur = st.bld[key] || 0;
    const cost = (cur + 1) * 15;
    const scrap = getScrapMetal();
    if (cur >= 5 || scrap < cost) return;
    setScrapMetal(scrap - cost);
    st.bld[key] = cur + 1;
    saveGuildLandsState(st);
    renderLandsBuildingsView();
}

function openHexCaptureView(hexIdx) {
    stopHexHoldLoop();
    const st = getGuildLandsState();
    if (st.hexes[hexIdx]) { renderGuildLandsView(); return; }
    const isBoss = hexIdx === st.chieftainIdx;
    const reqEnergy = isBoss ? 2 : 1;
    if (st.energy < reqEnergy) {
        alert(`Недостаточно ⚡ Энергии (нужно ${reqEnergy} ⚡)! Восстанавливается по 1 ед. каждые 10 мин.`);
        return;
    }

    setSubViewBack('lands', '↩️ Назад к карте земель');
    document.getElementById('sub-view-title').innerText = isBoss ? "👹 ВОЖАК ВАРВАРОВ" : `⚔️ СЕКТОР #${hexIdx + 1}`;
    document.getElementById('sub-view-subtitle').innerText = `Зажмите и удерживайте для захвата (${reqEnergy} ⚡)`;

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="text-align:center; padding:14px 10px;">
            <div id="hex-capture-visual" class="hex-big ${isBoss ? 'hex-boss' : 'hex-enemy'}">${isBoss ? '👹' : '⚔️'}</div>
            <div style="font-size:12px; color:#e6c280; font-weight:bold; margin-bottom:6px;">Прогресс зачистки: <span id="hex-pct-label">0%</span></div>
            <div style="width:100%; height:14px; background:#14100e; border:1px solid #544432; border-radius:4px; overflow:hidden; margin-bottom:10px;">
                <div id="hex-progress-bar" style="width:0%; height:100%; background:linear-gradient(to right, #2ecc71, #ffd700);"></div>
            </div>
            <button id="hex-hold-btn" class="menu-btn green-btn">👇 ЗАЖАТЬ И УДЕРЖИВАТЬ</button>
        </div>
    `;

    let progress = 0;
    let holding = false;
    const baseSpeed = isBoss ? 1.8 : 2.8;
    const stepPerTick = Math.max(1.2, baseSpeed + (st.bld.militia || 0) * 0.45 - (st.level - 1) * 0.15);

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
        if (holding) progress = Math.min(100, progress + stepPerTick);
        else if (progress > 0 && progress < 100) progress = Math.max(0, progress - 1.1);

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
    const isBoss = hexIdx === st.chieftainIdx;
    const reqEnergy = isBoss ? 2 : 1;
    let dropText = '';

    if (!st.hexes[hexIdx] && st.energy >= reqEnergy) {
        st.hexes[hexIdx] = true;
        st.energy -= reqEnergy;
        if (isBoss) st.chieftainIdx = -1;
        if (typeof rollHexCaptureDrop === 'function') {
            const loot = rollHexCaptureDrop(st.level, st.bld.scout || 0, isBoss);
            if (loot) dropText = `\n🎁 Трофей: ${loot}`;
        }
    }

    if (st.hexes.every(Boolean)) {
        const rewardScrap = 20 + st.level * 12;
        setScrapMetal(getScrapMetal() + rewardScrap);
        st.level += 1;
        st.hexes = new Array(HEX_TOTAL).fill(false);
        st.lastRaidTs = Date.now();
        saveGuildLandsState(st);
        alert(`🎉 ВСЕ 37 СЕКТОРОВ УКРЕПЛЕНЫ!\nУровень владений повышен до Ур.${st.level}!\nНаграда: +${rewardScrap} 🔩 Лома${dropText}`);
    } else {
        saveGuildLandsState(st);
        if (dropText) alert(`${isBoss ? '👹 Вожак повержен!' : `Сектор #${hexIdx + 1} освобождён!`}${dropText}`);
    }
    renderGuildLandsView();
}
