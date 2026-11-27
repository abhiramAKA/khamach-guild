/* ==========================================================================
   ОРДЕН КХАМАЧА — ДЕЙСТВИЯ: ВЫБОР КАМНЕЙ, ЧАР +5%, РЕМОНТ И ПОХОД (v2.5.0)
   ========================================================================== */

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
    alert(`Предмет улучшен до ${target.lvl} уровня! Открыто новое гнездо для самоцвета.`);
    renderGuildBagView();
}

function bagSalvageByRealIdx(realIdx) {
    const allBag = getBagItems();
    const picked = allBag[realIdx];
    if (!picked) return;

    const rarRank = picked.rarity || 1;
    const sMeta = EQUIP_SLOTS[picked.owner].find(s => s.key === picked.slotKey);
    const rMeta = RARITY_TIERS[rarRank] || RARITY_TIERS[1];

    if (!confirm(`Разобрать «${rMeta.name} ${sMeta.name}» на ${rMeta.itemScrap} 🔩 Металлолома?`)) return;

    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    setScrapMetal(getScrapMetal() + rMeta.itemScrap);
    renderGuildBagView();
}

function bagSalvageGemByIdx(gIdx) {
    const gems = getGemsList();
    const gem = gems[gIdx];
    if (!gem) return;

    const gm = GEMS_META[gem.type] || GEMS_META.amber;
    const rm = RARITY_TIERS[gem.rank] || RARITY_TIERS[1];

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

function openGemSelectMenu(owner, slotKey, socketIdx) {
    const gems = getGemsList();
    if (gems.length === 0) {
        alert("В рюкзаке нет свободных самоцветов. Добывайте их в полёте на Босса!");
        return;
    }
    setSubViewBack(`item:${owner}:${slotKey}`, '↩️ Назад к вещи');
    document.getElementById('sub-view-title').innerText = "💎 ВЫБОР САМОЦВЕТА";
    document.getElementById('sub-view-subtitle').innerText = `Гнездо #${socketIdx + 1} (старый камень при замене исчезнет)`;

    const grid = gems.map((g, gIdx) => {
        const gm = GEMS_META[g.type] || GEMS_META.amber;
        const rm = RARITY_TIERS[g.rank] || RARITY_TIERS[1];
        return `
            <div class="gem-tile rar-${rm.rank}" onclick="applyGemToSocket('${owner}','${slotKey}',${socketIdx},${gIdx})">
                <span style="font-size:22px;">${gm.icon}</span>
                <span style="font-size:9px; color:#fff; font-weight:bold;">+${rm.gemBonus}</span>
                <span style="font-size:8px; color:#e0e0e0;">${STAT_LABELS[gm.stat].split(' ')[1]}</span>
            </div>
        `;
    }).join('');

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box"><div class="gem-grid">${grid}</div></div>
    `;
}

function applyGemToSocket(owner, slotKey, socketIdx, gemBagIdx) {
    const gems = getGemsList();
    const chosen = gems[gemBagIdx];
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!chosen || !item) return;

    item.gems = item.gems || [];
    const existing = item.gems[socketIdx];
    if (existing) {
        if (!confirm("В этом гнезде уже стоит камень. При установке нового старый самоцвет бесследно исчезнет. Продолжить?")) return;
    }

    gems.splice(gemBagIdx, 1);
    saveGemsList(gems);
    item.gems[socketIdx] = chosen;
    saveEquipStorage(owner, equip);

    if (typeof renderItemDetailView === 'function') renderItemDetailView(owner, slotKey);
}

function openEnchantSelectMenu(owner, slotKey) {
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item) return;

    const cost = item.lvl * 10;
    const scrap = getScrapMetal();
    if (scrap < cost) return;

    setSubViewBack(`item:${owner}:${slotKey}`, '↩️ Назад к вещи');
    document.getElementById('sub-view-title').innerText = "✨ ВЫБОР ЧАР";
    document.getElementById('sub-view-subtitle').innerText = `Ранг чар: ${item.lvl} (+${item.lvl * 5}% к выбранному стату)`;

    const choices = ['atk', 'hp', 'reg'].map(st => `
        <button class="menu-btn purple-btn" onclick="applyChosenEnchant('${owner}','${slotKey}','${st}')">
            ${STAT_LABELS[st]} (+${item.lvl * 5}%) — ${cost} 🔩 Лома
        </button>
    `).join('');

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="display:flex; flex-direction:column; gap:8px;">
            <div style="font-size:11px; color:#cdb38c;">Доступно Металлолома: <strong>${scrap} 🔩</strong></div>
            ${choices}
        </div>
    `;
}

function applyChosenEnchant(owner, slotKey, statKey) {
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item) return;

    const cost = item.lvl * 10;
    const scrap = getScrapMetal();
    if (scrap < cost) return;

    if (!confirm(`Потратить ${cost} 🔩 Металлолома, чтобы наложить чары «${STAT_LABELS[statKey]} +${item.lvl * 5}%» (Ур.${item.lvl})?`)) return;

    setScrapMetal(scrap - cost);
    item.enchant = { stat: statKey, rank: item.lvl };
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
        const s = shipSlots[Math.floor(Math.random() * shipSlots.length)];
        const stKey = sets[Math.floor(Math.random() * sets.length)];
        const rar = rollPetTripRarity();
        const rMeta = RARITY_TIERS[rar] || RARITY_TIERS[1];
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
