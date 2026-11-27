/* ==========================================================================
   ОРДЕН КХАМАЧА — ИНТЕРФЕЙС ЭКИПИРОВКИ ПИТОМЦА И КОРАБЛЯ (v1.2.1-BETA)
   ========================================================================== */

function renderOwnerEquipView(owner) {
    const isPet = owner === 'pet';
    document.getElementById('sub-view-title').innerText = isPet ? "🐉 ПИТОМЕЦ ОРДЕНА" : "🚀 АСТРАЛЬНЫЙ КОРАБЛЬ";
    document.getElementById('sub-view-subtitle').innerText = isPet ? "6 слотов, Камни и Космический Поход" : "6 модулей, Камни и Полёт на Босса";

    const body = document.getElementById('sub-view-body');
    const stats = calculateOwnerStats(owner);
    const power = getOwnerPowerScore(stats);
    const equip = getEquipStorage(owner);
    const bag = getBagItems().filter(b => b.owner === owner);
    const gems = getGemsStorage();

    let topActionHTML = '';
    if (isPet) {
        const expStart = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        const dropCount = Math.max(1, Math.min(4, Math.floor(power / 45) + 1));
        if (expStart > 0) {
            const elapsed = Date.now() - expStart;
            if (elapsed >= PET_EXPEDITION_MS) {
                topActionHTML = `<button class="menu-btn green-btn" onclick="claimPetSpaceLoot()">🎁 ЗАБРАТЬ ДОБЫЧУ ИЗ КОСМОСА (до ${dropCount} предм.)</button>`;
            } else {
                const rem = PET_EXPEDITION_MS - elapsed;
                const m = Math.floor(rem / 60000).toString().padStart(2, '0');
                const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
                topActionHTML = `<div id="pet-exp-timer" style="text-align:center; color:#ffd700; font-weight:bold; padding:7px; border:1px dashed #8a7350;">⏱️ В походе: ${m}:${s} (В бою с Боссом не помогает)</div>`;
            }
        } else {
            topActionHTML = `<button class="menu-btn green-btn" onclick="startPetSpaceTrip()">🌌 ОТПРАВИТЬ В ПОХОД НА 1 ЧАС (Добыча: до ${dropCount} шт.)</button>`;
        }
    } else {
        const petBusy = isPetOnExpedition();
        const petNote = petBusy
            ? `<div style="font-size:10px; color:#ffb3ba; margin-bottom:5px;">⚠️ Питомец в походе — Корабль летит один!</div>`
            : `<div style="font-size:10px; color:#2ecc71; margin-bottom:5px;">✅ Питомец дома — его статы складываются с Кораблём!</div>`;
        topActionHTML = `${petNote}<button class="menu-btn purple-btn" onclick="launchShipRaidView()">🚀 В ПОЛЁТ НА БОССА (За шмотками Питомца)</button>`;
    }

    let slotsHTML = '';
    EQUIP_SLOTS[owner].forEach(slot => {
        const item = equip[slot.key];
        if (!item || item.lvl < 1) {
            slotsHTML += `<div style="padding:5px 0; border-bottom:1px dashed #3a3025; color:#6a5335;">${slot.icon} ${slot.name}: <em>Пусто</em></div>`;
            return;
        }
        const setMeta = EQUIP_SETS[item.set] || EQUIP_SETS.flame;
        const maxSockets = Math.max(0, item.lvl - 1);
        const usedGems = item.gems || [];
        let socketsStr = maxSockets === 0 ? 'Гнёзд: 0 (нужен 2 ур.)' : 'Гнёзда: ';
        for (let i = 0; i < maxSockets; i++) {
            socketsStr += usedGems[i] ? GEMS_META[usedGems[i]].icon : '⬜';
        }

        const totalGems = gems.ruby + gems.emerald + gems.sapphire + gems.topaz;
        const canSocket = usedGems.length < maxSockets && totalGems > 0;
        const socketBtn = canSocket ? `<button class="mini-btn green-btn" onclick="openGemSocketPicker('${owner}','${slot.key}')">+💎</button>` : '';
        const enchText = item.enchant ? ` | ✨+${item.enchant.rank * 12}%` : '';

        slotsHTML += `
            <div style="padding:5px 0; border-bottom:1px dashed #3a3025; display:flex; justify-content:space-between; align-items:center; gap:4px;">
                <div style="font-size:11px;">
                    <strong style="color:${setMeta.color};">${slot.icon} ${slot.name} [${setMeta.name}] Ур.${item.lvl}</strong>${enchText}<br>
                    <span style="font-size:10px; color:#bfae96;">${socketsStr}</span>
                </div>
                <div>${socketBtn}</div>
            </div>
        `;
    });

    let bagHTML = bag.length === 0
        ? `<div style="font-size:11px; color:#6a5335;">В рюкзаке нет новых предметов.</div>`
        : bag.map((bItem, idx) => {
            const sMeta = EQUIP_SLOTS[owner].find(s => s.key === bItem.slotKey);
            const setMeta = EQUIP_SETS[bItem.set] || EQUIP_SETS.flame;
            const equipped = equip[bItem.slotKey];
            const canMerge = equipped && equipped.set === bItem.set && equipped.lvl < 7;
            const actionBtn = !equipped
                ? `<button class="mini-btn green-btn" onclick="equipFromBag('${owner}', ${idx})">Надеть</button>`
                : (canMerge
                    ? `<button class="mini-btn green-btn" onclick="mergeFromBag('${owner}', ${idx})">+1 Ур.</button>`
                    : `<button class="mini-btn" onclick="equipFromBag('${owner}', ${idx})">Заменить</button>`);

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed #2e251d; font-size:11px;">
                    <span style="color:${setMeta.color};">${sMeta.icon} ${sMeta.name} [${setMeta.name}] Ур.1</span>
                    <div style="display:flex; gap:4px;">
                        ${actionBtn}
                        <button class="mini-btn back-tint" onclick="salvageFromBag('${owner}', ${idx})" title="Разобрать на Прах">✨+5</button>
                    </div>
                </div>
            `;
        }).join('');

    body.innerHTML = `
        <div class="card-box">
            <div style="display:flex; justify-content:space-between; font-weight:bold; color:#ffd700; font-size:12px;">
                <span>Общая Мощь: ⚡ ${power}</span>
                <span>Сет: ${stats.bestSetCount}/6</span>
            </div>
            <div class="stat-grid">
                <div>⚔️ Атака: <strong>${stats.atk}</strong></div>
                <div>❤️ Жизнь: <strong>${stats.hp}</strong></div>
                <div>🛡️ Броня: <strong>${stats.def}</strong></div>
                <div>💚 Реген: <strong>${stats.reg}/3с</strong></div>
            </div>
            ${topActionHTML}
        </div>
        <div class="card-box">
            <div style="font-weight:bold; color:#e6c280; font-size:11px; margin-bottom:4px;">НАДЕТОЕ СНАРЯЖЕНИЕ (Макс. Ур. 7)</div>
            ${slotsHTML}
        </div>
        <div class="card-box">
            <div style="font-weight:bold; color:#e6c280; font-size:11px; margin-bottom:4px;">РЮКЗАК ДОБЫЧИ (${bag.length})</div>
            ${bagHTML}
        </div>
    `;

    if (isPet && isPetOnExpedition() && typeof startPetExpTicker === 'function') {
        startPetExpTicker();
    }
}
