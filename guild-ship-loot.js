/* ==========================================================================
   ОРДЕН КХАМАЧА — 4 ПОРОГА НАГРАД (1500 / 3000 / 5000 / 8000) (v2.1.2-BETA)
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
    if (damageDealt >= 8000) {
        return { stage: 4, label: 'Порог 4: 🎁100% + 💎100%', itemChance: 1.0, gemChance: 1.0, nextGoal: 0 };
    }
    if (damageDealt >= 5000) {
        return { stage: 3, label: 'Порог 3: 🎁100% + 💎50%', itemChance: 1.0, gemChance: 0.5, nextGoal: 8000 };
    }
    if (damageDealt >= 3000) {
        return { stage: 2, label: 'Порог 2: 🎁100%', itemChance: 1.0, gemChance: 0, nextGoal: 5000 };
    }
    if (damageDealt >= 1500) {
        return { stage: 1, label: 'Порог 1: 🎁50%', itemChance: 0.5, gemChance: 0, nextGoal: 3000 };
    }
    return { stage: 0, label: 'Без награды', itemChance: 0, gemChance: 0, nextGoal: 1500 };
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

    if (tier.itemChance > 0 && Math.random() < tier.itemChance) {
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

    if (report.length === 0) {
        const tip = tier.stage === 0
            ? 'До 1-го порога (1 500 урона) не хватило немного выдержки!'
            : 'Шанс 50% на 1-м пороге в этот раз не сработал — дотяните до 3 000 урона для гарантии!';
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\n${tip}`);
    } else {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\n\nДобыто (сложено в Рюкзак):\n• ${report.join('\n• ')}`);
    }
    if (typeof renderOwnerHubView === 'function') renderOwnerHubView('ship');
}
