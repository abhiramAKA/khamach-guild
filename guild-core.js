/* ==========================================================================
   ОРДЕН КХАМАЧА — ЯДРО СИНХРОНИЗАЦИИ, ПАУЗА БОЯ И НАВИГАЦИЯ (v2.4.3-BETA)
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
    const bagCount = getBagItems().length;
    const gemsCount = getGemsList().length;

    const lvlBadge = document.getElementById('guild-lvl-badge');
    if (lvlBadge) lvlBadge.innerText = `👑 ${lvl}`;

    const resBar = document.getElementById('guild-resources-bar');
    if (resBar) {
        const badge = (bagCount + gemsCount) > 0 ? ` (${bagCount + gemsCount})` : '';
        resBar.innerHTML = `<button class="menu-btn" style="padding:7px; font-size:12px;" onclick="openGuildView('bag')">🎒 Рюкзак и Склад Ордена${badge}</button>`;
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
    else renderComingSoonSection(viewKey);
}

function closeGuildView() {
    if (window.shipGameRunning) {
        window.shipGamePaused = true;
        const ok = confirm("Вы действительно хотите прервать полёт? Нанесённый урон и награды за этот вылет не сохранятся.");
        if (!ok) {
            window.shipGamePaused = false;
            return;
        }
    }

    if (activeGuildTimer) { clearInterval(activeGuildTimer); activeGuildTimer = null; }
    if (typeof window.stopShipMinigame === 'function') window.stopShipMinigame();

    if (window.currentSubBackTarget === 'pet_cfg' && typeof renderOwnerGearConfig === 'function') {
        renderOwnerGearConfig('pet');
        return;
    }
    if (window.currentSubBackTarget === 'ship_cfg' && typeof renderOwnerGearConfig === 'function') {
        renderOwnerGearConfig('ship');
        return;
    }
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

function renderComingSoonSection(key) {
    const meta = {
        skills: {
            title: "🌳 ДРЕВО НАВЫКОВ",
            sub: "Древние знания и перки Ордена",
            icon: "🌳",
            desc: "Здесь откроется ветвь развития всего Ордена Кхамача. Вы сможете усиливать доход золота в Ратуше, увеличивать удачу при поиске редких самоцветов, сокращать время космических походов Питомца и открывать пассивные боевые таланты."
        },
        altar: {
            title: "⛩️ АЛТАРЬ ВОЗНЕСЕНИЯ",
            sub: "Клановые рейды, ритуалы и слияние стихий",
            icon: "⛩️",
            desc: "Священное место силы для совместных клановых механик, коллективных ритуалов и кооперативных рейдов Ордена на древних Титанов. Также здесь можно будет приносить в жертву Астральный Прах и самоцветы, чтобы пробуждать скрытые свойства снаряжения, перековывать стихии вещей и получать общие клановые благословения перед вылетом."
        },
        farm: {
            title: "🌾 АСТРАЛЬНАЯ ФЕРМА",
            sub: "Выращивание редких трав и алхимия",
            icon: "🌾",
            desc: "Личные угодья Ордена под куполом Цитадели. Здесь вы сможете высаживать космические семена, собирать урожай целебных кристаллов и самостоятельно варить Зелья исцеления, эликсиры ярости и лакомства для ускорения Питомца."
        },
        shop: {
            title: "🏪 ЛАВКА ОРДЕНА",
            sub: "Торговый пост контрабандистов Предела",
            icon: "🏪",
            desc: "Закрытый рынок для членов Ордена. Скоро здесь появится обмен Металлолома и золота на недостающие чертежи экипировки, сундуки с самоцветами, ремонтные наборы и редкие артефакты для Корабля и Питомца."
        }
    };
    const info = meta[key] || meta.skills;
    document.getElementById('sub-view-title').innerText = info.title;
    document.getElementById('sub-view-subtitle').innerText = info.sub;
    document.getElementById('sub-view-body').innerHTML = `
        <div class="card-box" style="text-align:center; padding:16px 12px;">
            <div style="font-size:52px; margin-bottom:8px;">${info.icon}</div>
            <div style="color:#ffd700; font-weight:bold; font-size:13px; margin-bottom:8px;">РАЗДЕЛ В РАЗРАБОТКЕ</div>
            <p style="margin:0; font-size:12px; line-height:1.5; color:#cdb38c;">${info.desc}</p>
        </div>
    `;
}

function initGuildModule() {
    initGuildStorageDefaults();
    renderGuildHeaderStats();

    const footer = document.getElementById('guild-version-footer');
    if (footer) footer.innerText = `Орден Кхамача | Сборка ${window.GUILD_VERSION || 'v2.4.3-BETA'}`;

    const backBtn = document.getElementById('back-to-hub-btn');
    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = MAIN_HUB_RETURN_URL + '?t=' + Date.now();
        };
    }
}
