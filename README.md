# Downlyst - YouTube Playlist Downloader

A modern, responsive YouTube playlist and video downloader built with Next.js 15 and advanced bot protection bypass methods.

## Features

- 🎬 **Download YouTube playlists** - Fetch entire playlists with one click
- 📱 **Single video downloads** - Download individual videos directly
- 🔍 **YouTube search** - Search and download videos without leaving the app
- 🎵 **Multiple formats** - Support for MP4 (video) and MP3 (audio)
- 📱 **Mobile responsive** - Works perfectly on all devices
- 🚀 **High quality** - Always downloads the highest quality available
- 🛡️ **Bot protection bypass** - Advanced methods to bypass YouTube's restrictions
- ⚡ **Fast & reliable** - Optimized for Vercel deployment

## Deployment

### Deploy to Vercel (Recommended)

1. **Fork this repository** or clone it to your GitHub account

2. **Connect to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Import your repository
   - Configure the project settings

3. **Environment Variables** (Optional):
   - No environment variables required for basic functionality
   - All bot protection is built-in

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be available at `https://your-app-name.vercel.app`

### Manual Deployment

```bash
# Clone the repository
git clone https://github.com/yourusername/youtube-playlist-downloader.git
cd youtube-playlist-downloader

# Install dependencies
npm install

# Build the application
npm run build

# Start the production server
npm start
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Bot Protection Features

This application includes advanced bot protection bypass methods:

- **Custom User-Agent rotation** - Mimics real browser behavior
- **Enhanced headers** - Includes all necessary browser headers
- **Request optimization** - Optimized for Vercel's serverless environment
- **Fallback mechanisms** - Multiple methods to ensure reliability
- **Error handling** - Graceful handling of YouTube's restrictions

## Technical Details

- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS with custom responsive design
- **YouTube Integration:** @distube/ytdl-core with custom bot protection
- **Deployment:** Optimized for Vercel serverless functions
- **TypeScript:** Full type safety throughout the application

## Troubleshooting

### Common Issues

1. **"Video not found" errors:**
   - Ensure the URL is correct and the video is public
   - Some age-restricted or region-locked videos may not work

2. **Download failures:**
   - The app automatically retries with fallback methods
   - Check your internet connection
   - YouTube may temporarily block requests - try again later

3. **Slow downloads:**
   - Large playlists are processed with delays to prevent rate limiting
   - Individual video downloads are optimized for speed

### Vercel Deployment Issues

- Ensure your Vercel account supports the required function timeout limits
- Check the Vercel function logs for detailed error information
- Make sure all dependencies are properly installed

## License

This project is for educational purposes only. Please respect YouTube's Terms of Service and copyright laws when using this application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please open an issue on GitHub with:
- Your error message
- Steps to reproduce
- Browser and device information
