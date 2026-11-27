/* ==========================================================================
   ОРДЕН КХАМАЧА — ЯДРО СИНХРОНИЗАЦИИ И ЭКСПЕДИЦИИ ПИТОМЦА (v1.2.0-BETA)
   ========================================================================== */

const MAIN_HUB_RETURN_URL = '../khamach/hub.html';
const PET_EXPEDITION_MS = 3600000; // 1 час
let activeGuildTimer = null;

function initGuildStorageDefaults() {
    if (!localStorage.getItem('khamach_guild_v2_init')) {
        localStorage.setItem('khamach_guild_v2_init', 'true');
        localStorage.setItem('khamach_astral_dust', '10'); // Стартовый прах для Шамана

        // Стартовый базовый сет 1 ур. для Питомца и Корабля (0 гнёзд под камни)
        saveEquipStorage('pet', {
            claw: { lvl: 1, set: 'flame', gems: [], enchant: null }
        });
        saveEquipStorage('ship', {
            cannon: { lvl: 1, set: 'flame', gems: [], enchant: null },
            hull:   { lvl: 1, set: 'flame', gems: [], enchant: null }
        });
        saveBagItems([]);
        saveGemsStorage({ ruby: 1, emerald: 1, sapphire: 0, topaz: 0 });
    }
}

function isPetOnExpedition() {
    return parseInt(localStorage.getItem('khamach_pet_exp_start') || '0') > 0;
}

function getSharedSquadLevel() {
    const t = parseInt(localStorage.getItem('khamach_hero_lvl_tank') || '1');
    const d = parseInt(localStorage.getItem('khamach_hero_lvl_damage') || '1');
    const a = parseInt(localStorage.getItem('khamach_hero_lvl_archer') || '1');
    const m = parseInt(localStorage.getItem('khamach_hero_lvl_mage') || '1');
    return Math.floor((t + d + a + m) / 4);
}

function renderGuildHeaderStats() {
    const lvl = getSharedSquadLevel();
    const gold = parseInt(localStorage.getItem('khamach_gold') || '0');
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    const gems = getGemsStorage();

    const lvlBadge = document.getElementById('guild-lvl-badge');
    if (lvlBadge) lvlBadge.innerText = `👑 ${lvl}`;

    const resBar = document.getElementById('guild-resources-bar');
    if (resBar) {
        resBar.innerHTML = `
            <span style="color:#ffd700;">🪙 ${gold.toLocaleString('ru-RU')}</span> |
            <span style="color:#e58cff;">✨ Прах: ${dust}</span> |
            <span>🔴${gems.ruby} 🟢${gems.emerald} 🔵${gems.sapphire} 🟡${gems.topaz}</span>
        `;
    }
}

function openGuildView(viewKey) {
    if (activeGuildTimer) { clearInterval(activeGuildTimer); activeGuildTimer = null; }
    if (typeof stopShipMinigame === 'function') stopShipMinigame();

    document.getElementById('guild-main-screen').style.display = 'none';
    document.getElementById('guild-sub-screen').style.display = 'flex';

    if (viewKey === 'pet' && typeof renderOwnerEquipView === 'function') renderOwnerEquipView('pet');
    else if (viewKey === 'ship' && typeof renderOwnerEquipView === 'function') renderOwnerEquipView('ship');
    else if (viewKey === 'shaman' && typeof renderShamanSection === 'function') renderShamanSection();
    else if (viewKey === 'skills') renderSkillsSection();
}

function closeGuildView() {
    if (activeGuildTimer) { clearInterval(activeGuildTimer); activeGuildTimer = null; }
    if (typeof stopShipMinigame === 'function') stopShipMinigame();

    document.getElementById('guild-sub-screen').style.display = 'none';
    document.getElementById('guild-main-screen').style.display = 'flex';
    renderGuildHeaderStats();
}

function renderSkillsSection() {
    document.getElementById('sub-view-title').innerText = "🌳 ДРЕВО НАВЫКОВ";
    document.getElementById('sub-view-subtitle').innerText = "Перки Цитадели, Ратуши и Удачи";
    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box">
            <strong style="color:#ffd700;">📜 Торговая Гильдия (В разработке)</strong>
            <p style="margin:6px 0; font-size:11px; line-height:1.4;">Множитель выплат золота в Ратуше (x1.00 — x50.00) за пещерную руду.</p>
        </div>
        <div class="card-box">
            <strong style="color:#2ecc71;">🍀 Благословение Искателя (В разработке)</strong>
            <p style="margin:6px 0; font-size:11px; line-height:1.4;">Повышает шанс найти редкие камни и дополнительную добычу.</p>
        </div>
    `;
}

function initGuildModule() {
    initGuildStorageDefaults();
    renderGuildHeaderStats();

    const footer = document.getElementById('guild-version-footer');
    if (footer) footer.innerText = `Орден Кхамача | Сборка ${window.GUILD_VERSION || 'v1.2.0-BETA'}`;

    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = MAIN_HUB_RETURN_URL + '?t=' + Date.now();
        };
    }
}
