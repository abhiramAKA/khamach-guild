/* ==========================================================================
   ОРДЕН КХАМАЧА — ТРОФЕИ ЗА ЗАХВАТ ГЕКСА ВО ВЛАДЕНИЯХ (v2.7.0-BETA)
   ========================================================================== */

function rollHexRarityByLandLevel(landLevel) {
    const r = Math.random() * 100;
    const bonus = Math.min(35, (landLevel - 1) * 5);
    if (r < 0.8 + bonus * 0.08) return 6;  // Мифический (крайне редкий)
    if (r < 3.0 + bonus * 0.25) return 5;  // Легендарный
    if (r < 10.0 + bonus * 0.5) return 4;  // Эпический
    if (r < 25.0 + bonus * 0.8) return 3;  // Редкий
    if (r < 52.0 + bonus)       return 2;  // Необычный
    return 1;                              // Обычный
}

function rollHexCaptureDrop(landLevel) {
    // Базовый шанс найти трофей в гексе: 25% + 5% за каждый уровень укреплений (до 70%)
    const dropChance = Math.min(0.70, 0.25 + (landLevel - 1) * 0.05);
    if (Math.random() >= dropChance) return null;

    const kindRoll = Math.random() * 100;
    const rar = rollHexRarityByLandLevel(landLevel);
    const rMeta = RARITY_TIERS[rar] || RARITY_TIERS;

    if (kindRoll < 45) {
        // Находка Металлолома
        const scrapGain = (2 + Math.floor(Math.random() * 4)) * rar;
        setScrapMetal(getScrapMetal() + scrapGain);
        return `🔩 Металлолом +${scrapGain}`;
    } else if (kindRoll < 72) {
        // Находка Самоцвета
        const gems = getGemsList();
        const gKeys = Object.keys(GEMS_META);
        const gType = gKeys[Math.floor(Math.random() * gKeys.length)];
        gems.push({ type: gType, rank: rar });
        saveGemsList(gems);
        const gm = GEMS_META[gType];
        return `${gm.icon} ${rMeta.name} ${gm.name} (+${rMeta.gemBonus})`;
    } else {
        // Находка экипировки (случайно для Питомца или Корабля)
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
}
