document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });

    function performSearch(query) {
        // Check if it looks like a URL
        if (isValidUrl(query)) {
            let url = query;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            window.location.href = url;
        } else {
            // Default to Google search
            window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
    }

    function isValidUrl(string) {
        // Simple regex to check if it mimics a domain structure
        const res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return (res !== null);
    }

    // --- Shortcuts Logic ---
    const shortcutsContainer = document.getElementById('shortcuts-container');
    const addShortcutModal = document.getElementById('add-shortcut-modal');
    const saveShortcutBtn = document.getElementById('save-shortcut');
    const cancelShortcutBtn = document.getElementById('cancel-shortcut');
    const shortcutNameInput = document.getElementById('shortcut-name');
    const shortcutUrlInput = document.getElementById('shortcut-url');

    // Delete Modal Elements
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    let shortcutIndexToDelete = -1;

    // Context Menu Elements
    const contextMenu = document.getElementById('shortcut-context-menu');
    const ctxEdit = document.getElementById('ctx-edit');
    const ctxDelete = document.getElementById('ctx-delete');
    let editingShortcutIndex = -1;
    let contextMenuShortcutIndex = -1;

    const defaultShortcuts = [
        { title: 'i.pack', url: 'https://www.oussamaidiken.site/i.pack', icon: 'i.pack.png', isLocal: true },
        { title: 'stuff', url: 'https://www.oussamaidiken.site/stuff', icon: 'stuff.png', isLocal: true },
        { title: 'tag', url: 'https://www.oussamaidiken.site/TAG', icon: 'tag.png', isLocal: true },
        { title: 'meta', url: 'https://www.oussamaidiken.site/meta', icon: 'meta.png', isLocal: true },
        { title: 'text editor', url: 'https://www.oussamaidiken.site/txt', icon: 'txt.png', isLocal: true },
        { title: 'lab', url: 'https://www.oussamaidiken.site/lab', icon: 'lab.png', isLocal: true },
        { title: 'ctrl + v', url: 'https://www.oussamaidiken.site/ctrlv', icon: 'ctrlv.png', isLocal: true },
        { title: 'الأذان', url: 'https://www.oussamaidiken.site/Prayer-Times', icon: 'adan.png', isLocal: true }
    ];

    let shortcuts = JSON.parse(localStorage.getItem('shortcuts')) || defaultShortcuts;

    // Block default context menu globally
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Hide context menu on click elsewhere
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.classList.add('hidden');
        }
    });

    function renderShortcuts() {
        shortcutsContainer.innerHTML = '';
        shortcuts.forEach((shortcut, index) => {
            const link = document.createElement('a');
            link.href = shortcut.url;
            link.className = 'shortcut';
            link.style.position = 'relative';

            // Context Menu Event
            link.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                contextMenuShortcutIndex = index;
                showContextMenu(e.pageX, e.pageY);
            });

            const iconDiv = document.createElement('div');
            iconDiv.className = 'shortcut-icon';
            const img = document.createElement('img');
            img.src = shortcut.icon;
            img.alt = shortcut.title;
            // Handle image error for external favicons
            img.onerror = function () {
                this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMmEyIDEgMCAwIDEgMiAyaDJhMiAxIDAgMCAxIDIgMnY0aDZ2OEgwaC04di04aDZWMTRoMnYtNHgyLTJWMiB6IiBmaWxsPSIjNWY2MzY4Ii8+PC9zdmc+'; // Gray generic icon fallback
            };
            iconDiv.appendChild(img);

            const titleDiv = document.createElement('div');
            titleDiv.className = 'shortcut-title';
            titleDiv.textContent = shortcut.title;

            // Delete Button (still keep it for convenience/visual cue)
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'shortcut-delete';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Remove';
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteShortcut(index);
            });

            link.appendChild(iconDiv);
            link.appendChild(titleDiv);
            link.appendChild(deleteBtn);
            shortcutsContainer.appendChild(link);
        });

        const addWrapper = document.createElement('div');
        addWrapper.className = 'shortcut';
        addWrapper.style.cursor = 'pointer';

        const addBtnIcon = document.createElement('div');
        addBtnIcon.className = 'shortcut-add-btn';
        addBtnIcon.innerHTML = `
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </div>
        `;

        const addTitle = document.createElement('div');
        addTitle.className = 'shortcut-title';
        addTitle.textContent = 'Add shortcut';

        addWrapper.appendChild(addBtnIcon);
        addWrapper.appendChild(addTitle);
        addWrapper.addEventListener('click', () => {
            editingShortcutIndex = -1; // Reset edit mode
            openAddModal();
        });

        shortcutsContainer.appendChild(addWrapper);
    }

    function showContextMenu(x, y) {
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
    }

    // Context Menu Actions
    ctxEdit.addEventListener('click', () => {
        if (contextMenuShortcutIndex > -1) {
            const shortcut = shortcuts[contextMenuShortcutIndex];
            editingShortcutIndex = contextMenuShortcutIndex;
            shortcutNameInput.value = shortcut.title;
            shortcutUrlInput.value = shortcut.url;
            addShortcutModal.classList.remove('hidden');
            shortcutNameInput.focus();
        }
        contextMenu.classList.add('hidden');
    });

    ctxDelete.addEventListener('click', () => {
        if (contextMenuShortcutIndex > -1) {
            deleteShortcut(contextMenuShortcutIndex);
        }
        contextMenu.classList.add('hidden');
    });


    function addOrUpdateShortcut(title, url) {
        if (!url) return;
        if (!url.startsWith('http')) url = 'https://' + url;

        let domain = '';
        try {
            domain = new URL(url).hostname;
        } catch (e) {
            domain = url;
        }

        // Only update icon if it's a new or diff domain? Or just always fetch new logic.
        // If updating, we might want to keep custom icon if we had one?
        // But current logic is just fetching from Google. simple.
        const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        if (editingShortcutIndex > -1) {
            // Update existing
            shortcuts[editingShortcutIndex] = {
                title: title || domain,
                url: url,
                icon: iconUrl, // Update icon too
                isLocal: false
            };
            editingShortcutIndex = -1;
        } else {
            // Add new
            shortcuts.push({ title: title || domain, url: url, icon: iconUrl, isLocal: false });
        }

        saveShortcuts();
        renderShortcuts();
        closeAddModal();
    }

    function deleteShortcut(index) {
        shortcutIndexToDelete = index;
        deleteConfirmationModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        deleteConfirmationModal.classList.add('hidden');
        shortcutIndexToDelete = -1;
    }

    function saveShortcuts() {
        localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
    }

    function openAddModal() {
        if (editingShortcutIndex === -1) {
            shortcutNameInput.value = '';
            shortcutUrlInput.value = '';
        }
        addShortcutModal.classList.remove('hidden');
        shortcutNameInput.focus();
    }

    function closeAddModal() {
        addShortcutModal.classList.add('hidden');
        editingShortcutIndex = -1;
    }

    saveShortcutBtn.addEventListener('click', () => {
        addOrUpdateShortcut(shortcutNameInput.value, shortcutUrlInput.value);
    });

    cancelShortcutBtn.addEventListener('click', closeAddModal);

    addShortcutModal.addEventListener('click', (e) => {
        if (e.target === addShortcutModal) closeAddModal();
    });

    // Delete Modal Listeners
    confirmDeleteBtn.addEventListener('click', () => {
        if (shortcutIndexToDelete > -1) {
            shortcuts.splice(shortcutIndexToDelete, 1);
            saveShortcuts();
            renderShortcuts();
            closeDeleteModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    deleteConfirmationModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmationModal) closeDeleteModal();
    });

    renderShortcuts();

    // --- Settings Logic ---
    const settingsTrigger = document.getElementById('settings-trigger');
    const settingsPanel = document.getElementById('settings-panel');
    const colorOptions = document.querySelectorAll('.bg-option[data-color]');
    const bgImageUpload = document.getElementById('bg-image-upload');
    const removeBgImageBtn = document.getElementById('remove-bg-image');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const bgLayer = document.getElementById('bg-layer');
    const blurSlider = document.getElementById('blur-slider');
    const blurValueDisplay = document.getElementById('blur-value');

    let currentUiMode = 'auto'; // 'auto', 'light', 'dark'
    let imageIsDark = true;

    // Custom Color Picker Initialization
    const cp = new CustomColorPicker('color-picker-container', (color) => {
        setBackgroundColor(color);
        saveSetting('bgColor', color);
        saveSetting('bgType', 'color');
        removeBgImage();
    });

    // Mode Toggle Logic
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Apply mode
            if (btn.id === 'mode-auto') currentUiMode = 'auto';
            else if (btn.id === 'mode-light') currentUiMode = 'light';
            else if (btn.id === 'mode-dark') currentUiMode = 'dark';

            saveSetting('uiMode', currentUiMode);

            // Re-apply UI classes based on new mode
            updateUiClasses();
        });
    });

    // Blur Slider Logic
    blurSlider.addEventListener('input', (e) => {
        const blurAmount = e.target.value;
        setBlur(blurAmount);
        saveSetting('bgBlur', blurAmount);
    });

    // Toggle Panel
    settingsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('hidden');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsTrigger.contains(e.target)) {
            settingsPanel.classList.add('hidden');
        }
    });

    // Load saved settings
    loadSettings();

    // Solid Color Options
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const color = option.getAttribute('data-color');
            setBackgroundColor(color);
            cp.setHex(color); // Sync picker
            saveSetting('bgColor', color);
            saveSetting('bgType', 'color');
            removeBgImage(); // Clear image if color is selected
        });
    });

    // Image Upload
    bgImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const imageUrl = event.target.result;
                analyzeImageBrightness(imageUrl, (isDark) => {
                    imageIsDark = isDark;
                    saveSetting('imageIsDark', isDark);
                    setBackgroundImage(imageUrl);
                    saveSetting('bgImage', imageUrl);
                    saveSetting('bgType', 'image');
                });
            };
            reader.readAsDataURL(file);
        }
    });

    removeBgImageBtn.addEventListener('click', () => {
        removeBgImage();
        // Revert to last color or default
        const lastColor = localStorage.getItem('bgColor') || '#202124';
        setBackgroundColor(lastColor);
        cp.setHex(lastColor);
        saveSetting('bgType', 'color');
    });

    function setBackgroundColor(color) {
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.backgroundColor = color;
        updateUiClasses(color);
    }

    function setBackgroundImage(url) {
        bgLayer.style.backgroundColor = 'transparent';
        bgLayer.style.backgroundImage = `url(${url})`;
        bgLayer.style.backgroundSize = 'cover';
        bgLayer.style.backgroundPosition = 'center';
        bgLayer.style.backgroundRepeat = 'no-repeat';
        removeBgImageBtn.classList.remove('hidden');
        updateUiClasses();
    }

    function removeBgImage() {
        bgLayer.style.backgroundImage = 'none';
        removeBgImageBtn.classList.add('hidden');
        localStorage.removeItem('bgImage');
    }

    function setBlur(amount) {
        bgLayer.style.filter = `blur(${amount}px)`;
        blurValueDisplay.textContent = `${amount}px`;
    }

    function analyzeImageBrightness(imageSrc, callback) {
        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "Anonymous"; // If needed, though local file urls don't need it usually.
        img.onload = function () {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // If image is too big, might be slow. But local images are ok.
            // For massive images, maybe scale down first?
            // Let's draw to a small canvas directly.

            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = 100;
            smallCanvas.height = 100;
            const smallCtx = smallCanvas.getContext('2d');
            smallCtx.drawImage(img, 0, 0, 100, 100);

            const imageData = smallCtx.getImageData(0, 0, 100, 100);
            const data = imageData.data;
            let r, g, b, avg;
            let colorSum = 0;

            for (let x = 0, len = data.length; x < len; x += 4) {
                r = data[x];
                g = data[x + 1];
                b = data[x + 2];
                avg = Math.floor((r + g + b) / 3);
                colorSum += avg;
            }

            const totalPixels = data.length / 4;
            const brightness = Math.floor(colorSum / totalPixels);
            callback(brightness < 128);
        }
    }

    function updateUiClasses(colorOverride) {
        // Clear manual overrides first
        document.body.classList.remove('dark-bg', 'light-bg');

        if (currentUiMode === 'auto') {
            const bgType = localStorage.getItem('bgType');

            if (bgType === 'image') {
                if (imageIsDark) {
                    document.body.classList.add('dark-bg');
                } else {
                    document.body.classList.add('light-bg');
                }
            } else {
                let colorToCheck = colorOverride;
                if (!colorToCheck) {
                    colorToCheck = localStorage.getItem('bgColor') || '#202124';
                }

                if (colorToCheck && isDark(colorToCheck)) {
                    document.body.classList.add('dark-bg');
                } else if (colorToCheck && !isDark(colorToCheck)) {
                    document.body.classList.add('light-bg');
                }
            }
        } else if (currentUiMode === 'light') {
            document.body.classList.add('light-bg');
        } else if (currentUiMode === 'dark') {
            document.body.classList.add('dark-bg');
        }
    }


    function saveSetting(key, value) {
        localStorage.setItem(key, value);
    }

    function loadSettings() {
        const bgType = localStorage.getItem('bgType') || 'color';
        const bgColor = localStorage.getItem('bgColor') || '#202124';
        currentUiMode = localStorage.getItem('uiMode') || 'auto';
        const bgBlur = localStorage.getItem('bgBlur') || '0';

        if (localStorage.getItem('imageIsDark') !== null) {
            imageIsDark = localStorage.getItem('imageIsDark') === 'true';
        }

        // Update Mode Buttons UI
        modeBtns.forEach(b => b.classList.remove('active'));
        if (currentUiMode === 'auto') document.getElementById('mode-auto').classList.add('active');
        if (currentUiMode === 'light') document.getElementById('mode-light').classList.add('active');
        if (currentUiMode === 'dark') document.getElementById('mode-dark').classList.add('active');

        // Update Blur UI
        blurSlider.value = bgBlur;
        setBlur(bgBlur);

        if (bgType === 'image') {
            const bgImage = localStorage.getItem('bgImage');
            if (bgImage) {
                setBackgroundImage(bgImage);
            }
        } else {
            if (bgColor) {
                setBackgroundColor(bgColor);
            }
        }
        cp.setHex(bgColor);
    }

    // Helper to check if color is dark (simple version)
    function isDark(color) {
        // Convert hex to rgb
        let r, g, b;
        if (color.match(/^rgb/)) {
            const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            r = match[1]; g = match[2]; b = match[3];
        } else {
            // Hex
            const hex = color.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq < 128);
    }
});
