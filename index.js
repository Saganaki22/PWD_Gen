// DOM elements
const passwordLengthSlider = document.getElementById('passwordLength');
const passwordLengthValue = document.getElementById('passwordLengthValue');
const generatePasswordButton = document.getElementById('generatePasswordButton');
const passwordOutput = document.getElementById('passwordOutput');
const copyButton = document.getElementById('copyButton');
const strengthMeter = document.getElementById('strengthMeter');
const strengthLabel = document.getElementById('strengthLabel');
const strengthWarning = document.getElementById('strengthWarning');
const notification = document.getElementById('notification');
const themeToggle = document.getElementById('themeToggle');

// Character set toggles
const uppercaseToggle = document.getElementById('uppercaseToggle');
const lowercaseToggle = document.getElementById('lowercaseToggle');
const numbersToggle = document.getElementById('numbersToggle');
const symbolsToggle = document.getElementById('symbolsToggle');

// Pre-generate random values for better performance
let randomValues = new Uint32Array(64); // Max password length
crypto.getRandomValues(randomValues);
let randomIndex = 0;

// Character sets
const CHARS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Cache for character sets to avoid rebuilding them repeatedly
let cachedChars = '';
let lastToggles = '';

// Strength configurations
const STRENGTH_LEVELS = {
  VERY_WEAK: {
    color: '#dc3545',  // Red
    label: '🔴 Very Weak - Avoid using this password',
    warning: 'This password is too weak for most purposes'
  },
  WEAK: {
    color: '#fd7e14',  // Orange
    label: '🟠 Weak - Not very secure',
    warning: 'Consider using a longer password with more character types'
  },
  MODERATE: {
    color: '#ffc107',  // Yellow
    label: '🟡 Moderate - Somewhat secure',
    warning: 'Add more character types for better security'
  },
  STRONG: {
    color: '#198754',  // Green
    label: '🟢 Strong - Secure password',
    warning: ''
  },
  VERY_STRONG: {
    color: '#0d503c',  // Dark Green
    label: '🟢🟢 Very Strong - Highly secure',
    warning: ''
  }
};

// Common patterns to check against
const COMMON_PATTERNS = [
  /^[a-z]+$/i,  // only letters
  /^[0-9]+$/,   // only numbers
  /^[a-z0-9]+$/i,  // only alphanumeric
  /12345/,      // sequential numbers
  /qwerty/i,    // keyboard patterns
  /password/i,  // common words
  /abc/i,       // sequential letters
];

// Throttle function for smooth updates
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Function to generate and display password
function generateAndDisplayPassword() {
  try {
    const password = generatePassword();
    if (password) {
      passwordOutput.value = password;
      updateStrengthMeter(password, password.length);
      passwordOutput.classList.toggle('expanded', password.length > 30);
    }
  } catch (error) {
    showNotification(error.message, 'error');
  }
}

// Throttled version for automatic generation
const throttledGenerate = throttle(generateAndDisplayPassword, 50);

// Update password length display and strength meter on slider change
passwordLengthSlider.addEventListener('input', () => {
  const value = parseInt(passwordLengthSlider.value);
  passwordLengthValue.textContent = value;
  throttledGenerate();
});

// Update strength and generate new password when toggles change
[uppercaseToggle, lowercaseToggle, numbersToggle, symbolsToggle].forEach(toggle => {
  toggle.addEventListener('change', generateAndDisplayPassword);
});

// Generate password on button click (immediate)
generatePasswordButton.addEventListener('click', generateAndDisplayPassword);

// Toggle password expansion on double click
passwordOutput.addEventListener('dblclick', (e) => {
  e.preventDefault();
  passwordOutput.classList.toggle('expanded');
});

// Single click for copy
passwordOutput.addEventListener('click', (e) => {
  if (e.detail === 1) {
    copyToClipboard();
  }
});

// Copy password to clipboard
function copyToClipboard() {
  if (!passwordOutput.value) {
    showNotification('Generate a password first!', 'error');
    return;
  }
  
  navigator.clipboard.writeText(passwordOutput.value)
    .then(() => showNotification('Password copied!', 'success'))
    .catch(() => {
      passwordOutput.select();
      document.execCommand('copy');
      showNotification('Password copied!', 'success');
    });
}

// Add click handler for copying
copyButton.addEventListener('click', copyToClipboard);

// Build character set based on toggles
function getCharacterSet() {
  const currentToggles = [
    uppercaseToggle.checked,
    lowercaseToggle.checked,
    numbersToggle.checked,
    symbolsToggle.checked
  ].join('');

  // Return cached version if toggles haven't changed
  if (currentToggles === lastToggles) {
    return cachedChars;
  }

  // Build new character set
  let chars = '';
  if (uppercaseToggle.checked) chars += CHARS.uppercase;
  if (lowercaseToggle.checked) chars += CHARS.lowercase;
  if (numbersToggle.checked) chars += CHARS.numbers;
  if (symbolsToggle.checked) chars += CHARS.symbols;

  // Update cache
  cachedChars = chars;
  lastToggles = currentToggles;

  return chars;
}

// Generate password based on selected options
function generatePassword() {
  const length = Math.max(8, parseInt(passwordLengthSlider.value));
  const chars = getCharacterSet();
  
  if (!chars) {
    throw new Error('Please select at least one character type');
  }

  // Refresh random values if needed
  if (randomIndex + length > randomValues.length) {
    crypto.getRandomValues(randomValues);
    randomIndex = 0;
  }

  // Generate password
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[randomIndex++] % chars.length];
  }

  // Validate character types (quick check for first occurrence only)
  if (uppercaseToggle.checked && !containsCharType(password, CHARS.uppercase)) return generatePassword();
  if (lowercaseToggle.checked && !containsCharType(password, CHARS.lowercase)) return generatePassword();
  if (numbersToggle.checked && !containsCharType(password, CHARS.numbers)) return generatePassword();
  if (symbolsToggle.checked && !containsCharType(password, CHARS.symbols)) return generatePassword();

  return password;
}

// Optimized check if password contains characters from a specific set
function containsCharType(password, charSet) {
  for (let i = 0; i < password.length; i++) {
    if (charSet.includes(password[i])) return true;
  }
  return false;
}

// Get number of enabled character types
function getEnabledCharTypes() {
  return [uppercaseToggle, lowercaseToggle, numbersToggle, symbolsToggle]
    .reduce((count, toggle) => count + (toggle.checked ? 1 : 0), 0);
}

// Check if password contains common patterns
function hasCommonPatterns(password) {
  return COMMON_PATTERNS.some(pattern => pattern.test(password));
}

// Update the strength meter based on password length and complexity
function updateStrengthMeter(password, length) {
  let score;
  const enabledTypes = getEnabledCharTypes();
  const hasPattern = password ? hasCommonPatterns(password) : false;
  
  // Determine strength level
  if (length < 8 || enabledTypes === 1 || hasPattern) {
    score = 0;
  } else if (length < 16 && enabledTypes <= 2) {
    score = 1;
  } else if (length < 24 && enabledTypes <= 3) {
    score = 2;
  } else if (length < 40 && enabledTypes === 4) {
    score = 3;
  } else if (length >= 40 && enabledTypes === 4) {
    score = 4;
  } else {
    score = 2;
  }
  
  const strengthColors = {
    0: '#dc3545', // Very Weak - Red
    1: '#ffc107', // Weak - Yellow
    2: '#fd7e14', // Moderate - Orange
    3: '#198754', // Strong - Green
    4: '#198754'  // Very Strong - Same Green
  };

  const strengthLabels = {
    0: 'Very Weak',
    1: 'Weak',
    2: 'Moderate',
    3: 'Strong',
    4: 'Very Strong'
  };

  const strengthMeterWidth = {
    0: '20%',
    1: '40%',
    2: '60%',
    3: '80%',
    4: '100%'
  };

  strengthMeter.style.width = strengthMeterWidth[score];
  strengthMeter.style.backgroundColor = strengthColors[score];
  strengthMeter.style.boxShadow = score === 4 ? '0 0 10px #198754' : 'none';
  
  // Set label color to match meter color for all except Very Strong
  strengthLabel.style.color = strengthColors[score];
  strengthLabel.textContent = strengthLabels[score];

  // Add warnings for weak passwords
  if (score < 2) {
    strengthWarning.textContent = 'Consider using a longer password with more variety';
    strengthWarning.style.display = 'block';
  } else {
    strengthWarning.textContent = '';
    strengthWarning.style.display = 'none';
  }
}

// Show notification
function showNotification(message, type = 'success') {
  notification.innerHTML = type === 'success' ? 
    `<i class="fas fa-check-circle me-2"></i>${message}` :
    `<i class="fas fa-exclamation-circle me-2"></i>${message}`;
  
  // Remove any existing classes
  notification.classList.remove('success', 'error');
  // Add appropriate class
  notification.classList.add(type);
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const passwordLengthSlider = document.getElementById('passwordLength');
  const passwordLengthValue = document.getElementById('passwordLengthValue');
  const strengthMeter = document.getElementById('strengthMeter');
  const strengthLabel = document.getElementById('strengthLabel');
  const strengthWarning = document.getElementById('strengthWarning');
  const passwordOutput = document.getElementById('passwordOutput');
  const copyButton = document.getElementById('copyButton');
  const generateButton = document.getElementById('generatePasswordButton');
  const themeToggle = document.getElementById('themeToggle');
  const notification = document.getElementById('notification');

  // Theme detection and management
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '🌙' : '☀️';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  // Initialize theme based on system preference or stored preference
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    setTheme(storedTheme === 'dark');
  } else {
    setTheme(prefersDarkScheme.matches);
  }

  // Listen for system theme changes
  prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {  // Only auto-switch if user hasn't set a preference
      setTheme(e.matches);
    }
  });

  // Theme toggle button
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
  });

  // Password generation functions
  function generatePassword() {
    const length = Math.max(8, parseInt(passwordLengthSlider.value));
    const useUppercase = document.getElementById('uppercaseToggle').checked;
    const useLowercase = document.getElementById('lowercaseToggle').checked;
    const useNumbers = document.getElementById('numbersToggle').checked;
    const useSymbols = document.getElementById('symbolsToggle').checked;

    let charset = '';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*';

    if (charset === '') {
      return '';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  function calculatePasswordStrength(password) {
    if (!password) return { score: 0, label: '', color: '' };

    const length = password.length;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*]/.test(password);

    const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;

    let score = 0;
    let label = '';
    let color = '';

    if (length >= 12) score += 2;
    else if (length >= 8) score += 1;

    score += varietyCount;

    if (score >= 5) {
      label = 'Very Strong';
      color = '#198754';
    } else if (score === 4) {
      label = 'Strong';
      color = '#198754';
    } else if (score === 3) {
      label = 'Medium';
      color = '#ffc107';
    } else if (score === 2) {
      label = 'Weak';
      color = '#dc3545';
    } else {
      label = 'Very Weak';
      color = '#dc3545';
    }

    return { score, label, color };
  }

  function generateAndDisplayPassword() {
    const password = generatePassword();
    passwordOutput.value = password;

    const strength = calculatePasswordStrength(password);
    strengthMeter.style.width = `${(strength.score / 5) * 100}%`;
    strengthMeter.style.backgroundColor = strength.color;
    strengthLabel.textContent = strength.label;
    strengthLabel.style.color = strength.color;

    // Show warning for weak passwords
    if (strength.score <= 2) {
      strengthWarning.textContent = 'Consider using a longer password with more variety';
      strengthWarning.style.color = '#dc3545';
    } else {
      strengthWarning.textContent = '';
    }
  }

  // Event listeners
  passwordLengthSlider.addEventListener('input', function() {
    passwordLengthValue.textContent = this.value;
    generateAndDisplayPassword();
  });

  document.querySelectorAll('.form-check-input').forEach(checkbox => {
    checkbox.addEventListener('change', generateAndDisplayPassword);
  });

  generateButton.addEventListener('click', generateAndDisplayPassword);

  // Copy password functionality
  function copyPassword() {
    passwordOutput.select();
    document.execCommand('copy');
    showNotification('success', 'Password copied!');
  }

  copyButton.addEventListener('click', copyPassword);
  passwordOutput.addEventListener('click', copyPassword);

  // Notification system
  function showNotification(type, message) {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
      notification.className = 'notification';
    }, 3000);
  }

  // Generate initial password
  generateAndDisplayPassword();
});
