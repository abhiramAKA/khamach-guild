/* ==========================================================================
   ОРДЕН КХАМАЧА — ТРОФЕИ ВЛАДЕНИЙ И ЛИМИТ РЮКЗАКА НА КОРМ/ЧЕРТЕЖИ (v2.8.1)
   ========================================================================== */

function rollHexRarityByLandLevel(landLevel, scoutLvl) {
    const r = Math.random() * 100;
    const bonus = Math.min(45, (landLevel - 1) * 4 + scoutLvl * 3);
    if (r < 0.8 + bonus * 0.08) return 6;
    if (r < 3.0 + bonus * 0.25) return 5;
    if (r < 10.0 + bonus * 0.5) return 4;
    if (r < 25.0 + bonus * 0.8) return 3;
    if (r < 52.0 + bonus)       return 2;
    return 1;
}

function rollHexCaptureDrop(landLevel, scoutLvl, isChieftain) {
    const dropChance = isChieftain
        ? 1.0
        : Math.min(0.85, 0.28 + (landLevel - 1) * 0.04 + scoutLvl * 0.05);
    if (Math.random() >= dropChance) return null;

    const kindRoll = Math.random() * 100;
    const rar = rollHexRarityByLandLevel(landLevel, scoutLvl);
    const rMeta = RARITY_TIERS[rar] || RARITY_TIERS;

    if (kindRoll < (isChieftain ? 35 : 22)) {
        const curFood = getUpgradeTokens('pet');
        if (curFood >= MAX_UPGRADE_TOKENS) {
            return `⚠️ Найден 🍖 Астральный Корм, но в Рюкзаке уже максимум (${MAX_UPGRADE_TOKENS}/${MAX_UPGRADE_TOKENS})! Покормите питомца, чтобы освободить место.`;
        }
        setUpgradeTokens('pet', curFood + 1);
        return `🍖 Астральный Корм (${curFood + 1}/${MAX_UPGRADE_TOKENS} в сумке)`;
    }

    if (kindRoll < (isChieftain ? 70 : 44)) {
        const curBp = getUpgradeTokens('ship');
        if (curBp >= MAX_UPGRADE_TOKENS) {
            return `⚠️ Найден 📐 Чертёж Инженеров, но в Рюкзаке уже максимум (${MAX_UPGRADE_TOKENS}/${MAX_UPGRADE_TOKENS})! Изучите чертежи в Корабле, чтобы освободить место.`;
        }
        setUpgradeTokens('ship', curBp + 1);
        return `📐 Чертёж Инженеров (${curBp + 1}/${MAX_UPGRADE_TOKENS} в сумке)`;
    }

    if (kindRoll < 72) {
        const scrapGain = (3 + Math.floor(Math.random() * 4)) * rar;
        setScrapMetal(getScrapMetal() + scrapGain);
        return `🔩 Металлолом +${scrapGain}`;
    }

    if (kindRoll < 86) {
        const gems = getGemsList();
        const gKeys = Object.keys(GEMS_META);
        const gType = gKeys[Math.floor(Math.random() * gKeys.length)];
        gems.push({ type: gType, rank: rar });
        saveGemsList(gems);
        const gm = GEMS_META[gType];
        return `${gm.icon} ${rMeta.name} ${gm.name} (+${rMeta.gemBonus})`;
    }

    const owner = Math.random() < 0.5 ? 'pet' : 'ship';
    const ownerTag = owner === 'pet' ? '🐉' : '🚀';
    const slots = EQUIP_SLOTS[owner];
    const sets = ['flame', 'abyss', 'storm', 'frost'];
    const s = slots[Math.floor(Math.random() * slots.length)];
    const stKey = sets[Math.floor(Math.random() * sets.length)];

    const bag = getBagItems();
    bag.push({ owner: owner, slotKey: s.key, set: stKey, rarity: rar });
    saveBagItems(bag);
    return `${ownerTag} ${rMeta.tag} ${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] (${rMeta.name})`;
}
