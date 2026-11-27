/* ==========================================================================
   ОРДЕН КХАМАЧА — СТУПЕНЧАТАЯ РЕДКОСТЬ ЛУТА ОТ УРОНА (500 / 1500 / 3500 / 7000)
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

function rollWeightedTierRarity(w1, w2, w3, w4) {
    const r = Math.random() * 100;
    if (r < w1) return 1;
    if (r < w1 + w2) return 2;
    if (r < w1 + w2 + w3) return 3;
    return 4;
}

function getShipLootTierByDamage(damageDealt) {
    if (damageDealt >= 7000) {
        return {
            stage: 4,
            label: 'Тир 4: 🎁🟦-🟨 + 💎100%',
            itemChance: 1.0,
            iW: { w1: 0, w2: 40, w3: 45, w4: 15 },
            gemChance: 1.0,
            gW: { w1: 0, w2: 40, w3: 45, w4: 15 },
            nextGoal: 0
        };
    }
    if (damageDealt >= 3500) {
        return {
            stage: 3,
            label: 'Тир 3: 🎁⬜-🟪 + 💎70%',
            itemChance: 1.0,
            iW: { w1: 35, w2: 45, w3: 20, w4: 0 },
            gemChance: 0.70,
            gW: { w1: 50, w2: 35, w3: 15, w4: 0 },
            nextGoal: 7000
        };
    }
    if (damageDealt >= 1500) {
        return {
            stage: 2,
            label: 'Тир 2: 🎁⬜-🟦 + 💎35%',
            itemChance: 1.0,
            iW: { w1: 70, w2: 30, w3: 0, w4: 0 },
            gemChance: 0.35,
            gW: { w1: 100, w2: 0, w3: 0, w4: 0 },
            nextGoal: 3500
        };
    }
    if (damageDealt >= 500) {
        return {
            stage: 1,
            label: 'Тир 1: 🎁⬜ (100%)',
            itemChance: 1.0,
            iW: { w1: 100, w2: 0, w3: 0, w4: 0 },
            gemChance: 0,
            gW: { w1: 100, w2: 0, w3: 0, w4: 0 },
            nextGoal: 1500
        };
    }
    return {
        stage: 0,
        label: 'Без награды',
        itemChance: 0,
        iW: { w1: 100, w2: 0, w3: 0, w4: 0 },
        gemChance: 0,
        gW: { w1: 100, w2: 0, w3: 0, w4: 0 },
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
        const rar = rollWeightedTierRarity(tier.iW.w1, tier.iW.w2, tier.iW.w3, tier.iW.w4);
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
        const gRank = rollWeightedTierRarity(tier.gW.w1, tier.gW.w2, tier.gW.w3, tier.gW.w4);
        gems.push({ type: gType, rank: gRank });
        saveGemsList(gems);

        const rm = GEM_RARITIES[gRank] || GEM_RARITIES;
        const gm = GEMS_META[gType];
        report.push(`${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(gType, gRank)})`);
    }

    if (report.length === 0) {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\nДля гарантированной базовой вещи нужно нанести 500 урона!`);
    } else {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\n\nДобыто (в Рюкзак):\n• ${report.join('\n• ')}`);
    }
    if (typeof renderOwnerHubView === 'function') renderOwnerHubView('ship');
}
