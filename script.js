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

    // AI Tools Toggle
    const aiToolsTrigger = document.getElementById('ai-tools-trigger');
    const aiToolsList = document.getElementById('ai-tools-list');

    aiToolsTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        aiToolsList.classList.toggle('hidden');
    });

    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsPanel.contains(e.target) && !settingsTrigger.contains(e.target)) {
            settingsPanel.classList.add('hidden');
        }
        if (!aiToolsList.contains(e.target) && !aiToolsTrigger.contains(e.target) && !settingsPanel.contains(e.target)) {
            aiToolsList.classList.add('hidden');
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

    // --- Bottom Shortcuts Section ---
    const shortcutsSection = document.getElementById('shortcuts-section');
    const bottomShortcutsToggle = document.getElementById('bottom-shortcuts-toggle');
    const bottomShortcutsMgmtList = document.getElementById('bottom-shortcuts-list-mgmt');
    const newBottomShortcutInput = document.getElementById('new-bottom-shortcut-url');
    const addBottomShortcutBtn = document.getElementById('add-bottom-shortcut-btn');

    const defaultBottomShortcuts = [
        'https://youtube.com/',
        'https://mail.google.com/',
        'https://web.telegram.org/',
        'https://web.whatsapp.com/',
        'https://x.com/',
        'https://discord.com/app',
        'https://www.photopea.com/',
        'https://pinterest.com/',
        'https://instagram.com/'
    ];

    const svgIcons = {
        'youtube.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>youtube</title><path fill="#ffffff" d="m10 15l5.19-3L10 9zm11.56-7.83c.13.47.22 1.1.28 1.9c.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83c-.25.9-.83 1.48-1.73 1.73c-.47.13-1.33.22-2.65.28c-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44c-.9-.25-1.48-.83-1.73-1.73c-.13-.47-.22-1.1-.28-1.9c-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83c.25-.9.83-1.48 1.73-1.73c.47-.13 1.33-.22 2.65-.28c1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44c.9.25 1.48.83 1.73 1.73"/></svg>`,
        'mail.google.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>gmail</title><path fill="#ffffff" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64L12 9.548l6.545-4.91l1.528-1.145C21.69 2.28 24 3.434 24 5.457"/></svg>`,
        'telegram.org': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48" fill="#ffffff"><title fill="#ffffff">telegram</title><path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="#ffffff"/></svg>`,
        'whatsapp.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>baseline-whatsapp</title><path fill="#ffffff" d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.65-1.03-5.14-2.9-7.01m-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18l-3.12.82l.83-3.04l-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81c-.23-.08-.39-.12-.56.12c-.17.25-.64.81-.78.97c-.14.17-.29.19-.54.06c-.25-.12-1.05-.39-1.99-1.23c-.74-.66-1.23-1.47-1.38-1.72c-.14-.25-.02-.38.11-.51c.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31c-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74c.59.26 1.05.41 1.41.52c.59.19 1.13.16 1.56.1c.48-.07 1.47-.6 1.67-1.18c.21-.58.21-1.07.14-1.18s-.22-.16-.47-.28"/></svg>`,
        'x.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>x-solid</title><path fill="#ffffff" d="M13.795 10.533L20.68 2h-3.073l-5.255 6.517L7.69 2H1l7.806 10.91L1.47 22h3.074l5.705-7.07L15.31 22H22zm-2.38 2.95L9.97 11.464L4.36 3.627h2.31l4.528 6.317l1.443 2.02l6.018 8.409h-2.31z"/></svg>`,
        'discord.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>baseline-discord</title><path fill="#ffffff" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"/></svg>`,
        'photopea.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>photopea</title><path fill="#ffffff" d="M20.098 0A3.9 3.9 0 0 1 24 3.903v16.194A3.9 3.9 0 0 1 20.098 24H6.393l-.051-10.34v-.074c0-3.92 3.112-7.09 6.963-7.09c2.31 0 4.177 1.902 4.177 4.254s-1.867 4.254-4.177 4.254c-.77 0-1.393-.634-1.393-1.418s.623-1.418 1.393-1.418c.769 0 1.392-.634 1.392-1.418s-.623-1.418-1.392-1.418c-2.31 0-4.178 1.9-4.178 4.253c0 2.352 1.868 4.254 4.178 4.254c3.85 0 6.962-3.169 6.962-7.09S17.155 3.66 13.305 3.66c-5.39 0-9.75 4.436-9.75 9.925v.086l.023 10.315A3.9 3.9 0 0 1 0 20.097V3.903A3.9 3.9 0 0 1 3.902 0z"/></svg>`,
        'pinterest.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>pinterest-fill</title><path fill="#ffffff" d="M13.372 2.094a10.003 10.003 0 0 0-5.369 19.074a7.8 7.8 0 0 1 .162-2.292c.185-.839 1.296-5.463 1.296-5.463a3.7 3.7 0 0 1-.324-1.577c0-1.485.857-2.593 1.923-2.593a1.334 1.334 0 0 1 1.342 1.508c0 .9-.578 2.262-.88 3.54a1.544 1.544 0 0 0 1.575 1.923c1.897 0 3.17-2.431 3.17-5.301c0-2.201-1.457-3.847-4.143-3.847a4.746 4.746 0 0 0-4.93 4.793a2.96 2.96 0 0 0 .648 1.97a.48.48 0 0 1 .162.554c-.046.184-.162.623-.208.785a.354.354 0 0 1-.51.253c-1.384-.554-2.036-2.077-2.036-3.816c0-2.847 2.384-6.255 7.154-6.255c3.796 0 6.319 2.777 6.319 5.747c0 3.909-2.176 6.848-5.393 6.848a2.86 2.86 0 0 1-2.454-1.246s-.579 2.316-.692 2.754a8 8 0 0 1-1.019 2.131c.923.28 1.882.42 2.846.416a9.99 9.99 0 0 0 9.996-10.002a10 10 0 0 0-8.635-9.904"/></svg>`,
        'instagram.com': `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title>instagram</title><path fill="#ffffff" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>`
    };

    let bottomShortcuts = JSON.parse(localStorage.getItem('bottomShortcuts')) || defaultBottomShortcuts;
    let bottomShortcutsEnabled = localStorage.getItem('bottomShortcutsEnabled') === 'true';

    function renderBottomShortcuts() {
        shortcutsSection.innerHTML = '';
        if (!bottomShortcutsEnabled) {
            shortcutsSection.classList.add('hidden');
            return;
        }

        bottomShortcuts.forEach(url => {
            let domain = '';
            try {
                domain = new URL(url).hostname.replace('www.', '');
            } catch (e) {
                domain = url;
            }

            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.className = 'ai-tool-item';

            // Check if we have an SVG for this domain
            let matchedSvg = null;
            for (const key in svgIcons) {
                if (url.includes(key)) {
                    matchedSvg = svgIcons[key];
                    break;
                }
            }

            if (matchedSvg) {
                link.innerHTML = matchedSvg;
            } else {
                const img = document.createElement('img');
                img.src = `https://www.google.com/s2/favicons?domain=${url}&sz=64`;
                img.alt = domain;
                link.appendChild(img);
            }

            shortcutsSection.appendChild(link);
        });

        if (bottomShortcuts.length > 0) {
            shortcutsSection.classList.remove('hidden');
        } else {
            shortcutsSection.classList.add('hidden');
        }
    }

    function renderBottomShortcutsMgmt() {
        bottomShortcutsMgmtList.innerHTML = '';
        bottomShortcuts.forEach((url, index) => {
            const item = document.createElement('div');
            item.className = 'mgmt-item';

            const span = document.createElement('span');
            span.textContent = url;
            span.title = url;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn-small';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', () => {
                bottomShortcuts.splice(index, 1);
                saveBottomShortcuts();
                renderBottomShortcuts();
                renderBottomShortcutsMgmt();
            });

            item.appendChild(span);
            item.appendChild(removeBtn);
            bottomShortcutsMgmtList.appendChild(item);
        });
    }

    function saveBottomShortcuts() {
        localStorage.setItem('bottomShortcuts', JSON.stringify(bottomShortcuts));
    }

    bottomShortcutsToggle.checked = bottomShortcutsEnabled;
    bottomShortcutsToggle.addEventListener('change', () => {
        bottomShortcutsEnabled = bottomShortcutsToggle.checked;
        localStorage.setItem('bottomShortcutsEnabled', bottomShortcutsEnabled);
        renderBottomShortcuts();
    });

    addBottomShortcutBtn.addEventListener('click', () => {
        let url = newBottomShortcutInput.value.trim();
        if (url) {
            if (!url.startsWith('http')) url = 'https://' + url;
            bottomShortcuts.push(url);
            newBottomShortcutInput.value = '';
            saveBottomShortcuts();
            renderBottomShortcuts();
            renderBottomShortcutsMgmt();
        }
    });

    newBottomShortcutInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addBottomShortcutBtn.click();
        }
    });

    // Initial render
    renderBottomShortcuts();
    renderBottomShortcutsMgmt();

    // --- Settings Tabs Logic ---
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            tabContents.forEach(content => {
                if (content.id === `tab-${targetTab}`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });

    // --- Bottom Shortcut Style Logic ---
    const bottomShortcutsStyleToggle = document.getElementById('bottom-shortcuts-style-toggle');
    let bottomShortcutsTransparent = localStorage.getItem('bottomShortcutsTransparent') === 'true';

    function updateBottomShortcutsStyle() {
        if (bottomShortcutsTransparent) {
            shortcutsSection.classList.add('transparent');
        } else {
            shortcutsSection.classList.remove('transparent');
        }
    }

    bottomShortcutsStyleToggle.checked = bottomShortcutsTransparent;
    bottomShortcutsStyleToggle.addEventListener('change', () => {
        bottomShortcutsTransparent = bottomShortcutsStyleToggle.checked;
        localStorage.setItem('bottomShortcutsTransparent', bottomShortcutsTransparent);
        updateBottomShortcutsStyle();
    });

    // Apply initial style
    updateBottomShortcutsStyle();

    // --- Bottom Shortcuts Icon Size Logic ---
    const iconSizeSlider = document.getElementById('bottom-shortcuts-size-slider');
    const iconSizeValueDisplay = document.getElementById('icon-size-value');
    let bottomShortcutsIconSize = localStorage.getItem('bottomShortcutsIconSize') || '22';

    if (bottomShortcutsIconSize) {
        iconSizeSlider.value = bottomShortcutsIconSize;
        iconSizeValueDisplay.textContent = `${bottomShortcutsIconSize}px`;
    }

    function updateIconSizes(size) {
        const icons = shortcutsSection.querySelectorAll('img, svg');
        icons.forEach(el => {
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
        });
    }

    iconSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        iconSizeValueDisplay.textContent = `${size}px`;
        bottomShortcutsIconSize = size;
        localStorage.setItem('bottomShortcutsIconSize', size);
        updateIconSizes(size);
    });

    // Observer to apply sizes when shortcuts are re-rendered
    const observer = new MutationObserver(() => {
        updateIconSizes(bottomShortcutsIconSize);
    });

    observer.observe(shortcutsSection, { childList: true });

    // Initial apply
    updateIconSizes(bottomShortcutsIconSize);

    // --- Bottom Shortcuts Icon Gap Logic ---
    const iconGapSlider = document.getElementById('bottom-shortcuts-gap-slider');
    const iconGapValueDisplay = document.getElementById('icon-gap-value');
    let bottomShortcutsIconGap = localStorage.getItem('bottomShortcutsIconGap') || '15';

    if (bottomShortcutsIconGap) {
        iconGapSlider.value = bottomShortcutsIconGap;
        iconGapValueDisplay.textContent = `${bottomShortcutsIconGap}px`;
        shortcutsSection.style.gap = `${bottomShortcutsIconGap}px`;
    }

    iconGapSlider.addEventListener('input', (e) => {
        const gap = e.target.value;
        iconGapValueDisplay.textContent = `${gap}px`;
        bottomShortcutsIconGap = gap;
        localStorage.setItem('bottomShortcutsIconGap', gap);
        shortcutsSection.style.gap = `${gap}px`;
    });

    // --- Logo Remote Upgrade Logic ---
    const mainLogoItem = document.getElementById('main-logo');
    if (mainLogoItem) {
        const remoteLogoUrl = 'https://raw.githubusercontent.com/aiotv1/aio-tab/refs/heads/main/logo.png';
        const tempImg = new Image();
        tempImg.onload = () => {
            mainLogoItem.src = remoteLogoUrl;
        };
        tempImg.src = remoteLogoUrl;
    }
});

