# Cruise Packing App

A browser-based app for organizing clothing, planning outfits across multiple cruises, and preparing suitcase-by-suitcase packing lists. Open `index.html` in a modern browser for basic use; no build step is required.

## Progressive Web App

The app includes a web app manifest, 192px and 512px icons, and a service worker that caches the app shell for offline loading. Serve it from `localhost` or an HTTPS host to enable browser installation and offline support; opening `index.html` directly does not register the service worker. Visit the app once while online to cache its files. App data remains in browser local storage on the current device.

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

The app stores data in browser local storage on the current device. After you opt in by signing in to Firebase, it also syncs that data between devices. Clearing the browser's site data may remove its local copy, so export backups regularly.

## Firebase sync setup

The app can sync its local data between devices through Firebase Authentication and Cloud Firestore. Sign-in is optional; without it, the app continues to use local storage and JSON backups.

Before using sync:

1. In the Firebase console for project `cruise-packer-17b82`, enable **Authentication > Sign-in method > Email/Password**.
2. Create a **Cloud Firestore** database on the Spark plan.
3. Publish the rules from [`firestore.rules`](./firestore.rules) in **Firestore Database > Rules**. They restrict each signed-in user to their own document.
4. Serve the app from an HTTPS host (or `localhost`) and open it online. Add the deployed hostname to **Authentication > Settings > Authorized domains** if Firebase rejects it. Firebase's browser SDK is loaded from Google's CDN; offline app features continue to use local storage.
5. In **Settings > Sync between devices**, create an account on the device with the data you want to keep. If that account has no cloud data yet, the app uploads the current browser's app data. Sign in with the same account on other devices to load and sync it.

The app keeps local copies on each device. While online, changes sync automatically; when both devices make changes before reconnecting, whichever whole-app save reaches Firestore last wins and can replace the other device's unsynced changes. Export JSON backups regularly. Firebase's web API key is included in client code by design; access control comes from Authentication and the Firestore rules, not from keeping that key secret.
