/* ==========================================================================
   ОРДЕН КХАМАЧА — КОМПАКТНЫЙ СПИСОК ВЕЩЕЙ И КАРТОЧКА ПРЕДМЕТА (v2.4.0)
   ========================================================================== */

function buildActiveSkillsHTML(setCounts) {
    let items = [];
    if (setCounts.flame > 0) items.push(`<span style="color:#ff8c8c;">🔥 Ожог (${setCounts.flame}): +${(setCounts.flame * 1.5).toFixed(1)} ур/с</span>`);
    if (setCounts.abyss > 0) items.push(`<span style="color:#e58cff;">🔮 Вампиризм (${setCounts.abyss}): +${(setCounts.abyss * 0.5).toFixed(1)} ❤️ / 4 удар</span>`);
    if (setCounts.storm > 0) {
        const mult = (1.5 + setCounts.storm * 0.15).toFixed(2);
        items.push(`<span style="color:#ffe88c;">⚡ Крит (${setCounts.storm}): +${setCounts.storm * 3}% заряд (×${mult})</span>`);
    }
    if (setCounts.frost > 0) {
        const cd = Math.max(5, 17 - setCounts.frost);
        items.push(`<span style="color:#8cd1ff;">❄️ Барьер (${setCounts.frost}): блок каждые ${cd}с</span>`);
    }
    return items.length > 0 ? items.join('<br>') : '<span style="color:#6a5335;">Наденьте целые вещи стихий, чтобы открыть умения.</span>';
}

function buildOwnerSlotsHTML(owner, equip) {
    let slotsHTML = '';
    EQUIP_SLOTS[owner].forEach(slot => {
        const item = equip[slot.key];
        if (!item || item.lvl < 1) {
            slotsHTML += `<div style="padding:7px 4px; border-bottom:1px dashed #3a3025; color:#6a5335; font-size:12px;">${slot.icon} ${slot.name} — <em>Пусто</em></div>`;
            return;
        }
        const setMeta = EQUIP_SETS[item.set] || EQUIP_SETS.flame;
        const rarMeta = ITEM_RARITIES[item.rarity || 1] || ITEM_RARITIES;
        const dur = item.durability !== undefined ? item.durability : 100;
        const statusMark = dur <= 0 ? ' ❌' : (dur < 40 ? ' ⚠️' : '');

        slotsHTML += `
            <div onclick="renderItemDetailView('${owner}','${slot.key}')" style="padding:8px 6px; border-bottom:1px dashed #3a3025; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                <span style="color:${setMeta.color}; font-weight:bold; font-size:12px;">${rarMeta.tag} ${slot.icon} ${slot.name} [${setMeta.name}] Ур.${item.lvl}${statusMark}</span>
                <span style="color:#8a7350; font-size:11px;">Подробнее ❯</span>
            </div>
        `;
    });
    return slotsHTML;
}

function renderItemDetailView(owner, slotKey) {
    const isPet = owner === 'pet';
    setSubViewBack(isPet ? 'pet_cfg' : 'ship_cfg', '↩️ Назад к списку вещей');

    const slotMeta = EQUIP_SLOTS[owner].find(s => s.key === slotKey);
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item || !slotMeta) return;

    const setMeta = EQUIP_SETS[item.set] || EQUIP_SETS.flame;
    const rarMeta = ITEM_RARITIES[item.rarity || 1] || ITEM_RARITIES;
    const dur = item.durability !== undefined ? item.durability : 100;
    const isBroken = dur <= 0;

    const lvlMult = (1 + (item.lvl - 1) * 0.4) * rarMeta.mult;
    const bVal = Math.round(slotMeta.baseVal * lvlMult);
    const sVal = Math.round(slotMeta.subVal * lvlMult);

    const maxSockets = Math.max(0, item.lvl - 1);
    const usedGems = item.gems || [];
    let socketsHTML = maxSockets === 0 ? 'Гнёзда откроются со 2-го уровня вещи.' : '';
    for (let i = 0; i < maxSockets; i++) {
        if (usedGems[i]) {
            const gm = GEMS_META[usedGems[i].type];
            const rm = GEM_RARITIES[usedGems[i].rank] || GEM_RARITIES;
            socketsHTML += `<div>${gm.icon} ${rm.name} ${gm.name} (+${rm.bonus} ${STAT_LABELS[gm.stat]})</div>`;
        } else {
            socketsHTML += `<div style="color:#6a5335;">⬜ Пустое гнездо</div>`;
        }
    }

    const scrap = getScrapMetal();
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    const gems = getGemsList();

    const repairCost = Math.max(2, Math.ceil((100 - dur) / 10) * 2);
    const enchRank = item.enchant ? item.enchant.rank : 0;
    const enchCost = (enchRank + 1) * 10;
    const enchLabel = item.enchant ? `${STAT_LABELS[item.enchant.stat]} (+${enchRank * 15}%)` : 'Нет чар';

    document.getElementById('sub-view-title').innerText = `${slotMeta.icon} ${slotMeta.name}`;
    document.getElementById('sub-view-subtitle').innerText = `${rarMeta.name} вещь | Стихия: ${setMeta.name}`;

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="font-size:12px; line-height:1.5;">
            <div style="color:${setMeta.color}; font-weight:bold; font-size:13px; margin-bottom:4px;">${rarMeta.tag} ${slotMeta.name} [${setMeta.name}] — Ур. ${item.lvl}/7</div>
            <div>• ${STAT_LABELS[slotMeta.baseStat]}: <strong>+${bVal}</strong></div>
            <div>• ${STAT_LABELS[slotMeta.subStat]}: <strong>+${sVal}</strong></div>
            <div>• Стихия: <strong>${setMeta.icon} ${setMeta.skill}</strong> (+1 ранг умения)</div>
            <div>• Прочность: <strong style="color:${isBroken ? '#ff4500' : '#2ecc71'};">${dur}/100</strong> ${isBroken ? '(Сломано — бонусов нет!)' : ''}</div>
            <div>• Чары Шамана: <strong style="color:#e58cff;">${enchLabel}</strong></div>
        </div>
        <div class="card-box" style="font-size:11px;">
            <strong style="color:#e6c280;">💎 Самоцветы в вещах (${usedGems.length}/${maxSockets}):</strong>
            <div style="margin-top:4px;">${socketsHTML}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
            ${dur < 100 ? `<button class="menu-btn ${scrap >= repairCost ? 'green-btn' : 'disabled-btn'}" onclick="repairEquipSlot('${owner}','${slotKey}')">🔧 Починить до 100% (Нужно ${repairCost} 🔩 Лома)</button>` : ''}
            ${(!isBroken && usedGems.length < maxSockets && gems.length > 0) ? `<button class="menu-btn green-btn" onclick="openGemSocketPicker('${owner}','${slotKey}')">💎 Вставить лучший камень из сумки</button>` : ''}
            ${(!isBroken && enchRank < 5) ? `<button class="menu-btn ${dust >= enchCost ? 'purple-btn' : 'disabled-btn'}" onclick="enchantEquipItem('${owner}','${slotKey}')">✨ Наложить чары Шамана (${enchCost} ✨ Праха)</button>` : ''}
        </div>
    `;
}
