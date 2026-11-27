/* ==========================================================================
   ОРДЕН КХАМАЧА — ЭКРАН ПИТОМЦА/КОРАБЛЯ СО ШКАЛОЙ ОПЫТА И УРОВНЕМ (v2.8.0)
   ========================================================================== */

function showOwnerHelpModal(owner) {
    if (owner === 'pet') {
        alert(
            "🌌 КОСМИЧЕСКОЕ ПУТЕШЕСТВИЕ ПИТОМЦА\n\n" +
            "Ваш питомец отправляется в неизведанные сектора Астрала на 1 час, обыскивая обломки древних дредноутов и заброшенные станции.\n\n" +
            "• Добыча: модули и обшивка для Корабля, а также 🧪 Зелья исцеления.\n" +
            "• Уровень Питомца: повышается при кормлении 🍖 Астральным Кормом (добывается во Владениях). Уровень Питомца открывает скрещивание его одежды до того же уровня!"
        );
    } else {
        alert(
            "🚀 ОХОТА НА АСТРАЛЬНОГО ЛЕВИАФАНА\n\n" +
            "Вы выводите Астральный Корабль на битву с древним чудищем Бездны. Каждые 10 секунд Босс выпускает неотвратимую Астральную Волну.\n\n" +
            "• Добыча: экипировка для Питомца и 💎 Самоцветы.\n" +
            "• Уровень Корабля: повышается при изучении 📐 Чертежей Инженеров (добываются во Владениях). Уровень Корабля открывает улучшение его модулей!"
        );
    }
}

function renderOwnerHubView(owner) {
    const isPet = owner === 'pet';
    setSubViewBack('main', 'Назад в Орден');
    document.getElementById('sub-view-title').innerText = isPet ? "🐉 ПИТОМЕЦ" : "🚀 КОРАБЛЬ";
    document.getElementById('sub-view-subtitle').innerText = isPet ? "Космические экспедиции" : "Охота на Бесконечного Босса";

    const body = document.getElementById('sub-view-body');
    const stats = calculateOwnerStats(owner);
    const power = getOwnerPowerScore(stats);
    const lvlInfo = getOwnerLevelInfo(owner);
    const tokens = getUpgradeTokens(owner);

    const xpPct = lvlInfo.lvl >= 7 ? 100 : Math.min(100, Math.round((lvlInfo.xp / lvlInfo.req) * 100));
    const xpText = lvlInfo.lvl >= 7 ? 'МАКС. УРОВЕНЬ (7)' : `Опыт: ${lvlInfo.xp} / ${lvlInfo.req}`;
    const feedBtnLabel = isPet
        ? `🍖 Покормить питомца (+25 опыта | в сумке: ${tokens})`
        : `📐 Изучить чертёж (+25 опыта | в сумке: ${tokens})`;

    let mainActionHTML = '';
    let statusLine = '';

    if (isPet) {
        const expStart = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        const dropCount = Math.max(1, Math.min(3, Math.floor(power / 55) + 1));
        statusLine = `Добыча за поход: <strong>до ${dropCount} модулей + 🧪 Зелье</strong>`;

        if (expStart > 0) {
            const elapsed = Date.now() - expStart;
            if (elapsed >= PET_EXPEDITION_MS) {
                mainActionHTML = `<button class="menu-btn green-btn" onclick="claimPetSpaceLoot()">🎁 ЗАБРАТЬ ДОБЫЧУ ИЗ ПОХОДА</button>`;
            } else {
                const rem = PET_EXPEDITION_MS - elapsed;
                const m = Math.floor(rem / 60000).toString().padStart(2, '0');
                const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
                mainActionHTML = `<div id="pet-exp-timer" style="text-align:center; color:#ffd700; font-weight:bold; padding:10px; border:1px dashed #8a7350; border-radius:4px;">⏱️ В походе: ${m}:${s}</div>`;
            }
        } else {
            mainActionHTML = `<button class="menu-btn green-btn" onclick="startPetSpaceTrip()">🌌 ОТПРАВИТЬ В ПРИКЛЮЧЕНИЕ (1 ЧАС)</button>`;
        }
    } else {
        const bestDmg = parseInt(localStorage.getItem('khamach_ship_best_dmg') || '0');
        const potions = getHealPotions();
        const petState = isPetOnExpedition()
            ? `<span style="color:#ffb3ba;">Питомец в походе (летите один)</span>`
            : `<span style="color:#2ecc71;">Питомец в строю (+статы)</span>`;
        statusLine = `🏆 Рекорд: <strong>${bestDmg.toLocaleString('ru-RU')}</strong> | 🧪 Зелий: <strong>${potions}</strong><br>${petState}`;
        mainActionHTML = `<button class="menu-btn purple-btn" onclick="triggerShipFlightSafe()">🚀 В ПОЛЁТ НА БОССА</button>`;
    }

    const feedButtonHTML = (lvlInfo.lvl < 7 && tokens > 0)
        ? `<button class="menu-btn green-btn" style="font-size:11px; padding:7px;" onclick="consumeOwnerToken('${owner}','hub')">${feedBtnLabel}</button>`
        : '';

    body.innerHTML = `
        <div class="card-box" style="text-align:center; padding:12px 10px; position:relative;">
            <button class="mini-btn" onclick="showOwnerHelpModal('${owner}')" style="position:absolute; top:8px; right:8px; font-size:12px; padding:4px 8px;">❓</button>
            <div style="font-size:48px; line-height:1; margin-bottom:4px;">${isPet ? '🐲' : '🚀'}</div>
            <div style="font-size:14px; font-weight:bold; color:#ffd700;">Уровень ${lvlInfo.lvl} / 7 | Мощь: ⚡ ${power}</div>
            <div style="font-size:10px; color:#8cd1ff; margin:3px 0;">${xpText}</div>
            <div style="width:85%; height:8px; background:#14100e; border:1px solid #544432; border-radius:4px; margin:0 auto 8px auto; overflow:hidden;">
                <div style="width:${xpPct}%; height:100%; background:linear-gradient(to right, #4da6ff, #ffd700);"></div>
            </div>
            <div style="font-size:11px; color:#cdb38c; line-height:1.4; margin-bottom:10px;">${statusLine}</div>
            <div style="display:flex; flex-direction:column; gap:7px;">
                ${mainActionHTML}
                ${feedButtonHTML}
                <button class="menu-btn" onclick="renderOwnerGearConfig('${owner}')">⚙️ Характеристики и Снаряжение</button>
            </div>
        </div>
    `;

    if (isPet && isPetOnExpedition() && typeof startPetExpTicker === 'function') startPetExpTicker();
}

function triggerShipFlightSafe() {
    if (typeof window.launchShipRaidView === 'function') {
        window.launchShipRaidView();
        return;
    }
    const ft = document.getElementById('guild-version-footer');
    alert("Полёт не запустился. Причина:\n" + (ft ? ft.innerText : 'Ошибка загрузки'));
}

function renderOwnerGearConfig(owner) {
    const isPet = owner === 'pet';
    setSubViewBack(owner, isPet ? '↩️ Назад к Питомцу' : '↩️ Назад к Кораблю');
    const lvlInfo = getOwnerLevelInfo(owner);
    document.getElementById('sub-view-title').innerText = isPet ? "⚙️ СНАРЯЖЕНИЕ ПИТОМЦА" : "⚙️ МОДУЛИ КОРАБЛЯ";
    document.getElementById('sub-view-subtitle').innerText = `Макс. уровень вещей: Ур.${lvlInfo.lvl} (зависит от уровня владельца)`;

    const body = document.getElementById('sub-view-body');
    const stats = calculateOwnerStats(owner);
    const equip = getEquipStorage(owner);
    const slotsHTML = typeof buildOwnerSlotsHTML === 'function' ? buildOwnerSlotsHTML(owner, equip) : '';

    body.innerHTML = `
        <div class="card-box">
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:4px; background:rgba(0,0,0,0.5); padding:6px; border-radius:3px; font-size:11px; text-align:center;">
                <div>⚔️ Атака<br><strong>${stats.atk}</strong></div>
                <div>❤️ Жизнь<br><strong>${stats.hp}</strong></div>
                <div>💚 Реген<br><strong>${stats.reg}</strong></div>
            </div>
        </div>
        <div class="gear-grid">${slotsHTML}</div>
    `;
}
