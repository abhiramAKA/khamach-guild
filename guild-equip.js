/* ==========================================================================
   ОРДЕН КХАМАЧА — ИНТЕРФЕЙС 3 СТАТОВ И ОТДЕЛЬНЫЙ БЛОК УМЕНИЙ (v1.6.0-BETA)
   ========================================================================== */

function buildActiveSkillsHTML(setCounts) {
    let items = [];
    if (setCounts.flame > 0) {
        items.push(`<span style="color:#ff8c8c;">🔥 Ожог (${setCounts.flame}): +${(setCounts.flame * 1.5).toFixed(1)} ур/с</span>`);
    }
    if (setCounts.abyss > 0) {
        items.push(`<span style="color:#e58cff;">🔮 Вампиризм (${setCounts.abyss}): +${(setCounts.abyss * 0.5).toFixed(1)} ❤️ / 4 удар</span>`);
    }
    if (setCounts.storm > 0) {
        const mult = (1.5 + setCounts.storm * 0.15).toFixed(2);
        items.push(`<span style="color:#ffe88c;">⚡ Крит (${setCounts.storm}): +${setCounts.storm * 3}% заряд (×${mult})</span>`);
    }
    if (setCounts.frost > 0) {
        const cd = Math.max(5, 17 - setCounts.frost);
        items.push(`<span style="color:#8cd1ff;">❄️ Барьер (${setCounts.frost}): блок каждые ${cd}с</span>`);
    }
    return items.length > 0
        ? items.join('<br>')
        : '<span style="color:#6a5335;">Наденьте вещи стихий, чтобы открыть умения.</span>';
}

function renderOwnerEquipView(owner) {
    const isPet = owner === 'pet';
    document.getElementById('sub-view-title').innerText = isPet ? "🐉 ПИТОМЕЦ ОРДЕНА" : "🚀 АСТРАЛЬНЫЙ КОРАБЛЬ";
    document.getElementById('sub-view-subtitle').innerText = isPet ? "6 слотов, Камни и Космический Поход" : "6 модулей, Зелья и Полёт на Босса";

    const body = document.getElementById('sub-view-body');
    const stats = calculateOwnerStats(owner);
    const power = getOwnerPowerScore(stats);
    const equip = getEquipStorage(owner);
    const bag = getBagItems().filter(b => b.owner === owner);
    const gems = getGemsList();
    const potions = getHealPotions();

    let topActionHTML = '';
    if (isPet) {
        const expStart = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        const dropCount = Math.max(1, Math.min(4, Math.floor(power / 35) + 1));
        if (expStart > 0) {
            const elapsed = Date.now() - expStart;
            if (elapsed >= PET_EXPEDITION_MS) {
                topActionHTML = `<button class="menu-btn green-btn" onclick="claimPetSpaceLoot()">🎁 ЗАБРАТЬ ДОБЫЧУ ИЗ КОСМОСА (до ${dropCount} предм. + 🧪)</button>`;
            } else {
                const rem = PET_EXPEDITION_MS - elapsed;
                const m = Math.floor(rem / 60000).toString().padStart(2, '0');
                const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
                topActionHTML = `<div id="pet-exp-timer" style="text-align:center; color:#ffd700; font-weight:bold; padding:7px; border:1px dashed #8a7350;">⏱️ В походе: ${m}:${s} (В бою с Боссом не помогает)</div>`;
            }
        } else {
            topActionHTML = `<button class="menu-btn green-btn" onclick="startPetSpaceTrip()">🌌 ОТПРАВИТЬ В ПОХОД НА 1 ЧАС (до ${dropCount} шт. + 🧪)</button>`;
        }
    } else {
        const petBusy = isPetOnExpedition();
        const petNote = petBusy
            ? `<div style="font-size:10px; color:#ffb3ba; margin-bottom:5px;">⚠️ Питомец в походе — Корабль летит один! | 🧪 Зелий: ${potions}</div>`
            : `<div style="font-size:10px; color:#2ecc71; margin-bottom:5px;">✅ Питомец дома (статы складываются) | 🧪 Зелий: ${potions}</div>`;
        topActionHTML = `${petNote}<button class="menu-btn purple-btn" onclick="window.launchShipRaidView()">🚀 В ПОЛЁТ НА БОССА (За шмотками Питомца)</button>`;
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
            if (usedGems[i]) {
                const rTag = (GEM_RARITIES[usedGems[i].rank] || GEM_RARITIES[1]).tag;
                socketsStr += `${GEMS_META[usedGems[i].type].icon}${rTag} `;
            } else {
                socketsStr += '⬜ ';
            }
        }

        const canSocket = usedGems.length < maxSockets && gems.length > 0;
        const socketBtn = canSocket ? `<button class="mini-btn green-btn" onclick="openGemSocketPicker('${owner}','${slot.key}')">+💎</button>` : '';
        const enchText = item.enchant ? ` | ✨+${item.enchant.rank * 15}%` : '';

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

    const gemsSummary = gems.length === 0
        ? 'Нет свободных камней'
        : gems.slice(0, 6).map(g => `${GEMS_META[g.type].icon}${GEM_RARITIES[g.rank].tag}+${getGemBonusValue(g.type, g.rank)}`).join(' ');

    body.innerHTML = `
        <div class="card-box">
            <div style="display:flex; justify-content:space-between; font-weight:bold; color:#ffd700; font-size:12px;">
                <span>Общая Мощь: ⚡ ${power}</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:4px; background:rgba(0,0,0,0.5); padding:6px; border-radius:3px; font-size:11px; margin:5px 0; text-align:center;">
                <div>⚔️ Атака<br><strong>${stats.atk}</strong></div>
                <div>❤️ Жизнь<br><strong>${stats.hp}</strong></div>
                <div>💚 Реген<br><strong>${stats.reg}</strong></div>
            </div>
            <div style="background:rgba(15,12,20,0.7); border:1px dashed #4a3f2c; padding:5px 7px; border-radius:3px; font-size:10px; margin-bottom:6px; line-height:1.4;">
                <strong style="color:#e6c280;">⚡ Умения от экипировки:</strong><br>
                ${buildActiveSkillsHTML(stats.setCounts)}
            </div>
            ${topActionHTML}
        </div>
        <div class="card-box">
            <div style="font-weight:bold; color:#e6c280; font-size:11px; margin-bottom:2px;">НАДЕТОЕ СНАРЯЖЕНИЕ (Макс. Ур. 7)</div>
            <div style="font-size:10px; color:#8cd1ff; margin-bottom:4px;">Камни в сумке (${gems.length}): ${gemsSummary}</div>
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
