/* ==========================================================================
   ОРДЕН КХАМАЧА — ЗАПУСК ПОЛЁТА И УПРАВЛЕНИЕ КОРАБЛЁМ (v2.0.0-BETA)
   ========================================================================== */

let shipKeyDownHandler = null;
let shipKeyUpHandler = null;

function clearShipControls() {
    if (shipKeyDownHandler) {
        window.removeEventListener('keydown', shipKeyDownHandler);
        shipKeyDownHandler = null;
    }
    if (shipKeyUpHandler) {
        window.removeEventListener('keyup', shipKeyUpHandler);
        shipKeyUpHandler = null;
    }
}

function launchShipRaidView() {
    if (typeof setSubViewBack === 'function') setSubViewBack('ship', '↩️ Прервать полёт');
    const titleEl = document.getElementById('sub-view-title');
    const subEl = document.getElementById('sub-view-subtitle');
    const bodyEl = document.getElementById('sub-view-body');
    if (!bodyEl) return;

    if (titleEl) titleEl.innerText = "🚀 ПОЛЁТ НА БОССА";
    if (subEl) subEl.innerText = "Стрелки / A-D / Кнопки — уворот, Пробел — зелье";

    const potions = getHealPotions();
    bodyEl.innerHTML = `
        <canvas id="ship-battle-canvas" class="ship-canvas" width="360" height="240"></canvas>
        <div class="ship-controls">
            <button id="ship-left-btn" class="menu-btn">⬅️ ВЛЕВО</button>
            <button id="ship-potion-btn" class="menu-btn green-btn" style="width:95px; padding:8px 4px; font-size:12px;">🧪 (${potions})</button>
            <button id="ship-right-btn" class="menu-btn">ВПРАВО ➡️</button>
        </div>
    `;
    if (typeof startShipMinigame === 'function') startShipMinigame();
}

window.launchShipRaidView = launchShipRaidView;

function bindShipInputs(canvas, state, maxHP) {
    clearShipControls();
    const lBtn = document.getElementById('ship-left-btn');
    const rBtn = document.getElementById('ship-right-btn');
    const potBtn = document.getElementById('ship-potion-btn');

    function useBattlePotion() {
        const curPots = getHealPotions();
        if (curPots <= 0 || state.hp >= maxHP) return;
        setHealPotions(curPots - 1);
        const healAmount = Math.max(4, Math.ceil(maxHP * 0.5));
        state.hp = Math.min(maxHP, Number((state.hp + healAmount).toFixed(1)));
        if (potBtn) potBtn.innerText = `🧪 (${curPots - 1})`;
        if (typeof playShipFX === 'function') playShipFX('potion');
    }

    if (lBtn) {
        lBtn.onmousedown = lBtn.ontouchstart = (e) => { e.preventDefault(); state.moveDir = -1; };
        lBtn.onmouseup = lBtn.ontouchend = lBtn.onmouseleave = () => { if (state.moveDir === -1) state.moveDir = 0; };
    }
    if (rBtn) {
        rBtn.onmousedown = rBtn.ontouchstart = (e) => { e.preventDefault(); state.moveDir = 1; };
        rBtn.onmouseup = rBtn.ontouchend = rBtn.onmouseleave = () => { if (state.moveDir === 1) state.moveDir = 0; };
    }
    if (potBtn) potBtn.onclick = useBattlePotion;

    shipKeyDownHandler = function(e) {
        if (!window.shipGameRunning) return;
        const k = e.key.toLowerCase();
        if (e.key === 'ArrowLeft' || k === 'a' || k === 'ф') { e.preventDefault(); state.moveDir = -1; }
        else if (e.key === 'ArrowRight' || k === 'd' || k === 'в') { e.preventDefault(); state.moveDir = 1; }
        else if (e.code === 'Space') { e.preventDefault(); useBattlePotion(); }
    };

    shipKeyUpHandler = function(e) {
        const k = e.key.toLowerCase();
        if ((e.key === 'ArrowLeft' || k === 'a' || k === 'ф') && state.moveDir === -1) state.moveDir = 0;
        if ((e.key === 'ArrowRight' || k === 'd' || k === 'в') && state.moveDir === 1) state.moveDir = 0;
    };

    window.addEventListener('keydown', shipKeyDownHandler);
    window.addEventListener('keyup', shipKeyUpHandler);

    canvas.ontouchmove = (e) => {
        if (!e.touches || !e.touches.length) return;
        const rect = canvas.getBoundingClientRect();
        const tx = (e.touches.item(0).clientX - rect.left) * (canvas.width / rect.width);
        state.px = Math.max(22, Math.min(338, tx));
    };
}
