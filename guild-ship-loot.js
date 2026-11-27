/* ==========================================================================
   ОРДЕН КХАМАЧА — ДРОП 6 РЕДКОСТЕЙ И КРУГЛЫХ КАМНЕЙ ОТ УРОНА (v2.5.0-BETA)
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

function rollWeighted6(w) {
    const r = Math.random() * 100;
    let acc = 0;
    for (let i = 0; i < 6; i++) {
        acc += w[i];
        if (r < acc) return i + 1;
    }
    return 1;
}

function getShipLootTierByDamage(damageDealt) {
    if (damageDealt >= 9000) {
        return { label: 'Тир 5: 🎁🟪-🟥 + 💎100%', itemChance: 1.0, iW:, gemChance: 1.0, gW:, nextGoal: 0 };
    }
    if (damageDealt >= 5500) {
        return { label: 'Тир 4: 🎁🟦-🟨 + 💎80%', itemChance: 1.0, iW:, gemChance: 0.80, gW:, nextGoal: 9000 };
    }
    if (damageDealt >= 3000) {
        return { label: 'Тир 3: 🎁🟩-🟪 + 💎50%', itemChance: 1.0, iW:, gemChance: 0.50, gW:, nextGoal: 5500 };
    }
    if (damageDealt >= 1400) {
        return { label: 'Тир 2: 🎁⬜-🟦 + 💎25%', itemChance: 1.0, iW:, gemChance: 0.25, gW:, nextGoal: 3000 };
    }
    if (damageDealt >= 500) {
        return { label: 'Тир 1: 🎁⬜-🟩 (100%)', itemChance: 1.0, iW:, gemChance: 0, gW:, nextGoal: 1400 };
    }
    return { label: 'Цель: 500 урона', itemChance: 0, iW:, gemChance: 0, gW:, nextGoal: 500 };
}

function grantEndlessBossRewards(damageDealt) {
    applyPostBattleWear();

    const dmg = Math.floor(damageDealt);
    const prevBest = parseInt(localStorage.getItem('khamach_ship_best_dmg') || '0');
    const isNewRecord = dmg > prevBest;
    if (isNewRecord) localStorage.setItem('khamach_ship_best_dmg', String(dmg));

    const tier = getShipLootTierByDamage(dmg);
    const recordTag = isNewRecord ? ' 🏆 НОВЫЙ РЕКОРД!' : '';
    let report = [];

    if (tier.itemChance > 0 && Math.random() < tier.itemChance) {
        const sets = ['flame', 'abyss', 'storm', 'frost'];
        const pSlots = EQUIP_SLOTS.pet;
        const s = pSlots[Math.floor(Math.random() * pSlots.length)];
        const stKey = sets[Math.floor(Math.random() * sets.length)];
        const rar = rollWeighted6(tier.iW);
        const rMeta = RARITY_TIERS[rar] || RARITY_TIERS;

        const bag = getBagItems();
        bag.push({ owner: 'pet', slotKey: s.key, set: stKey, rarity: rar });
        saveBagItems(bag);
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`);
    }

    if (tier.gemChance > 0 && Math.random() < tier.gemChance) {
        const gems = getGemsList();
        const gKeys = Object.keys(GEMS_META);
        const gType = gKeys[Math.floor(Math.random() * gKeys.length)];
        const gRank = rollWeighted6(tier.gW);
        gems.push({ type: gType, rank: gRank });
        saveGemsList(gems);

        const rm = RARITY_TIERS[gRank] || RARITY_TIERS;
        const gm = GEMS_META[gType];
        report.push(`${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(gRank)})`);
    }

    if (report.length === 0) {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\nДля гарантированной вещи нужно нанести 500 урона!`);
    } else {
        alert(`ВЫЛЕТ ЗАВЕРШЁН!\nУрон: ${dmg.toLocaleString('ru-RU')}${recordTag}\nСнаряжение износилось (-10%).\n\nДобыто (в Рюкзак):\n• ${report.join('\n• ')}`);
    }
    if (typeof renderOwnerHubView === 'function') renderOwnerHubView('ship');
}
