# Downlyst - YouTube Playlist Downloader

A modern, responsive YouTube playlist and video downloader built with Next.js 15.

![Downlyst Preview](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## ✨ Features

- 🎬 **Playlist Downloads** - Fetch and download entire YouTube playlists
- � **Single Video Downloads** - Download individual videos directly
- 🔍 **YouTube Search** - Search and download videos without leaving the app
- 🎵 **Multiple Formats** - MP4 (video) and MP3 (audio) support
- 📱 **Fully Responsive** - Beautiful UI on desktop, tablet, and mobile
- 🚀 **High Quality** - Downloads the best available quality
- � **Smart Fallback** - External download services as backup when needed

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS 4 | Utility-first styling |
| yt-dlp | YouTube download engine |
| FFmpeg | Audio/video processing |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Python 3.x (for yt-dlp)
- FFmpeg (optional, for best quality)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/youtube-playlist-downloader.git
cd youtube-playlist-downloader

# Install Node.js dependencies
npm install

# Install yt-dlp (required for downloads)
pip install yt-dlp

# Install FFmpeg (recommended)
# Windows: winget install Gyan.FFmpeg
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── download/    # Video download endpoint
│   │   ├── fetch/       # Playlist fetching endpoint
│   │   └── search/      # YouTube search endpoint
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main application page
├── components/
│   └── ui/              # Reusable UI components
└── lib/
    └── utils.ts         # Utility functions
```

## 🔧 How It Works

1. **Fetch**: Enter a YouTube URL or search query
2. **Process**: The app fetches video metadata using yt-dlp
3. **Download**: Choose MP3 or MP4 format
4. **Fallback**: If direct download fails, external services are offered

## ⚠️ Known Limitations

- YouTube actively blocks automated downloads; results may vary
- Large videos may timeout on serverless platforms (Vercel)
- Some age-restricted or region-locked videos may not work
- For best results, run locally with yt-dlp installed

## 📋 Troubleshooting

| Issue | Solution |
|-------|----------|
| Download fails | External service links will be provided as fallback |
| "yt-dlp not found" | Install via `pip install yt-dlp` |
| Poor video quality | Install FFmpeg for proper audio/video merging |
| Timeout errors | Run locally instead of on serverless platforms |

## 🌐 Deployment

### Vercel (Limited)

> ⚠️ **Note**: Serverless platforms have timeout limits. Direct downloads may not work; the app will fall back to external services.

1. Fork this repository
2. Import to Vercel
3. Deploy

### Self-Hosted (Recommended)

For full functionality, deploy on a VPS or dedicated server with yt-dlp and FFmpeg installed.

## 📄 License

This project is for **educational purposes only**. Please respect YouTube's Terms of Service and copyright laws.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

<p align="center">
  Made with ❤️ using Next.js
</p>
