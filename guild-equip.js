/* ==========================================================================
   ОРДЕН КХАМАЧА — ОСНОВНОЙ ЭКРАН ПИТОМЦА И КОРАБЛЯ (v1.9.1-BETA)
   ========================================================================== */

function renderOwnerEquipView(owner) {
    const isPet = owner === 'pet';
    document.getElementById('sub-view-title').innerText = isPet ? "🐉 ПИТОМЕЦ ОРДЕНА" : "🚀 АСТРАЛЬНЫЙ КОРАБЛЬ";
    document.getElementById('sub-view-subtitle').innerText = isPet ? "6 слотов, Ремонт и Космический Поход" : "6 модулей, Ремонт и Полёт на Босса";

    const body = document.getElementById('sub-view-body');
    const stats = calculateOwnerStats(owner);
    const power = getOwnerPowerScore(stats);
    const equip = getEquipStorage(owner);
    const bag = getBagItems().filter(b => b.owner === owner);
    const gems = getGemsList();
    const potions = getHealPotions();
    const scrap = getScrapMetal();

    let topActionHTML = '';
    if (isPet) {
        const expStart = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        const dropCount = Math.max(1, Math.min(3, Math.floor(power / 55) + 1));
        if (expStart > 0) {
            const elapsed = Date.now() - expStart;
            if (elapsed >= PET_EXPEDITION_MS) {
                topActionHTML = `<button class="menu-btn green-btn" onclick="claimPetSpaceLoot()">🎁 ЗАБРАТЬ ДОБЫЧУ ИЗ КОСМОСА (до ${dropCount} предм. + 🧪)</button>`;
            } else {
                const rem = PET_EXPEDITION_MS - elapsed;
                const m = Math.floor(rem / 60000).toString().padStart(2, '0');
                const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
                topActionHTML = `<div id="pet-exp-timer" style="text-align:center; color:#ffd700; font-weight:bold; padding:7px; border:1px dashed #8a7350;">⏱️ В походе: ${m}:${s} (В бою с Боссом не помогает)</div>`;
            }
        } else {
            topActionHTML = `<button class="menu-btn green-btn" onclick="startPetSpaceTrip()">🌌 ОТПРАВИТЬ В ПОХОД НА 1 ЧАС (до ${dropCount} шт. + 🧪)</button>`;
        }
    } else {
        const bestDmg = parseInt(localStorage.getItem('khamach_ship_best_dmg') || '0');
        const petNote = isPetOnExpedition()
            ? `<div style="font-size:10px; color:#ffb3ba; margin-bottom:5px;">⚠️ Питомец в походе — Корабль летит один! | 🧪 Зелий: ${potions}</div>`
            : `<div style="font-size:10px; color:#2ecc71; margin-bottom:5px;">✅ Питомец дома (статы складываются) | 🧪 Зелий: ${potions}</div>`;
        topActionHTML = `<div style="font-size:11px; color:#ffd700; margin-bottom:3px;">🏆 Рекорд урона: <strong>${bestDmg.toLocaleString('ru-RU')}</strong></div>${petNote}<button class="menu-btn purple-btn" onclick="window.launchShipRaidView()">🚀 В ПОЛЁТ НА БОССА</button>`;
    }

    const slotsHTML = typeof buildOwnerSlotsHTML === 'function' ? buildOwnerSlotsHTML(owner, equip, gems, scrap) : '';
    const bagHTML = typeof buildOwnerBagHTML === 'function' ? buildOwnerBagHTML(owner, bag, equip) : '';
    const skillsHTML = typeof buildActiveSkillsHTML === 'function' ? buildActiveSkillsHTML(stats.setCounts) : '';

    const gemsSummary = gems.length === 0
        ? 'Нет'
        : gems.slice(0, 6).map(g => `${GEMS_META[g.type].icon}${GEM_RARITIES[g.rank].tag}+${getGemBonusValue(g.type, g.rank)}`).join(' ');

    body.innerHTML = `
        <div class="card-box">
            <div style="display:flex; justify-content:space-between; font-weight:bold; color:#ffd700; font-size:12px;">
                <span>Общая Мощь: ⚡ ${power}</span><span style="color:#cdb38c;">🔩 Лом: ${scrap}</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:4px; background:rgba(0,0,0,0.5); padding:6px; border-radius:3px; font-size:11px; margin:5px 0; text-align:center;">
                <div>⚔️ Атака<br><strong>${stats.atk}</strong></div>
                <div>❤️ Жизнь<br><strong>${stats.hp}</strong></div>
                <div>💚 Реген<br><strong>${stats.reg}</strong></div>
            </div>
            <div style="background:rgba(15,12,20,0.7); border:1px dashed #4a3f2c; padding:5px 7px; border-radius:3px; font-size:10px; margin-bottom:6px; line-height:1.4;">
                <strong style="color:#e6c280;">⚡ Умения от целых вещей:</strong><br>${skillsHTML}
            </div>
            ${topActionHTML}
        </div>
        <div class="card-box">
            <div style="font-weight:bold; color:#e6c280; font-size:11px; margin-bottom:2px;">НАДЕТОЕ СНАРЯЖЕНИЕ (Макс. Ур. 7)</div>
            <div style="font-size:10px; color:#8cd1ff; margin-bottom:4px;">Камни (${gems.length}): ${gemsSummary}</div>
            ${slotsHTML}
        </div>
        <div class="card-box">
            <div style="font-weight:bold; color:#e6c280; font-size:11px; margin-bottom:4px;">РЮКЗАК ДОБЫЧИ (${bag.length})</div>
            ${bagHTML}
        </div>
    `;

    if (isPet && isPetOnExpedition() && typeof startPetExpTicker === 'function') startPetExpTicker();
}
