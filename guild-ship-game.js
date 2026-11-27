/* ==========================================================================
   ОРДЕН КХАМАЧА — БЕСКОНЕЧНЫЙ БОСС И ШКАЛА ПОРОГОВ НАГРАДЫ (v2.0.1-BETA)
   ========================================================================== */

let shipLoopId = null;
window.shipGameRunning = false;

window.stopShipMinigame = function() {
    window.shipGameRunning = false;
    if (shipLoopId) { cancelAnimationFrame(shipLoopId); shipLoopId = null; }
    if (typeof clearShipControls === 'function') clearShipControls();
};

window.startShipMinigame = function() {
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

    const state = {
        px: 180, py: 205, hp: maxHP, moveDir: 0,
        bx: 180, by: 42, bDir: 1.6,
        damageDealt: 0, rageStage: 0,
        critCharge: 0, shotCount: 0, shieldReady: frostCnt > 0, shieldTimer: 0,
        pBullets: [], bBullets: [], frame: 0
    };

    if (typeof bindShipInputs === 'function') bindShipInputs(canvas, state, maxHP);
    window.shipGameRunning = true;

    function tick() {
        if (!window.shipGameRunning) return;
        state.frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        state.rageStage = Math.floor(state.frame / 900);
        const bossDmg = 2 + state.rageStage;
        const bossFireRate = Math.max(26, 52 - state.rageStage * 4);

        if (state.frame % 60 === 0) {
            if (burnDps > 0) state.damageDealt += burnDps;
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
            if (isCritShot) {
                state.critCharge = 0;
                if (typeof playShipFX === 'function') playShipFX('crit');
            } else {
                if (typeof playShipFX === 'function') playShipFX('shoot');
            }
            state.pBullets.push({ x: state.px, y: state.py - 14, isCrit: isCritShot });
        }

        if (state.frame % bossFireRate === 0) {
            state.bBullets.push({ x: state.bx + (Math.random() * 48 - 24), y: state.by + 16 });
        }

        state.pBullets = state.pBullets.filter(b => {
            b.y -= b.isCrit ? 7.5 : 6;
            ctx.fillStyle = b.isCrit ? "#ffe88c" : "#ffd700";
            if (b.isCrit) { ctx.beginPath(); ctx.arc(b.x, b.y, 7, 0, Math.PI * 2); ctx.fill(); }
            else { ctx.fillRect(b.x - 2, b.y, 4, 10); }

            if (Math.abs(b.x - state.bx) < 26 && Math.abs(b.y - state.by) < 20) {
                state.shotCount++;
                if (b.isCrit) {
                    state.damageDealt += Math.round(totalAtk * critMult);
                } else {
                    state.damageDealt += totalAtk;
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
            b.y += 3.1 + Math.min(1.5, state.rageStage * 0.25);
            ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill();
            if (Math.abs(b.x - state.px) < 16 && Math.abs(b.y - state.py) < 14) {
                if (state.shieldReady) {
                    state.shieldReady = false;
                    if (typeof playShipFX === 'function') playShipFX('shield');
                } else {
                    state.hp = Number((state.hp - bossDmg).toFixed(1));
                    if (typeof playShipFX === 'function') playShipFX('hit');
                }
                return false;
            }
            return b.y < canvas.height;
        });

        ctx.font = "32px serif"; ctx.textAlign = "center";
        ctx.fillText("👾", state.bx, state.by + 12);
        ctx.font = "26px serif";
        ctx.fillText("🚀", state.px, state.py + 8);

        if (state.shieldReady) {
            ctx.strokeStyle = "#8cd1ff"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(state.px, state.py, 20, 0, Math.PI * 2); ctx.stroke();
        }

        const curDmg = Math.floor(state.damageDealt);
        const tierInfo = typeof getShipLootTierByDamage === 'function'
            ? getShipLootTierByDamage(curDmg)
            : { label: '🎁 40%', nextGoal: 500 };
        const goalStr = tierInfo.nextGoal > 0 ? `→ ${tierInfo.nextGoal}` : 'МАКС!';

        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(8, 4, 344, 16);
        ctx.fillStyle = "#ffd700"; ctx.font = "10px Georgia"; ctx.textAlign = "left";
        ctx.fillText(`💥 ${curDmg} (${tierInfo.label} ${goalStr})`, 12, 16);
        ctx.fillStyle = "#ff8c8c"; ctx.textAlign = "right";
        ctx.fillText(`Ярость:${state.rageStage + 1}`, 346, 16);

        if (stormCnt > 0) {
            ctx.fillStyle = "#221133"; ctx.fillRect(10, 220, 340, 4);
            ctx.fillStyle = "#ffe88c"; ctx.fillRect(10, 220, 340 * (state.critCharge / 100), 4);
        }

        ctx.fillStyle = "#2ecc71"; ctx.font = "11px Georgia"; ctx.textAlign = "left";
        ctx.fillText(`❤️${state.hp}/${maxHP} | ⚔️${totalAtk} 💚${totalReg} ${state.shieldReady ? '❄️Щит' : ''}`, 10, 236);

        if (state.hp <= 0) {
            window.stopShipMinigame();
            if (typeof playShipFX === 'function') playShipFX('win');
            if (typeof grantEndlessBossRewards === 'function') grantEndlessBossRewards(state.damageDealt);
            return;
        }
        shipLoopId = requestAnimationFrame(tick);
    }
    shipLoopId = requestAnimationFrame(tick);
};
