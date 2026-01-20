class CustomColorPicker {
    constructor(containerId, onChange) {
        this.container = document.getElementById(containerId);
        this.onChange = onChange;

        this.hueRing = this.container.querySelector('.cp-hue-ring');
        this.hueHandle = this.container.querySelector('.cp-hue-handle');
        this.slSquare = this.container.querySelector('.cp-sl-square');
        this.slHandle = this.container.querySelector('.cp-sl-handle');

        this.hue = 0; // 0-360
        this.saturation = 100; // 0-100
        this.lightness = 50; // 0-100 (HSL lightness, slightly different from HSV value but close enough for this UI)
        // Actually, the UI (square) implies HSV (Sat vs Value). Let's use HSV internally and convert to RGB/Hex.
        this.val = 100; // Value 0-100

        this.initEvents();
    }

    initEvents() {
        // Hue Ring Interactions
        const updateHue = (e) => {
            const rect = this.hueRing.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = e.clientX - centerX;
            const y = e.clientY - centerY;

            // Calculate angle, adding 90 deg because 0 is usually 3 o'clock but our gradient starts red at 12 o'clock (css conic-gradient typically starts top)
            // CSS conic-gradient(red, ...) starts at top.
            // Math.atan2(y, x) -> 0 is right (3 o'clock), -PI/2 is top (12 o'clock).
            let angleRad = Math.atan2(y, x);
            let angleDeg = angleRad * (180 / Math.PI) + 90;
            if (angleDeg < 0) angleDeg += 360;

            this.hue = angleDeg;
            this.updateUI();
            this.triggerChange();
        };

        this.hueRing.addEventListener('mousedown', (e) => {
            e.preventDefault(); // update on click
            updateHue(e);

            const onMouseMove = (ev) => updateHue(ev);
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // SL Square Interactions
        const updateSL = (e) => {
            const rect = this.slSquare.getBoundingClientRect();
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;

            // Clamp
            x = Math.max(0, Math.min(x, rect.width));
            y = Math.max(0, Math.min(y, rect.height));

            this.saturation = (x / rect.width) * 100;
            this.val = 100 - ((y / rect.height) * 100);

            this.updateUI();
            this.triggerChange();
        };

        this.slSquare.addEventListener('mousedown', (e) => {
            e.preventDefault();
            updateSL(e);

            const onMouseMove = (ev) => updateSL(ev);
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    setHex(hex) {
        // Simple hex to HSV (not perfect but robust enough)
        const rgb = this.hexToRgb(hex);
        if (!rgb) return;
        const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
        this.hue = hsv.h * 360;
        this.saturation = hsv.s * 100;
        this.val = hsv.v * 100;
        this.updateUI();
    }

    updateUI() {
        // Update Hue Handle Position
        // Angle 0 is top.
        const r = 50; // % radius
        // To stick handle on ring center track (approx 85% of total radius if hole is 70%? no hole is 70% of diam, so 35% rad. Ring is 100% diam, 50% rad. Middle is (50+35)/2 = 42.5%? No, css handle is just left/top 50%.
        // Actually handle is usually on the ring. Let's use simple trig to place handle.
        // Css conic gradient starts red at top (0deg).
        // JS angle 0 is top.
        // x = sin(a), y = -cos(a) for top-0 clockwise?
        // Math matches: 0 deg -> x=0, y=-1 (top). 90 deg -> x=1, y=0 (right).

        const rad = (this.hue * Math.PI) / 180;
        const radius = 42.5; // Putting it in the middle of ring (15% to 50% -> avg 32.5? Wait hole is 15% margin.. wait code says top:15% bottom:15% -> 70% height -> 35% radius inner. Outer is 50% radius. Avg is 42.5%)

        // CSS coordinates: Center is 50%, 50%.
        // x offset = sin(rad) * radius
        // y offset = -cos(rad) * radius
        const hx = 50 + Math.sin(rad) * radius;
        const hy = 50 - Math.cos(rad) * radius;

        this.hueHandle.style.left = `${hx}%`;
        this.hueHandle.style.top = `${hy}%`;
        this.hueHandle.style.backgroundColor = `hsl(${this.hue}, 100%, 50%)`; // Handle color matches hue

        // Update Square Background to match Hue
        this.slSquare.style.backgroundColor = `hsl(${this.hue}, 100%, 50%)`;

        // Update SL Handle Position
        this.slHandle.style.left = `${this.saturation}%`;
        this.slHandle.style.top = `${100 - this.val}%`;
    }

    triggerChange() {
        const rgb = this.hsvToRgb(this.hue / 360, this.saturation / 100, this.val / 100);
        const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        if (this.onChange) this.onChange(hex);
    }

    // Colors Helpers
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    rgbToHsv(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;
        const d = max - min;
        s = max == 0 ? 0 : d / max;
        if (max == min) {
            h = 0;
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, v };
    }

    hsvToRgb(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
}
window.CustomColorPicker = CustomColorPicker;
