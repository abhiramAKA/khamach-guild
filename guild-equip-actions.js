/* ==========================================================================
   ОРДЕН КХАМАЧА — РЕМОНТ ЗА ЛОМ, СЛИЯНИЕ ПО РЕДКОСТИ И ПОХОД (v1.9.0-BETA)
   ========================================================================== */

function buildOwnerBagHTML(owner, bag, equip) {
    if (bag.length === 0) return `<div style="font-size:11px; color:#6a5335;">В рюкзаке нет новых предметов.</div>`;
    return bag.map((bItem, idx) => {
        const sMeta = EQUIP_SLOTS[owner].find(s => s.key === bItem.slotKey);
        const setMeta = EQUIP_SETS[bItem.set] || EQUIP_SETS.flame;
        const bRar = ITEM_RARITIES[bItem.rarity || 1] || ITEM_RARITIES;
        const equipped = equip[bItem.slotKey];
        const eqRarRank = equipped ? (equipped.rarity || 1) : 0;

        let btns = '';
        if (!equipped) {
            btns += `<button class="mini-btn green-btn" onclick="equipFromBag('${owner}', ${idx})">Надеть</button>`;
        } else {
            // Скрещивание только при одинаковой редкости (Базовая+Базовая, Легендарная+Легендарная)
            if (eqRarRank === bRar.rank && equipped.lvl < 7) {
                btns += `<button class="mini-btn green-btn" onclick="mergeFromBag('${owner}', ${idx})">+1 Ур.</button>`;
            }
            const repLabel = bRar.rank > eqRarRank ? `Надеть ${bRar.tag}` : 'Заменить';
            btns += `<button class="mini-btn" onclick="equipFromBag('${owner}', ${idx})">${repLabel}</button>`;
        }

        const scrapYield = 5 * bRar.rank;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; border-bottom:1px dashed #2e251d; font-size:11px; gap:4px;">
                <span style="color:${setMeta.color};">${bRar.tag} ${sMeta.icon} ${sMeta.name} [${setMeta.name}]</span>
                <div style="display:flex; gap:3px; flex-shrink:0;">
                    ${btns}
                    <button class="mini-btn back-tint" onclick="salvageFromBag('${owner}', ${idx})" title="Разобрать на Лом и Прах">🔩+${scrapYield}</button>
                </div>
            </div>
        `;
    }).join('');
}

function rollRandomGemDrop() {
    const gKeys = Object.keys(GEMS_META);
    const type = gKeys[Math.floor(Math.random() * gKeys.length)];
    return { type: type, rank: rollRandomRarityRank() };
}

function findRealBagIndex(owner, ownerIdx) {
    const allBag = getBagItems();
    let count = -1;
    for (let i = 0; i < allBag.length; i++) {
        if (allBag[i].owner === owner) { count++; if (count === ownerIdx) return i; }
    }
    return -1;
}

function repairEquipSlot(owner, slotKey) {
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item) return;

    const dur = item.durability !== undefined ? item.durability : 100;
    if (dur >= 100) return;

    const cost = Math.max(2, Math.ceil((100 - dur) / 10) * 2);
    const scrap = getScrapMetal();
    if (scrap < cost) return;

    setScrapMetal(scrap - cost);
    item.durability = 100;
    saveEquipStorage(owner, equip);
    renderGuildHeaderStats();
    renderOwnerEquipView(owner);
}

function equipFromBag(owner, ownerIdx) {
    const allBag = getBagItems();
    const realIdx = findRealBagIndex(owner, ownerIdx);
    if (realIdx === -1) return;

    const picked = allBag[realIdx];
    const equip = getEquipStorage(owner);
    const oldItem = equip[picked.slotKey];

    equip[picked.slotKey] = {
        lvl: oldItem ? oldItem.lvl : 1,
        set: picked.set,
        rarity: picked.rarity || 1,
        durability: 100,
        gems: oldItem ? (oldItem.gems || []) : [],
        enchant: oldItem ? oldItem.enchant : null
    };
    saveEquipStorage(owner, equip);
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    renderOwnerEquipView(owner);
}

function mergeFromBag(owner, ownerIdx) {
    const allBag = getBagItems();
    const realIdx = findRealBagIndex(owner, ownerIdx);
    if (realIdx === -1) return;

    const picked = allBag[realIdx];
    const equip = getEquipStorage(owner);
    const target = equip[picked.slotKey];
    if (!target || target.lvl >= 7) return;
    if ((target.rarity || 1) !== (picked.rarity || 1)) return;

    target.lvl += 1;
    saveEquipStorage(owner, equip);
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    alert(`Предмет улучшен до ${target.lvl} уровня! Открыто новое гнездо для камня.`);
    renderOwnerEquipView(owner);
}

function salvageFromBag(owner, ownerIdx) {
    const allBag = getBagItems();
    const realIdx = findRealBagIndex(owner, ownerIdx);
    if (realIdx === -1) return;

    const rarRank = allBag[realIdx].rarity || 1;
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);

    setScrapMetal(getScrapMetal() + 5 * rarRank);
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    localStorage.setItem('khamach_astral_dust', String(dust + 5 * rarRank));

    renderGuildHeaderStats();
    renderOwnerEquipView(owner);
}

function openGemSocketPicker(owner, slotKey) {
    const gems = getGemsList();
    if (gems.length === 0) return;

    gems.sort((a, b) => (b.rank || 1) - (a.rank || 1));
    const chosenGem = gems.shift();

    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item || (item.gems || []).length >= (item.lvl - 1)) return;

    saveGemsList(gems);
    item.gems = item.gems || [];
    item.gems.push(chosenGem);
    saveEquipStorage(owner, equip);

    const rm = GEM_RARITIES[chosenGem.rank] || GEM_RARITIES;
    const gm = GEMS_META[chosenGem.type];
    alert(`Вставлен камень: ${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(chosenGem.type, chosenGem.rank)} ${STAT_LABELS[gm.stat]})`);

    renderGuildHeaderStats();
    renderOwnerEquipView(owner);
}

function startPetSpaceTrip() {
    if (isPetOnExpedition()) return;
    localStorage.setItem('khamach_pet_exp_start', Date.now().toString());
    renderOwnerEquipView('pet');
}

function startPetExpTicker() {
    if (activeGuildTimer) clearInterval(activeGuildTimer);
    activeGuildTimer = setInterval(() => {
        const el = document.getElementById('pet-exp-timer');
        const st = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        if (!el || !st) return;
        const rem = Math.max(0, PET_EXPEDITION_MS - (Date.now() - st));
        if (rem <= 0) { clearInterval(activeGuildTimer); renderOwnerEquipView('pet'); }
        else {
            const m = Math.floor(rem / 60000).toString().padStart(2, '0');
            const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
            el.innerText = `⏱️ В походе: ${m}:${s} (В бою с Боссом не помогает)`;
        }
    }, 1000);
}

function claimPetSpaceLoot() {
    const st = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
    if (!st || (Date.now() - st) < PET_EXPEDITION_MS) return;

    const power = getOwnerPowerScore(calculateOwnerStats('pet'));
    const dropCount = Math.max(1, Math.min(3, Math.floor(power / 55) + 1));
    const bag = getBagItems();
    const sets = ['flame', 'abyss', 'storm', 'frost'];
    const shipSlots = EQUIP_SLOTS.ship;

    let report = [];
    for (let i = 0; i < dropCount; i++) {
        const s = shipSlots[Math.floor(Math.random() * shipSlots.length)];
        const stKey = sets[Math.floor(Math.random() * sets.length)];
        const rar = rollRandomRarityRank();
        const rMeta = ITEM_RARITIES[rar];
        bag.push({ owner: 'ship', slotKey: s.key, set: stKey, rarity: rar });
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`);
    }
    saveBagItems(bag);

    const foundPotions = power >= 60 ? 2 : 1;
    setHealPotions(getHealPotions() + foundPotions);
    report.push(`🧪 Зелье исцеления ×${foundPotions}`);

    if (Math.random() < 0.55) {
        const gems = getGemsList();
        const droppedGem = rollRandomGemDrop();
        gems.push(droppedGem);
        saveGemsList(gems);
        const rm = GEM_RARITIES[droppedGem.rank];
        const gm = GEMS_META[droppedGem.type];
        report.push(`${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(droppedGem.type, droppedGem.rank)})`);
    }

    localStorage.removeItem('khamach_pet_exp_start');
    renderGuildHeaderStats();
    alert(`Питомец вернулся из космоса!\nНайдена добыча:\n• ${report.join('\n• ')}`);
    renderOwnerEquipView('pet');
}
