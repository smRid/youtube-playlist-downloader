const express = require('express');
const ytpl = require('ytpl');
const UserAgent = require('user-agents');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const playlistUrl = req.query.url;
    if (!playlistUrl) {
      return res.status(400).json({ error: 'Playlist URL is required' });
    }

    console.log(`Fetching playlist: ${playlistUrl}`);
    
    // Enhanced headers for playlist fetching
    const userAgent = new UserAgent();
    const options = {
      limit: 100,
      requestOptions: {
        headers: {
          'User-Agent': userAgent.toString(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    };

    let playlist;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Add delay between retries
        if (retryCount > 0) {
          const delay = 1000 * Math.pow(2, retryCount);
          console.log(`[PlaylistRoute] Waiting ${delay}ms before retry ${retryCount}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        playlist = await ytpl(playlistUrl, options);
        break;
      } catch (error) {
        retryCount++;
        console.log(`[PlaylistRoute] Retry ${retryCount}/${maxRetries} failed: ${error.message}`);
        
        if (retryCount >= maxRetries) {
          throw error;
        }
      }
    }
    
    const videos = playlist.items.map(video => ({
      id: video.id,
      title: video.title,
      thumbnail: video.bestThumbnail.url,
      duration: video.duration,
      url: video.shortUrl
    }));
    
    console.log(`Successfully fetched ${videos.length} videos from playlist`);
    
    res.json({
      playlistTitle: playlist.title,
      videos: videos
    });
  } catch (err) {
    console.error('Error fetching playlist:', err);
    
    // Enhanced error handling
    if (err.message.includes('Sign in to confirm') || 
        err.message.includes('not a bot') || 
        err.message.includes('unavailable')) {
      res.status(503).json({ 
        error: 'YouTube has temporarily restricted access to this playlist. Please try again in a few minutes.' 
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch playlist. Please check the URL and try again.' });
    }
  }
});

module.exports = router;
