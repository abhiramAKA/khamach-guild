/* ==========================================================================
   ОРДЕН КХАМАЧА — ИНТЕРФЕЙС КАРТЫ 37 ГЕКСОВ И 5 ПОСТРОЕК (v2.9.1-BETA)
   ========================================================================== */

function showLandsHelpModal() {
    alert(
        "🗺️ ВЛАДЕНИЯ ОРДЕНА (37 ГЕКСОВ)\n\n" +
        "• Линия фронта: высадку нужно начинать с самого нижнего ряда, а затем захватывать соседние прилегающие сектора (подсвечены золотом).\n" +
        "• Особые сектора: 🏰 Цитадель, 🗼 Башня (замедляет набеги), ⛏️ Шахта (+3 🔩/час), ⚡ Источник (+5 к лимиту и +3 ⚡ сразу при захвате).\n" +
        "• 🏗️ 5 Укреплений: Стены, Ополчение, Разведка, Конденсатор энергии и Ловушки (варвары могут понизить на -1 ур.)."
    );
}

function renderGuildLandsView() {
    stopHexHoldLoop();
    setSubViewBack('main', 'Назад в Орден');
    const st = getGuildLandsState();
    const ownedCount = st.hexes.filter(Boolean).length;
    const maxEn = getMaxLandEnergy(st.hexes);
    const raidMins = Math.round(getBarbarianRaidIntervalMs(st) / 60000);
    const regenMins = Math.round(getEnergyRegenIntervalMs(st) / 60000);

    document.getElementById('sub-view-title').innerText = "🗺️ ВЛАДЕНИЯ ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = `Укрепление Ур.${st.level} | Очищено: ${ownedCount}/${HEX_TOTAL}`;

    const specIcons = { castle: '🏰', tower: '🗼', mine: '⛏️', shrine: '⚡' };
    let rowsHTML = '';
    let curIdx = 0;
    HEX_ROW_COUNTS.split(',').map(Number).forEach(count => {
        let cells = '';
        for (let i = 0; i < count; i++) {
            const idx = curIdx++;
            const isOwned = isHexOwnedAt(st.hexes, idx);
            const canAttack = !isOwned && isHexReachable(st.hexes, idx);
            const isBoss = !isOwned && idx === st.chieftainIdx;

            let cls = 'hex-locked';
            if (isOwned) cls = 'hex-owned';
            else if (isBoss && canAttack) cls = 'hex-boss hex-front';
            else if (isBoss) cls = 'hex-boss';
            else if (canAttack) cls = 'hex-front';

            const sp = getSpecialHexType(idx);
            const icon = isBoss ? '👹' : (sp ? specIcons[sp] : (isOwned ? '🛡️' : '⚔️'));
            const clickAttr = canAttack
                ? `onclick="openHexCaptureView(${idx})"`
                : (!isOwned ? `onclick="alert('Этот сектор в глубоком тылу! Сначала захватите прилегающие гексы от нижнего плацдарма.')"` : '');
            cells += `<div class="hex-cell ${cls}" ${clickAttr}><span>${icon}</span></div>`;
        }
        rowsHTML += `<div class="hex-row">${cells}</div>`;
    });

    const bSum = (st.bld.walls || 0) + (st.bld.militia || 0) + (st.bld.scout || 0) + (st.bld.condenser || 0) + (st.bld.traps || 0);

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="position:relative; text-align:center; padding:6px;">
            <button class="mini-btn" onclick="showLandsHelpModal()" style="position:absolute; top:6px; right:6px; font-size:11px; padding:3px 6px;">❓</button>
            <div style="font-size:12px; color:#ffd700; font-weight:bold;">⚡ Энергия: ${st.energy}/${maxEn} (+1 / ${regenMins}м) | Набег: ${raidMins}м</div>
            <button class="mini-btn green-btn" style="margin-top:5px; width:88%; padding:5px;" onclick="renderLandsBuildingsView()">🏗️ Постройки Ордена (Улучшений: ${bSum}/25)</button>
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
        { key: 'walls',     icon: '🧱', name: 'Крепостные стены',  desc: 'Уменьшают число захватываемых клеток за набег', cur: st.bld.walls || 0 },
        { key: 'militia',   icon: '⚔️', name: 'Ополчение Ордена',  desc: 'Ускоряет заполнение шкалы при захвате сектора', cur: st.bld.militia || 0 },
        { key: 'scout',     icon: '🍀', name: 'Разведка трофеев',  desc: 'Повышает шанс найти Корм, Чертежи, Лом и Камни', cur: st.bld.scout || 0 },
        { key: 'condenser', icon: '⚡', name: 'Конденсатор силы',  desc: 'Ускоряет восстановление ⚡ энергии (-1 мин/ур.)', cur: st.bld.condenser || 0 },
        { key: 'traps',     icon: '🔥', name: 'Алхимические мины', desc: 'Дают +12% за уровень полностью сорвать набег варваров', cur: st.bld.traps || 0 }
    ];

    const cards = list.map(b => {
        const cost = (b.cur + 1) * 15;
        const btn = b.cur >= 5
            ? `<span style="color:#ffd700; font-size:10px;">МАКС (Ур.5)</span>`
            : `<button class="mini-btn ${scrap >= cost ? 'green-btn' : 'disabled-btn'}" onclick="upgradeLandBuilding('${b.key}')">Улучшить (${cost} 🔩)</button>`;
        return `
            <div class="card-box" style="display:flex; justify-content:space-between; align-items:center; gap:6px; padding:6px 8px;">
                <div style="font-size:11px;">
                    <strong style="color:#e6c280;">${b.icon} ${b.name} (Ур.${b.cur}/5)</strong><br>
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
