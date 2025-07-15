const express = require('express');
const ytpl = require('ytpl');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const playlistUrl = req.query.url;
    if (!playlistUrl) {
      return res.status(400).json({ error: 'Playlist URL is required' });
    }

    const playlist = await ytpl(playlistUrl, { limit: 100 });
    const videos = playlist.items.map(video => ({
      id: video.id,
      title: video.title,
      thumbnail: video.bestThumbnail.url,
      duration: video.duration,
      url: video.shortUrl
    }));
    
    res.json({
      playlistTitle: playlist.title,
      videos: videos
    });
  } catch (err) {
    console.error('Error fetching playlist:', err);
    res.status(500).json({ error: 'Failed to fetch playlist. Please check the URL and try again.' });
  }
});

module.exports = router;
