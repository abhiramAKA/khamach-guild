/* ==========================================================================
   ОРДЕН КХАМАЧА — ЛЁГКИЙ ЭКРАН ПИТОМЦА/КОРАБЛЯ И СЕТКА СНАРЯЖЕНИЯ (v2.4.1)
   ========================================================================== */

function renderOwnerHubView(owner) {
    const isPet = owner === 'pet';
    setSubViewBack('main', 'Назад в Орден');
    document.getElementById('sub-view-title').innerText = isPet ? "🐉 ПИТОМЕЦ" : "🚀 КОРАБЛЬ";
    document.getElementById('sub-view-subtitle').innerText = isPet ? "Космические экспедиции" : "Охота на Бесконечного Босса";

    const body = document.getElementById('sub-view-body');
    const stats = calculateOwnerStats(owner);
    const power = getOwnerPowerScore(stats);

    let mainActionHTML = '';
    let statusLine = '';

    if (isPet) {
        const expStart = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        const dropCount = Math.max(1, Math.min(3, Math.floor(power / 55) + 1));
        statusLine = `Добыча за поход: <strong>до ${dropCount} обломков + 🧪 Зелье</strong>`;

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

    body.innerHTML = `
        <div class="card-box" style="text-align:center; padding:14px 10px;">
            <div style="font-size:56px; line-height:1; margin-bottom:6px;">${isPet ? '🐲' : '🚀'}</div>
            <div style="font-size:15px; font-weight:bold; color:#ffd700; margin-bottom:4px;">Боевая Мощь: ⚡ ${power}</div>
            <div style="font-size:11px; color:#cdb38c; line-height:1.45; margin-bottom:12px;">${statusLine}</div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                ${mainActionHTML}
                <button class="menu-btn" onclick="renderOwnerGearConfig('${owner}')">⚙️ Характеристики и Снаряжение</button>
            </div>
        </div>
    `;

    if (isPet && isPetOnExpedition() && typeof startPetExpTicker === 'function') {
        startPetExpTicker();
    }
}

function triggerShipFlightSafe() {
    if (typeof window.launchShipRaidView === 'function') {
        window.launchShipRaidView();
        return;
    }
    const ft = document.getElementById('guild-version-footer');
    const errInfo = ft ? ft.innerText : 'Неизвестная ошибка загрузки скриптов';
    alert("Полёт не запустился. Причина:\n" + errInfo);
}

function renderOwnerGearConfig(owner) {
    const isPet = owner === 'pet';
    setSubViewBack(owner, isPet ? '↩️ Назад к Питомцу' : '↩️ Назад к Кораблю');
    document.getElementById('sub-view-title').innerText = isPet ? "⚙️ СНАРЯЖЕНИЕ ПИТОМЦА" : "⚙️ МОДУЛИ КОРАБЛЯ";
    document.getElementById('sub-view-subtitle').innerText = "Нажмите на ячейку для осмотра и улучшения";

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
        <div class="gear-grid">
            ${slotsHTML}
        </div>
    `;
}
