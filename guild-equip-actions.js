/* ==========================================================================
   ОРДЕН КХАМАЧА — ДЕЙСТВИЯ РЮКЗАКА, РЕМОНТА, ЧАР И ПОХОДА (v2.0.0-BETA)
   ========================================================================== */

function rollRandomGemDrop() {
    const gKeys = Object.keys(GEMS_META);
    const type = gKeys[Math.floor(Math.random() * gKeys.length)];
    return { type: type, rank: rollRandomRarityRank() };
}

function bagEquipByRealIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag[realIdx];
    if (!picked) return;

    const owner = picked.owner;
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
    renderGuildBagView();
}

function bagMergeByRealIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag[realIdx];
    if (!picked) return;

    const owner = picked.owner;
    const equip = getEquipStorage(owner);
    const target = equip[picked.slotKey];
    if (!target || target.lvl >= 7) return;
    if ((target.rarity || 1) !== (picked.rarity || 1)) return;

    target.lvl += 1;
    saveEquipStorage(owner, equip);
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    alert(`Предмет улучшен до ${target.lvl} уровня! Открыто новое гнездо для камня.`);
    renderGuildBagView();
}

function bagSalvageByRealIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag[realIdx];
    if (!picked) return;

    const rarRank = picked.rarity || 1;
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);

    setScrapMetal(getScrapMetal() + 5 * rarRank);
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    localStorage.setItem('khamach_astral_dust', String(dust + 5 * rarRank));
    renderGuildBagView();
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
    renderOwnerGearConfig(owner);
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
    renderOwnerGearConfig(owner);
}

function enchantEquipItem(owner, slotKey) {
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item) return;

    const rank = item.enchant ? item.enchant.rank : 0;
    const cost = (rank + 1) * 10;
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    if (rank >= 5 || dust < cost) return;

    const statsKeys = ['atk', 'hp', 'reg'];
    const chosenStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];

    localStorage.setItem('khamach_astral_dust', String(dust - cost));
    item.enchant = { stat: chosenStat, rank: rank + 1 };
    saveEquipStorage(owner, equip);
    alert(`Наложены чары: ${STAT_LABELS[chosenStat]} (+${(rank + 1) * 15}%)!`);
    renderOwnerGearConfig(owner);
}

function startPetSpaceTrip() {
    if (isPetOnExpedition()) return;
    localStorage.setItem('khamach_pet_exp_start', Date.now().toString());
    renderOwnerHubView('pet');
}

function startPetExpTicker() {
    if (activeGuildTimer) clearInterval(activeGuildTimer);
    activeGuildTimer = setInterval(() => {
        const el = document.getElementById('pet-exp-timer');
        const st = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        if (!el || !st) return;
        const rem = Math.max(0, PET_EXPEDITION_MS - (Date.now() - st));
        if (rem <= 0) { clearInterval(activeGuildTimer); renderOwnerHubView('pet'); }
        else {
            const m = Math.floor(rem / 60000).toString().padStart(2, '0');
            const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
            el.innerText = `⏱️ В походе: ${m}:${s}`;
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
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}]`);
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
    alert(`Питомец вернулся из космоса!\nНайдена добыча:\n• ${report.join('\n• ')}`);
    renderOwnerHubView('pet');
}
