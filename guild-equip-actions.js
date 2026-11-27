/* ==========================================================================
   ОРДЕН КХАМАЧА — ДЕЙСТВИЯ СО СНАРЯЖЕНИЕМ, КАМНЯМИ И ПОХОДОМ (v1.2.1-BETA)
   ========================================================================== */

function findRealBagIndex(owner, ownerIdx) {
    const allBag = getBagItems();
    let count = -1;
    for (let i = 0; i < allBag.length; i++) {
        if (allBag[i].owner === owner) {
            count++;
            if (count === ownerIdx) return i;
        }
    }
    return -1;
}

function equipFromBag(owner, ownerIdx) {
    const allBag = getBagItems();
    const realIdx = findRealBagIndex(owner, ownerIdx);
    if (realIdx === -1) return;

    const picked = allBag[realIdx];
    const equip = getEquipStorage(owner);
    equip[picked.slotKey] = { lvl: 1, set: picked.set, gems: [], enchant: null };
    saveEquipStorage(owner, equip);

    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    renderOwnerEquipView(owner);
}

function mergeFromBag(owner, ownerIdx) {
    const allBag = getBagItems();
    const realIdx = findRealBagIndex(owner, ownerIdx);
    if (realIdx === -1) return;

    const picked = allBag[realIdx];
    const equip = getEquipStorage(owner);
    const target = equip[picked.slotKey];
    if (!target || target.lvl >= 7) return;

    target.lvl += 1;
    saveEquipStorage(owner, equip);
    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    alert(`Предмет улучшен до ${target.lvl} уровня! Открыто новое гнездо для камня.`);
    renderOwnerEquipView(owner);
}

function salvageFromBag(owner, ownerIdx) {
    const allBag = getBagItems();
    const realIdx = findRealBagIndex(owner, ownerIdx);
    if (realIdx === -1) return;

    allBag.splice(realIdx, 1);
    saveBagItems(allBag);
    const dust = parseInt(localStorage.getItem('khamach_astral_dust') || '0');
    localStorage.setItem('khamach_astral_dust', String(dust + 5));
    renderGuildHeaderStats();
    renderOwnerEquipView(owner);
}

function openGemSocketPicker(owner, slotKey) {
    const gems = getGemsStorage();
    const avail = Object.keys(GEMS_META).filter(k => gems[k] > 0);
    if (avail.length === 0) return;

    const choice = avail[0];
    const equip = getEquipStorage(owner);
    const item = equip[slotKey];
    if (!item || (item.gems || []).length >= (item.lvl - 1)) return;

    gems[choice] -= 1;
    saveGemsStorage(gems);
    item.gems = item.gems || [];
    item.gems.push(choice);
    saveEquipStorage(owner, equip);
    renderGuildHeaderStats();
    renderOwnerEquipView(owner);
}

function startPetSpaceTrip() {
    if (isPetOnExpedition()) return;
    localStorage.setItem('khamach_pet_exp_start', Date.now().toString());
    renderOwnerEquipView('pet');
}

function startPetExpTicker() {
    if (activeGuildTimer) clearInterval(activeGuildTimer);
    activeGuildTimer = setInterval(() => {
        const el = document.getElementById('pet-exp-timer');
        const st = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
        if (!el || !st) return;
        const rem = Math.max(0, PET_EXPEDITION_MS - (Date.now() - st));
        if (rem <= 0) {
            clearInterval(activeGuildTimer);
            renderOwnerEquipView('pet');
        } else {
            const m = Math.floor(rem / 60000).toString().padStart(2, '0');
            const s = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
            el.innerText = `⏱️ В походе: ${m}:${s} (В бою с Боссом не помогает)`;
        }
    }, 1000);
}

function claimPetSpaceLoot() {
    const st = parseInt(localStorage.getItem('khamach_pet_exp_start') || '0');
    if (!st || (Date.now() - st) < PET_EXPEDITION_MS) return;

    const power = getOwnerPowerScore(calculateOwnerStats('pet'));
    const dropCount = Math.max(1, Math.min(4, Math.floor(power / 45) + 1));
    const bag = getBagItems();
    const sets = ['flame', 'abyss', 'storm'];
    const shipSlots = EQUIP_SLOTS.ship;

    let report = [];
    for (let i = 0; i < dropCount; i++) {
        const s = shipSlots[Math.floor(Math.random() * shipSlots.length)];
        const stKey = sets[Math.floor(Math.random() * sets.length)];
        bag.push({ owner: 'ship', slotKey: s.key, set: stKey });
        report.push(`${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}]`);
    }
    saveBagItems(bag);

    if (Math.random() < 0.5) {
        const gems = getGemsStorage();
        const gKeys = Object.keys(GEMS_META);
        const rk = gKeys[Math.floor(Math.random() * gKeys.length)];
        gems[rk] += 1;
        saveGemsStorage(gems);
        report.push(`${GEMS_META[rk].icon} ${GEMS_META[rk].name}`);
    }

    localStorage.removeItem('khamach_pet_exp_start');
    renderGuildHeaderStats();
    alert(`Питомец вернулся из космоса!\nНайдены обломки кораблей:\n• ${report.join('\n• ')}`);
    renderOwnerEquipView('pet');
}
