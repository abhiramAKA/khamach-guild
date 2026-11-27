/* ==========================================================================
   ОРДЕН КХАМАЧА — РЕНДЕР СЛОТОВ ЭКИПИРОВКИ И РЕМОНТА (v1.9.1-BETA)
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

function buildOwnerSlotsHTML(owner, equip, gems, scrap) {
    let slotsHTML = '';
    EQUIP_SLOTS[owner].forEach(slot => {
        const item = equip[slot.key];
        if (!item || item.lvl < 1) {
            slotsHTML += `<div style="padding:5px 0; border-bottom:1px dashed #3a3025; color:#6a5335;">${slot.icon} ${slot.name}: <em>Пусто</em></div>`;
            return;
        }
        const setMeta = EQUIP_SETS[item.set] || EQUIP_SETS.flame;
        const rarMeta = ITEM_RARITIES[item.rarity || 1] || ITEM_RARITIES;
        const dur = item.durability !== undefined ? item.durability : 100;
        const isBroken = dur <= 0;
        const durColor = isBroken ? '#ff4500' : (dur < 40 ? '#f1c40f' : '#2ecc71');
        const durLabel = isBroken ? `❌ СЛОМАНО (0/100)` : `🛡️ ${dur}/100`;

        const maxSockets = Math.max(0, item.lvl - 1);
        const usedGems = item.gems || [];
        let socketsStr = maxSockets === 0 ? 'Гнёзд: 0' : 'Гнёзда: ';
        for (let i = 0; i < maxSockets; i++) {
            socketsStr += usedGems[i] ? `${GEMS_META[usedGems[i].type].icon}${(GEM_RARITIES[usedGems[i].rank] || GEM_RARITIES).tag} ` : '⬜ ';
        }

        const repairCost = Math.max(2, Math.ceil((100 - dur) / 10) * 2);
        const repairBtn = dur < 100
            ? `<button class="mini-btn ${scrap >= repairCost ? 'green-btn' : 'disabled-btn'}" onclick="repairEquipSlot('${owner}','${slot.key}')">🔧${repairCost}🔩</button>`
            : '';
        const socketBtn = (!isBroken && usedGems.length < maxSockets && gems.length > 0)
            ? `<button class="mini-btn green-btn" onclick="openGemSocketPicker('${owner}','${slot.key}')">+💎</button>`
            : '';
        const enchText = item.enchant ? ` | ✨+${item.enchant.rank * 15}%` : '';

        slotsHTML += `
            <div style="padding:5px 0; border-bottom:1px dashed #3a3025; display:flex; justify-content:space-between; align-items:center; gap:4px; ${isBroken ? 'opacity:0.75;' : ''}">
                <div style="font-size:11px;">
                    <strong style="color:${setMeta.color};">${rarMeta.tag} ${slot.icon} ${slot.name} [${setMeta.name}] Ур.${item.lvl}</strong>${enchText}<br>
                    <span style="font-size:10px; color:${durColor};">${durLabel}</span> | <span style="font-size:10px; color:#bfae96;">${socketsStr}</span>
                </div>
                <div style="display:flex; gap:3px; flex-shrink:0;">${repairBtn}${socketBtn}</div>
            </div>
        `;
    });
    return slotsHTML;
}
