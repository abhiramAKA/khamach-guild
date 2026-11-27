/* ==========================================================================
   ОРДЕН КХАМАЧА — АРКАДНЫЙ БОЙ С 4 УМЕНИЯМИ И ЗЕЛЬЕМ ЛЕЧЕНИЯ (v1.6.0)
   ========================================================================== */

let shipLoopId = null;
let shipGameRunning = false;

window.stopShipMinigame = function() {
    shipGameRunning = false;
    if (shipLoopId) { cancelAnimationFrame(shipLoopId); shipLoopId = null; }
};

window.launchShipRaidView = function() {
    const titleEl = document.getElementById('sub-view-title');
    const subEl = document.getElementById('sub-view-subtitle');
    const bodyEl = document.getElementById('sub-view-body');
    if (!bodyEl) return;

    if (titleEl) titleEl.innerText = "🚀 ПОЛЁТ НА БОССА";
    if (subEl) subEl.innerText = "Уворачивайтесь от огня и бейте Босса";

    const potions = getHealPotions();
    bodyEl.innerHTML = `
        <canvas id="ship-battle-canvas" class="ship-canvas" width="360" height="240"></canvas>
        <div class="ship-controls">
            <button id="ship-left-btn" class="menu-btn">⬅️ ВЛЕВО</button>
            <button id="ship-potion-btn" class="menu-btn green-btn" style="width:95px; padding:8px 4px; font-size:12px;">🧪 (${potions})</button>
            <button id="ship-right-btn" class="menu-btn">ВПРАВО ➡️</button>
        </div>
    `;
    startShipMinigame();
};

function startShipMinigame() {
    window.stopShipMinigame();
    const canvas = document.getElementById('ship-battle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sStats = calculateOwnerStats('ship');
    const pStats = isPetOnExpedition()
        ? { atk: 0, hp: 0, reg: 0, setCounts: { flame: 0, abyss: 0, storm: 0, frost: 0 } }
        : calculateOwnerStats('pet');

    const totalAtk = sStats.atk + pStats.atk;
    const maxHP = sStats.hp + pStats.hp;
    const totalReg = sStats.reg + pStats.reg;

    const flameCnt = sStats.setCounts.flame + pStats.setCounts.flame;
    const abyssCnt = sStats.setCounts.abyss + pStats.setCounts.abyss;
    const stormCnt = sStats.setCounts.storm + pStats.setCounts.storm;
    const frostCnt = sStats.setCounts.frost + pStats.setCounts.frost;

    const burnDps = flameCnt * 1.5;
    const vampHeal = abyssCnt * 0.5;
    const critGain = stormCnt * 3;
    const critMult = 1.5 + stormCnt * 0.15;
    const shieldCdFrames = frostCnt > 0 ? Math.max(5, 17 - frostCnt) * 60 : 0;

    const shipPower = getOwnerPowerScore(sStats);
    const bossMaxHP = 110 + shipPower * 5;
    const bossDmg = 2 + Math.floor(shipPower / 25);

    const state = {
        px: 180, py: 205, hp: maxHP, moveDir: 0,
        bx: 180, by: 40, bDir: 1.5, bossHP: bossMaxHP,
        critCharge: 0, shotCount: 0, shieldReady: frostCnt > 0, shieldTimer: 0,
        pBullets: [], bBullets: [], frame: 0
    };

    const lBtn = document.getElementById('ship-left-btn');
    const rBtn = document.getElementById('ship-right-btn');
    const potBtn = document.getElementById('ship-potion-btn');

    if (lBtn) {
        lBtn.onmousedown = lBtn.ontouchstart = (e) => { e.preventDefault(); state.moveDir = -1; };
        lBtn.onmouseup = lBtn.ontouchend = () => { if (state.moveDir === -1) state.moveDir = 0; };
    }
    if (rBtn) {
        rBtn.onmousedown = rBtn.ontouchstart = (e) => { e.preventDefault(); state.moveDir = 1; };
        rBtn.onmouseup = rBtn.ontouchend = () => { if (state.moveDir === 1) state.moveDir = 0; };
    }
    if (potBtn) {
        potBtn.onclick = function() {
            const curPots = getHealPotions();
            if (curPots <= 0 || state.hp >= maxHP) return;
            setHealPotions(curPots - 1);
            const healAmount = Math.max(4, Math.ceil(maxHP * 0.5));
            state.hp = Math.min(maxHP, Number((state.hp + healAmount).toFixed(1)));
            potBtn.innerText = `🧪 (${curPots - 1})`;
        };
    }

    canvas.ontouchmove = (e) => {
        if (!e.touches || !e.touches.length) return;
        const rect = canvas.getBoundingClientRect();
        const tx = (e.touches.item(0).clientX - rect.left) * (canvas.width / rect.width);
        state.px = Math.max(22, Math.min(338, tx));
    };

    shipGameRunning = true;

    function tick() {
        if (!shipGameRunning) return;
        state.frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state.frame % 60 === 0) {
            if (burnDps > 0) state.bossHP -= burnDps;
            if (frostCnt > 0 && !state.shieldReady) {
                state.shieldTimer += 60;
                if (state.shieldTimer >= shieldCdFrames) { state.shieldReady = true; state.shieldTimer = 0; }
            }
        }

        if (state.frame % 180 === 0 && state.hp < maxHP) {
            state.hp = Math.min(maxHP, Number((state.hp + totalReg * 0.25).toFixed(1)));
        }

        state.px = Math.max(22, Math.min(338, state.px + state.moveDir * 4.5));
        state.bx += state.bDir;
        if (state.bx > 320 || state.bx < 40) state.bDir *= -1;

        if (state.frame % 18 === 0) {
            const isCritShot = stormCnt > 0 && state.critCharge >= 100;
            if (isCritShot) state.critCharge = 0;
            state.pBullets.push({ x: state.px, y: state.py - 14, isCrit: isCritShot });
        }

        if (state.frame % 55 === 0) {
            state.bBullets.push({ x: state.bx + (Math.random() * 36 - 18), y: state.by + 16 });
        }

        state.pBullets = state.pBullets.filter(b => {
            b.y -= b.isCrit ? 7.5 : 6;
            ctx.fillStyle = b.isCrit ? "#ffe88c" : "#ffd700";
            if (b.isCrit) { ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill(); }
            else { ctx.fillRect(b.x - 2, b.y, 4, 10); }

            if (Math.abs(b.x - state.bx) < 26 && Math.abs(b.y - state.by) < 20) {
                state.shotCount++;
                if (b.isCrit) { state.bossHP -= Math.round(totalAtk * critMult); }
                else {
                    state.bossHP -= totalAtk;
                    if (critGain > 0) state.critCharge = Math.min(100, state.critCharge + critGain);
                }
                if (vampHeal > 0 && state.shotCount % 4 === 0) {
                    state.hp = Math.min(maxHP, Number((state.hp + vampHeal).toFixed(1)));
                }
                return false;
            }
            return b.y > 0;
        });

        ctx.fillStyle = "#ff4500";
        state.bBullets = state.bBullets.filter(b => {
            b.y += 3.1;
            ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
            if (Math.abs(b.x - state.px) < 16 && Math.abs(b.y - state.py) < 14) {
                if (state.shieldReady) { state.shieldReady = false; }
                else { state.hp = Number((state.hp - bossDmg).toFixed(1)); }
                return false;
            }
            return b.y < canvas.height;
        });

        ctx.font = "32px serif"; ctx.textAlign = "center";
        ctx.fillText("👾", state.bx, state.by + 10);
        ctx.font = "26px serif";
        ctx.fillText("🚀", state.px, state.py + 8);

        if (state.shieldReady) {
            ctx.strokeStyle = "#8cd1ff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(state.px, state.py, 20, 0, Math.PI * 2); ctx.stroke();
        }

        ctx.fillStyle = "#331111"; ctx.fillRect(20, 8, 320, 8);
        ctx.fillStyle = "#ff3333"; ctx.fillRect(20, 8, 320 * Math.max(0, state.bossHP / bossMaxHP), 8);

        if (stormCnt > 0) {
            ctx.fillStyle = "#221133"; ctx.fillRect(10, 220, 340, 4);
            ctx.fillStyle = "#ffe88c"; ctx.fillRect(10, 220, 340 * (state.critCharge / 100), 4);
        }

        ctx.fillStyle = "#2ecc71"; ctx.font = "11px Georgia"; ctx.textAlign = "left";
        ctx.fillText(`❤️${state.hp}/${maxHP} | ⚔️${totalAtk} 💚${totalReg} ${state.shieldReady ? '❄️Щит' : ''}`, 10, 236);

        if (state.bossHP <= 0) { window.stopShipMinigame(); grantBossPetLoot(); return; }
        if (state.hp <= 0) {
            window.stopShipMinigame();
            alert("Корабль подбит! Используйте 🧪 Зелья в бою или усильте экипировку.");
            renderOwnerEquipView('ship');
            return;
        }
        shipLoopId = requestAnimationFrame(tick);
    }
    shipLoopId = requestAnimationFrame(tick);
}

function grantBossPetLoot() {
    const sets = ['flame', 'abyss', 'storm', 'frost'];
    const pSlots = EQUIP_SLOTS.pet;
    const s = pSlots[Math.floor(Math.random() * pSlots.length)];
    const stKey = sets[Math.floor(Math.random() * sets.length)];

    const bag = getBagItems();
    bag.push({ owner: 'pet', slotKey: s.key, set: stKey });
    saveBagItems(bag);

    let gemText = '';
    if (Math.random() < 0.50 && typeof rollRandomGemDrop === 'function') {
        const gems = getGemsList();
        const droppedGem = rollRandomGemDrop();
        gems.push(droppedGem);
        saveGemsList(gems);
        const rm = GEM_RARITIES[droppedGem.rank];
        const gm = GEMS_META[droppedGem.type];
        gemText = `\n+ ${gm.icon} ${rm.name} ${gm.name} (+${getGemBonusValue(droppedGem.type, droppedGem.rank)})`;
    }

    renderGuildHeaderStats();
    alert(`ПОБЕДА НАД БОССОМ!\nВыпала экипировка для Питомца:\n${s.icon} ${s.name} [${EQUIP_SETS[stKey].name}] Ур.1${gemText}`);
    renderOwnerEquipView('ship');
}
