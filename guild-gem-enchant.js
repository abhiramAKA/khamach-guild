/* ==========================================================================
   ОРДЕН КХАМАЧА — ВЫБОР САМОЦВЕТОВ И ЧАР (+5/РАНГ, БЕЗ ПОВТОРА АКТИВНОЙ) (v2.10)
   ========================================================================== */

function openGemSelectMenu(owner, slotKey, socketIdx) {
    const gems = getGemsList();
    if (gems.length === 0) {
        alert("В рюкзаке нет свободных самоцветов. Добывайте их в полёте на Босса!");
        return;
    }
    setSubViewBack(`item:${owner}:${slotKey}`, '↩️ Назад к вещи');
    document.getElementById('sub-view-title').innerText = "💎 ВЫБОР САМОЦВЕТА";
    document.getElementById('sub-view-subtitle').innerText = `Гнездо #${socketIdx + 1} (старый камень при замене исчезнет)`;

    const shortRar = { 1: 'Обыч.', 2: 'Необыч.', 3: 'Редкий', 4: 'Эпич.', 5: 'Легенд.', 6: 'Мифич.' };

    const grid = gems.map((g, gIdx) => {
        const gm = GEMS_META[g.type] || GEMS_META.amber;
        const rm = RARITY_TIERS[g.rank] || RARITY_TIERS;
        return `
            <div class="gem-tile rar-${rm.rank}" onclick="applyGemToSocket('${owner}','${slotKey}',${socketIdx},${gIdx})" title="${rm.name} ${gm.name}">
                <span style="font-size:20px; line-height:1;">${gm.icon}</span>
                <span style="font-size:9px; color:#fff; font-weight:bold;">+${rm.gemBonus} ${STAT_LABELS[gm.stat].split(' ').at(0)}</span>
                <span style="font-size:8px; color:#e6c280;">${shortRar[rm.rank] || rm.name}</span>
            </div>
        `;
    }).join('');

    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box"><div class="gem-grid">${grid}</div></div>
    `;
}

function applyGemToSocket(owner, slotKey, socketIdx, gemBagIdx) {
    const gems = getGemsList();
    const chosen = gems.at(gemBagIdx);
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!chosen || !item) return;

    item.gems = item.gems || [];
    const existing = item.gems.at(socketIdx);
    if (existing) {
        if (!confirm("В этом гнезде уже стоит камень. При установке нового старый самоцвет бесследно исчезнет. Продолжить?")) return;
    }

    gems.splice(gemBagIdx, 1);
    saveGemsList(gems);
    item.gems.splice(socketIdx, 1, chosen);
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
    document.getElementById('sub-view-subtitle').innerText = `Ранг чар: ${item.lvl} (+${item.lvl * 5} к выбранной характеристике)`;

    const curStat = (item.enchant && item.enchant.rank >= item.lvl) ? item.enchant.stat : '';

    const choices = ['atk', 'hp', 'reg'].map(st => {
        if (st === curStat) {
            return `<button class="menu-btn disabled-btn" disabled>${STAT_LABELS[st]} (+${item.lvl * 5}) — ✅ Уже активно</button>`;
        }
        return `<button class="menu-btn purple-btn" onclick="applyChosenEnchant('${owner}','${slotKey}','${st}')">${STAT_LABELS[st]} (+${item.lvl * 5}) — ${cost} 🔩 Лома</button>`;
    }).join('');

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

    if (item.enchant && item.enchant.rank >= item.lvl && item.enchant.stat === statKey) return;

    const cost = item.lvl * 10;
    const scrap = getScrapMetal();
    if (scrap < cost) return;

    if (!confirm(`Потратить ${cost} 🔩 Металлолома, чтобы наложить чары «${STAT_LABELS[statKey]} +${item.lvl * 5}» (Ур.${item.lvl})?`)) return;

    setScrapMetal(scrap - cost);
    item.enchant = { stat: statKey, rank: item.lvl };
    saveEquipStorage(owner, equip);

    if (typeof renderItemDetailView === 'function') renderItemDetailView(owner, slotKey);
}
