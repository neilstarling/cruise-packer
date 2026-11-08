# Cruise Packing App

A browser-based app for organizing clothing, planning outfits across multiple cruises, and preparing suitcase-by-suitcase packing lists. Open `index.html` in a modern browser to use it; no build step or server is required.

## Main tabs

### The Wardrobes

The Wardrobes has separate **Her Wardrobe** and **His Wardrobe** views. Clothing is grouped into categories:

- **Her:** Dresses, Jackets, Shoes, Handbags, Walking Stick
- **His:** Jackets, Waistcoats, Shirts, Trousers, Shoes

Add items in **Settings** by entering a name, choosing a category, selecting one or more colour labels, and clicking **Add Tile**. Names are saved in uppercase. The built-in labels are White, Red, Gold, Brown, Grey, Orange, and Black. A tile displays its selected label colours; use its delete button to remove it. Each category has a **Filter colours** menu for showing items with selected labels.

### Cruises

The **Cruises** tab has **Future Cruises**, **Past Cruises**, and **Add New** sections.

- Future cruises are ordered by departure date, soonest first.
- Completed cruises are ordered by return date, most recent first.
- Each cruise row shows its dates, duration, ship, destinations, and **View** and **Delete Cruise** buttons.
- **Add a new Cruise** creates a cruise and opens its planner. **View** reopens a saved planner. **Delete Cruise** asks for confirmation before removing the cruise and its plans.

Cruise dates are entered as separate departure and return dates. A cruise with no return date is kept in Future Cruises. Cruise details and plans save automatically in the current browser.

### Night Itinerary Planner

Each cruise has its own planner. Set its departure and return dates, destinations, ship, and duration (5, 7, 10, or 12 nights). The ship selector includes default Cunard ships and any ships added in Settings. For every night:

- Select clothing items for each category in the Her and His outfit rows.
- Select a suitcase for each person's outfit. Suitcase assignments can be left blank.
- Choose the dress code.
- Use **Copy Outfit** to copy the selected clothing items for both people to the first completely empty night in another future cruise. Existing outfits are not overwritten; dress codes and suitcase assignments are not copied.
- Drag the ↕ handle to reorder nights, or focus it and use the up and down arrow keys. The outfits, dress codes, and suitcase assignments move with the night.

Use **Print Packing List / Save as PDF** to open a print-friendly list for the current cruise. It groups outfits by suitcase and includes a separate section for outfits not assigned to a suitcase.

### Settings

Settings is where you manage wardrobe items and reusable app data:

- **Add Clothing Item:** Add an item to either person's wardrobe.
- **Suitcase Names:** Rename the default suitcases and click **Save Suitcase Names** to apply the changes. **Add Suitcase** prompts for a name and adds another suitcase. All named suitcases are available in planner assignments and print lists.
- **Cruise Ships:** Add ship names to the planner's ship selector.
- **Custom Sticker Labels:** Create labels with a name, background colour, and tag colour. Delete a label from the Active Labels list.
- **Backup Data:** Export a JSON file containing wardrobes, labels, suitcase names, ships, and cruise details and plans. Importing a backup replaces the current data after confirmation. Export a backup before importing if you may want to keep the current data.

### Help

The **Help** tab provides an in-app guide to wardrobes, cruises, outfit planning, packing lists, settings, and data storage.

## Data storage

The app stores data in browser local storage on the current device. It does not automatically sync between browsers or devices. Clearing the browser's site data may remove saved plans, so export backups regularly.
