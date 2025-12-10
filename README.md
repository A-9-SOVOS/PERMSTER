# PERMSTER - Twitter Quality of Life Plugin

<div align="center">

![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
![License](https://img.shields.io/badge/license-Arc--9%20Open%20Royalty-green.svg)
![Chrome](https://img.shields.io/badge/chrome-supported-brightgreen.svg)
![Edge](https://img.shields.io/badge/edge-supported-brightgreen.svg)

**A browser extension that adds engagement metrics to tweets by displaying the likes‑to‑views ratio (engagement rate) directly in your Twitter/X feed.**

[Features](#features) • [Installation](#installation) • [How It Works](#how-it-works) • [Privacy](#privacy--local-only-data) • [Contributing](#contributing)

</div>

---

## ✨ Key Features

The extension has been updated with several new capabilities:

The extension has been updated with several new capabilities:

- 📊 **Engagement badge** – shows the likes‑to‑views percentage next to each tweet
- 🛠️ **Floating tooltip** – community‑note text now appears in a floating tooltip that stays visible even when the tweet is scrolled, providing a better reading experience
- 🎨 **Improved theme detection** – uses Twitter's internal `data‑theme` attribute for reliable colour selection across Light, Dim and Lights‑Out themes
- 🔢 **Enhanced number parsing** – correctly parses Western formats (`K`, `M`, `B`) **and** East‑Asian units (`万`, `億`, `亿`)
- 🌓 **Full theme support** – badge colour automatically adapts to the current Twitter theme
- ⚡ **Efficient performance** – only processes tweets that become visible using an IntersectionObserver
- 🧩 **Robust community‑note handling** – extracts note text more reliably, hides the original note element, and adds a clickable badge that opens the original note URL

---

## 📋 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Statistics Tracking & Local Data](#statistics-tracking--local-data)
- [Privacy & Local-Only Data](#privacy--local-only-data)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Features

### Core Features

- 📊 **Engagement Metrics**: Displays likes-to-views ratio as a percentage next to each tweet
- 📈 **Hover Details**: Shows exact likes and views counts on hover via floating tooltip
- 🎨 **Theme Support**: Supports all Twitter themes (light, dim, lights-out)
- 🔢 **Multi-Format Parsing**: Handles various number formats, including East-Asian units (万, 億, 亿)
- 📝 **Community Notes**: Clickable φ badge with floating tooltip for better note reading experience
- 🔒 **Privacy-First**: All data collection is optional and stored locally only
- ⚡ **Performance Optimized**: Uses IntersectionObserver for efficient processing

---

## 🚀 Installation

### For Chrome/Edge Users

1. Download the extension files from this repository
2. Open your browser's extensions page:
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked** and select the extension directory
5. Navigate to Twitter/X and enjoy enhanced tweet metrics!

> **Note**: The extension requires no additional configuration and works immediately on Twitter/X

---

## ⚙️ How It Works

The extension runs on the Twitter/X website and calculates the engagement rate (likes/views ratio) for each tweet in your feed. The ratio is displayed with a `߷` symbol next to the tweet's engagement metrics.

### 📊 Engagement Rate Display Rules

| Engagement Rate | Display Format | Example |
|-----------------|----------------|---------|
| **≥ 10%** | 1 decimal place | `12.3%` |
| **1% - 10%** | 2 decimal places | `1.23%` |
| **< 1%** | 3 decimal places | `0.123%` |

### 📝 Community Notes Enhancement

When a tweet contains a community note:
- Original note element is hidden for cleaner reading
- Small `φ` badge appears in the tweet actions area
- Hovering shows full note text in a floating tooltip
- Clicking opens the original note URL in a new tab

---

## 📈 Statistics Tracking & Local Data

### 📂 Storage & File Management

- **Default Location**: `Downloads/XData/xd.csv` (fallback to Downloads folder)
- **Auto-Saving**: Saves periodically and on-demand when requested
- **File Format**: CSV with comprehensive metrics per user/category
- **Persistence**: Aggregated stats saved to extension storage for continuity across reloads

### 📊 Tracked Metrics

The extension collects the following data (only when data collection is enabled):

- **Per-User Statistics**: Engagement scores, averages, post counts, last-seen timestamps
- **Content Categories**: Post length buckets (short/mid/long/extended) and media indicators  
- **Engagement Metrics**: Total likes, views, comments with min/max/avg calculations
- **Performance Data**: Post processing counts and save intervals

> **Important**: The UI filtering setting (minimum % likes per views) only hides posts in the browser UI — the extension still records metrics for filtered posts so they can be saved locally if you choose to enable data collection.

---

## 📁 Project Structure

```
PERMSTER/
├── manifest.json          # Extension configuration
├── content.js            # Main extension logic (parsing, metrics, UI)
├── background.js         # Service worker (data handling, file operations)
├── styles.css            # Extension styling
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE               # Arc-9 Open Royalty Agreement
└── README.md             # This file
```

---

## 🔒 Privacy & Local-Only Data

### ✅ What We Do

- The extension runs locally in your browser on Twitter/X only
- **Optional data collection** - completely opt-in, disabled by default
- When enabled, stats are saved only to files on your device (`Downloads/XData/xd.csv` by default)
- **Zero data transmission** - no metric data is sent to external servers
- All processing happens client-side in your browser

### 🔐 Required Permissions

- `storage` - Save extension settings and local data
- `activeTab` - Access the current Twitter/X tab  
- `scripting` - Inject the extension functionality
- `downloads` - Write CSV files reliably to your Downloads folder

### 🛡️ Data Handling

- All data collection is **local-only** and **optional**
- No analytics or tracking of user behavior
- No network requests for data transmission
- You control what data gets collected and saved
- Data persists only in your browser storage and local files

---

## 🤝 Contributing

We welcome contributions! Feel free to submit issues and pull requests to improve the extension.

### 🎯 Areas for Contribution

- 📊 **New metrics** - Add more engagement calculations
- 🔧 **Parsing improvements** - Better number format handling  
- 🎨 **UI/UX enhancements** - Improve the user interface
- 🐛 **Bug fixes** - Help us identify and fix issues
- 📖 **Documentation** - Improve guides and examples

### 🛠️ Development Setup

1. Clone this repository
2. Load the extension in developer mode (see [Installation](#installation))
3. Make your changes
4. Test thoroughly on Twitter/X
5. Submit a pull request with detailed description

---

## 📜 License

<div align="center">

**Arc-9 Open Royalty Agreement**

This project is released under the [Arc-9 Open Royalty Agreement](LICENSE). The license grants broad, free-use rights while reserving a limited **4% royalty** to the originator for certain commercial uses.

📋 [View Full License](LICENSE) | ⚖️ [License Summary](#license-summary)

</div>

### License Summary

- ✅ **Free for personal and non-commercial use**
- ✅ **Open source development encouraged**  
- ✅ **Modification and distribution permitted**
- 💰 **4% royalty on covered commercial uses**
- 📝 **See LICENSE file for complete terms**

### 📝 License Notice

Source files include Arc‑9 header comments pointing to the `LICENSE` file for clarity. By using this project, you agree to the terms outlined in the license agreement.

---

<div align="center">

**Made with ❤️ by [A-9-SOVOS](https://github.com/A-9-SOVOS)**

[![License: Arc-9](https://img.shields.io/badge/License-Arc--9%20Open%20Royalty-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](#)
[![Chrome](https://img.shields.io/badge/chrome-supported-brightgreen.svg)](#)

</div>
