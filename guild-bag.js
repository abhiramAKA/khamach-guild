/* ==========================================================================
   ОРДЕН КХАМАЧА — РЮКЗАК: ИНДИКАТОРЫ (🟢/🔴/⚪), КАМНИ И ПРИПАСЫ (v2.9.9)
   ========================================================================== */

function getSingleItemPowerScore(owner, slotKey, itemObj) {
    if (!itemObj || (itemObj.lvl || 1) < 1) return 0;
    const sMeta = EQUIP_SLOTS[owner].find(s => s.key === slotKey);
    const rarMeta = RARITY_TIERS[itemObj.rarity || 1] || RARITY_TIERS;
    const lvl = itemObj.lvl || 1;
    const lvlMult = (1 + (lvl - 1) * 0.4) * rarMeta.mult;

    let score = Math.round(sMeta.baseVal * lvlMult) + Math.round(sMeta.subVal * lvlMult);
    if (Array.isArray(itemObj.gems)) {
        itemObj.gems.forEach(gObj => {
            if (gObj) score += getGemBonusValue(gObj.rank || 1);
        });
    }
    if (itemObj.enchant && itemObj.enchant.rank > 0) {
        score += Math.min(lvl, itemObj.enchant.rank) * 2;
    }
    return score;
}

function renderGuildBagView() {
    setSubViewBack('main', 'Назад в Орден');
    document.getElementById('sub-view-title').innerText = "🎒 РЮКЗАК ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = "Корм, Чертежи, Самоцветы и Вещи";

    const body = document.getElementById('sub-view-body');
    const bag = getBagItems();
    const gems = getGemsList();
    const scrap = getScrapMetal();
    const foodCnt = getUpgradeTokens('pet');
    const bpCnt = getUpgradeTokens('ship');
    const petLvl = getOwnerLevelInfo('pet').lvl;
    const shipLvl = getOwnerLevelInfo('ship').lvl;

    let tokensHTML = '';
    if (foodCnt > 0 || bpCnt > 0) {
        tokensHTML = `<div class="card-box" style="display:flex; flex-direction:column; gap:5px;">
            <div style="font-size:11px; color:#e6c280; font-weight:bold;">📦 ПРИПАСЫ РАЗВИТИЯ</div>
            ${foodCnt > 0 ? `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                <span>🍖 Астральный Корм (×${foodCnt}) — +25 опыта 🐉</span>
                <button class="mini-btn green-btn" onclick="consumeOwnerToken('pet','bag')">Покормить</button>
            </div>` : ''}
            ${bpCnt > 0 ? `<div style="display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                <span>📐 Чертёж Инженеров (×${bpCnt}) — +25 опыта 🚀</span>
                <button class="mini-btn green-btn" onclick="consumeOwnerToken('ship','bag')">Изучить</button>
            </div>` : ''}
        </div>`;
    }

    let gemsHTML = '';
    if (gems.length === 0) {
        gemsHTML = '<div style="font-size:11px; color:#6a5335;">В мешочке нет свободных самоцветов.</div>';
    } else {
        gemsHTML = '<div class="gem-grid">' + gems.map((g, gIdx) => {
            const gm = GEMS_META[g.type] || GEMS_META.amber;
            const rm = RARITY_TIERS[g.rank] || RARITY_TIERS;
            return `
                <div class="gem-tile rar-${rm.rank}" onclick="bagSalvageGemByIdx(${gIdx})" title="${rm.name} ${gm.name} (+${rm.gemBonus}) — Нажмите для разборки">
                    <span style="font-size:22px; line-height:1;">${gm.icon}</span>
                    <span style="font-size:9px; color:#fff; font-weight:bold;">+${rm.gemBonus}</span>
                    <span style="font-size:8px; color:#ffb3ba;">🔩+${rm.gemScrap}</span>
                </div>
            `;
        }).join('') + '</div>';
    }

    let itemsHTML = '';
    if (bag.length === 0) {
        itemsHTML = `<div style="font-size:11px; color:#6a5335; padding:6px 0;">Рюкзак снаряжения пуст.</div>`;
    } else {
        itemsHTML = bag.map((bItem, realIdx) => {
            const owner = bItem.owner;
            const ownerTag = owner === 'pet' ? '🐉' : '🚀';
            const maxOwnerLvl = owner === 'pet' ? petLvl : shipLvl;
            const sMeta = EQUIP_SLOTS[owner].find(s => s.key === bItem.slotKey);
            const setMeta = EQUIP_SETS[bItem.set] || EQUIP_SETS.flame;
            const bRar = RARITY_TIERS[bItem.rarity || 1] || RARITY_TIERS;
            const bLvl = bItem.lvl || 1;
            const lvlBadge = bLvl > 1 ? ` Ур.${bLvl}` : '';
            const equip = getEquipStorage(owner);
            const equipped = equip[bItem.slotKey];
            const eqRarRank = equipped ? (equipped.rarity || 1) : 0;

            const bagPower = getSingleItemPowerScore(owner, bItem.slotKey, bItem);
            const eqPower = getSingleItemPowerScore(owner, bItem.slotKey, equipped);
            let trendBadge = `<span title="Равно по силе (${bagPower} = ${eqPower})">⚪</span>`;
            if (bagPower > eqPower) {
                trendBadge = `<span title="Сильнее надетой (${bagPower} > ${eqPower})">🟢</span>`;
            } else if (bagPower < eqPower) {
                trendBadge = `<span title="Слабее надетой (${bagPower} < ${eqPower})">🔴</span>`;
            }

            let btns = '';
            if (!equipped || equipped.lvl < 1) {
                btns += `<button class="mini-btn green-btn" onclick="bagEquipDirectByIdx(${realIdx})">Надеть</button>`;
            } else {
                if (eqRarRank === bRar.rank && equipped.lvl < 7) {
                    if (equipped.lvl < maxOwnerLvl) {
                        btns += `<button class="mini-btn green-btn" onclick="bagMergeByRealIdx(${realIdx})">+1 Ур.</button>`;
                    } else {
                        btns += `<button class="mini-btn disabled-btn" onclick="alert('Чтобы улучшить вещь до ${equipped.lvl + 1} ур., сначала поднимите уровень ${owner === 'pet' ? 'Питомца' : 'Корабля'} до ${equipped.lvl + 1} ур.!')">🔒Ур.${equipped.lvl + 1}</button>`;
                    }
                }
                const repLabel = bRar.rank > eqRarRank ? `Заменить ${bRar.tag}` : 'Заменить';
                btns += `<button class="mini-btn" onclick="openBagReplaceCompareView(${realIdx})">${repLabel}</button>`;
            }

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed #2e251d; font-size:11px; gap:4px;">
                    <span style="color:${setMeta.color};">${trendBadge} ${ownerTag} ${bRar.tag} ${sMeta.icon} ${sMeta.name}${lvlBadge} [${setMeta.name}]</span>
                    <div style="display:flex; gap:3px; flex-shrink:0;">
                        ${btns}
                        <button class="mini-btn back-tint" onclick="bagSalvageByRealIdx(${realIdx})" title="Разобрать на Лом">🔩+${bRar.itemScrap}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    body.innerHTML = `
        ${tokensHTML}
        <div class="card-box">
            <div style="display:flex; justify-content:space-between; font-size:11px; color:#e6c280; font-weight:bold; margin-bottom:5px;">
                <span>💎 САМОЦВЕТЫ (${gems.length})</span>
                <span style="color:#cdb38c;">🔩 Лом: ${scrap}</span>
            </div>
            ${gemsHTML}
        </div>
        <div class="card-box">
            <div style="font-size:11px; color:#e6c280; font-weight:bold; margin-bottom:4px;">ДОБЫТОЕ СНАРЯЖЕНИЕ (${bag.length})</div>
            ${itemsHTML}
        </div>
    `;
}
