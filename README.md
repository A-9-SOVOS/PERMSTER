# PERMSTER - Twitter Quality of Life Plugin

**Version:** 0.1.7  

A browser extension that adds engagement metrics to tweets by displaying the likes‑to‑views ratio (engagement rate) directly in your Twitter/X feed. The extension has been updated with several new capabilities:

- 📊 **Engagement badge** – shows the likes‑to‑views percentage next to each tweet.
- 🛠️ **Floating tooltip** – community‑note text now appears in a floating tooltip that stays visible even when the tweet is scrolled, providing a better reading experience.
- 🎨 **Improved theme detection** – uses Twitter’s internal `data‑theme` attribute for reliable colour selection across Light, Dim and Lights‑Out themes.
- 🔢 **Enhanced number parsing** – correctly parses Western formats (`K`, `M`, `B`) **and** East‑Asian units (`万`, `億`, `亿`).
- 🌓 **Full theme support** – badge colour automatically adapts to the current Twitter theme.
- ⚡ **Efficient performance** – only processes tweets that become visible using an IntersectionObserver.
- 🧩 **Robust community‑note handling** – extracts note text more reliably, hides the original note element, and adds a clickable badge that opens the original note URL.

## Features

- Displays likes‑to‑views ratio as a percentage next to each tweet.
- Shows exact likes and views counts on hover (via the floating tooltip).
- Supports all Twitter themes (light, dim, lights‑out).
- Handles various number formats, including East‑Asian units.
- Provides a clickable community‑note badge with a floating tooltip.

## Installation

1. Download the extension files.
2. Open your browser’s extensions page:
   - **Chrome:** `chrome://extensions/`
   - **Edge:** `edge://extensions/`
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extension directory.

## How It Works

The extension runs on the Twitter/X website and calculates the engagement rate (likes/views ratio) for each tweet in your feed. The ratio is shown with a `߷` symbol next to the tweet’s engagement metrics.

- Ratios **≥ 10 %** – displayed with **1 decimal place** (e.g., `12.3%`).
- Ratios **≥ 1 %** and **< 10 %** – displayed with **2 decimal places** (e.g., `1.23%`).
- Ratios **< 1 %** – displayed with **3 decimal places** (e.g., `0.123%`).

When a tweet contains a community note, the original note element is hidden and a small `φ` badge is inserted. Hovering the badge shows the note text in a floating tooltip that stays on‑screen while scrolling. Clicking the badge opens the original note URL in a new tab.

## Files

- `manifest.json` – Extension configuration.
- `content.js` – Main extension logic (includes parsing, theme detection, badge rendering, and tooltip handling).
- `styles.css` – Extension styling.
- `icon16.png`, `icon48.png`, `icon128.png` – Extension icons.

## Privacy

- Runs **only** on the Twitter/X website.
- **No data is collected or transmitted**.
- Operates entirely client‑side.
- Requires only the `activeTab` permission to read page content.

## Contributing

Feel free to submit issues and pull requests to improve the extension. Contributions that add new metrics, improve parsing, or enhance UI/UX are especially welcome.

## License

A‑9 Open Source
