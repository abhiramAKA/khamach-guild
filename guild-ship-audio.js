/* ==========================================================================
   ОРДЕН КХАМАЧА — ПРОЦЕДУРНЫЕ ЗВУКИ АРКАДНОГО БОЯ (Web Audio API v2.0.6)
   ========================================================================== */

let guildAudioCtx = null;

function playShipFX(type) {
    try {
        const vol = parseFloat(localStorage.getItem('khamach_vol_fx') || '0.7');
        if (vol <= 0) return;

        if (!guildAudioCtx) {
            guildAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (guildAudioCtx.state === 'suspended') {
            guildAudioCtx.resume();
        }

        const now = guildAudioCtx.currentTime;
        const osc = guildAudioCtx.createOscillator();
        const gain = guildAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(guildAudioCtx.destination);

        if (type === 'shoot') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(680, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
            gain.gain.setValueAtTime(0.08 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'crit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(1240, now + 0.18);
            gain.gain.setValueAtTime(0.22 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (type === 'hit') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.linearRampToValueAtTime(75, now + 0.16);
            gain.gain.setValueAtTime(0.25 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            osc.start(now);
            osc.stop(now + 0.16);
        } else if (type === 'shield') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.20 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'potion') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.24);
            gain.gain.setValueAtTime(0.25 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
            osc.start(now);
            osc.stop(now + 0.24);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554, now + 0.1);
            osc.frequency.setValueAtTime(659, now + 0.2);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
            gain.gain.setValueAtTime(0.30 * vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
            osc.start(now);
            osc.stop(now + 0.42);
        }
    } catch (e) {}
}
