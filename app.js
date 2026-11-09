let sex = 'her';
let filt = {};
let actSlot = null;
let activeCruiseId = null;
const defaultSuitcaseNames = [
    { id: 'a', name: 'Suitcase A' },
    { id: 'b', name: 'Suitcase B' }
];

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
    'dresses', 'jackets-her', 'shoes-her', 'handbags', 'walking-stick', 'jackets-him',
    'waistcoats', 'shirts', 'trousers', 'shoes-him'
];
const cruiseDurations = ['5', '7', '10', '12'];
const legacyCruiseDurations = { '3': '5', '14': '12' };
const defaultCruiseShips = [
    'Cunard - Queen Mary 2',
    'Cunard - Queen Elizabeth',
    'Cunard - Queen Anne',
    'Cunard - Queen Victoria'
];

function readData(key, fallback) {
    return JSON.parse(localStorage.getItem(key)) || fallback;
}

function createCruiseId() {
    return `cruise_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function validISODate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return dateToISO(date) === value;
}

function parseLegacyCruiseDates(value) {
    if (!value) return {};
    const dayRange = value.match(/^\s*(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([a-z]+)\s+(\d{4})\s*$/i);
    if (dayRange) {
        const [, firstDay, lastDay, month, year] = dayRange;
        const startDate = new Date(`${month} ${firstDay}, ${year}`);
        const endDate = new Date(`${month} ${lastDay}, ${year}`);
        if (startDate.getDate() === Number(firstDay) && endDate.getDate() === Number(lastDay)
            && startDate <= endDate
            && !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
            return {
                startDate: dateToISO(startDate),
                endDate: dateToISO(endDate)
            };
        }
    }

    const separator = value.match(/^(.+?)\s*(?:–|—|\bto\b)\s*(.+)$/i);
    if (separator) {
        const startDate = new Date(separator[1]);
        const endDate = new Date(separator[2]);
        if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())
            && startDate <= endDate) {
            return {
                startDate: dateToISO(startDate),
                endDate: dateToISO(endDate)
            };
        }
    }

    if (validISODate(value)) return { startDate: value, endDate: value };
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
        const dateString = dateToISO(date);
        return { startDate: dateString, endDate: dateString };
    }
    return { legacyDate: value };
}

function getCruises() {
    const cruises = readData('c_cruises', []);
    if (!Array.isArray(cruises)) throw new Error('Stored cruise data is invalid.');
    return cruises;
}

function makeCruise(details = {}) {
    return {
        id: details.id || createCruiseId(),
        startDate: details.startDate || '',
        endDate: details.endDate || '',
        legacyDate: details.legacyDate || '',
        duration: details.duration || '7',
        ship: details.ship || '',
        destinations: details.destinations || '',
        plans: details.plans || {},
        codes: details.codes || {},
        outfitCases: details.outfitCases || {}
    };
}

function saveCruises(cruises) {
    localStorage.setItem('c_cruises', JSON.stringify(cruises));
}

function saveActiveCruise() {
    if (!activeCruiseId) return;
    const cruises = getCruises();
    const index = cruises.findIndex(cruise => cruise.id === activeCruiseId);
    if (index < 0) return;
    const startDate = localStorage.getItem('c_cruiseStartDate') || '';
    const endDate = localStorage.getItem('c_cruiseEndDate') || '';
    cruises[index] = {
        ...cruises[index],
        startDate,
        endDate,
        legacyDate: startDate || endDate ? '' : (cruises[index].legacyDate || ''),
        duration: localStorage.getItem('c_d') || '7',
        ship: localStorage.getItem('c_ship') || '',
        destinations: localStorage.getItem('c_destinations') || '',
        plans: readData('c_p', {}),
        codes: readData('c_c', {}),
        outfitCases: readData('c_outfitCases', {})
    };
    saveCruises(cruises);
}

function loadCruise(cruise) {
    activeCruiseId = cruise.id;
    localStorage.setItem('c_activeCruiseId', cruise.id);
    localStorage.setItem('c_d', String(cruise.duration));
    localStorage.setItem('c_ship', cruise.ship);
    localStorage.setItem('c_destinations', cruise.destinations);
    localStorage.setItem('c_cruiseStartDate', cruise.startDate);
    localStorage.setItem('c_cruiseEndDate', cruise.endDate);
    localStorage.setItem('c_cruiseDate', cruiseDateLabel(cruise));
    localStorage.setItem('c_p', JSON.stringify(cruise.plans));
    localStorage.setItem('c_c', JSON.stringify(cruise.codes));
    localStorage.setItem('c_outfitCases', JSON.stringify(cruise.outfitCases));
    applyCruiseDetailsToUI();
}

function migrateLegacyCruise() {
    const legacyKeys = [
        'c_p', 'c_c', 'c_d', 'c_outfitCases', 'c_cruiseDate', 'c_destinations', 'c_ship'
    ];
    if (!legacyKeys.some(key => localStorage.getItem(key) !== null)) return [];

    const legacyDate = localStorage.getItem('c_cruiseDate') || '';
    const cruise = makeCruise({
        ...parseLegacyCruiseDates(legacyDate),
        duration: getCruiseDuration(),
        ship: localStorage.getItem('c_ship') || '',
        destinations: localStorage.getItem('c_destinations') || '',
        plans: readData('c_p', {}),
        codes: readData('c_c', {}),
        outfitCases: readData('c_outfitCases', {})
    });
    localStorage.setItem('c_activeCruiseId', cruise.id);
    return [cruise];
}

function initializeCruises() {
    let cruises;
    if (localStorage.getItem('c_cruises') === null) {
        cruises = migrateLegacyCruise();
        saveCruises(cruises);
    } else {
        cruises = getCruises();
    }
    const storedActiveId = localStorage.getItem('c_activeCruiseId');
    const activeCruise = cruises.find(cruise => cruise.id === storedActiveId) || cruises[0];
    if (activeCruise) loadCruise(activeCruise);
    else activeCruiseId = null;
}

function getCruiseDuration() {
    const storedDuration = localStorage.getItem('c_d') || '7';
    const duration = cruiseDurations.includes(storedDuration)
        ? storedDuration
        : legacyCruiseDurations[storedDuration] || '7';
    if (duration !== storedDuration) localStorage.setItem('c_d', duration);
    return Number(duration);
}

function goScrn(id, button) {
    document.querySelectorAll('.screen-view, .nav-btn').forEach(element => element.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    const navButton = button?.classList.contains('nav-btn')
        ? button
        : document.querySelector(`.nav-btn[data-screen="${id === 'itinerary-screen' ? 'cruises-screen' : id}"]`);
    navButton?.classList.add('active');
    if (id === 'cruises-screen') buildCruises();
    if (id === 'itinerary-screen') buildItin();
}

function goWard(owner) {
    sex = owner;
    document.querySelectorAll('.board-container, .tab-btn').forEach(element => element.classList.remove('active'));
    document.getElementById(`wardrobe-${owner}`).classList.add('active');
    document.getElementById(`tab-${owner}`).classList.add('active');
    loadWard();
}

function dateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${String(year).padStart(4, '0')}-${month}-${day}`;
}

function todayISO() {
    return dateToISO(new Date());
}

function formatCruiseDate(value) {
    if (!validISODate(value)) return '';
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function cruiseDateLabel(cruise) {
    if (cruise.startDate && cruise.endDate) {
        return `${formatCruiseDate(cruise.startDate)} – ${formatCruiseDate(cruise.endDate)}`;
    }
    if (cruise.startDate) return `From ${formatCruiseDate(cruise.startDate)}`;
    if (cruise.endDate) return `Return ${formatCruiseDate(cruise.endDate)}`;
    return cruise.legacyDate || 'Dates not set';
}

function buildCruises() {
    const today = todayISO();
    const cruises = getCruises();
    const future = cruises.filter(cruise => !cruise.endDate || cruise.endDate >= today)
        .sort((a, b) => (a.startDate || '9999-12-31').localeCompare(b.startDate || '9999-12-31'));
    const past = cruises.filter(cruise => cruise.endDate && cruise.endDate < today)
        .sort((a, b) => b.endDate.localeCompare(a.endDate));

    [
        ['future-cruises-list', future],
        ['past-cruises-list', past]
    ].forEach(([listId, entries]) => {
        const list = document.getElementById(listId);
        list.replaceChildren();
        if (!entries.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-cruises-message';
            empty.textContent = listId === 'future-cruises-list'
                ? 'No future cruises yet.'
                : 'No past cruises yet.';
            list.appendChild(empty);
        }
        entries.forEach(cruise => {
            const card = document.createElement('article');
            card.className = 'cruise-entry';
            const details = document.createElement('div');
            details.className = 'cruise-entry-details';
            [
                ['Date', cruiseDateLabel(cruise)],
                ['Duration', `${cruise.duration} nights`],
                ['Cruise ship', cruise.ship || 'Not selected'],
                ['Destinations', cruise.destinations || 'Not set']
            ].forEach(([label, value]) => {
                const line = document.createElement('p');
                const heading = document.createElement('strong');
                heading.textContent = `${label}: `;
                line.append(heading, document.createTextNode(value));
                details.appendChild(line);
            });
            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.className = 'cruise-view-button';
            viewButton.dataset.action = 'view-cruise';
            viewButton.dataset.cruiseId = cruise.id;
            viewButton.textContent = 'View';
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'cruise-delete-button';
            deleteButton.dataset.action = 'delete-cruise';
            deleteButton.dataset.cruiseId = cruise.id;
            deleteButton.textContent = 'Delete Cruise';
            card.append(details, viewButton, deleteButton);
            list.appendChild(card);
        });
    });
}

function addCruise() {
    saveActiveCruise();
    const cruises = getCruises();
    const cruise = makeCruise();
    cruises.push(cruise);
    saveCruises(cruises);
    loadCruise(cruise);
    goScrn('itinerary-screen');
}

function openCruise(id) {
    saveActiveCruise();
    const cruise = getCruises().find(entry => entry.id === id);
    if (!cruise) {
        alert('That cruise could not be found.');
        return;
    }
    loadCruise(cruise);
    goScrn('itinerary-screen');
}

function deleteCruise(id) {
    const cruises = getCruises();
    const cruise = cruises.find(entry => entry.id === id);
    if (!cruise) {
        alert('That cruise could not be found.');
        return;
    }
    if (!confirm(`Delete the cruise ${cruiseDateLabel(cruise)}${cruise.ship ? ` on ${cruise.ship}` : ''}? This cannot be undone.`)) {
        return;
    }

    saveActiveCruise();
    saveCruises(getCruises().filter(entry => entry.id !== id));
    if (activeCruiseId === id) {
        activeCruiseId = null;
        localStorage.removeItem('c_activeCruiseId');
        [
            'c_p', 'c_c', 'c_outfitCases', 'c_cruiseDate', 'c_cruiseStartDate',
            'c_cruiseEndDate', 'c_destinations', 'c_ship'
        ].forEach(key => localStorage.removeItem(key));
    }
    buildCruises();
}

function backToCruises() {
    saveActiveCruise();
    goScrn('cruises-screen');
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
    const owner = ['jackets-him', 'waistcoats', 'shirts', 'trousers', 'shoes-him'].includes(categorySelect.value)
        ? 'him'
        : 'her';
    wardrobe.push({
        id: `i_${Date.now()}`,
        name,
        category: categorySelect.value,
        tagIds,
        owner
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

    const selectedFilters = filt[item.category] || [];
    if (selectedFilters.length && !selectedFilters.some(filterId => itemTagIds(item).includes(filterId))) return;

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

function setFilt(category, labelId, isSelected) {
    const selectedFilters = filt[category] || [];
    filt[category] = isSelected
        ? [...new Set([...selectedFilters, labelId])]
        : selectedFilters.filter(filterId => filterId !== labelId);
    const filter = Array.from(document.querySelectorAll('.category-filter'))
        .find(element => element.dataset.categoryFilter === category);
    const selectedNames = labelsForFilter(category);
    filter.querySelector('summary').textContent = selectedNames.length
        ? `Filter colours: ${selectedNames.join(', ')}`
        : 'Filter colours: All';
    loadWard();
}

function labelsForFilter(category) {
    const selectedFilters = filt[category] || [];
    return readData('c_l', defL)
        .filter(label => selectedFilters.includes(label.id))
        .map(label => label.name);
}

function setDur() {
    localStorage.setItem('c_d', document.getElementById('dur-select').value);
    saveActiveCruise();
    buildItin();
}

function setDC(day, value) {
    const codes = readData('c_c', {});
    codes[day] = value;
    localStorage.setItem('c_c', JSON.stringify(codes));
    saveActiveCruise();
}

function reorderNights(fromDay, toDay, restoreFocus = false) {
    const duration = getCruiseDuration();
    if (fromDay < 1 || fromDay > duration || toDay < 1 || toDay > duration || fromDay === toDay) return;

    const order = Array.from({ length: duration }, (_, index) => index + 1);
    const [movedDay] = order.splice(fromDay - 1, 1);
    order.splice(toDay - 1, 0, movedDay);
    const newDayByOldDay = new Map(order.map((oldDay, index) => [String(oldDay), String(index + 1)]));
    const rekeyDays = data => Object.fromEntries(Object.entries(data).map(([key, value]) => {
        const match = key.match(/^(\d+)(.*)$/);
        const newDay = match && newDayByOldDay.get(match[1]);
        return [newDay ? `${newDay}${match[2]}` : key, value];
    }));

    ['c_p', 'c_c', 'c_outfitCases'].forEach(key => {
        localStorage.setItem(key, JSON.stringify(rekeyDays(readData(key, {}))));
    });
    saveActiveCruise();
    buildItin();
    if (restoreFocus) {
        document.querySelector(`.night-drag-handle[data-day="${toDay}"]`)?.focus();
    }
}

function buildItin() {
    const duration = getCruiseDuration();
    document.getElementById('dur-select').value = String(duration);
    renderCruiseShipOptions();
    const plans = readData('c_p', {});
    const codes = readData('c_c', {});
    const outfitCases = readData('c_outfitCases', {});
    const wardrobe = readData('c_w', []);
    const labels = readData('c_l', defL);
    const cards = document.getElementById('dynamic-itinerary-cards');
    const copyTargets = getCruises()
        .filter(cruise => cruise.id !== activeCruiseId && (!cruise.endDate || cruise.endDate >= todayISO()))
        .sort((a, b) => (a.startDate || '9999-12-31').localeCompare(b.startDate || '9999-12-31'));
    cards.replaceChildren();

    for (let day = 1; day <= duration; day++) {
        const card = document.createElement('section');
        card.className = 'night-card';
        card.dataset.day = String(day);

        const header = document.createElement('div');
        header.className = 'night-header';
        const titleGroup = document.createElement('div');
        titleGroup.className = 'night-title-group';
        const title = document.createElement('h3');
        title.textContent = `Night ${day}`;
        const dragHandle = document.createElement('button');
        dragHandle.type = 'button';
        dragHandle.className = 'night-drag-handle';
        dragHandle.draggable = true;
        dragHandle.dataset.day = String(day);
        dragHandle.setAttribute('aria-label', `Reorder Night ${day}. Use the up and down arrow keys to move.`);
        dragHandle.title = 'Drag to reorder, or use the up and down arrow keys';
        dragHandle.textContent = '↕';
        titleGroup.append(title, dragHandle);
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.className = 'copy-outfit-button';
        copyButton.dataset.action = 'toggle-copy-menu';
        copyButton.dataset.day = String(day);
        copyButton.textContent = 'Copy Outfit';
        copyButton.disabled = copyTargets.length === 0;
        const copySelect = document.createElement('select');
        copySelect.className = 'copy-cruise-select';
        copySelect.dataset.day = String(day);
        copySelect.setAttribute('aria-label', `Copy Night ${day} outfits to a future cruise`);
        copySelect.hidden = true;
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select future cruise';
        copySelect.appendChild(placeholder);
        copyTargets.forEach(cruise => {
            const option = document.createElement('option');
            option.value = cruise.id;
            option.textContent = `${cruiseDateLabel(cruise)}${cruise.ship ? ` — ${cruise.ship}` : ''}`;
            copySelect.appendChild(option);
        });
        const dressCode = document.createElement('select');
        dressCode.dataset.day = String(day);
        ['Formal', 'Gala'].forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} Night`;
            option.selected = (codes[day] || 'Formal') === code;
            dressCode.appendChild(option);
        });
        header.append(titleGroup, copyButton, copySelect, dressCode);
        card.appendChild(header);

        const rows = document.createElement('div');
        rows.className = 'planner-rows';
        rows.appendChild(createPlannerRow(day, 'her', [
            ['dresses', 'Dress'], ['jackets-her', 'Jacket'], ['shoes-her', 'Shoes'], ['handbags', 'Bag'],
            ['walking-stick', 'Walking Stick']
        ], plans, outfitCases, wardrobe, labels));
        rows.appendChild(createPlannerRow(day, 'him', [
            ['jackets-him', 'Jacket'], ['waistcoats', 'Waistcoat'], ['shirts', 'Shirt'],
            ['trousers', 'Trousers'], ['shoes-him', 'Shoes']
        ], plans, outfitCases, wardrobe, labels));
        card.appendChild(rows);
        cards.appendChild(card);
    }
}

function toggleCopyMenu(button) {
    const select = button.parentElement.querySelector('.copy-cruise-select');
    if (!select || button.disabled) return;
    document.querySelectorAll('.copy-cruise-select').forEach(menu => {
        if (menu !== select) menu.hidden = true;
    });
    select.hidden = !select.hidden;
    if (!select.hidden) select.focus();
}

function copyOutfitToCruise(day, targetId) {
    const cruises = getCruises();
    const targetIndex = cruises.findIndex(cruise => cruise.id === targetId);
    const target = cruises[targetIndex];
    if (!target || target.id === activeCruiseId || (target.endDate && target.endDate < todayISO())) {
        alert('Select a future cruise.');
        return;
    }

    const plans = readData('c_p', {});
    const categoriesByOwner = {
        her: ['dresses', 'jackets-her', 'shoes-her', 'handbags', 'walking-stick'],
        him: ['jackets-him', 'waistcoats', 'shirts', 'trousers', 'shoes-him']
    };
    const selected = [];
    Object.entries(categoriesByOwner).forEach(([owner, categories]) => {
        categories.forEach(category => {
            const key = `${day}_${owner}_${category}`;
            if (plans[key]) selected.push([owner, category, plans[key]]);
        });
    });
    if (!selected.length) {
        alert('There are no selected outfits to copy for this night.');
        return;
    }

    const targetPlans = { ...target.plans };
    let freeDay = 0;
    for (let candidate = 1; candidate <= Number(target.duration); candidate++) {
        const occupied = Object.entries(categoriesByOwner)
            .some(([owner, categories]) => categories.some(category => targetPlans[`${candidate}_${owner}_${category}`]));
        if (!occupied) {
            freeDay = candidate;
            break;
        }
    }
    if (!freeDay) {
        alert('The selected cruise has no free nights for these outfits.');
        return;
    }

    selected.forEach(([owner, category, itemId]) => {
        targetPlans[`${freeDay}_${owner}_${category}`] = itemId;
    });
    cruises[targetIndex] = { ...cruises[targetIndex], plans: targetPlans };
    saveCruises(cruises);
    alert(`Outfits copied to ${cruiseDateLabel(target)} — Night ${freeDay}.`);
    buildItin();
}

function createPlannerRow(day, owner, slots, plans, outfitCases, wardrobe, labels) {
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
    const suitcaseSelect = document.createElement('select');
    suitcaseSelect.className = 'outfit-case-select';
    suitcaseSelect.dataset.day = String(day);
    suitcaseSelect.dataset.owner = owner;
    suitcaseSelect.setAttribute('aria-label', `Suitcase for ${owner === 'her' ? 'her' : 'his'} Night ${day} outfit`);
    const suitcaseNames = getSuitcaseNames();
    [
        ['', 'Choose suitcase'],
        ...suitcaseNames.map(({ id, name }) => [id, name])
    ].forEach(([value, name]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = name;
        option.selected = (outfitCases[`${day}_${owner}`] || '') === value;
        suitcaseSelect.appendChild(option);
    });
    row.append(rowLabel, slotGroup, suitcaseSelect);
    return row;
}

function setOutfitCase(day, owner, suitcase) {
    const outfitCases = readData('c_outfitCases', {});
    const key = `${day}_${owner}`;
    if (suitcase) outfitCases[key] = suitcase;
    else delete outfitCases[key];
    localStorage.setItem('c_outfitCases', JSON.stringify(outfitCases));
    saveActiveCruise();
}

function printPackingList() {
    const duration = getCruiseDuration();
    const plans = readData('c_p', {});
    const outfitCases = readData('c_outfitCases', {});
    const wardrobe = readData('c_w', []);
    const suitcaseNames = getSuitcaseNames();
    const outfitsByCase = Object.fromEntries([
        ...suitcaseNames.map(({ id }) => [id, {}]),
        ['unassigned', {}]
    ]);
    const categoriesByOwner = {
        her: [
            ['dresses', 'Dress'], ['jackets-her', 'Jkt'], ['shoes-her', 'Shoes'], ['handbags', 'Bag'],
            ['walking-stick', 'Walking Stick']
        ],
        him: [
            ['jackets-him', 'Jkt'], ['waistcoats', 'Wc'], ['shirts', 'Shirt'],
            ['trousers', 'Trs'], ['shoes-him', 'Shoes']
        ]
    };

    for (let day = 1; day <= duration; day++) {
        for (const owner of ['her', 'him']) {
            const outfit = categoriesByOwner[owner]
                .map(([category, label]) => {
                    const item = wardrobe.find(entry => entry.id === plans[`${day}_${owner}_${category}`]);
                    return item ? `${label}: ${item.name}` : null;
                })
                .filter(Boolean);
            if (!outfit.length) continue;

            const suitcase = outfitCases[`${day}_${owner}`];
            const group = outfitsByCase[suitcaseNames.some(({ id }) => id === suitcase)
                ? suitcase
                : 'unassigned'];
            group[day] ||= { her: [], him: [] };
            group[day][owner] = outfit;
        }
    }

    const report = document.getElementById('packing-list-report');
    report.className = `packing-list-report packing-list-duration-${duration}`;
    report.replaceChildren();

    const title = document.createElement('h1');
    title.className = 'packing-list-title';
    title.textContent = 'Cruise Packing List';
    const subtitle = document.createElement('p');
    subtitle.className = 'packing-list-subtitle';
    const cruiseDetails = [
        `${duration}-night cruise`,
        localStorage.getItem('c_cruiseDate'),
        localStorage.getItem('c_destinations'),
        localStorage.getItem('c_ship')
    ].filter(Boolean);
    subtitle.textContent = cruiseDetails.join(' | ');
    report.append(title, subtitle);

    [
        ...suitcaseNames.map(({ id, name }) => [id, name]),
        ['unassigned', 'Not assigned to a suitcase']
    ].forEach(([key, name]) => {
        const nights = outfitsByCase[key];
        if (key === 'unassigned' && !Object.keys(nights).length) return;

        const body = document.createElement('tbody');
        body.className = `packing-case packing-case-${key}`;
        const caseHeading = document.createElement('tr');
        caseHeading.className = 'packing-case-heading';
        const caseCell = document.createElement('th');
        caseCell.colSpan = 3;
        caseCell.textContent = name;
        caseHeading.appendChild(caseCell);
        body.appendChild(caseHeading);

        const dayNumbers = Object.keys(nights).map(Number).sort((a, b) => a - b);
        dayNumbers.forEach(day => {
            const nightCell = document.createElement('th');
            nightCell.scope = 'row';
            nightCell.textContent = `Night ${day}`;
            nightCell.rowSpan = 2;

            for (const owner of ['her', 'him']) {
                const row = document.createElement('tr');
                row.className = `packing-outfit-row packing-outfit-${owner}`;
                if (owner === 'her') row.appendChild(nightCell);

                const ownerCell = document.createElement('th');
                ownerCell.scope = 'row';
                ownerCell.className = 'packing-outfit-label';
                ownerCell.textContent = owner === 'her' ? 'Her Outfit' : 'His Outfit';
                row.appendChild(ownerCell);

                const itemsCell = document.createElement('td');
                const items = nights[day][owner];
                if (items.length) {
                    const itemList = document.createElement('div');
                    itemList.className = 'packing-item-list';
                    items.forEach(item => {
                        const itemBox = document.createElement('span');
                        itemBox.className = 'packing-item-box';
                        itemBox.textContent = item;
                        itemList.appendChild(itemBox);
                    });
                    itemsCell.appendChild(itemList);
                } else {
                    itemsCell.textContent = '—';
                }
                row.appendChild(itemsCell);
                body.appendChild(row);
            }
        });
        if (!dayNumbers.length) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 3;
            cell.textContent = 'No outfits assigned.';
            row.appendChild(cell);
            body.appendChild(row);
        }
        let table = report.querySelector('table');
        if (!table) {
            table = document.createElement('table');
            table.className = 'packing-list-table';
            const header = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Night', 'Outfit', 'Clothing items'].forEach(text => {
                const cell = document.createElement('th');
                cell.textContent = text;
                headerRow.appendChild(cell);
            });
            header.appendChild(headerRow);
            table.appendChild(header);
            report.appendChild(table);
        }
        table.appendChild(body);
    });
    window.print();
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
    saveActiveCruise();
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

    document.querySelectorAll('.category-filter').forEach(filter => {
        const category = filter.dataset.categoryFilter;
        const selectedFilters = (filt[category] || []).filter(id => labels.some(label => label.id === id));
        filt[category] = selectedFilters;

        const options = filter.querySelector('.category-filter-options');
        options.replaceChildren();
        labels.forEach(label => {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.className = 'category-filter-option';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = selectedFilters.includes(label.id);
            checkbox.dataset.categoryFilterCheckbox = '';
            checkbox.dataset.categoryFilter = category;
            checkbox.dataset.labelId = label.id;
            const swatch = document.createElement('span');
            swatch.className = 'color-swatch';
            swatch.style.background = label.tag;
            const labelName = document.createElement('span');
            labelName.textContent = label.name;
            checkboxLabel.append(checkbox, swatch, labelName);
            options.appendChild(checkboxLabel);
        });

        const summary = filter.querySelector('summary');
        const selectedNames = labels
            .filter(label => selectedFilters.includes(label.id))
            .map(label => label.name);
        summary.textContent = selectedNames.length
            ? `Filter colours: ${selectedNames.join(', ')}`
            : 'Filter colours: All';
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

function normalizeSuitcaseNames(stored) {
    const entries = Array.isArray(stored)
        ? stored
        : stored && typeof stored === 'object'
            ? Object.entries(stored).map(([id, name]) => ({ id, name }))
            : [];
    const names = new Map(defaultSuitcaseNames.map(suitcase => [suitcase.id, suitcase.name]));
    entries.forEach(suitcase => {
        if (suitcase && typeof suitcase.id === 'string' && suitcase.id.trim()
            && suitcase.id !== 'unassigned'
            && /^[a-z\d_-]+$/i.test(suitcase.id)
            && typeof suitcase.name === 'string' && suitcase.name.trim()
            && suitcase.id.length <= 80 && suitcase.name.trim().length <= 40) {
            names.set(suitcase.id, suitcase.name.trim());
        }
    });
    return [...names].map(([id, name]) => ({ id, name }));
}

function getSuitcaseNames() {
    return normalizeSuitcaseNames(readData('c_bagNames', null));
}

function saveSuitcaseNames() {
    const inputs = Array.from(document.querySelectorAll('[data-suitcase-name]'));
    const names = inputs.map(input => ({
        id: input.dataset.suitcaseId,
        name: input.value.trim()
    }));
    const emptyInput = inputs.find(input => !input.value.trim());
    if (emptyInput) {
        alert('Enter a name for each suitcase.');
        emptyInput.focus();
        return;
    }

    localStorage.setItem('c_bagNames', JSON.stringify(names));
    applySuitcaseNamesToUI(names);
    if (document.getElementById('itinerary-screen').classList.contains('active')) buildItin();
}

function addSuitcase() {
    const name = prompt('Enter a name for the new suitcase:')?.trim();
    if (name === undefined) return;
    if (!name || name.length > 40) {
        alert('Enter a suitcase name of 1 to 40 characters.');
        return;
    }

    const names = getSuitcaseNames();
    let id;
    do {
        id = `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    } while (names.some(suitcase => suitcase.id === id));
    names.push({ id, name });
    localStorage.setItem('c_bagNames', JSON.stringify(names));
    applySuitcaseNamesToUI(names);
    if (document.getElementById('itinerary-screen').classList.contains('active')) buildItin();
}

function applySuitcaseNamesToUI(names = getSuitcaseNames()) {
    const list = document.getElementById('suitcase-names-list');
    list.replaceChildren();
    names.forEach((suitcase, index) => {
        const row = document.createElement('div');
        row.className = 'suitcase-name-row';
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `suitcase-name-input-${index}`;
        input.maxLength = 40;
        input.value = suitcase.name;
        input.dataset.suitcaseId = suitcase.id;
        input.dataset.suitcaseName = '';
        label.htmlFor = input.id;
        label.textContent = `Suitcase ${index + 1}`;
        row.append(label, input);
        list.appendChild(row);
    });
}

function getCruiseShips() {
    const ships = readData('c_ships', defaultCruiseShips);
    return Array.isArray(ships)
        ? ships.filter(ship => typeof ship === 'string' && ship.trim())
        : defaultCruiseShips;
}

function renderCruiseShipOptions() {
    const select = document.getElementById('cruise-ship-select');
    const selectedShip = localStorage.getItem('c_ship') || '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select a cruise ship';
    select.replaceChildren(placeholder);

    getCruiseShips().forEach(ship => {
        const option = document.createElement('option');
        option.value = ship;
        option.textContent = ship;
        select.appendChild(option);
    });
    select.value = selectedShip;
}

function renderCruiseShipList() {
    const list = document.getElementById('cruise-ship-list');
    list.replaceChildren();
    getCruiseShips().forEach(ship => {
        const item = document.createElement('li');
        item.textContent = ship;
        list.appendChild(item);
    });
}

function addCruiseShip() {
    const input = document.getElementById('cruise-ship-name-input');
    const name = input.value.trim();
    if (!name) {
        alert('Enter a cruise ship name.');
        input.focus();
        return;
    }

    const ships = getCruiseShips();
    if (ships.some(ship => ship.toLowerCase() === name.toLowerCase())) {
        alert('That cruise ship is already in the list.');
        input.focus();
        return;
    }

    ships.push(name);
    localStorage.setItem('c_ships', JSON.stringify(ships));
    input.value = '';
    renderCruiseShipList();
    renderCruiseShipOptions();
}

function saveCruiseDetails() {
    const startDate = document.getElementById('cruise-start-date-input').value;
    const endDate = document.getElementById('cruise-end-date-input').value;
    if ((startDate && !validISODate(startDate)) || (endDate && !validISODate(endDate))) {
        alert('Enter valid cruise dates.');
        return false;
    }
    if (startDate && endDate && endDate < startDate) {
        alert('The return date must be on or after the departure date.');
        document.getElementById('cruise-end-date-input').focus();
        return false;
    }
    localStorage.setItem('c_cruiseStartDate', startDate);
    localStorage.setItem('c_cruiseEndDate', endDate);
    const cruise = getCruises().find(entry => entry.id === activeCruiseId);
    localStorage.setItem('c_cruiseDate', cruiseDateLabel({
        startDate,
        endDate,
        legacyDate: startDate || endDate ? '' : cruise?.legacyDate || ''
    }));
    localStorage.setItem('c_destinations', document.getElementById('cruise-destinations-input').value.trim());
    localStorage.setItem('c_ship', document.getElementById('cruise-ship-select').value);
    saveActiveCruise();
    return true;
}

function applyCruiseDetailsToUI() {
    document.getElementById('cruise-start-date-input').value = localStorage.getItem('c_cruiseStartDate') || '';
    document.getElementById('cruise-end-date-input').value = localStorage.getItem('c_cruiseEndDate') || '';
    document.getElementById('cruise-destinations-input').value = localStorage.getItem('c_destinations') || '';
    renderCruiseShipOptions();
    renderCruiseShipList();
}

function expData() {
    saveActiveCruise();
    const packageData = {
        w: readData('c_w', []),
        l: readData('c_l', defL),
        p: readData('c_p', {}),
        c: readData('c_c', {}),
        d: localStorage.getItem('c_d') || '7',
        suitcaseNames: getSuitcaseNames(),
        outfitCases: readData('c_outfitCases', {}),
        cruiseDate: localStorage.getItem('c_cruiseDate') || '',
        destinations: localStorage.getItem('c_destinations') || '',
        ship: localStorage.getItem('c_ship') || '',
        ships: getCruiseShips(),
        cruises: getCruises(),
        activeCruiseId
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

function validateCruiseRecord(cruise, ships, suitcaseIds) {
    const validObject = value => value && typeof value === 'object' && !Array.isArray(value);
    if (!validObject(cruise) || typeof cruise.id !== 'string' || !cruise.id
        || typeof cruise.startDate !== 'string' || (cruise.startDate && !validISODate(cruise.startDate))
        || typeof cruise.endDate !== 'string' || (cruise.endDate && !validISODate(cruise.endDate))
        || (cruise.startDate && cruise.endDate && cruise.endDate < cruise.startDate)
        || typeof cruise.legacyDate !== 'string' || cruise.legacyDate.length > 120
        || typeof cruise.ship !== 'string' || cruise.ship.length > 80
        || typeof cruise.destinations !== 'string' || cruise.destinations.length > 300
        || !validObject(cruise.plans) || !validObject(cruise.codes) || !validObject(cruise.outfitCases)
        || Object.entries(cruise.plans).some(([key, value]) =>
            !/^\d+_(her|him)_[a-z-]+$/.test(key) || typeof value !== 'string')
        || Object.entries(cruise.codes).some(([key, value]) => !/^\d+$/.test(key) || typeof value !== 'string')
        || Object.entries(cruise.outfitCases).some(([key, value]) =>
            !/^\d+_(her|him)$/.test(key) || !suitcaseIds.includes(value))) {
        throw new Error('The backup contains invalid cruise data.');
    }

    const storedDuration = String(cruise.duration);
    if (![...cruiseDurations, ...Object.keys(legacyCruiseDurations)].includes(storedDuration)) {
        throw new Error('The backup contains an unsupported cruise duration.');
    }
    if (cruise.ship && !ships.includes(cruise.ship)) {
        throw new Error('A cruise selects a ship that is not in its ship list.');
    }
    return makeCruise({
        ...cruise,
        duration: cruiseDurations.includes(storedDuration)
            ? storedDuration
            : legacyCruiseDurations[storedDuration]
    });
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
    const rawSuitcaseNames = data.suitcaseNames;
    const invalidSuitcaseNames = rawSuitcaseNames !== undefined && (
        Array.isArray(rawSuitcaseNames)
            ? rawSuitcaseNames.some(suitcase => !suitcase
                || typeof suitcase.id !== 'string' || !suitcase.id.trim()
                || suitcase.id === 'unassigned'
                || !/^[a-z\d_-]+$/i.test(suitcase.id) || suitcase.id.length > 80
                || typeof suitcase.name !== 'string' || !suitcase.name.trim() || suitcase.name.length > 40)
                || new Set(rawSuitcaseNames.map(suitcase => suitcase.id)).size !== rawSuitcaseNames.length
            : !rawSuitcaseNames || typeof rawSuitcaseNames !== 'object'
                || Object.values(rawSuitcaseNames).some(name =>
                    typeof name !== 'string' || !name.trim() || name.length > 40)
    );
    if (invalidSuitcaseNames) throw new Error('The backup contains invalid suitcase names.');
    const suitcaseNames = normalizeSuitcaseNames(rawSuitcaseNames);
    const suitcaseIds = suitcaseNames.map(suitcase => suitcase.id);
    if (data.outfitCases !== undefined && (
        !data.outfitCases || typeof data.outfitCases !== 'object' || Array.isArray(data.outfitCases)
        || Object.entries(data.outfitCases).some(([key, value]) =>
            !/^\d+_(her|him)$/.test(key) || !suitcaseIds.includes(value))
    )) {
        throw new Error('The backup contains invalid outfit suitcase assignments.');
    }
    if (['cruiseDate', 'destinations', 'ship'].some(key =>
        data[key] !== undefined && (typeof data[key] !== 'string'
            || data[key].length > (key === 'destinations' ? 300 : key === 'cruiseDate' ? 120 : 80)))) {
        throw new Error('The backup contains invalid cruise details.');
    }
    if (data.ships !== undefined && (
        !Array.isArray(data.ships)
        || data.ships.some(ship => typeof ship !== 'string' || !ship.trim() || ship.length > 80)
    )) {
        throw new Error('The backup contains an invalid cruise ship list.');
    }
    const ships = [...new Map(
        (data.ships || defaultCruiseShips).map(ship => [ship.trim().toLowerCase(), ship.trim()])
    ).values()];
    const selectedShip = data.ship?.trim() || '';
    if (selectedShip && !ships.includes(selectedShip)) {
        throw new Error('The backup selects a cruise ship that is not in its ship list.');
    }
    const storedDuration = data.d === undefined ? '7' : String(data.d);
    if (![...cruiseDurations, ...Object.keys(legacyCruiseDurations)].includes(storedDuration)) {
        throw new Error('The backup contains an unsupported cruise duration.');
    }
    const duration = cruiseDurations.includes(storedDuration)
        ? storedDuration
        : legacyCruiseDurations[storedDuration];
    const cruises = data.cruises === undefined
        ? [makeCruise({
            ...parseLegacyCruiseDates(data.cruiseDate || ''),
            duration,
            ship: selectedShip,
            destinations: data.destinations || '',
            plans: data.p || {},
            codes: data.c || {},
            outfitCases: data.outfitCases || {}
        })]
        : (() => {
            if (!Array.isArray(data.cruises)) {
                throw new Error('The backup contains an invalid cruise list.');
            }
            const validated = data.cruises.map(cruise => validateCruiseRecord(cruise, ships, suitcaseIds));
            if (new Set(validated.map(cruise => cruise.id)).size !== validated.length) {
                throw new Error('The backup contains duplicate cruise IDs.');
            }
            return validated;
        })();
    const selectedCruiseId = typeof data.activeCruiseId === 'string'
        && cruises.some(cruise => cruise.id === data.activeCruiseId)
        ? data.activeCruiseId
        : cruises[0]?.id || '';
    return {
        ...data,
        d: duration,
        p: data.p || {},
        c: data.c || {},
        outfitCases: data.outfitCases || {},
        suitcaseNames,
        cruiseDate: data.cruiseDate || '',
        destinations: data.destinations || '',
        ship: selectedShip,
        ships,
        cruises,
        activeCruiseId: selectedCruiseId
    };
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
        localStorage.setItem('c_bagNames', JSON.stringify(imported.suitcaseNames));
        localStorage.setItem('c_outfitCases', JSON.stringify(imported.outfitCases));
        localStorage.setItem('c_cruiseDate', imported.cruiseDate);
        localStorage.setItem('c_destinations', imported.destinations);
        localStorage.setItem('c_ship', imported.ship);
        localStorage.setItem('c_ships', JSON.stringify(imported.ships));
        saveCruises(imported.cruises);
        activeCruiseId = imported.activeCruiseId || null;
        if (activeCruiseId) {
            loadCruise(imported.cruises.find(cruise => cruise.id === activeCruiseId));
        } else {
            localStorage.removeItem('c_activeCruiseId');
            localStorage.setItem('c_cruiseStartDate', '');
            localStorage.setItem('c_cruiseEndDate', '');
        }
        filt = {};
        confL();
        applySuitcaseNamesToUI(imported.suitcaseNames);
        applyCruiseDetailsToUI();
        renderCruiseShipList();
        loadWard();
        if (document.getElementById('itinerary-screen').classList.contains('active')) buildItin();
        if (document.getElementById('cruises-screen').classList.contains('active')) buildCruises();
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
    else if (button.dataset.action === 'add-cruise') addCruise();
    else if (button.dataset.action === 'view-cruise') openCruise(button.dataset.cruiseId);
    else if (button.dataset.action === 'delete-cruise') deleteCruise(button.dataset.cruiseId);
    else if (button.dataset.action === 'back-to-cruises') backToCruises();
    else if (button.dataset.action === 'toggle-copy-menu') toggleCopyMenu(button);
    else if (button.dataset.action === 'add-item') addItem();
    else if (button.dataset.action === 'save-suitcase-names') saveSuitcaseNames();
    else if (button.dataset.action === 'add-suitcase') addSuitcase();
    else if (button.dataset.action === 'add-cruise-ship') addCruiseShip();
    else if (button.dataset.action === 'print-packing-list') printPackingList();
    else if (button.dataset.action === 'open-picker') {
        openPick(Number(button.dataset.day), button.dataset.owner, button.dataset.category);
    } else if (button.dataset.action === 'choose-item') setSlot(button.dataset.itemId);
    else if (button.dataset.action === 'clear-slot') setSlot(null);
    else if (button.dataset.action === 'add-label') addLabel();
    else if (button.dataset.action === 'delete-label') deleteLabel(button.dataset.labelId);
    else if (button.dataset.action === 'delete-item') deleteItem(button.dataset.itemId);
    else if (button.dataset.action === 'export-data') expData();
});

document.addEventListener('change', event => {
    if (event.target.id === 'dur-select') setDur();
    else if (event.target.id === 'cruise-ship-select') saveCruiseDetails();
    else if (['cruise-start-date-input', 'cruise-end-date-input'].includes(event.target.id)) saveCruiseDetails();
    else if (event.target.matches('.copy-cruise-select') && event.target.value) {
        copyOutfitToCruise(Number(event.target.dataset.day), event.target.value);
    }
    else if (event.target.id === 'import-file-picker') impData(event.target);
    else if (event.target.matches('[data-category-filter-checkbox]')) {
        setFilt(
            event.target.dataset.categoryFilter,
            event.target.dataset.labelId,
            event.target.checked
        );
    }
    else if (event.target.matches('.outfit-case-select')) {
        setOutfitCase(event.target.dataset.day, event.target.dataset.owner, event.target.value);
    }
    else if (event.target.matches('#dynamic-itinerary-cards select[data-day]:not(.outfit-case-select)')) {
        setDC(event.target.dataset.day, event.target.value);
    }
});

document.addEventListener('dragstart', event => {
    const handle = event.target.closest('.night-drag-handle');
    const card = handle?.closest('.night-card');
    if (!card || !event.dataTransfer) return;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', card.dataset.day);
    card.classList.add('night-card-dragging');
});

document.addEventListener('dragover', event => {
    const card = event.target.closest('.night-card');
    if (!card || !event.dataTransfer?.types.includes('text/plain')) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    card.classList.add('night-card-drop-target');
});

document.addEventListener('dragleave', event => {
    const card = event.target.closest('.night-card');
    if (card && !card.contains(event.relatedTarget)) card.classList.remove('night-card-drop-target');
});

document.addEventListener('drop', event => {
    const card = event.target.closest('.night-card');
    if (!card || !event.dataTransfer) return;

    event.preventDefault();
    const fromDay = Number(event.dataTransfer.getData('text/plain'));
    const toDay = Number(card.dataset.day);
    document.querySelectorAll('.night-card').forEach(night => {
        night.classList.remove('night-card-dragging', 'night-card-drop-target');
    });
    reorderNights(fromDay, toDay);
});

document.addEventListener('dragend', () => {
    document.querySelectorAll('.night-card').forEach(night => {
        night.classList.remove('night-card-dragging', 'night-card-drop-target');
    });
});

document.addEventListener('input', event => {
    if (event.target.id === 'cruise-destinations-input') {
        saveCruiseDetails();
    }
});

document.addEventListener('keydown', event => {
    const handle = event.target.closest('.night-drag-handle');
    if (handle && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const day = Number(handle.dataset.day);
        reorderNights(day, day + (event.key === 'ArrowUp' ? -1 : 1), true);
        return;
    }
    if (event.key === 'Escape' && document.getElementById('picker-modal').classList.contains('active')) {
        closePick();
    }
});

window.addEventListener('DOMContentLoaded', () => {
    initializeCruises();
    confL();
    applySuitcaseNamesToUI();
    loadWard();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .catch(error => console.error('Service worker registration failed:', error));
    });
}
