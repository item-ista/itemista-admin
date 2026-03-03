// Generates a professional notification sound using Web Audio API
// This avoids needing an external audio file

let audioContext = null;

export function playNotificationSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const now = audioContext.currentTime;

    // First tone (higher pitch)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone (even higher, delayed)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1175, now + 0.18); // D6
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.35);

    // Third tone (highest, completes the chime)
    const osc3 = audioContext.createOscillator();
    const gain3 = audioContext.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1320, now + 0.38); // E6
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.setValueAtTime(0.25, now + 0.38);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    osc3.connect(gain3);
    gain3.connect(audioContext.destination);
    osc3.start(now + 0.38);
    osc3.stop(now + 0.6);
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}
