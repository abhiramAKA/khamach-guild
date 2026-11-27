/* ==========================================================================
   ОРДЕН КХАМАЧА — ШАМАН НАЛОЖЕНИЯ И ПЕРЕКОВКИ ЧАР (v1.2.1-BETA)
   ========================================================================== */

function renderShamanSection() {
    document.getElementById('sub-view-title').innerText = "🔮 ШАМАН ОРДЕНА";
    document.getElementById('sub-view-subtitle').innerText = "Наложение Чар за Астральный Прах";

    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    const body = document.getElementById('sub-view-body');

    let listHTML = '';
    ['ship', 'pet'].forEach(owner => {
        const equip = getEquipStorage(owner);
        const prefix = owner === 'ship' ? '🚀 Корабль' : '🐉 Питомец';
        EQUIP_SLOTS[owner].forEach(slot => {
            const item = equip[slot.key];
            if (!item || item.lvl < 1) return;
            const rank = item.enchant ? item.enchant.rank : 0;
            const cost = (rank + 1) * 10;
            const canEnch = rank < 5 && dust >= cost;
            const curLabel = item.enchant ? `${STAT_LABELS[item.enchant.stat]} (+${rank * 12}%)` : 'Нет чар';

            listHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 0; border-bottom:1px dashed #3a3025; font-size:11px;">
                    <div>
                        <strong style="color:#e6c280;">${prefix}: ${slot.icon} ${slot.name} Ур.${item.lvl}</strong><br>
                        <span style="color:#e58cff;">${curLabel}</span>
                    </div>
                    <button class="mini-btn ${canEnch ? 'purple-btn' : 'disabled-btn'}" onclick="enchantEquipItem('${owner}','${slot.key}')">
                        ✨ Чары (${cost})
                    </button>
                </div>
            `;
        });
    });

    body.innerHTML = `
        <div class="card-box">
            <div style="color:#e58cff; font-weight:bold; margin-bottom:4px;">✨ Доступно Астрального Праха: ${dust}</div>
            <div style="font-size:11px; color:#bfae96;">Шаман усиливает одну случайную боевую характеристику вещи (+12% за ранг, макс. 5 ранг). Прах добывается при разборке лишних вещей в рюкзаке.</div>
        </div>
        <div class="card-box">${listHTML}</div>
    `;
}

function enchantEquipItem(owner, slotKey) {
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item) return;

    const rank = item.enchant ? item.enchant.rank : 0;
    const cost = (rank + 1) * 10;
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    if (rank >= 5 || dust < cost) return;

    const statsKeys = ['atk', 'hp', 'def', 'reg'];
    const chosenStat = statsKeys[Math.floor(Math.random() * statsKeys.length)];

    localStorage.setItem('khamach_astral_dust', String(dust - cost));
    item.enchant = { stat: chosenStat, rank: rank + 1 };
    saveEquipStorage(owner, equip);

    renderGuildHeaderStats();
    renderShamanSection();
}
