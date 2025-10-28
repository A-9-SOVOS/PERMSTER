# PERMSTER - Twitter Engagement Metrics Extension

A browser extension that adds engagement metrics to tweets by displaying the likes-to-views ratio (engagement rate) directly in your Twitter/X feed.

## Features

- 📊 Displays likes-to-views ratio as a percentage next to each tweet
- 🎯 Shows exact likes and views counts on hover
- 🌓 Supports all Twitter themes (light, dim, and lights out)
- ⚡ Efficient performance with intersection observer for visible tweets only
- 🔢 Handles various number formats (K, M, B, 万, 億/亿)

## Installation

1. Download the extension files
2. Open your browser's extension page
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## How It Works

The extension automatically calculates and displays the engagement rate (likes/views ratio) for each tweet in your feed. The ratio is shown with a ߷ symbol next to the tweet's engagement metrics.

- For ratios ≥ 10%: Shows 1 decimal place (e.g., "12.3%")
- For ratios ≥ 1%: Shows 2 decimal places (e.g., "1.23%")
- For ratios < 1%: Shows 3 decimal places (e.g., "0.123%")

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main extension logic
- `styles.css` - Extension styling
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons

## Privacy

This extension:
- Only runs on Twitter/X website
- Doesn't collect or transmit any data
- Works entirely client-side
- Requires no special permissions beyond page content access

## Contributing

Feel free to submit issues and pull requests to improve the extension.

## License

A-9 Open Source
