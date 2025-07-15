const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const playlistRoutes = require(path.join(__dirname, 'routes', 'playlistRoutes'));
const downloadRoutes = require(path.join(__dirname, 'routes', 'downloadRoutes'));

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'YouTube Playlist Downloader API is running!', timestamp: new Date().toISOString() });
});

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

app.use('/api/playlist', playlistRoutes);
app.use('/api/download', downloadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
