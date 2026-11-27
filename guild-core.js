/* ==========================================================================
   ОРДЕН КХАМАЧА — ЯДРО СИНХРОНИЗАЦИИ И НАВИГАЦИИ (v2.9.6-BETA)
   ========================================================================== */

const MAIN_HUB_RETURN_URL = '../khamach/hub.html';
const PET_EXPEDITION_MS = 3600000;
let activeGuildTimer = null;
window.currentSubBackTarget = 'main';

function initGuildStorageDefaults() {
    if (!localStorage.getItem('khamach_guild_v4_init')) {
        localStorage.setItem('khamach_guild_v4_init', 'true');
        setScrapMetal(20);
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
            { type: 'amber', rank: 1 },
            { type: 'pearl', rank: 1 },
            { type: 'onyx',  rank: 2 }
        ]);
    }
    if (localStorage.getItem('khamach_scrap_metal') === null) setScrapMetal(20);
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
    const totalBag = getBagItems().length + getGemsList().length;

    const lvlBadge = document.getElementById('guild-lvl-badge');
    if (lvlBadge) lvlBadge.innerText = `👑 ${lvl}`;

    const bagLabel = document.getElementById('bag-tile-label');
    if (bagLabel) {
        bagLabel.innerText = totalBag > 0 ? `Рюкзак (${totalBag})` : 'Рюкзак';
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
    if (typeof stopHexHoldLoop === 'function') stopHexHoldLoop();

    document.getElementById('guild-main-screen').style.display = 'none';
    document.getElementById('guild-sub-screen').style.display = 'flex';
    setSubViewBack('main', 'Назад в Орден');

    if (viewKey === 'pet' && typeof renderOwnerHubView === 'function') renderOwnerHubView('pet');
    else if (viewKey === 'ship' && typeof renderOwnerHubView === 'function') renderOwnerHubView('ship');
    else if (viewKey === 'lands' && typeof renderGuildLandsView === 'function') renderGuildLandsView();
    else if (viewKey === 'bag' && typeof renderGuildBagView === 'function') renderGuildBagView();
    else renderComingSoonSection(viewKey);
}

function closeGuildView() {
    if (window.shipGameRunning) {
        window.shipGamePaused = true;
        if (!confirm("Вы действительно хотите прервать полёт? Нанесённый урон и награды за этот вылет не сохранятся.")) {
            window.shipGamePaused = false;
            return;
        }
    }
    if (activeGuildTimer) { clearInterval(activeGuildTimer); activeGuildTimer = null; }
    if (typeof window.stopShipMinigame === 'function') window.stopShipMinigame();
    if (typeof stopHexHoldLoop === 'function') stopHexHoldLoop();

    const back = window.currentSubBackTarget || 'main';
    if (back === 'bag' && typeof renderGuildBagView === 'function') { renderGuildBagView(); return; }
    if (back === 'lands' && typeof renderGuildLandsView === 'function') { renderGuildLandsView(); return; }
    if (back.startsWith('item:')) {
        const p = back.split(':');
        if (typeof renderItemDetailView === 'function') { renderItemDetailView(p.at(1), p.at(2)); return; }
    }
    if (back === 'pet_cfg' && typeof renderOwnerGearConfig === 'function') { renderOwnerGearConfig('pet'); return; }
    if (back === 'ship_cfg' && typeof renderOwnerGearConfig === 'function') { renderOwnerGearConfig('ship'); return; }
    if (back === 'pet' && typeof renderOwnerHubView === 'function') { renderOwnerHubView('pet'); return; }
    if (back === 'ship' && typeof renderOwnerHubView === 'function') { renderOwnerHubView('ship'); return; }

    document.getElementById('guild-sub-screen').style.display = 'none';
    document.getElementById('guild-main-screen').style.display = 'flex';
    renderGuildHeaderStats();
}

function renderComingSoonSection(key) {
    const meta = {
        skills: { title: "🌳 ДРЕВО НАВЫКОВ", sub: "Древние знания и перки Ордена", icon: "🌳", desc: "Здесь откроется ветвь развития всего Ордена Кхамача. Вы сможете усиливать доход золота в Ратуше, увеличивать удачу при поиске редких самоцветов, сокращать время космических походов Питомца и открывать пассивные боевые таланты." },
        altar:  { title: "⛩️ АЛТАРЬ ВОЗНЕСЕНИЯ", sub: "Клановые рейды и ритуалы", icon: "⛩️", desc: "Священное место силы для совместных клановых механик, коллективных ритуалов и кооперативных рейдов Ордена на древних Титанов. Также здесь можно будет приносить в жертву Металлолом и самоцветы, пробуждать скрытые свойства снаряжения и получать общие благословения перед вылетом." },
        farm:   { title: "🌾 АСТРАЛЬНАЯ ФЕРМА", sub: "Выращивание редких трав", icon: "🌾", desc: "Личные угодья Ордена под куполом Цитадели. Здесь вы сможете высаживать космические семена, собирать урожай целебных кристаллов и самостоятельно варить Зелья исцеления и лакомства для ускорения Питомца." },
        shop:   { title: "🏪 ЛАВКА ОРДЕНА", sub: "Торговый пост Предела", icon: "🏪", desc: "Закрытый рынок для членов Ордена. Скоро здесь появится обмен Металлолома и золота на недостающие чертежи экипировки, сундуки с самоцветами, ремонтные наборы и редкие артефакты." }
    };
    const info = meta[key] || meta.skills;
    document.getElementById('sub-view-title').innerText = info.title;
    document.getElementById('sub-view-subtitle').innerText = info.sub;
    document.getElementById('sub-view-body').innerHTML = `<div class="card-box" style="text-align:center; padding:16px 12px;"><div style="font-size:52px; margin-bottom:8px;">${info.icon}</div><div style="color:#ffd700; font-weight:bold; font-size:13px; margin-bottom:8px;">РАЗДЕЛ В РАЗРАБОТКЕ</div><p style="margin:0; font-size:12px; line-height:1.5; color:#cdb38c;">${info.desc}</p></div>`;
}

function initGuildModule() {
    initGuildStorageDefaults();
    renderGuildHeaderStats();
    const footer = document.getElementById('guild-version-footer');
    if (footer) footer.innerText = `Орден Кхамача | Сборка ${window.GUILD_VERSION || 'v2.9.6-BETA'}`;
    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) backBtn.onclick = function() { window.location.href = MAIN_HUB_RETURN_URL + '?t=' + Date.now(); };
}
