/* ==========================================================================
   ОРДЕН КХАМАЧА — АРКАДНЫЙ БОЙ КОРАБЛЯ С БОССОМ И ЛУТ ПИТОМЦА (v1.2.1-BETA)
   ========================================================================== */

let shipLoopId = null;
let shipGameRunning = false;

function stopShipMinigame() {
    shipGameRunning = false;
    if (shipLoopId) { cancelAnimationFrame(shipLoopId); shipLoopId = null; }
}

function launchShipRaidView() {
    document.getElementById('sub-view-title').innerText = "🚀 ПОЛЁТ НА БОССА";
    document.getElementById('sub-view-subtitle').innerText = "Уворачивайтесь от огня и бейте Босса";

    document.getElementById('sub-view-body').innerHTML = `
        <canvas id="ship-battle-canvas" class="ship-canvas" width="360" height="245"></canvas>
        <div class="ship-controls">
            <button id="ship-left-btn" class="menu-btn">⬅️ ВЛЕВО</button>
            <button id="ship-right-btn" class="menu-btn">ВПРАВО ➡️</button>
        </div>
    `;
    startShipMinigame();
}

function startShipMinigame() {
    stopShipMinigame();
    const canvas = document.getElementById('ship-battle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sStats = calculateOwnerStats('ship');
    const pStats = isPetOnExpedition() ? { atk: 0, hp: 0, def: 0, reg: 0 } : calculateOwnerStats('pet');

    const totalAtk = sStats.atk + pStats.atk;
    const maxHP = sStats.hp + pStats.hp;
    const totalDef = sStats.def + pStats.def;
    const totalReg = sStats.reg + pStats.reg;

    const bossMaxHP = 320 + getOwnerPowerScore(sStats) * 4;
    const bossRawDmg = 24;

    const state = {
        px: 180, py: 215, hp: maxHP, moveDir: 0,
        bx: 180, by: 40, bDir: 1.5, bossHP: bossMaxHP,
        pBullets: [], bBullets: [], frame: 0
    };

    const lBtn = document.getElementById('ship-left-btn');
    const rBtn = document.getElementById('ship-right-btn');
    if (lBtn) {
        lBtn.onmousedown = lBtn.ontouchstart = (e) => { e.preventDefault(); state.moveDir = -1; };
        lBtn.onmouseup = lBtn.ontouchend = () => { if (state.moveDir === -1) state.moveDir = 0; };
    }
    if (rBtn) {
        rBtn.onmousedown = rBtn.ontouchstart = (e) => { e.preventDefault(); state.moveDir = 1; };
        rBtn.onmouseup = rBtn.ontouchend = () => { if (state.moveDir === 1) state.moveDir = 0; };
    }

    shipGameRunning = true;

    function tick() {
        if (!shipGameRunning) return;
        state.frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state.frame % 180 === 0 && state.hp < maxHP) {
            state.hp = Math.min(maxHP, state.hp + totalReg);
        }

        state.px = Math.max(22, Math.min(338, state.px + state.moveDir * 4.5));
        state.bx += state.bDir;
        if (state.bx > 320 || state.bx < 40) state.bDir *= -1;

        if (state.frame % 18 === 0) state.pBullets.push({ x: state.px, y: state.py - 14 });
        if (state.frame % 55 === 0) state.bBullets.push({ x: state.bx + (Math.random() * 36 - 18), y: state.by + 16 });

        ctx.fillStyle = "#ffd700";
        state.pBullets = state.pBullets.filter(b => {
            b.y -= 6;
            ctx.fillRect(b.x - 2, b.y, 4, 10);
            if (Math.abs(b.x - state.bx) < 26 && Math.abs(b.y - state.by) < 20) {
                state.bossHP -= totalAtk;
                return false;
            }
            return b.y > 0;
        });

        ctx.fillStyle = "#ff4500";
        state.bBullets = state.bBullets.filter(b => {
            b.y += 3.1;
            ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
            if (Math.abs(b.x - state.px) < 16 && Math.abs(b.y - state.py) < 14) {
                const dmg = Math.max(4, bossRawDmg - totalDef);
                state.hp -= dmg;
                return false;
            }
            return b.y < canvas.height;
        });

        ctx.font = "32px serif"; ctx.textAlign = "center";
        ctx.fillText("👾", state.bx, state.by + 10);
        ctx.font = "26px serif";
        ctx.fillText("🚀", state.px, state.py + 8);

        ctx.fillStyle = "#331111"; ctx.fillRect(20, 8, 320, 8);
        ctx.fillStyle = "#ff3333"; ctx.fillRect(20, 8, 320 * Math.max(0, state.bossHP / bossMaxHP), 8);

        ctx.fillStyle = "#2ecc71"; ctx.font = "11px Georgia"; ctx.textAlign = "left";
        ctx.fillText(`❤️ ${state.hp}/${maxHP} | ⚔️${totalAtk} 🛡️${totalDef} 💚+${totalReg}`, 10, 238);

        if (state.bossHP <= 0) {
            stopShipMinigame();
            grantBossPetLoot();
            return;
        }
        if (state.hp <= 0) {
            stopShipMinigame();
            alert("Корабль подбит! Усильте броню или возьмите Питомца в бой.");
            renderOwnerEquipView('ship');
            return;
        }
        shipLoopId = requestAnimationFrame(tick);
    }
    shipLoopId = requestAnimationFrame(tick);
}

function grantBossPetLoot() {
    const sets = ['flame', 'abyss', 'storm'];
    const pSlots = EQUIP_SLOTS.pet;
    const s = pSlots[Math.floor(Math.random() * pSlots.length)];
    const stKey = sets[Math.floor(Math.random() * sets.length)];

    const bag = getBagItems();
    bag.push({ owner: 'pet', slotKey: s.key, set: stKey });
    saveBagItems(bag);

    let gemText = '';
    if (Math.random() < 0.45) {
        const gems = getGemsStorage();
        const gKeys = Object.keys(GEMS_META);
        const rk = gKeys[Math.floor(Math.random() * gKeys.length)];
        gems[rk] += 1;
        saveGemsStorage(gems);
        gemText = `\n+ ${GEMS_META[rk].icon} ${GEMS_META[rk].name}`;
    }

    renderGuildHeaderStats();
    alert(`ПОБЕДА НАД БОССОМ!\nВыпала экипировка для Питомца:\n${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] Ур.1${gemText}`);
    renderOwnerEquipView('ship');
}
