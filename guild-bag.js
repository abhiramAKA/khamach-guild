/* ==========================================================================
   ОРДЕН КХАМАЧА — РЮКЗАК: ЦВЕТНЫЕ ПЛИТКИ КАМНЕЙ И СНАРЯЖЕНИЯ (v2.5.0-BETA)
   ========================================================================== */

function renderGuildBagView() {
    setSubViewBack('main', 'Назад в Орден');
    document.getElementById('sub-view-title').innerText = "🎒 РЮКЗАК ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = "Самоцветы, Модули и Экипировка";

    const body = document.getElementById('sub-view-body');
    const bag = getBagItems();
    const gems = getGemsList();
    const scrap = getScrapMetal();

    let gemsHTML = '';
    if (gems.length === 0) {
        gemsHTML = '<div style="font-size:11px; color:#6a5335;">В мешочке нет свободных самоцветов.</div>';
    } else {
        gemsHTML = '<div class="gem-grid">' + gems.map((g, gIdx) => {
            const gm = GEMS_META[g.type] || GEMS_META.amber;
            const rm = RARITY_TIERS[g.rank] || RARITY_TIERS[1];
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
            const sMeta = EQUIP_SLOTS[owner].find(s => s.key === bItem.slotKey);
            const setMeta = EQUIP_SETS[bItem.set] || EQUIP_SETS.flame;
            const bRar = RARITY_TIERS[bItem.rarity || 1] || RARITY_TIERS[1];
            const equip = getEquipStorage(owner);
            const equipped = equip[bItem.slotKey];
            const eqRarRank = equipped ? (equipped.rarity || 1) : 0;

            let btns = '';
            if (!equipped) {
                btns += `<button class="mini-btn green-btn" onclick="bagEquipByRealIdx(${realIdx})">Надеть</button>`;
            } else {
                if (eqRarRank === bRar.rank && equipped.lvl < 7) {
                    btns += `<button class="mini-btn green-btn" onclick="bagMergeByRealIdx(${realIdx})">+1 Ур.</button>`;
                }
                const repLabel = bRar.rank > eqRarRank ? `Надеть ${bRar.tag}` : 'Заменить';
                btns += `<button class="mini-btn" onclick="bagEquipByRealIdx(${realIdx})">${repLabel}</button>`;
            }

            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed #2e251d; font-size:11px; gap:4px;">
                    <span style="color:${setMeta.color};">${ownerTag} ${bRar.tag} ${sMeta.icon} ${sMeta.name} [${setMeta.name}]</span>
                    <div style="display:flex; gap:3px; flex-shrink:0;">
                        ${btns}
                        <button class="mini-btn back-tint" onclick="bagSalvageByRealIdx(${realIdx})" title="Разобрать на Лом">🔩+${bRar.itemScrap}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    body.innerHTML = `
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
