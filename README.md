# YouTube Playlist Downloader

A full-stack web application built with MERN stack (MongoDB-less), Vite, and Tailwind CSS that allows users to download YouTube playlists as MP4 or MP3 files.

## Features

- 🎵 Download entire YouTube playlists
- 📹 Support for both MP4 (video) and MP3 (audio) formats
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast development with Vite
- 🔄 Real-time playlist fetching

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Axios

**Backend:**
- Node.js
- Express.js
- ytdl-core (YouTube downloader)
- ytpl (YouTube playlist parser)
- fluent-ffmpeg (audio conversion)

## Project Structure

```
youtube-playlist-downloader/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main application component
│   │   ├── main.jsx       # React entry point
│   │   └── index.css      # Tailwind CSS imports
│   ├── tailwind.config.js # Tailwind configuration
│   └── vite.config.js     # Vite configuration with API proxy
│
├── server/                 # Express backend
│   ├── routes/
│   │   ├── playlistRoutes.js  # Playlist fetching API
│   │   └── downloadRoutes.js  # Download handling API
│   ├── index.js           # Express server
│   └── package.json       # Backend dependencies
│
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5174` (or the next available port)

## Usage

1. Open your browser and navigate to `http://localhost:5174`
2. Paste a YouTube playlist URL in the input field
3. Click "Fetch Playlist" to load all videos
4. Choose your preferred format (MP4 or MP3) and click download for each video

## API Endpoints

### GET /api/playlist
- **Description:** Fetches playlist information and video list
- **Query Parameters:** 
  - `url` (required): YouTube playlist URL
- **Response:** JSON object with playlist title and video array

### GET /api/download
- **Description:** Downloads a specific video
- **Query Parameters:**
  - `videoId` (required): YouTube video ID
  - `format` (required): 'mp4' or 'mp3'
- **Response:** File download stream

## Development

### Running Both Servers
To run both frontend and backend simultaneously:

**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

### Building for Production
```bash
cd client
npm run build
```

## Important Notes

- This application is for educational purposes only
- Respect YouTube's Terms of Service
- Some videos may have download restrictions
- The application requires FFmpeg for MP3 conversion (included via ffmpeg-static)

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues:

1. **Port already in use**: Make sure ports 5000 and 5173 are available
2. **CORS errors**: Ensure the Vite proxy is properly configured
3. **Download failures**: Some videos may be restricted or unavailable

### Dependencies Issues:
- If you encounter issues with `ytdl-core`, try updating to the latest version
- For FFmpeg issues, ensure `ffmpeg-static` is properly installed
