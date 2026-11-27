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

function rollWeighted6Str(weightsStr) {
    const w = weightsStr.split(',').map(Number);
    const r = Math.random() * 100;
    let acc = 0;
    for (let i = 0; i < 6; i++) {
        acc += (w[i] || 0);
        if (r < acc) return i + 1;
    }
    return 1;
}

function getShipLootTierByDamage(damageDealt) {
    if (damageDealt >= 9000) {
        return { label: 'Тир 5: 🎁🟪-🟥 + 💎100%', itemChance: 1.0, iW: '0,0,15,40,35,10', gemChance: 1.0, gW: '0,0,15,40,35,10', nextGoal: 0 };
    }
    if (damageDealt >= 5500) {
        return { label: 'Тир 4: 🎁🟦-🟨 + 💎80%', itemChance: 1.0, iW: '0,15,40,30,15,0', gemChance: 0.80, gW: '0,20,40,25,15,0', nextGoal: 9000 };
    }
    if (damageDealt >= 3000) {
        return { label: 'Тир 3: 🎁🟩-🟪 + 💎50%', itemChance: 1.0, iW: '15,40,30,15,0,0', gemChance: 0.50, gW: '25,45,20,10,0,0', nextGoal: 5500 };
    }
    if (damageDealt >= 1400) {
        return { label: 'Тир 2: 🎁⬜-🟦 + 💎25%', itemChance: 1.0, iW: '45,40,15,0,0,0', gemChance: 0.25, gW: '65,35,0,0,0,0', nextGoal: 3000 };
    }
    if (damageDealt >= 500) {
        return { label: 'Тир 1: 🎁⬜-🟩 (100%)', itemChance: 1.0, iW: '75,25,0,0,0,0', gemChance: 0, gW: '100,0,0,0,0,0', nextGoal: 1400 };
    }
    return { label: 'Цель: 500 урона', itemChance: 0, iW: '100,0,0,0,0,0', gemChance: 0, gW: '100,0,0,0,0,0', nextGoal: 500 };
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
        const rar = rollWeighted6Str(tier.iW);
        const rMeta = RARITY_TIERS[rar] || RARITY_TIERS[1];

        const bag = getBagItems();
        bag.push({ owner: 'pet', slotKey: s.key, set: stKey, rarity: rar });
        saveBagItems(bag);
        report.push(`${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`);
    }

    if (tier.gemChance > 0 && Math.random() < tier.gemChance) {
        const gems = getGemsList();
        const gKeys = Object.keys(GEMS_META);
        const gType = gKeys[Math.floor(Math.random() * gKeys.length)];
        const gRank = rollWeighted6Str(tier.gW);
        gems.push({ type: gType, rank: gRank });
        saveGemsList(gems);

        const rm = RARITY_TIERS[gRank] || RARITY_TIERS[1];
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
