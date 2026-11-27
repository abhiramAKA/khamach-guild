/* ==========================================================================
   ОРДЕН КХАМАЧА — РЮКЗАК ЭКИПИРОВКИ, СЛИЯНИЯ, КАМНЕЙ И РАЗБОРКИ (v2.0.0)
   ========================================================================== */

function renderGuildBagView() {
    setSubViewBack('main', 'Назад в Орден');
    document.getElementById('sub-view-title').innerText = "🎒 РЮКЗАК ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = "Снаряжение Питомца и Корабля";

    const body = document.getElementById('sub-view-body');
    const bag = getBagItems();
    const gems = getGemsList();
    const scrap = getScrapMetal();
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');

    const gemsHTML = gems.length === 0
        ? '<span style="color:#6a5335;">В мешочке пусто.</span>'
        : gems.map(g => {
            const gm = GEMS_META[g.type];
            const rm = GEM_RARITIES[g.rank] || GEM_RARITIES;
            return `<span style="display:inline-block; background:rgba(0,0,0,0.5); border:1px solid #4a3f2c; padding:2px 5px; border-radius:3px; margin:2px; font-size:10px;">${gm.icon}${rm.tag} ${gm.name} (+${rm.bonus})</span>`;
        }).join('');

    let itemsHTML = '';
    if (bag.length === 0) {
        itemsHTML = `<div style="font-size:11px; color:#6a5335; padding:8px 0;">Рюкзак пуст. Отправьте Питомца в поход или слетайте на Босса!</div>`;
    } else {
        itemsHTML = bag.map((bItem, realIdx) => {
            const owner = bItem.owner;
            const ownerTag = owner === 'pet' ? '🐉' : '🚀';
            const sMeta = EQUIP_SLOTS[owner].find(s => s.key === bItem.slotKey);
            const setMeta = EQUIP_SETS[bItem.set] || EQUIP_SETS.flame;
            const bRar = ITEM_RARITIES[bItem.rarity || 1] || ITEM_RARITIES;
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

            const scrapYield = 5 * bRar.rank;
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed #2e251d; font-size:11px; gap:4px;">
                    <span style="color:${setMeta.color};">${ownerTag} ${bRar.tag} ${sMeta.icon} ${sMeta.name} [${setMeta.name}]</span>
                    <div style="display:flex; gap:3px; flex-shrink:0;">
                        ${btns}
                        <button class="mini-btn back-tint" onclick="bagSalvageByRealIdx(${realIdx})" title="Разобрать на Лом и Прах">🔩+${scrapYield}</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    body.innerHTML = `
        <div class="card-box">
            <div style="font-size:11px; color:#e6c280; font-weight:bold; margin-bottom:4px;">💎 САМОЦВЕТЫ (${gems.length}) | 🔩 Лом: ${scrap} | ✨ Прах: ${dust}</div>
            <div>${gemsHTML}</div>
        </div>
        <div class="card-box">
            <div style="font-size:11px; color:#e6c280; font-weight:bold; margin-bottom:4px;">ДОБЫТОЕ СНАРЯЖЕНИЕ (${bag.length})</div>
            ${itemsHTML}
        </div>
    `;
}
