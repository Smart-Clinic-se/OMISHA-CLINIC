// Utility to play sounds using Web Audio API
// This avoids the need for external MP3 files and fixes CORB/download issues.

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

export const playAnnouncementSound = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const now = audioContext.currentTime;

    // First Note (Ding) - High Pitch
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + 0.5);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(audioContext.destination);

    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second Note (Dong) - Lower Pitch
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, now + 0.4); // Overlap slightly
    osc2.frequency.exponentialRampToValueAtTime(250, now + 1.5);

    gain2.gain.setValueAtTime(0.3, now + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

    osc2.connect(gain2);
    gain2.connect(audioContext.destination);

    osc2.start(now + 0.4);
    osc2.stop(now + 1.5);
};

export const playNotificationSound = () => {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.3);
};
