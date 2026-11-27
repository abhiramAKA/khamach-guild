/* ==========================================================================
   ОРДЕН КХАМАЧА — ПЛИТКИ ОДЕЖДЫ, ГНЁЗДА КАМНЕЙ И ПЛОСКИЕ ЧАРЫ (v2.10.0)
   ========================================================================== */

const SET_SKILL_DESC = {
    flame: "🔥 Ожог: Ваши выстрелы поджигают Босса. Эта вещь добавляет +1.5 ед. периодического урона огнём каждую секунду боя, даже пока вы уворачиваетесь от снарядов.",
    abyss: "🔮 Вампиризм: Поглощает жизненную силу врага. Эта вещь добавляет +0.4 ❤️ исцеления за каждый 4-й выстрел, попавший точно в Босса.",
    storm: "⚡ Критический разряд: Накапливает заряд молнии при попаданиях. Эта вещь ускоряет зарядку шкалы Крита на +3% за выстрел и усиливает урон критического шара на +15%.",
    frost: "❄️ Ледяной Барьер: Окружает корабль защитным полем, которое полностью блокирует 1 обычный снаряд Босса (и режет урон Астральной Волны вдвое). Каждая вещь Льда ускоряет перезарядку щита на 1 сек."
};

function buildOwnerSlotsHTML(owner, equip) {
    let gridHTML = '';
    EQUIP_SLOTS[owner].forEach(slot => {
        const item = equip[slot.key];
        if (!item || item.lvl < 1) {
            gridHTML += `<div class="gear-tile empty"><span style="font-size:26px; filter:grayscale(1);">${slot.icon}</span><span style="font-size:10px; font-weight:bold;">${slot.name}</span><span style="font-size:9px;">Пусто</span></div>`;
            return;
        }
        const setMeta = EQUIP_SETS[item.set] || EQUIP_SETS.flame;
        const rarRank = item.rarity || 1;
        const dur = item.durability !== undefined ? item.durability : 100;
        const warnMark = dur <= 0 ? '❌ ' : (dur < 40 ? '⚠️ ' : '');

        gridHTML += `
            <div class="gear-tile rar-${rarRank}" onclick="renderItemDetailView('${owner}','${slot.key}')">
                <span style="font-size:28px; line-height:1;">${slot.icon}</span>
                <span style="font-size:10px; font-weight:bold; color:${setMeta.color}; text-align:center; line-height:1.1;">${warnMark}${slot.name}</span>
                <span style="font-size:9px; color:#e0e0e0;">${setMeta.icon} Ур.${item.lvl}</span>
            </div>
        `;
    });
    return gridHTML;
}

function renderItemDetailView(owner, slotKey) {
    const isPet = owner === 'pet';
    setSubViewBack(isPet ? 'pet_cfg' : 'ship_cfg', '↩️ Назад к ячейкам');

    const slotMeta = EQUIP_SLOTS[owner].find(s => s.key === slotKey);
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item || !slotMeta) return;

    const setMeta = EQUIP_SETS[item.set] || EQUIP_SETS.flame;
    const rarMeta = RARITY_TIERS[item.rarity || 1] || RARITY_TIERS;
    const dur = item.durability !== undefined ? item.durability : 100;
    const isBroken = dur <= 0;

    const lvlMult = (1 + (item.lvl - 1) * 0.4) * rarMeta.mult;
    const bVal = Math.round(slotMeta.baseVal * lvlMult);
    const sVal = Math.round(slotMeta.subVal * lvlMult);

    const maxSockets = Math.max(0, item.lvl - 1);
    const usedGems = item.gems || [];
    let socketsHTML = maxSockets === 0 ? '<div style="color:#6a5335;">Гнёзда откроются со 2-го уровня вещи.</div>' : '<div class="gem-grid" style="margin-top:5px;">';
    for (let i = 0; i < maxSockets; i++) {
        const gObj = usedGems.at(i);
        const clickAttr = !isBroken ? `onclick="openGemSelectMenu('${owner}','${slotKey}',${i})"` : '';
        if (gObj) {
            const gm = GEMS_META[gObj.type];
            const rm = RARITY_TIERS[gObj.rank] || RARITY_TIERS;
            socketsHTML += `<div class="gem-tile rar-${rm.rank}" ${clickAttr} title="${rm.name} ${gm.name} (+${rm.gemBonus}) — Нажмите для замены"><span style="font-size:20px;">${gm.icon}</span><span style="font-size:9px; color:#fff;">+${rm.gemBonus}</span></div>`;
        } else {
            socketsHTML += `<div class="gem-tile empty" style="opacity:0.85; cursor:pointer;" ${clickAttr}><span style="font-size:16px;">➕</span><span style="font-size:9px;">Гнездо</span></div>`;
        }
    }
    if (maxSockets > 0) socketsHTML += '</div>';

    const scrap = getScrapMetal();
    const repairCost = Math.max(2, Math.ceil((100 - dur) / 10) * 2);
    const effEnchRank = item.enchant ? Math.min(item.lvl, item.enchant.rank) : 0;
    const enchLabel = item.enchant ? `${STAT_LABELS[item.enchant.stat]} (+${effEnchRank * 5} | Ур.${effEnchRank})` : 'Нет чар';
    const enchCost = item.lvl * 10;

    document.getElementById('sub-view-title').innerText = `${slotMeta.icon} ${slotMeta.name}`;
    document.getElementById('sub-view-subtitle').innerText = `${rarMeta.name} | Стихия: ${setMeta.name}`;

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="font-size:12px; line-height:1.45;">
            <div style="color:${setMeta.color}; font-weight:bold; font-size:13px; margin-bottom:4px;">${slotMeta.name} [${setMeta.name}] — Ур. ${item.lvl}/7</div>
            <div>• Редкость: <strong>${rarMeta.tag} ${rarMeta.name}</strong> (множитель ×${rarMeta.mult})</div>
            <div>• ${STAT_LABELS[slotMeta.baseStat]}: <strong>+${bVal}</strong></div>
            <div>• ${STAT_LABELS[slotMeta.subStat]}: <strong>+${sVal}</strong></div>
            <div>• Прочность: <strong style="color:${isBroken ? '#ff4500' : '#2ecc71'};">${dur}/100</strong> ${isBroken ? '(Сломано!)' : ''}</div>
            <div>• Чары: <strong style="color:#e58cff;">${enchLabel}</strong></div>
        </div>
        <div class="card-box" style="font-size:11px; line-height:1.4; border-color:${setMeta.color};">
            <strong style="color:${setMeta.color};">⚡ Умение стихии «${setMeta.name}»:</strong>
            <div style="margin-top:3px; color:#e0e0e0;">${SET_SKILL_DESC[item.set] || ''}</div>
        </div>
        <div class="card-box" style="font-size:11px;">
            <strong style="color:#e6c280;">💎 Гнёзда самоцветов (нажмите на гнездо для вставки/замены):</strong>
            ${socketsHTML}
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
            ${dur < 100 ? `<button class="menu-btn ${scrap >= repairCost ? 'green-btn' : 'disabled-btn'}" onclick="repairEquipSlot('${owner}','${slotKey}')">🔧 Починить до 100% (${repairCost} 🔩 Лома)</button>` : ''}
            ${!isBroken ? `<button class="menu-btn ${scrap >= enchCost ? 'purple-btn' : 'disabled-btn'}" onclick="openEnchantSelectMenu('${owner}','${slotKey}')">✨ Наложить / Сменить чары Ур.${item.lvl} (${enchCost} 🔩 Лома)</button>` : ''}
        </div>
    `;
}
