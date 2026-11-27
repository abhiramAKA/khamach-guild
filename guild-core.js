/* ==========================================================================
   ОРДЕН КХАМАЧА — ЯДРО СИНХРОНИЗАЦИИ С ОСНОВНОЙ ЦИТАДЕЛЬЮ (v1.0.0-ALPHA)
   ========================================================================== */

const MAIN_HUB_RETURN_URL = '../khamach/hub.html';

function getSharedSquadLevel() {
    const t = parseInt(localStorage.getItem('khamach_hero_lvl_tank') || '1');
    const d = parseInt(localStorage.getItem('khamach_hero_lvl_damage') || '1');
    const a = parseInt(localStorage.getItem('khamach_hero_lvl_archer') || '1');
    const m = parseInt(localStorage.getItem('khamach_hero_lvl_mage') || '1');
    return Math.floor((t + d + a + m) / 4);
}

function getSharedResources() {
    return {
        gold: parseInt(localStorage.getItem('khamach_gold') || '0'),
        ore:  parseInt(localStorage.getItem('khamach_dragon_ore') || '0'),
        coal: parseInt(localStorage.getItem('khamach_res_coal') || '0'),
        ice:  parseInt(localStorage.getItem('khamach_res_ice') || '0'),
        dark: parseInt(localStorage.getItem('khamach_res_dark') || '0'),
        dust: parseInt(localStorage.getItem('khamach_res_dust') || '0')
    };
}

function renderGuildHeaderStats() {
    const lvl = getSharedSquadLevel();
    const res = getSharedResources();

    const lvlBadge = document.getElementById('guild-lvl-badge');
    if (lvlBadge) lvlBadge.innerText = `👑 ${lvl}`;

    const resBar = document.getElementById('guild-resources-bar');
    if (resBar) {
        resBar.innerHTML = `
            <span style="color:#ffd700;">🪙 ${res.gold.toLocaleString('ru-RU')}</span> |
            <span>🪨 ${res.ore}</span>
            <span>🔥 ${res.coal}</span>
            <span>❄️ ${res.ice}</span>
            <span>🔮 ${res.dark}</span>
            <span>✨ ${res.dust}</span>
        `;
    }
}

function openGuildView(viewKey) {
    const mainScr = document.getElementById('guild-main-screen');
    const subScr = document.getElementById('guild-sub-screen');
    if (mainScr) mainScr.style.display = 'none';
    if (subScr) subScr.style.display = 'flex';

    if (typeof renderGuildSubView === 'function') {
        renderGuildSubView(viewKey);
    }
}

function closeGuildView() {
    const mainScr = document.getElementById('guild-main-screen');
    const subScr = document.getElementById('guild-sub-screen');
    if (subScr) subScr.style.display = 'none';
    if (mainScr) mainScr.style.display = 'flex';
    renderGuildHeaderStats();
}

function initGuildModule() {
    renderGuildHeaderStats();

    const footer = document.getElementById('guild-version-footer');
    if (footer) footer.innerText = `Орден Кхамача | Сборка ${window.GUILD_VERSION || 'v1.0.0'}`;

    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = MAIN_HUB_RETURN_URL + '?t=' + Date.now();
        };
    }
}
