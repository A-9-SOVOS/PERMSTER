# PERMSTER - Twitter Quality of Life Plugin

<div align="center">

**A browser extension that adds engagement metrics and content control directly in your Twitter/X feed.**

[Features](#features) • [Installation](#installation) • [How It Works](#how-it-works) • [Privacy](#privacy--local-only-data) • [Contributing](#contributing)

</div>

---

- [Features](#features)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Privacy & Local-Only Data](#privacy--local-only-data)
- [Contributing](#contributing)
- [License](#license)

---

### Core Features
- 📊 **Engagement Metrics**: Displays likes-to-views ratio as a percentage (symbol: ߷) next to each tweet.
- 🎨 **Theme Support**: Adapts to all Twitter themes (light, dim, lights-out).
- 🔢 **Multi-Format Parsing**: Supports international number formats (e.g., 1.2K, 3,456, 1.2万, 1億).
- 📝 **Community Notes**: Replaces notes with a φ badge, featuring hover tooltips and dropdown menus.
- 🔒 **Data Control**: Opt-in local data collection (disabled by default).
- 🎯 **Content Filtering**: Visually hides low-engagement tweets while preserving data collection.

---

## 🚀 Installation
1. Download the extension files from this repository
2. Open your browser's extensions page:
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked** and select the extension directory
5. Navigate to Twitter/X (x.com) or refresh the page and enjoy the enhancements!


**congratulations**>
The extension requires no additional configuration and should work immediately on Twitter/X. 

All data collection is opt-in, stored locally, and disabled by default.

### 🔧 Settings & Configuration
Access the extension popup to configure:
- **Data Collection**: Toggle local data collection on/off.
- **Auto-Saving**: Save data every N posts (default: 500).
- **Filter Threshold**: Set a minimum engagement percentage (0-100%) to hide low-performing posts.
- **Show Zeros**: Display posts with 0% engagement.
- **Only Zeros**: Filter to show exclusively posts with 0% engagement.

---

## ⚙️ How It Works
The extension enhances your Twitter/X experience by calculating and displaying engagement metrics directly in your feed. It operates entirely client-side, ensuring privacy and performance.

### 📊 Engagement Calculation
- **Formula**: `(likes / views) × 100 = engagement percentage`.
- **Display Format**: 
  - ≥10%: `10.5%`
  - ≥1%: `2.34%`
  - <1%: `0.567%`
- **Parsing**: Supports diverse formats (e.g., 1.2K, 3,456, 1.2万).

### 📝 Community Notes Enhancement
When a tweet includes a community note:
- The original note is hidden for cleaner readability.
- A φ badge appears in the tweet actions area.
- Hovering reveals the full note text in a tooltip.
- Clicking opens a dropdown with:
  - Direct links to sources.
  - Rating options (helpful/not helpful).
  - Full note content for easy reading.

### 🎯 Content Filtering
- **Visual-Only Filtering**: Tweets below the engagement threshold are hidden but still logged.
- **Configurable Threshold**: Set a minimum engagement percentage (0-100%) in the popup.
- **Zero-Engagement Options**: Toggle visibility for posts with 0% engagement.
- **Feed-Restricted**: Filtering applies only to timeline/feed posts, not detail pages.

### 📈 Data Collection & Storage
- **Auto-Collection**: Gathers metrics from all posts in your "For You" feed.
- **Per-User Stats**: Tracks individual account performance over time.
- **Category Analysis**: Segments data by post length and media presence.
- **Deduplication**: Tracks up to 100,000 processed post IDs to avoid duplicates.
- **CSV Export**: Saves detailed statistics to `Downloads/XData/xd.csv` (auto-created).

#### 📋 Statistics Tracked
- **Per-User**: Engagement count, average score, views, comments, and timestamps.
- **Content Categories**: Post length (short, mid, long, extended) and media types (images vs. text-only).
- **Global**: Overall engagement range, total likes/views/comments, and performance metrics.

> **Note**: Filtering only affects posts visibility while preserving data collection for local storage.

---

## 🤝 Contributing
Contributions are welcome! Submit issues or pull requests to improve the extension.

### 🎯 Areas for Contribution
- **New Metrics**: Add engagement calculations (e.g., retweets, bookmarks, shares).
- **Parsing Improvements**: Enhance support for international number formats.
- **UI/UX Enhancements**: Improve badge design, tooltip positioning, or popup interface.
- **Bug Fixes**: Address parsing edge cases or theme compatibility issues.
- **Documentation**: Expand guides, add examples, or translate to other languages.
- **Testing**: Ensure cross-browser compatibility and performance.

### 🛠️ Development Setup
1. Clone this repository.
2. Load the extension in developer mode (see [Installation](#installation)).
3. Open browser DevTools to check console logs.
4. Test changes on Twitter/X and submit a pull request.

---

## 📜 License
<div align="center">
**Arc-9 Open Royalty Agreement**

This project is released under the [Arc-9 Open Royalty Agreement](LICENSE). It grants broad, free-use rights while reserving a **4% royalty** for the originator on certain commercial uses.

📋 [View Full License](LICENSE) | ⚖️ [License Summary](#license-summary)

</div>

### License Summary
- ✅ **Free for personal and non-commercial use**
- ✅ **Open-source development encouraged**
- ✅ **Modification and distribution permitted**
- 💰 **4% royalty on covered commercial uses**
- 📝 **See [LICENSE](LICENSE) for complete terms**

### 📝 License Notice

By using this project or it's methods, you agree to the terms outlined in the license agreement.

---

<div align="center">

**Made with ❤️ by [A-9-SOVOS](https://github.com/A-9-SOVOS)**

![Tip](Tip.png)

[![License: Arc-9](https://img.shields.io/badge/License-Arc-9%20Open%20Royalty-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](#)
[![Chrome](https://img.shields.io/badge/chrome-supported-brightgreen.svg)](#)

</div>
