/* ==========================================================================
   ОРДЕН КХАМАЧА — ЦИКЛ БОЯ: ВОЛНА РАЗ В 10 СЕК И БАЛАНС РЕГЕНА (v2.1.3)
   ========================================================================== */

let shipLoopId = null;
window.shipGameRunning = false;

window.stopShipMinigame = function() {
    window.shipGameRunning = false;
    if (shipLoopId) {
        cancelAnimationFrame(shipLoopId);
        shipLoopId = null;
    }
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

    const cfg = {
        totalAtk: sStats.atk + pStats.atk,
        maxHP: sStats.hp + pStats.hp,
        totalReg: sStats.reg + pStats.reg,
        flameCnt: sStats.setCounts.flame + pStats.setCounts.flame,
        abyssCnt: sStats.setCounts.abyss + pStats.setCounts.abyss,
        stormCnt: sStats.setCounts.storm + pStats.setCounts.storm,
        frostCnt: sStats.setCounts.frost + pStats.setCounts.frost
    };

    const burnDps = cfg.flameCnt * 1.5;
    const vampHeal = cfg.abyssCnt * 0.4;
    const critGain = cfg.stormCnt * 3;
    const critMult = 1.5 + cfg.stormCnt * 0.15;
    const shieldCd = cfg.frostCnt > 0 ? Math.max(5, 17 - cfg.frostCnt) * 60 : 0;

    const state = {
        px: 180, py: 205, hp: cfg.maxHP, moveDir: 0,
        bx: 180, by: 42, bDir: 1.7,
        damageDealt: 0, waveCount: 0,
        novaWarning: 0, novaWaveY: 0, novaWaveHit: false,
        critCharge: 0, shotCount: 0,
        shieldReady: cfg.frostCnt > 0, shieldTimer: 0,
        pBullets: [], bBullets: [], frame: 0
    };

    if (typeof bindShipInputs === 'function') bindShipInputs(canvas, state, cfg.maxHP);
    window.shipGameRunning = true;

    function tick() {
        if (!window.shipGameRunning) return;
        state.frame++;

        // Каждые 10 секунд (600 кадров): за 1.5 сек предупреждение, на 600-м кадре — Астральная Волна
        const cyclePos = state.frame % 600;
        if (cyclePos >= 510 && cyclePos < 600) {
            state.novaWarning = 600 - cyclePos;
        } else {
            state.novaWarning = 0;
        }
        if (cyclePos === 0) {
            state.waveCount++;
            state.novaWaveY = state.by + 16;
            state.novaWaveHit = false;
            if (typeof playShipFX === 'function') playShipFX('hit');
        }

        const bulletDmg = 5 + Math.floor(state.waveCount / 2);
        const fireRate = Math.max(24, 48 - state.waveCount * 3);

        if (state.frame % 60 === 0) {
            if (burnDps > 0) state.damageDealt += burnDps;
            if (cfg.frostCnt > 0 && !state.shieldReady) {
                state.shieldTimer += 60;
                if (state.shieldTimer >= shieldCd) {
                    state.shieldReady = true;
                    state.shieldTimer = 0;
                }
            }
        }

        // Регенерация раз в 6 секунд (360 кадров) на 15% от параметра Регена
        if (state.frame % 360 === 0 && state.hp < cfg.maxHP) {
            const healTick = Math.max(0.2, Number((cfg.totalReg * 0.15).toFixed(1)));
            state.hp = Math.min(cfg.maxHP, Number((state.hp + healTick).toFixed(1)));
        }

        state.px = Math.max(22, Math.min(338, state.px + state.moveDir * 4.5));
        state.bx += state.bDir;
        if (state.bx > 320 || state.bx < 40) state.bDir *= -1;

        if (state.frame % 18 === 0) {
            const isCrit = cfg.stormCnt > 0 && state.critCharge >= 100;
            if (isCrit) {
                state.critCharge = 0;
                if (typeof playShipFX === 'function') playShipFX('crit');
            } else if (typeof playShipFX === 'function') {
                playShipFX('shoot');
            }
            state.pBullets.push({ x: state.px, y: state.py - 14, isCrit: isCrit });
        }

        if (state.frame % fireRate === 0) {
            state.bBullets.push({ x: state.bx + (Math.random() * 52 - 26), y: state.by + 16 });
        }

        if (typeof renderShipBattleFrame === 'function') {
            renderShipBattleFrame(ctx, canvas, state, cfg);
        }

        if (state.novaWaveY > 0) {
            state.novaWaveY += 4.2;
            if (!state.novaWaveHit && Math.abs(state.novaWaveY - state.py) < 12) {
                state.novaWaveHit = true;
                let waveDmg = 1 + state.waveCount;
                if (state.shieldReady) {
                    state.shieldReady = false;
                    waveDmg = Math.max(1, Math.ceil(waveDmg * 0.5));
                    if (typeof playShipFX === 'function') playShipFX('shield');
                }
                state.hp = Number((state.hp - waveDmg).toFixed(1));
            }
            if (state.novaWaveY > canvas.height) state.novaWaveY = 0;
        }

        state.pBullets = state.pBullets.filter(b => {
            b.y -= b.isCrit ? 7.5 : 6;
            ctx.fillStyle = b.isCrit ? "#ffe88c" : "#ffd700";
            if (b.isCrit) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(b.x - 2, b.y, 4, 10);
            }
            if (Math.abs(b.x - state.bx) < 26 && Math.abs(b.y - state.by) < 20) {
                state.shotCount++;
                if (b.isCrit) state.damageDealt += Math.round(cfg.totalAtk * critMult);
                else {
                    state.damageDealt += cfg.totalAtk;
                    if (critGain > 0) state.critCharge = Math.min(100, state.critCharge + critGain);
                }
                if (vampHeal > 0 && state.shotCount % 4 === 0) {
                    state.hp = Math.min(cfg.maxHP, Number((state.hp + vampHeal).toFixed(1)));
                }
                return false;
            }
            return b.y > 0;
        });

        ctx.fillStyle = "#ff4500";
        state.bBullets = state.bBullets.filter(b => {
            b.y += 3.2 + Math.min(1.6, state.waveCount * 0.25);
            ctx.beginPath();
            ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
            ctx.fill();
            if (Math.abs(b.x - state.px) < 16 && Math.abs(b.y - state.py) < 14) {
                if (state.shieldReady) {
                    state.shieldReady = false;
                    if (typeof playShipFX === 'function') playShipFX('shield');
                } else {
                    state.hp = Number((state.hp - bulletDmg).toFixed(1));
                    if (typeof playShipFX === 'function') playShipFX('hit');
                }
                return false;
            }
            return b.y < canvas.height;
        });

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
