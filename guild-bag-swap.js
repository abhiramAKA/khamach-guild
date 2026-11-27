/* ==========================================================================
   ОРДЕН КХАМАЧА — СРАВНЕНИЕ ВЕЩЕЙ ПРИ ЗАМЕНЕ И СЛИЯНИЕ В РЮКЗАКЕ (v2.10.0)
   ========================================================================== */

function buildItemCompareCardHTML(titleTag, owner, slotKey, itemObj, borderHighlight) {
    const sMeta = EQUIP_SLOTS[owner].find(s => s.key === slotKey);
    const setMeta = EQUIP_SETS[itemObj.set] || EQUIP_SETS.flame;
    const rarMeta = RARITY_TIERS[itemObj.rarity || 1] || RARITY_TIERS;
    const lvl = itemObj.lvl || 1;
    const dur = itemObj.durability !== undefined ? itemObj.durability : 100;
    const lvlMult = (1 + (lvl - 1) * 0.4) * rarMeta.mult;
    const bVal = Math.round(sMeta.baseVal * lvlMult);
    const sVal = Math.round(sMeta.subVal * lvlMult);
    const gemsCnt = Array.isArray(itemObj.gems) ? itemObj.gems.length : 0;
    const enchStr = (itemObj.enchant && itemObj.enchant.rank > 0)
        ? `${STAT_LABELS[itemObj.enchant.stat]} (+${Math.min(lvl, itemObj.enchant.rank) * 5})` : 'Нет';

    return `
        <div class="card-box" style="font-size:11px; line-height:1.45; border-color:${borderHighlight};">
            <div style="font-size:10px; color:#8a7350; text-transform:uppercase; margin-bottom:2px;">${titleTag}</div>
            <div style="color:${setMeta.color}; font-weight:bold; font-size:12px;">${rarMeta.tag} ${sMeta.icon} ${sMeta.name} [${setMeta.name}] — Ур.${lvl} (${rarMeta.name})</div>
            <div>• ${STAT_LABELS[sMeta.baseStat]}: <strong>+${bVal}</strong> | ${STAT_LABELS[sMeta.subStat]}: <strong>+${sVal}</strong></div>
            <div>• Стихия: <strong>${setMeta.icon} ${setMeta.skill}</strong> | Прочность: <strong>${dur}/100</strong></div>
            <div>• Камни: <strong>${gemsCnt}</strong> | Чары: <strong>${enchStr}</strong></div>
        </div>
    `;
}

function openBagReplaceCompareView(realIdx) {
    const allBag = getBagItems();
    const picked = allBag.at(realIdx);
    if (!picked) return;
    const equip = getEquipStorage(picked.owner);
    const currentItem = equip[picked.slotKey];
    if (!currentItem || currentItem.lvl < 1) { confirmBagSwapByIdx(realIdx); return; }

    setSubViewBack('bag', '↩️ Отмена (назад в Рюкзак)');
    document.getElementById('sub-view-title').innerText = "⚖️ СРАВНЕНИЕ ВЕЩЕЙ";
    document.getElementById('sub-view-subtitle').innerText = "Старая вещь вернётся обратно в Рюкзак";

    const curCard = buildItemCompareCardHTML('🛡️ Сейчас надето (вернётся в Рюкзак)', picked.owner, picked.slotKey, currentItem, '#6e3131');
    const newCard = buildItemCompareCardHTML('🆕 Новая вещь из Рюкзака', picked.owner, picked.slotKey, picked, '#316e34');
    document.getElementById('sub-view-body').innerHTML = `${curCard}${newCard}<button class="menu-btn green-btn" onclick="confirmBagSwapByIdx(${realIdx})">✅ Подтвердить замену</button>`;
}

function confirmBagSwapByIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag.at(realIdx);
    if (!picked) return;
    const owner = picked.owner;
    const equip = getEquipStorage(owner);
    const oldItem = equip[picked.slotKey];

    allBag.splice(realIdx, 1);
    if (oldItem && oldItem.lvl >= 1) {
        allBag.push({
            owner: owner, slotKey: picked.slotKey, set: oldItem.set, rarity: oldItem.rarity || 1,
            lvl: oldItem.lvl || 1, durability: oldItem.durability !== undefined ? oldItem.durability : 100,
            gems: Array.isArray(oldItem.gems) ? oldItem.gems : [], enchant: oldItem.enchant || null
        });
    }
    equip[picked.slotKey] = {
        lvl: picked.lvl || 1, set: picked.set, rarity: picked.rarity || 1,
        durability: picked.durability !== undefined ? picked.durability : 100,
        gems: Array.isArray(picked.gems) ? picked.gems : [], enchant: picked.enchant || null
    };
    saveEquipStorage(owner, equip);
    saveBagItems(allBag);
    renderGuildBagView();
}

function bagEquipDirectByIdx(realIdx) { confirmBagSwapByIdx(realIdx); }

function bagMergeByRealIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag.at(realIdx);
    if (!picked) return;
    const maxOwnerLvl = getOwnerLevelInfo(picked.owner).lvl;
    const equip = getEquipStorage(picked.owner);
    const target = equip[picked.slotKey];
    if (!target || target.lvl >= 7 || target.lvl >= maxOwnerLvl) return;
    if ((target.rarity || 1) !== (picked.rarity || 1)) return;

    target.lvl += 1;
    saveEquipStorage(picked.owner, equip);
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    alert(`Предмет улучшен до ${target.lvl} уровня! Открыто новое гнездо для самоцвета.`);
    renderGuildBagView();
}
