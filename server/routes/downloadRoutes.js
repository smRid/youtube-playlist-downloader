const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const UserAgent = require('user-agents');
const YouTubeBypass = require('../utils/youtubeBypass');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);

// Initialize the YouTube bypass system
const youtubeBypass = new YouTubeBypass();

// Test endpoint to check if a video is available with enhanced bypass
router.get('/test', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`[DownloadTest] Testing video access for: ${videoId}`);
  
  try {
    // Use the enhanced bypass system
    const result = await youtubeBypass.validateVideoAccess(videoId);
    
    if (result.valid) {
      console.log(`[DownloadTest] Video validation successful: ${result.title}`);
      res.json({ 
        valid: true, 
        title: result.title,
        duration: result.duration,
        method: result.method || 'Enhanced bypass system'
      });
    } else {
      console.log(`[DownloadTest] Video validation failed: ${result.error}`);
      res.json({ valid: false, error: result.error });
    }
  } catch (err) {
    console.error('[DownloadTest] Error:', err);
    
    // Enhanced error messages
    if (err.message.includes('Sign in to confirm') || 
        err.message.includes('not a bot') || 
        err.message.includes('This video is not available')) {
      return res.json({ 
        valid: false, 
        error: 'YouTube anti-bot protection detected. Using enhanced bypass...' 
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
  console.log(`[Download] Attempting to download: ${url} in format: ${format}`);

  try {
    // Use the enhanced bypass system to get video info
    const bypassResult = await youtubeBypass.extractVideoInfo(videoId);
    
    if (!bypassResult.success) {
      console.log(`[Download] Enhanced bypass failed: ${bypassResult.error}`);
      return res.status(500).json({ error: 'Failed to bypass YouTube protection: ' + bypassResult.error });
    }
    
    // Get enhanced headers from bypass system
    const enhancedHeaders = youtubeBypass.generateProxyHeaders();
    const sessionCookies = youtubeBypass.generateSessionCookies();
    
    // Enhanced options with bypass system
    const options = {
      requestOptions: {
        headers: {
          ...enhancedHeaders,
          'Referer': 'https://www.youtube.com/',
          'Origin': 'https://www.youtube.com'
        }
      }
    };

    // Get sanitized filename from bypass result
    let title = 'video';
    if (bypassResult.info && bypassResult.info.videoDetails) {
      title = bypassResult.info.videoDetails.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
    }
    
    console.log(`[Download] Sanitized filename: ${title}`);

    if (format === 'mp3') {
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      try {
        // Use enhanced bypass stream
        const stream = await youtubeBypass.getVideoStream(url, {
          quality: 'highestaudio',
          filter: 'audioonly'
        });
        
        if (!stream.success) {
          console.error(`[Download] Stream failed: ${stream.error}`);
          return res.status(500).json({ error: 'Failed to get video stream: ' + stream.error });
        }
        
        ffmpeg(stream.stream)
          .audioBitrate(128)
          .toFormat('mp3')
          .on('error', (err) => {
            console.error('[Download] FFmpeg error:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to convert audio: ' + err.message });
            }
          })
          .on('end', () => {
            console.log('[Download] Audio conversion completed');
          })
          .pipe(res, { end: true });
      } catch (streamError) {
        console.error('[Download] Audio stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create audio stream: ' + streamError.message });
        }
      }
    } else {
      // Video download with enhanced bypass
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
      res.setHeader('Content-Type', 'video/mp4');

      try {
        // Use enhanced bypass stream
        const stream = await youtubeBypass.getVideoStream(url, {
          quality: 'highest',
          filter: 'videoandaudio'
        });
        
        if (!stream.success) {
          console.error(`[Download] Video stream failed: ${stream.error}`);
          return res.status(500).json({ error: 'Failed to get video stream: ' + stream.error });
        }
        
        stream.stream.pipe(res);
        
        stream.stream.on('end', () => {
          console.log('[Download] Video download completed');
        });
        
        stream.stream.on('error', (err) => {
          console.error('[Download] Video stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream video: ' + err.message });
          }
        });
      } catch (streamError) {
        console.error('[Download] Video stream error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create video stream: ' + streamError.message });
        }
      }
    }
  } catch (err) {
    console.error('[Download] Error:', err);
    
    // Enhanced error handling
    if (err.message.includes('Sign in to confirm') || 
        err.message.includes('not a bot') || 
        err.message.includes('This video is not available')) {
      return res.status(503).json({ 
        error: 'YouTube anti-bot protection detected. The enhanced bypass system is working to resolve this...' 
      });
    }
    
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});

// POST endpoint for downloads
router.post('/', async (req, res) => {
  const { url, format } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Extract video ID from URL
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  console.log(`[Download POST] Attempting to download: ${url} in format: ${format || 'mp3'}`);

  try {
    // Use the enhanced bypass system to get video info
    const bypassResult = await youtubeBypass.extractVideoInfo(videoId);
    
    if (!bypassResult.success) {
      console.log(`[Download POST] Enhanced bypass failed: ${bypassResult.error}`);
      return res.status(500).json({ error: 'Failed to bypass YouTube protection: ' + bypassResult.error });
    }
    
    // Get sanitized filename from bypass result
    let title = 'video';
    if (bypassResult.info && bypassResult.info.videoDetails) {
      title = bypassResult.info.videoDetails.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
    }
    
    console.log(`[Download POST] Sanitized filename: ${title}`);

    if (format === 'mp3' || !format) {
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      try {
        // Use enhanced bypass stream
        const stream = await youtubeBypass.getVideoStream(url, {
          quality: 'highestaudio',
          filter: 'audioonly'
        });
        
        if (!stream.success) {
          console.error(`[Download POST] Stream failed: ${stream.error}`);
          return res.status(500).json({ error: 'Failed to get video stream: ' + stream.error });
        }
        
        ffmpeg(stream.stream)
          .audioBitrate(128)
          .toFormat('mp3')
          .on('error', (err) => {
            console.error(`[Download POST] FFmpeg error: ${err.message}`);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Audio conversion failed: ' + err.message });
            }
          })
          .on('end', () => {
            console.log(`[Download POST] Audio conversion completed successfully`);
          })
          .pipe(res);
      } catch (streamError) {
        console.error(`[Download POST] Stream error: ${streamError.message}`);
        return res.status(500).json({ error: 'Stream failed: ' + streamError.message });
      }
    } else {
      // For non-audio formats, return the direct stream
      try {
        const stream = await youtubeBypass.getVideoStream(url, {
          quality: 'highest',
          filter: 'video'
        });
        
        if (!stream.success) {
          console.error(`[Download POST] Video stream failed: ${stream.error}`);
          return res.status(500).json({ error: 'Failed to get video stream: ' + stream.error });
        }
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        
        stream.stream.pipe(res);
      } catch (streamError) {
        console.error(`[Download POST] Video stream error: ${streamError.message}`);
        return res.status(500).json({ error: 'Video stream failed: ' + streamError.message });
      }
    }
  } catch (err) {
    console.error('[Download POST] Error:', err);
    
    // Enhanced error messages
    if (err.message.includes('Sign in to confirm') || 
        err.message.includes('not a bot') || 
        err.message.includes('This video is not available')) {
      return res.status(503).json({ 
        error: 'YouTube anti-bot protection detected. The enhanced bypass system is working to resolve this...' 
      });
    }
    
    res.status(500).json({ error: 'Download failed: ' + err.message });
  }
});

module.exports = router;
