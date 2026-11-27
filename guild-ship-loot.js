/* ==========================================================================
   ОРДЕН КХАМАЧА — СТУПЕНЧАТАЯ РЕДКОСТЬ ЛУТА ОТ УРОНА ПО БОССУ (v2.2.0-BETA)
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

function rollWeightedTierRarity(weights) {
    // weights: [w1, w2, w3, w4] в сумме 100
    const r = Math.random() * 100;
    if (r < weights) return 1;
    if (r < weights + weights) return 2;
    if (r < weights + weights + weights) return 3;
    return 4;
}

function getShipLootTierByDamage(damageDealt) {
    if (damageDealt >= 7000) {
        return {
            stage: 4,
            label: 'Тир 4: 🎁🟦-🟨 + 💎100%',
            itemChance: 1.0,
            itemWeights:,
            gemChance: 1.0,
            gemWeights:,
            nextGoal: 0
        };
    }
    if (damageDealt >= 3500) {
        return {
            stage: 3,
            label: 'Тир 3: 🎁⬜-🟪 + 💎70%',
            itemChance: 1.0,
            itemWeights:,
            gemChance: 0.70,
            gemWeights:,
            nextGoal: 7000
        };
    }
    if (damageDealt >= 1500) {
        return {
            stage: 2,
            label: 'Тир 2: 🎁⬜-🟦 + 💎35%',
            itemChance: 1.0,
            itemWeights:,
            gemChance: 0.35,
            gemWeights:,
            nextGoal: 3500
        };
    }
    if (damageDealt >= 500) {
        return {
            stage: 1,
            label: 'Тир 1: 🎁⬜ (100%)',
            itemChance: 1.0,
            itemWeights:,
            gemChance: 0,
            gemWeights:,
            nextGoal: 1500
        };
    }
    return {
        stage: 0,
        label: 'Цель: 500 урона',
        itemChance: 0,
        itemWeights:,
        gemChance: 0,
        gemWeights:,
        nextGoal: 500
    };
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
        const rar = rollWeightedTierRarity(tier.itemWeights);
        const rMeta = ITEM_RARITIES[rar] || ITEM_RARITIES;

        const bag = getBagItems();
        bag.push({ owner: 'pet', slotKey: s.key, set: stKey, rarity: rar });
        saveBagItems(bag);
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`);
    }

    if (tier.gemChance > 0 && Math.random() < tier.gemChance) {
        const gems = getGemsList();
        const gKeys = Object.keys(GEMS_META);
        const gType = gKeys[Math.floor(Math.random() * gKeys.length)];
        const gRank = rollWeightedTierRarity(tier.gemWeights);
        gems.push({ type: gType, rank: gRank });
        saveGemsList(gems);

        const rm = GEM_RARITIES[gRank] || GEM_RARITIES;
        const gm = GEMS_META[gType];
        report.push(`${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(gType, gRank)})`);
    }

    if (report.length === 0) {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\nПродержитесь ~10–15 сек (500 урона) для гарантированной базовой вещи!`);
    } else {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\n\nДобыто (в Рюкзак):\n• ${report.join('\n• ')}`);
    }
    if (typeof renderOwnerHubView === 'function') renderOwnerHubView('ship');
}
