/* ==========================================================================
   ОРДЕН КХАМАЧА — ЗАХВАТ СЕКТОРА УДЕРЖАНИЕМ И ТРОФЕИ 63 ГЕКСОВ (v2.9.2)
   ========================================================================== */

function openHexCaptureView(hexIdx) {
    stopHexHoldLoop();
    const st = getGuildLandsState();
    if (!isHexReachable(st.hexes, hexIdx)) { renderGuildLandsView(); return; }
    const isBoss = hexIdx === st.chieftainIdx;
    const reqEnergy = isBoss ? 2 : 1;
    if (st.energy < reqEnergy) {
        alert(`Недостаточно ⚡ Энергии (нужно ${reqEnergy} ⚡)!`);
        return;
    }

    setSubViewBack('lands', '↩️ Назад к карте земель');
    document.getElementById('sub-view-title').innerText = isBoss ? "👹 ВОЖАК ВАРВАРОВ" : `⚔️ СЕКТОР #${hexIdx + 1}`;
    document.getElementById('sub-view-subtitle').innerText = `Зажмите и удерживайте для захвата (${reqEnergy} ⚡)`;

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="text-align:center; padding:14px 10px;">
            <div id="hex-capture-visual" class="hex-big ${isBoss ? 'hex-boss' : 'hex-front'}">${isBoss ? '👹' : '⚔️'}</div>
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

    if (isHexReachable(st.hexes, hexIdx) && st.energy >= reqEnergy) {
        setHexOwnedAt(st.hexes, hexIdx, true);
        st.energy -= reqEnergy;
        if (hexIdx === 10) {
            const maxEn = getMaxLandEnergy(st.hexes);
            st.energy = Math.min(maxEn, st.energy + 3);
            dropText += `\n⚡ Источник силы активирован: +3 ⚡ Энергии!`;
        }
        if (isBoss) st.chieftainIdx = -1;
        if (typeof rollHexCaptureDrop === 'function') {
            const loot = rollHexCaptureDrop(st.level, st.bld.scout || 0, isBoss);
            if (loot) dropText += `\n🎁 Трофей: ${loot}`;
        }
    }

    if (st.hexes.every(Boolean)) {
        const rewardScrap = 30 + st.level * 15;
        setScrapMetal(getScrapMetal() + rewardScrap);
        st.level += 1;
        st.hexes = new Array(HEX_TOTAL).fill(false);
        st.lastRaidTs = Date.now();
        saveGuildLandsState(st);
        alert(`🎉 ВСЕ 63 СЕКТОРА УКРЕПЛЕНЫ!\nУровень владений повышен до Ур.${st.level}!\nНаграда: +${rewardScrap} 🔩 Лома${dropText}`);
    } else {
        saveGuildLandsState(st);
        if (dropText) alert(`${isBoss ? '👹 Вожак повержен!' : `Сектор #${hexIdx + 1} освобождён!`}${dropText}`);
    }
    renderGuildLandsView();
}
