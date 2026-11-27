/* ==========================================================================
   ОРДЕН КХАМАЧА — КОНТЕЙНЕР ЭКРАНОВ: НАВЫКИ, АЛХИМИК, КУЗНЕЦ, МИНИ-ИГРА
   ========================================================================== */

const GUILD_SECTIONS_META = {
    skills: {
        title: "🌳 ДРЕВО НАВЫКОВ",
        subtitle: "Перки Ратуши и Выносливости",
        html: `
            <div style="padding:8px; border:1px solid #544432; background:rgba(20,16,14,0.9); border-radius:4px;">
                <strong style="color:#ffd700;">📜 Торговая Гильдия (Ранг 1 / 15)</strong>
                <p style="margin:6px 0; font-size:11px; line-height:1.4;">Увеличивает выплаты золота за все контракты Ратуши (от x1.00 до x50.00). Прокачка за пещерную руду.</p>
                <div style="color:#8a7350; font-size:11px;">Статус: Модуль готов к подключению логики рангов.</div>
            </div>
            <div style="padding:8px; border:1px solid #544432; background:rgba(20,16,14,0.9); border-radius:4px;">
                <strong style="color:#2ecc71;">⚡ Закалка Отряда (Ранг 0 / 10)</strong>
                <p style="margin:6px 0; font-size:11px; line-height:1.4;">Снижает накапливаемую усталость в рейдах и поручениях.</p>
            </div>
        `
    },
    alchemy: {
        title: "🧪 ЛАБОРАТОРИЯ АЛХИМИКА",
        subtitle: "Трансмутация Ресурсов и Эликсиры",
        html: `
            <div style="padding:8px; border:1px solid #544432; background:rgba(20,16,14,0.9); border-radius:4px;">
                <strong style="color:#8cd1ff;">⚗️ Переплавка Пород (Синтез 4 → 1)</strong>
                <p style="margin:6px 0; font-size:11px; line-height:1.4;">Позволяет преобразовывать лишнюю Горную руду в Уголь пламени, Ледяные осколки, Сферы Тьмы и Звёздную пыль.</p>
            </div>
            <div style="padding:8px; border:1px solid #544432; background:rgba(20,16,14,0.9); border-radius:4px;">
                <strong style="color:#ffb3ba;">🍷 Настойка Бодрости</strong>
                <p style="margin:6px 0; font-size:11px; line-height:1.4;">Мгновенно снимает усталость с выбранного героя за алхимические ингредиенты.</p>
            </div>
        `
    },
    smith: {
        title: "⚒️ ДРЕВНЯЯ КУЗНЯ",
        subtitle: "Ковка Артефактов и Снаряжения",
        html: `
            <div style="padding:8px; border:1px solid #544432; background:rgba(20,16,14,0.9); border-radius:4px;">
                <strong style="color:#ff8c8c;">🗡️ Оружейная Ордена</strong>
                <p style="margin:6px 0; font-size:11px; line-height:1.4;">Создание экипировки для Защитника, Воина, Стрелка и Мага из редких кристаллов пещер.</p>
            </div>
        `
    },
    minigame: {
        title: "🎲 ИСПЫТАНИЕ ОРДЕНА",
        subtitle: "Таверна и Подземные Игры",
        html: `
            <div style="padding:8px; border:1px solid #544432; background:rgba(20,16,14,0.9); border-radius:4px;">
                <strong style="color:#e6c280;">🃏 Рунические Кости</strong>
                <p style="margin:6px 0; font-size:11px; line-height:1.4;">Мини-игра на ставку ресурсов и монет между рейдами.</p>
            </div>
        `
    }
};

function renderGuildSubView(viewKey) {
    const meta = GUILD_SECTIONS_META[viewKey];
    if (!meta) return;

    const titleEl = document.getElementById('sub-view-title');
    const subEl = document.getElementById('sub-view-subtitle');
    const bodyEl = document.getElementById('sub-view-body');

    if (titleEl) titleEl.innerText = meta.title;
    if (subEl) subEl.innerText = meta.subtitle;
    if (bodyEl) bodyEl.innerHTML = meta.html;
}
