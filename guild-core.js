/* ==========================================================================
   ОРДЕН КХАМАЧА — ЯДРО СИНХРОНИЗАЦИИ И НАВИГАЦИИ (v2.0.0-BETA)
   ========================================================================== */

const MAIN_HUB_RETURN_URL = '../khamach/hub.html';
const PET_EXPEDITION_MS = 3600000;
let activeGuildTimer = null;
window.currentSubBackTarget = 'main';

function initGuildStorageDefaults() {
    if (!localStorage.getItem('khamach_guild_v3_init')) {
        localStorage.setItem('khamach_guild_v3_init', 'true');
        localStorage.setItem('khamach_astral_dust', '15');
        setScrapMetal(15);
        setHealPotions(2);

        saveEquipStorage('pet', {
            claw: { lvl: 1, set: 'flame', rarity: 1, durability: 100, gems: [], enchant: null }
        });
        saveEquipStorage('ship', {
            cannon: { lvl: 1, set: 'flame', rarity: 1, durability: 100, gems: [], enchant: null },
            hull:   { lvl: 1, set: 'frost', rarity: 1, durability: 100, gems: [], enchant: null }
        });
        saveBagItems([]);
        saveGemsList([
            { type: 'ruby', rank: 1 },
            { type: 'emerald', rank: 1 },
            { type: 'topaz', rank: 2 }
        ]);
    }
    if (localStorage.getItem('khamach_scrap_metal') === null) setScrapMetal(15);
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
    const scrap = getScrapMetal();
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    const gems = getGemsList();
    const potions = getHealPotions();

    const lvlBadge = document.getElementById('guild-lvl-badge');
    if (lvlBadge) lvlBadge.innerText = `👑 ${lvl}`;

    const resBar = document.getElementById('guild-resources-bar');
    if (resBar) {
        resBar.innerHTML = `
            <span style="color:#cdb38c;">🔩 Лом: ${scrap}</span> |
            <span style="color:#e58cff;">✨ Прах: ${dust}</span> |
            <span style="color:#8cd1ff;">💎 ${gems.length}</span> |
            <span style="color:#2ecc71;">🧪 ${potions}</span>
        `;
    }
}

function setSubViewBack(target, label) {
    window.currentSubBackTarget = target;
    const btn = document.getElementById('sub-view-back-btn');
    if (btn) btn.innerText = label || 'Назад в Орден';
}

function openGuildView(viewKey) {
    if (activeGuildTimer) { clearInterval(activeGuildTimer); activeGuildTimer = null; }
    if (typeof window.stopShipMinigame === 'function') window.stopShipMinigame();

    document.getElementById('guild-main-screen').style.display = 'none';
    document.getElementById('guild-sub-screen').style.display = 'flex';
    setSubViewBack('main', 'Назад в Орден');

    if (viewKey === 'pet' && typeof renderOwnerHubView === 'function') renderOwnerHubView('pet');
    else if (viewKey === 'ship' && typeof renderOwnerHubView === 'function') renderOwnerHubView('ship');
    else if (viewKey === 'bag' && typeof renderGuildBagView === 'function') renderGuildBagView();
    else if (viewKey === 'skills') renderSkillsSection();
}

function closeGuildView() {
    if (activeGuildTimer) { clearInterval(activeGuildTimer); activeGuildTimer = null; }
    if (typeof window.stopShipMinigame === 'function') window.stopShipMinigame();

    if (window.currentSubBackTarget === 'pet' && typeof renderOwnerHubView === 'function') {
        setSubViewBack('main', 'Назад в Орден');
        renderOwnerHubView('pet');
        return;
    }
    if (window.currentSubBackTarget === 'ship' && typeof renderOwnerHubView === 'function') {
        setSubViewBack('main', 'Назад в Орден');
        renderOwnerHubView('ship');
        return;
    }

    document.getElementById('guild-sub-screen').style.display = 'none';
    document.getElementById('guild-main-screen').style.display = 'flex';
    renderGuildHeaderStats();
}

function renderSkillsSection() {
    document.getElementById('sub-view-title').innerText = "🌳 ДРЕВО НАВЫКОВ";
    document.getElementById('sub-view-subtitle').innerText = "Перки Цитадели, Ратуши и Удачи";
    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box">
            <strong style="color:#ffd700;">📜 Торговая Гильдия (Скоро)</strong>
            <p style="margin:6px 0; font-size:11px;">Множитель выплат золота в Ратуше (x1.00 — x50.00) за пещерную руду.</p>
        </div>
        <div class="card-box">
            <strong style="color:#2ecc71;">🍀 Благословение Искателя (Скоро)</strong>
            <p style="margin:6px 0; font-size:11px;">Повышает шанс найти легендарные вещи, камни и зелья.</p>
        </div>
    `;
}

function initGuildModule() {
    initGuildStorageDefaults();
    renderGuildHeaderStats();

    const footer = document.getElementById('guild-version-footer');
    if (footer) footer.innerText = `Орден Кхамача | Сборка ${window.GUILD_VERSION || 'v2.0.0-BETA'}`;

    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = MAIN_HUB_RETURN_URL + '?t=' + Date.now();
        };
    }
}
