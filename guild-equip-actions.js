/* ==========================================================================
   ОРДЕН КХАМАЧА — ДЕЙСТВИЯ: КОРМЛЕНИЕ, РАЗБОРКА, РЕМОНТ И ПОХОД (v2.9.7)
   ========================================================================== */

function consumeOwnerToken(owner, returnScreen) {
    const tokens = getUpgradeTokens(owner);
    if (tokens <= 0) return;
    const prevInfo = getOwnerLevelInfo(owner);
    if (prevInfo.isPeak) {
        alert("Шкала 7-го уровня уже заполнена на 100% — бонус +20% активен!");
        return;
    }

    setUpgradeTokens(owner, tokens - 1);
    const nextInfo = addOwnerXp(owner, 25);
    const isPet = owner === 'pet';
    if (nextInfo.lvl > prevInfo.lvl) {
        alert(isPet
            ? `🐉 Питомец вырос до ${nextInfo.lvl} уровня! Открыто улучшение вещей до ${nextInfo.lvl} ур.`
            : `🚀 Корабль модернизирован до ${nextInfo.lvl} уровня! Открыто улучшение модулей до ${nextInfo.lvl} ур.`);
    } else if (!prevInfo.isPeak && nextInfo.isPeak) {
        alert(`🔥 ПИК СИЛЫ (7 Ур. 100%)! Получено +20% ко всем характеристикам, пока шкала полная!`);
    }
    if (returnScreen === 'bag' && typeof renderGuildBagView === 'function') renderGuildBagView();
    else if (typeof renderOwnerHubView === 'function') renderOwnerHubView(owner);
}

function bagSalvageByRealIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag.at(realIdx);
    if (!picked) return;
    const rarRank = picked.rarity || 1;
    const sMeta = EQUIP_SLOTS[picked.owner].find(s => s.key === picked.slotKey);
    const rMeta = RARITY_TIERS[rarRank] || RARITY_TIERS;
    if (!confirm(`Разобрать «${rMeta.name} ${sMeta.name}» на ${rMeta.itemScrap} 🔩 Металлолома?`)) return;
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    setScrapMetal(getScrapMetal() + rMeta.itemScrap);
    renderGuildBagView();
}

function bagSalvageGemByIdx(gIdx) {
    const gems = getGemsList();
    const gem = gems.at(gIdx);
    if (!gem) return;
    const gm = GEMS_META[gem.type] || GEMS_META.amber;
    const rm = RARITY_TIERS[gem.rank] || RARITY_TIERS;
    if (!confirm(`Разобрать «${rm.name} ${gm.name} (+${rm.gemBonus})» на ${rm.gemScrap} 🔩 Металлолома?`)) return;
    gems.splice(gIdx, 1);
    saveGemsList(gems);
    setScrapMetal(getScrapMetal() + rm.gemScrap);
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
    if (typeof renderItemDetailView === 'function') renderItemDetailView(owner, slotKey);
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
        const s = shipSlots.at(Math.floor(Math.random() * shipSlots.length));
        const stKey = sets.at(Math.floor(Math.random() * sets.length));
        const rar = rollPetTripRarity();
        const rMeta = RARITY_TIERS[rar] || RARITY_TIERS;
        bag.push({ owner: 'ship', slotKey: s.key, set: stKey, rarity: rar });
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`);
    }
    saveBagItems(bag);
    const foundPotions = power >= 60 ? 2 : 1;
    setHealPotions(getHealPotions() + foundPotions);
    report.push(`🧪 Зелье исцеления ×${foundPotions}`);

    localStorage.removeItem('khamach_pet_exp_start');
    alert(`Питомец вернулся из космоса!\nНайдены обломки кораблей:\n• ${report.join('\n• ')}`);
    renderOwnerHubView('pet');
}
