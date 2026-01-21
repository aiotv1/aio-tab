// Logo Color Customization Logic
document.addEventListener('DOMContentLoaded', () => {
    const mainLogoItem = document.getElementById('main-logo');
    const logoHueSlider = document.getElementById('logo-hue-slider');
    const logoHueValueDisplay = document.getElementById('logo-hue-value');
    const logoTintToggle = document.getElementById('logo-tint-toggle');

    let logoHue = localStorage.getItem('logoHue') || '0';
    let logoTintEnabled = localStorage.getItem('logoTintEnabled') === 'true';

    function updateLogoColor() {
        if (!mainLogoItem) return;

        let filters = [];

        // Apply hue rotation
        if (logoHue && logoHue !== '0') {
            filters.push(`hue-rotate(${logoHue}deg)`);
        }

        // Apply monochrome tint
        if (logoTintEnabled) {
            filters.push('grayscale(1) brightness(0.9)');
        }

        mainLogoItem.style.filter = filters.join(' ');
    }

    // Initialize values
    if (logoHueSlider) {
        logoHueSlider.value = logoHue;
        logoHueValueDisplay.textContent = `${logoHue}°`;
    }

    if (logoTintToggle) {
        logoTintToggle.checked = logoTintEnabled;
    }

    // Hue slider listener
    if (logoHueSlider) {
        logoHueSlider.addEventListener('input', (e) => {
            logoHue = e.target.value;
            logoHueValueDisplay.textContent = `${logoHue}°`;
            localStorage.setItem('logoHue', logoHue);
            updateLogoColor();
        });
    }

    // Tint toggle listener
    if (logoTintToggle) {
        logoTintToggle.addEventListener('change', () => {
            logoTintEnabled = logoTintToggle.checked;
            localStorage.setItem('logoTintEnabled', logoTintEnabled);
            updateLogoColor();
        });
    }

    // Apply initial logo color
    updateLogoColor();
});
