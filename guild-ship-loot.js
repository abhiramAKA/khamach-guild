/* ==========================================================================
   ОРДЕН КХАМАЧА — ЛУТ ПО ПОРОГАМ УРОНА И ИЗНОС СНАРЯЖЕНИЯ (v1.9.0-BETA)
   ========================================================================== */

function applyPostBattleWear() {
    const owners = ['ship'];
    if (!isPetOnExpedition()) owners.push('pet');

    owners.forEach(owner => {
        const equip = getEquipStorage(owner);
        let changed = false;
        Object.keys(equip).forEach(k => {
            const item = equip[k];
            if (item && item.lvl >= 1) {
                const curDur = item.durability !== undefined ? item.durability : 100;
                if (curDur > 0) {
                    item.durability = Math.max(0, curDur - 10);
                    changed = true;
                }
            }
        });
        if (changed) saveEquipStorage(owner, equip);
    });
}

function getShipLootTierByDamage(damageDealt) {
    if (damageDealt >= 3500) {
        return { label: '🎁 Шмотка + 💎 Камень (100%)', itemChance: 1.0, gemChance: 1.0, nextGoal: 0 };
    }
    if (damageDealt >= 1500) {
        return { label: '🎁 Шмотка + 💎 (50%)', itemChance: 1.0, gemChance: 0.5, nextGoal: 3500 };
    }
    if (damageDealt >= 500) {
        return { label: '🎁 Шмотка (100%)', itemChance: 1.0, gemChance: 0, nextGoal: 1500 };
    }
    return { label: '🎁 Шанс шмотки (40%)', itemChance: 0.4, gemChance: 0, nextGoal: 500 };
}

function grantEndlessBossRewards(damageDealt) {
    applyPostBattleWear();

    const dmg = Math.floor(damageDealt);
    const prevBest = parseInt(localStorage.getItem('khamach_ship_best_dmg') || '0');
    const isNewRecord = dmg > prevBest;
    if (isNewRecord) {
        localStorage.setItem('khamach_ship_best_dmg', String(dmg));
    }

    const tier = getShipLootTierByDamage(dmg);
    const recordTag = isNewRecord ? ' 🏆 НОВЫЙ РЕКОРД!' : '';
    let report = [];

    if (Math.random() < tier.itemChance) {
        const sets = ['flame', 'abyss', 'storm', 'frost'];
        const pSlots = EQUIP_SLOTS.pet;
        const s = pSlots[Math.floor(Math.random() * pSlots.length)];
        const stKey = sets[Math.floor(Math.random() * sets.length)];
        const rar = typeof rollRandomRarityRank === 'function' ? rollRandomRarityRank() : 1;
        const rMeta = ITEM_RARITIES[rar] || ITEM_RARITIES;

        const bag = getBagItems();
        bag.push({ owner: 'pet', slotKey: s.key, set: stKey, rarity: rar });
        saveBagItems(bag);
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`);
    }

    if (tier.gemChance > 0 && Math.random() < tier.gemChance && typeof rollRandomGemDrop === 'function') {
        const gems = getGemsList();
        const droppedGem = rollRandomGemDrop();
        gems.push(droppedGem);
        saveGemsList(gems);
        const rm = GEM_RARITIES[droppedGem.rank];
        const gm = GEMS_META[droppedGem.type];
        report.push(`${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(droppedGem.type, droppedGem.rank)})`);
    }

    renderGuildHeaderStats();

    if (report.length === 0) {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nНанесено урона: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10 прочности). Трофеи не выпали.`);
    } else {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nНанесено урона: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10 прочности).\n\nДобыто:\n• ${report.join('\n• ')}`);
    }
    renderOwnerEquipView('ship');
}
