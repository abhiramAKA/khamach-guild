/* ==========================================================================
   ОРДЕН КХАМАЧА — ОТРИСОВКА СЦЕНЫ БОЯ КОРАБЛЯ С БОССОМ (v2.0.4-BETA)
   ========================================================================== */

function renderShipBattleFrame(ctx, canvas, state, cfg) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.fillText("👾", state.bx, state.by + 12);

    ctx.font = "26px serif";
    ctx.fillText("🚀", state.px, state.py + 8);

    if (state.shieldReady) {
        ctx.strokeStyle = "#8cd1ff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.px, state.py, 20, 0, Math.PI * 2);
        ctx.stroke();
    }

    const curDmg = Math.floor(state.damageDealt);
    const tierInfo = typeof getShipLootTierByDamage === 'function'
        ? getShipLootTierByDamage(curDmg)
        : { label: '🎁 40%', nextGoal: 500 };
    const goalStr = tierInfo.nextGoal > 0 ? '-> ' + tierInfo.nextGoal : 'МАКС!';

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(8, 4, 344, 16);

    ctx.fillStyle = "#ffd700";
    ctx.font = "10px Georgia";
    ctx.textAlign = "left";
    ctx.fillText('Урон: ' + curDmg + ' (' + tierInfo.label + ' ' + goalStr + ')', 12, 16);

    ctx.fillStyle = "#ff8c8c";
    ctx.textAlign = "right";
    ctx.fillText('Ярость:' + (state.rageStage + 1), 346, 16);

    if (cfg.stormCnt > 0) {
        const barW = Math.floor(340 * (state.critCharge / 100));
        ctx.fillStyle = "#221133";
        ctx.fillRect(10, 220, 340, 4);
        ctx.fillStyle = "#ffe88c";
        ctx.fillRect(10, 220, barW, 4);
    }

    ctx.fillStyle = "#2ecc71";
    ctx.font = "11px Georgia";
    ctx.textAlign = "left";
    const shieldTxt = state.shieldReady ? ' [Щит]' : '';
    ctx.fillText('HP: ' + state.hp + '/' + cfg.maxHP + ' | Атк: ' + cfg.totalAtk + ' Рег: ' + cfg.totalReg + shieldTxt, 10, 236);
}
