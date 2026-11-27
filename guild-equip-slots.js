/* ==========================================================================
   ОРДЕН КХАМАЧА — КВАДРАТНЫЕ ЯЧЕЙКИ ОДЕЖДЫ И КАРТОЧКА УМЕНИЯ (v2.4.1-BETA)
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
            gridHTML += `
                <div class="gear-tile empty">
                    <span style="font-size:26px; filter:grayscale(1);">${slot.icon}</span>
                    <span style="font-size:10px; font-weight:bold;">${slot.name}</span>
                    <span style="font-size:9px;">Пусто</span>
                </div>
            `;
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
    const skillFullDesc = SET_SKILL_DESC[item.set] || '';

    document.getElementById('sub-view-title').innerText = `${slotMeta.icon} ${slotMeta.name}`;
    document.getElementById('sub-view-subtitle').innerText = `${rarMeta.name} вещь | Стихия: ${setMeta.name}`;

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="font-size:12px; line-height:1.45;">
            <div style="color:${setMeta.color}; font-weight:bold; font-size:13px; margin-bottom:4px;">${rarMeta.tag} ${slotMeta.name} [${setMeta.name}] — Ур. ${item.lvl}/7</div>
            <div>• ${STAT_LABELS[slotMeta.baseStat]}: <strong>+${bVal}</strong></div>
            <div>• ${STAT_LABELS[slotMeta.subStat]}: <strong>+${sVal}</strong></div>
            <div>• Прочность: <strong style="color:${isBroken ? '#ff4500' : '#2ecc71'};">${dur}/100</strong> ${isBroken ? '(Сломано — бонусов нет!)' : ''}</div>
            <div>• Чары Шамана: <strong style="color:#e58cff;">${enchLabel}</strong></div>
        </div>
        <div class="card-box" style="font-size:11px; line-height:1.4; border-color:${setMeta.color};">
            <strong style="color:${setMeta.color};">⚡ Умение стихии «${setMeta.name}»:</strong>
            <div style="margin-top:3px; color:#e0e0e0;">${skillFullDesc}</div>
        </div>
        <div class="card-box" style="font-size:11px;">
            <strong style="color:#e6c280;">💎 Самоцветы в вещах (${usedGems.length}/${maxSockets}):</strong>
            <div style="margin-top:3px;">${socketsHTML}</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:6px;">
            ${dur < 100 ? `<button class="menu-btn ${scrap >= repairCost ? 'green-btn' : 'disabled-btn'}" onclick="repairEquipSlot('${owner}','${slotKey}')">🔧 Починить до 100% (Нужно ${repairCost} 🔩 Лома)</button>` : ''}
            ${(!isBroken && usedGems.length < maxSockets && gems.length > 0) ? `<button class="menu-btn green-btn" onclick="openGemSocketPicker('${owner}','${slotKey}')">💎 Вставить лучший камень из сумки</button>` : ''}
            ${(!isBroken && enchRank < 5) ? `<button class="menu-btn ${dust >= enchCost ? 'purple-btn' : 'disabled-btn'}" onclick="enchantEquipItem('${owner}','${slotKey}')">✨ Наложить чары Шамана (${enchCost} ✨ Праха)</button>` : ''}
        </div>
    `;
}
