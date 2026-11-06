let sex = 'her';
let filt = {};
let actSlot = null;

const defL = [
    { id: 'l_wh', name: 'White', bg: '#fff', tag: '#fff' },
    { id: 'l_rd', name: 'Red', bg: '#fff', tag: '#e53e3e' },
    { id: 'l_gd', name: 'Gold', bg: '#fff', tag: '#d97706' },
    { id: 'l_br', name: 'Brown', bg: '#fff', tag: '#78350f' },
    { id: 'l_gy', name: 'Grey', bg: '#e2e8f0', tag: '#4a5568' },
    { id: 'l_or', name: 'Orange', bg: '#fff', tag: '#ea580c' },
    { id: 'l_bk', name: 'Black', bg: '#fff', tag: '#1a202c' }
];

const categories = [
    'dresses', 'jackets-her', 'shoes-her', 'handbags', 'jackets-him',
    'waistcoats', 'shirts', 'trousers', 'shoes-him'
];

function readData(key, fallback) {
    return JSON.parse(localStorage.getItem(key)) || fallback;
}

function goScrn(id, button) {
    document.querySelectorAll('.screen-view, .nav-btn').forEach(element => element.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    button.classList.add('active');
    if (id === 'itinerary-screen') buildItin();
    if (id === 'suitcase-screen') buildSuitcasePacker();
}

function goWard(owner) {
    sex = owner;
    document.querySelectorAll('.board-container, .tab-btn').forEach(element => element.classList.remove('active'));
    document.getElementById(`wardrobe-${owner}`).classList.add('active');
    document.getElementById(`tab-${owner}`).classList.add('active');
}

function addItem() {
    const nameInput = document.getElementById('item-name');
    const categorySelect = document.getElementById('item-category');
    const name = nameInput.value.trim().toUpperCase();
    if (!name) {
        alert('Enter name!');
        nameInput.focus();
        return;
    }

    const tagIds = Array.from(document.querySelectorAll('#item-color-checkboxes input:checked'))
        .map(checkbox => checkbox.value);
    if (!tagIds.length) tagIds.push('l_wh');

    const wardrobe = readData('c_w', []);
    wardrobe.push({
        id: `i_${Date.now()}`,
        name,
        category: categorySelect.value,
        tagIds,
        owner: sex
    });
    localStorage.setItem('c_w', JSON.stringify(wardrobe));
    nameInput.value = '';
    document.querySelectorAll('#item-color-checkboxes input').forEach(checkbox => {
        checkbox.checked = false;
    });
    loadWard();
}

function itemTagIds(item) {
    return Array.isArray(item.tagIds) ? item.tagIds : [item.tagIds];
}

function labelsFor(item, labels) {
    const ids = itemTagIds(item);
    return labels.filter(label => ids.includes(label.id))
        .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

function tagBackground(labels) {
    if (labels.length < 2) return labels[0]?.tag || '#fff';
    const segment = 100 / labels.length;
    return `linear-gradient(to bottom, ${labels.map((label, index) =>
        `${label.tag} ${index * segment}%, ${label.tag} ${(index + 1) * segment}%`).join(', ')})`;
}

function applyTileStyle(tile, item, labels) {
    const itemLabels = labelsFor(item, labels);
    const background = itemLabels[0]?.bg || '#fff';
    tile.style.background = background;
    tile.style.color = background.toLowerCase() === '#1a202c' || background.toLowerCase() === '#000000' ? '#fff' : '#000';
    tile.style.setProperty('--tags', tagBackground(itemLabels));
}

function drawTile(item) {
    const box = document.getElementById(`${item.category}-list`);
    if (!box) return;

    if (filt[item.category] && !itemTagIds(item).includes(filt[item.category])) return;

    const tile = document.createElement('div');
    tile.className = 'tile wardrobe-tile';
    tile.tabIndex = 0;
    tile.setAttribute('role', 'group');
    tile.setAttribute('aria-label', `${item.name}. Use the delete button to remove this item.`);
    applyTileStyle(tile, item, readData('c_l', defL));

    const name = document.createElement('span');
    name.textContent = item.name;
    tile.appendChild(name);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'tile-delete';
    deleteButton.dataset.action = 'delete-item';
    deleteButton.dataset.itemId = item.id;
    deleteButton.setAttribute('aria-label', `Delete ${item.name}`);
    deleteButton.textContent = '×';
    tile.appendChild(deleteButton);
    box.appendChild(tile);
}

function loadWard() {
    const wardrobe = readData('c_w', []);
    document.querySelectorAll('.tile-list').forEach(list => {
        list.replaceChildren();
    });
    wardrobe.forEach(item => {
        if (item.owner === sex) drawTile(item);
    });
}

function deleteItem(id) {
    const wardrobe = readData('c_w', []);
    const item = wardrobe.find(entry => entry.id === id);
    if (!item || !confirm(`Delete ${item.name}?`)) return;
    localStorage.setItem('c_w', JSON.stringify(wardrobe.filter(entry => entry.id !== id)));
    loadWard();
}

function setFilt(category, labelId) {
    if (labelId) filt[category] = labelId;
    else delete filt[category];
    loadWard();
}

function setDur() {
    localStorage.setItem('c_d', document.getElementById('dur-select').value);
    buildItin();
}

function setDC(day, value) {
    const codes = readData('c_c', {});
    codes[day] = value;
    localStorage.setItem('c_c', JSON.stringify(codes));
}

function buildItin() {
    const duration = parseInt(localStorage.getItem('c_d'), 10) || 7;
    document.getElementById('dur-select').value = String(duration);
    const plans = readData('c_p', {});
    const codes = readData('c_c', {});
    const wardrobe = readData('c_w', []);
    const labels = readData('c_l', defL);
    const cards = document.getElementById('dynamic-itinerary-cards');
    cards.replaceChildren();

    for (let day = 1; day <= duration; day++) {
        const card = document.createElement('section');
        card.className = 'night-card';

        const header = document.createElement('div');
        header.className = 'night-header';
        const title = document.createElement('h3');
        title.textContent = `Night ${day}`;
        const dressCode = document.createElement('select');
        dressCode.dataset.day = String(day);
        ['Formal', 'Gala'].forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} Night`;
            option.selected = (codes[day] || 'Formal') === code;
            dressCode.appendChild(option);
        });
        header.append(title, dressCode);
        card.appendChild(header);

        const rows = document.createElement('div');
        rows.className = 'planner-rows';
        rows.appendChild(createPlannerRow(day, 'her', [
            ['dresses', 'Dress'], ['jackets-her', 'Jacket'], ['shoes-her', 'Shoes'], ['handbags', 'Bag']
        ], plans, wardrobe, labels));
        rows.appendChild(createPlannerRow(day, 'him', [
            ['jackets-him', 'Jacket'], ['waistcoats', 'Waistcoat'], ['shirts', 'Shirt'],
            ['trousers', 'Trousers'], ['shoes-him', 'Shoes']
        ], plans, wardrobe, labels));
        card.appendChild(rows);
        cards.appendChild(card);
    }
}

function createPlannerRow(day, owner, slots, plans, wardrobe, labels) {
    const row = document.createElement('div');
    row.className = `row ${owner}-row`;
    const rowLabel = document.createElement('span');
    rowLabel.className = 'row-label';
    rowLabel.textContent = owner === 'her' ? 'Her Row:' : 'His Row:';
    const slotGroup = document.createElement('div');
    slotGroup.className = 'outfit-slots';
    slots.forEach(([category, label]) => {
        slotGroup.appendChild(createSlot(day, owner, category, label, plans, wardrobe, labels));
    });
    row.append(rowLabel, slotGroup);
    return row;
}

function createSlot(day, owner, category, label, plans, wardrobe, labels) {
    const key = `${day}_${owner}_${category}`;
    const item = wardrobe.find(entry => entry.id === plans[key]);
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `slot${item ? ' filled' : ''}`;
    slot.dataset.action = 'open-picker';
    slot.dataset.day = String(day);
    slot.dataset.owner = owner;
    slot.dataset.category = category;

    if (!item) {
        slot.textContent = label;
        return slot;
    }

    applyTileStyle(slot, item, labels);
    slot.setAttribute('aria-label', `${label}: ${item.name}. Change selection.`);
    const tagBar = document.createElement('span');
    tagBar.className = 'slot-tag';
    const itemName = document.createElement('span');
    itemName.textContent = item.name;
    slot.append(tagBar, itemName);
    return slot;
}

function openPick(day, owner, category) {
    actSlot = { day, owner, category };
    const wardrobe = readData('c_w', []);
    const labels = readData('c_l', defL);
    document.getElementById('modal-title').textContent =
        `Select ${owner === 'her' ? 'Her' : 'His'} ${category.replace('-her', '').replace('-him', '')}`;

    const modalList = document.getElementById('modal-list');
    modalList.replaceChildren();
    const items = wardrobe.filter(item => item.owner === owner && item.category === category);
    if (!items.length) {
        const message = document.createElement('p');
        message.className = 'empty-picker-message';
        message.textContent = 'No items found. Add to wardrobe first!';
        modalList.appendChild(message);
    } else {
        items.forEach(item => {
            const choice = document.createElement('button');
            choice.type = 'button';
            choice.className = 'tile picker-tile';
            choice.dataset.action = 'choose-item';
            choice.dataset.itemId = item.id;
            choice.textContent = item.name;
            applyTileStyle(choice, item, labels);
            modalList.appendChild(choice);
        });
    }
    document.getElementById('picker-modal').classList.add('active');
    document.querySelector('#picker-modal .modal-content').focus();
}

function setSlot(id) {
    if (!actSlot) return;
    const plans = readData('c_p', {});
    const key = `${actSlot.day}_${actSlot.owner}_${actSlot.category}`;
    if (id === null) delete plans[key];
    else plans[key] = id;
    localStorage.setItem('c_p', JSON.stringify(plans));
    closePick();
    buildItin();
}

function closePick() {
    document.getElementById('picker-modal').classList.remove('active');
    actSlot = null;
}

function addLabel() {
    const nameInput = document.getElementById('lbl-name');
    const name = nameInput.value.trim();
    if (!name) {
        alert('Enter name!');
        nameInput.focus();
        return;
    }
    const labels = readData('c_l', defL);
    labels.push({
        id: `l_${Date.now()}`,
        name,
        bg: document.getElementById('lbl-bg').value,
        tag: document.getElementById('lbl-tag').value
    });
    localStorage.setItem('c_l', JSON.stringify(labels));
    nameInput.value = '';
    confL();
}

function deleteLabel(id) {
    const labels = readData('c_l', defL);
    if (!confirm('Delete style?')) return;
    localStorage.setItem('c_l', JSON.stringify(labels.filter(label => label.id !== id)));
    confL();
    loadWard();
}

function confL() {
    const labels = readData('c_l', defL);
    const checkboxContainer = document.getElementById('item-color-checkboxes');
    const labelsGrid = document.getElementById('labels-grid');
    checkboxContainer.replaceChildren();
    labelsGrid.replaceChildren();

    document.querySelectorAll('.category-filter').forEach(select => {
        const category = select.dataset.categoryFilter;
        const selectedLabelId = filt[category];
        select.replaceChildren();

        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All colors';
        select.appendChild(allOption);

        labels.forEach(label => {
            const option = document.createElement('option');
            option.value = label.id;
            option.textContent = label.name;
            select.appendChild(option);
        });

        if (selectedLabelId && labels.some(label => label.id === selectedLabelId)) {
            select.value = selectedLabelId;
        } else {
            delete filt[category];
            select.value = '';
        }
    });

    labels.forEach(label => {
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'color-checkbox-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = label.id;
        const swatch = document.createElement('span');
        swatch.className = 'color-swatch';
        swatch.style.background = label.tag;
        const labelName = document.createElement('span');
        labelName.textContent = label.name;
        checkboxLabel.append(checkbox, swatch, labelName);
        checkboxContainer.appendChild(checkboxLabel);

        const card = document.createElement('div');
        card.className = 'label-config-card';
        const preview = document.createElement('div');
        preview.className = 'tile label-preview';
        preview.textContent = label.name.toUpperCase();
        preview.style.background = label.bg;
        preview.style.color = label.bg.toLowerCase() === '#1a202c' ? '#fff' : '#000';
        preview.style.setProperty('--tags', label.tag);
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'label-delete';
        deleteButton.dataset.action = 'delete-label';
        deleteButton.dataset.labelId = label.id;
        deleteButton.setAttribute('aria-label', `Delete ${label.name} label`);
        deleteButton.textContent = '🗑️';
        card.append(preview, deleteButton);
        labelsGrid.appendChild(card);
    });
}

function buildSuitcasePacker() {
    const plans = readData('c_p', {});
    const wardrobe = readData('c_w', []);
    const labels = readData('c_l', defL);
    const packedState = readData('c_packed', {});
    const assignedItemIds = [...new Set(Object.values(plans))].filter(Boolean);
    const assignedItems = wardrobe.filter(item => assignedItemIds.includes(item.id));
    const columns = {
        unpacked: document.getElementById('unpacked-dock-list'),
        a: document.getElementById('suitcase-a-list'),
        b: document.getElementById('suitcase-b-list')
    };
    Object.values(columns).forEach(column => column.replaceChildren());

    assignedItems.forEach(item => {
        const state = packedState[item.id] || 'unpacked';
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'tile suitcase-tile';
        tile.dataset.action = 'cycle-packed-state';
        tile.dataset.itemId = item.id;
        tile.textContent = `[${item.owner === 'her' ? 'Her' : 'His'}] ${item.name}`;
        tile.setAttribute('aria-label', `${item.name}, currently ${state === 'unpacked' ? 'unpacked' : `in suitcase ${state.toUpperCase()}`}. Activate to move to the next location.`);
        applyTileStyle(tile, item, labels);
        columns[state in columns ? state : 'unpacked'].appendChild(tile);
    });

    if (!assignedItems.length) {
        const message = document.createElement('p');
        message.className = 'empty-suitcase-message';
        message.textContent = 'No outfits planned yet! Items will appear here once assigned to a night in the Evening Planner.';
        columns.unpacked.appendChild(message);
    }
}

function cyclePackedState(id) {
    const packedState = readData('c_packed', {});
    const state = packedState[id] || 'unpacked';
    packedState[id] = state === 'unpacked' ? 'a' : state === 'a' ? 'b' : 'unpacked';
    localStorage.setItem('c_packed', JSON.stringify(packedState));
    buildSuitcasePacker();
}

function expData() {
    const packageData = {
        w: readData('c_w', []),
        l: readData('c_l', defL),
        p: readData('c_p', {}),
        c: readData('c_c', {}),
        d: localStorage.getItem('c_d') || '7',
        packed: readData('c_packed', {})
    };
    const file = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cruise_backup.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function validateBackup(data) {
    const validColor = value => typeof value === 'string'
        && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value);
    const validLabels = Array.isArray(data.l) && data.l.every(label =>
        label && typeof label.id === 'string' && typeof label.name === 'string'
        && validColor(label.bg) && validColor(label.tag));
    const validWardrobe = Array.isArray(data.w) && data.w.every(item =>
        item && typeof item.id === 'string' && typeof item.name === 'string'
        && categories.includes(item.category) && ['her', 'him'].includes(item.owner)
        && (Array.isArray(item.tagIds) || typeof item.tagIds === 'string'));
    if (!validLabels || !validWardrobe) {
        throw new Error('The file is not a valid Cruise Packing Matrix backup.');
    }
    if (data.p !== undefined && (!data.p || typeof data.p !== 'object' || Array.isArray(data.p))) {
        throw new Error('The backup contains invalid outfit plans.');
    }
    if (data.c !== undefined && (!data.c || typeof data.c !== 'object' || Array.isArray(data.c))) {
        throw new Error('The backup contains invalid night settings.');
    }
    if (data.packed !== undefined && (!data.packed || typeof data.packed !== 'object' || Array.isArray(data.packed))) {
        throw new Error('The backup contains invalid suitcase assignments.');
    }
    const duration = data.d === undefined ? '7' : String(data.d);
    if (!['3', '5', '7', '10', '14'].includes(duration)) {
        throw new Error('The backup contains an unsupported cruise duration.');
    }
    return { ...data, d: duration, p: data.p || {}, c: data.c || {}, packed: data.packed || {} };
}

async function impData(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    try {
        const imported = validateBackup(JSON.parse(await file.text()));
        if (!confirm('Overwrite current data?')) return;
        localStorage.setItem('c_w', JSON.stringify(imported.w));
        localStorage.setItem('c_l', JSON.stringify(imported.l));
        localStorage.setItem('c_p', JSON.stringify(imported.p));
        localStorage.setItem('c_c', JSON.stringify(imported.c));
        localStorage.setItem('c_d', imported.d);
        localStorage.setItem('c_packed', JSON.stringify(imported.packed));
        filt = {};
        confL();
        loadWard();
        if (document.getElementById('itinerary-screen').classList.contains('active')) buildItin();
        if (document.getElementById('suitcase-screen').classList.contains('active')) buildSuitcasePacker();
        alert('Imported!');
    } catch (error) {
        alert(`Unable to import backup: ${error.message}`);
    } finally {
        fileInput.value = '';
    }
}

document.addEventListener('click', event => {
    const target = event.target;
    const button = target.closest('button');
    if (target.id === 'picker-modal') {
        closePick();
        return;
    }
    if (!button) return;

    if (button.dataset.screen) goScrn(button.dataset.screen, button);
    else if (button.classList.contains('tab-btn')) goWard(button.dataset.owner);
    else if (button.dataset.action === 'add-item') addItem();
    else if (button.dataset.action === 'open-picker') {
        openPick(Number(button.dataset.day), button.dataset.owner, button.dataset.category);
    } else if (button.dataset.action === 'choose-item') setSlot(button.dataset.itemId);
    else if (button.dataset.action === 'clear-slot') setSlot(null);
    else if (button.dataset.action === 'add-label') addLabel();
    else if (button.dataset.action === 'delete-label') deleteLabel(button.dataset.labelId);
    else if (button.dataset.action === 'delete-item') deleteItem(button.dataset.itemId);
    else if (button.dataset.action === 'export-data') expData();
    else if (button.dataset.action === 'cycle-packed-state') cyclePackedState(button.dataset.itemId);
});

document.addEventListener('change', event => {
    if (event.target.id === 'dur-select') setDur();
    else if (event.target.id === 'import-file-picker') impData(event.target);
    else if (event.target.matches('.category-filter')) {
        setFilt(event.target.dataset.categoryFilter, event.target.value);
    }
    else if (event.target.matches('#dynamic-itinerary-cards select')) {
        setDC(event.target.dataset.day, event.target.value);
    }
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById('picker-modal').classList.contains('active')) {
        closePick();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    confL();
    loadWard();
});
