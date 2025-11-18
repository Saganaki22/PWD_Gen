document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const els = {
        slider: document.getElementById('passwordLength'),
        lengthVal: document.getElementById('passwordLengthValue'),
        output: document.getElementById('passwordOutput'),
        btnGenerate: document.getElementById('generatePasswordButton'),
        btnCopy: document.getElementById('copyButton'),
        notification: document.getElementById('notification'),
        meterBar: document.getElementById('strengthMeterBar'),
        strengthLabel: document.getElementById('strengthLabel'),
        toggles: {
            upper: document.getElementById('uppercaseToggle'),
            lower: document.getElementById('lowercaseToggle'),
            number: document.getElementById('numbersToggle'),
            symbol: document.getElementById('symbolsToggle')
        }
    };

    // Configuration
    const CHARS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        number: '0123456789',
        symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    // State
    let isGenerating = false;

    // --- Core Functions ---

    const generatePassword = () => {
        const length = parseInt(els.slider.value);
        let chars = '';
        
        if (els.toggles.upper.checked) chars += CHARS.upper;
        if (els.toggles.lower.checked) chars += CHARS.lower;
        if (els.toggles.number.checked) chars += CHARS.number;
        if (els.toggles.symbol.checked) chars += CHARS.symbol;

        if (!chars) {
            showNotification('Select at least one option!', 'error');
            return '';
        }

        // Secure generation
        const randomValues = new Uint32Array(length);
        crypto.getRandomValues(randomValues);
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars[randomValues[i] % chars.length];
        }

        return password;
    };

    const updateUI = () => {
        const pwd = generatePassword();
        if (!pwd) return;

        els.output.value = pwd;
        calculateStrength(pwd);
    };

    const calculateStrength = (password) => {
        let score = 0;
        const length = password.length;
        
        // Length points
        if (length > 8) score += 10;
        if (length > 12) score += 15;
        if (length >= 16) score += 20;

        // Complexity points
        if (/[A-Z]/.test(password)) score += 15;
        if (/[a-z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^A-Za-z0-9]/.test(password)) score += 15;

        // Cap score at 100
        score = Math.min(100, score);

        // Update Visuals
        els.meterBar.style.width = `${score}%`;
        
        let colorClass, label;
        
        // Remove previous color classes
        els.meterBar.className = 'h-full w-0 transition-all duration-500 ease-out';

        if (score < 40) {
            els.meterBar.classList.add('bg-red-500');
            label = 'Weak';
            els.strengthLabel.className = 'text-red-400';
        } else if (score < 70) {
            els.meterBar.classList.add('bg-yellow-500');
            label = 'Moderate';
            els.strengthLabel.className = 'text-yellow-400';
        } else {
            els.meterBar.classList.add('bg-green-500');
            label = 'Strong';
            els.strengthLabel.className = 'text-green-400';
        }

        els.strengthLabel.textContent = label;
    };

    const copyToClipboard = async () => {
        if (!els.output.value) return;

        try {
            await navigator.clipboard.writeText(els.output.value);
            showNotification('Password copied to clipboard!', 'success');
        } catch (err) {
            // Fallback
            els.output.select();
            document.execCommand('copy');
            showNotification('Password copied!', 'success');
        }
    };

    const showNotification = (msg, type) => {
        const notif = els.notification;
        const text = document.getElementById('notificationText');
        
        text.textContent = msg;
        
        // Simple animation classes
        notif.classList.remove('translate-y-24', 'opacity-0');
        
        setTimeout(() => {
            notif.classList.add('translate-y-24', 'opacity-0');
        }, 3000);
    };

    // --- Event Listeners ---

    els.slider.addEventListener('input', (e) => {
        els.lengthVal.textContent = e.target.value;
        updateUI();
    });

    Object.values(els.toggles).forEach(toggle => {
        toggle.addEventListener('change', updateUI);
    });

    els.btnGenerate.addEventListener('click', () => {
        // Add a small animation effect to button
        els.btnGenerate.classList.add('scale-95');
        setTimeout(() => els.btnGenerate.classList.remove('scale-95'), 100);
        updateUI();
    });

    els.btnCopy.addEventListener('click', copyToClipboard);
    els.output.addEventListener('click', copyToClipboard);

    // Initialize
    updateUI();
});
