const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const UserAgent = require('user-agents');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);

// Test endpoint to check if a video is available
router.get('/test', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Testing video access for: ${videoId}`);
  
  try {
    // Enhanced headers for bypass
    const userAgent = new UserAgent();
    const options = {
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
          'Pragma': 'no-cache',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com'
        }
      }
    };

    // Try to get video info with enhanced headers
    const info = await ytdl.getInfo(videoId, options);
    
    if (info && info.videoDetails) {
      console.log(`Video validation successful: ${info.videoDetails.title}`);
      res.json({ 
        valid: true, 
        title: info.videoDetails.title,
        duration: info.videoDetails.lengthSeconds,
        method: 'Enhanced headers'
      });
    } else {
      console.log(`Video validation failed: No video details found`);
      res.json({ valid: false, error: 'No video details found' });
    }
  } catch (err) {
    console.error('Test error:', err);
    
    // Enhanced error messages
    if (err.message.includes('Sign in to confirm') || 
        err.message.includes('not a bot') || 
        err.message.includes('This video is not available')) {
      return res.json({ 
        valid: false, 
        error: 'YouTube anti-bot protection detected. Please try again.' 
      });
    }
    
    res.json({ valid: false, error: 'Unexpected error: ' + err.message });
  }
});

router.get('/', async (req, res) => {
  const { videoId, format } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`Attempting to download: ${url} in format: ${format}`);

  try {
    // Enhanced headers for bypass
    const userAgent = new UserAgent();
    const options = {
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
          'Pragma': 'no-cache',
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com'
        }
      }
    };

    // Get video info for filename
    const info = await ytdl.getInfo(videoId, options);
    let title = 'video';
    
    if (info && info.videoDetails) {
      title = info.videoDetails.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
    }
    
    console.log(`Sanitized filename: ${title}`);

    if (format === 'mp3') {
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      try {
        const stream = ytdl(url, { 
          quality: 'highestaudio',
          filter: 'audioonly',
          requestOptions: options.requestOptions
        });
        
        ffmpeg(stream)
          .audioBitrate(128)
          .toFormat('mp3')
          .on('error', (err) => {
            console.error('FFmpeg error:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to convert audio: ' + err.message });
            }
          })
          .on('end', () => {
            console.log('Audio conversion completed');
          })
          .pipe(res, { end: true });
      } catch (streamError) {
        console.error('Audio stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create audio stream: ' + streamError.message });
        }
      }
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
      res.setHeader('Content-Type', 'video/mp4');

      try {
        const streamResult = await bypassService.getVideoStream(url, { 
          quality: 'highest'
        });
        
        if (!streamResult.success) {
          return res.status(500).json({ error: 'Failed to create video stream: ' + streamResult.error });
        }
        
        streamResult.stream.on('error', (err) => {
          console.error('Video stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download video: ' + err.message });
          }
        });
        
        streamResult.stream.on('end', () => {
          console.log('Video download completed');
        });
        
        streamResult.stream.pipe(res);
      } catch (streamError) {
        console.error('Video stream creation error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create video stream: ' + streamError.message });
        }
      }
    }
  } catch (err) {
    console.error('Download error:', err);
    
    // Check for specific YouTube bot detection error
    if (err.message.includes('Sign in to confirm') || 
        err.message.includes('not a bot') || 
        err.message.includes('This video is not available')) {
      if (!res.headersSent) {
        res.status(503).json({ 
          error: 'YouTube anti-bot protection activated. Our bypass systems are working on this...' 
        });
      }
      return;
    }
    
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video. Error: ' + err.message });
    }
  }
});

module.exports = router;
