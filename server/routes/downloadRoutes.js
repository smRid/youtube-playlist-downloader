const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const YouTubeBypass = require('../utils/youtubeBypass');

const router = express.Router();
const bypassService = new YouTubeBypass();
ffmpeg.setFfmpegPath(ffmpegPath);

// Test endpoint to check if a video is available
router.get('/test', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  console.log(`Testing video access for: ${videoId}`);
  
  try {
    // Use bypass service for validation
    const result = await bypassService.validateVideoAccess(videoId);
    
    if (result.valid) {
      console.log(`Video validation successful using method: ${result.method}`);
      res.json({ 
        valid: true, 
        title: result.title,
        duration: result.duration,
        method: result.method
      });
    } else {
      console.log(`Video validation failed: ${result.error}`);
      
      // Enhanced error messages
      if (result.error.includes('Sign in to confirm') || 
          result.error.includes('not a bot') || 
          result.error.includes('This video is not available')) {
        return res.json({ 
          valid: false, 
          error: 'YouTube anti-bot protection detected. Trying alternative methods...' 
        });
      }
      
      res.json({ valid: false, error: result.error });
    }
  } catch (err) {
    console.error('Test error:', err);
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
    // First, validate with bypass service
    const validation = await bypassService.validateVideoAccess(videoId);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    console.log(`Video validated using method: ${validation.method}`);
    
    // Get video info for filename
    const infoResult = await bypassService.extractVideoInfo(videoId);
    let title = 'video';
    
    if (infoResult.success) {
      title = infoResult.info.videoDetails.title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
    }
    
    console.log(`Sanitized filename: ${title}`);

    if (format === 'mp3') {
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      try {
        const streamResult = await bypassService.getVideoStream(url, { 
          quality: 'highestaudio',
          filter: 'audioonly'
        });
        
        if (!streamResult.success) {
          return res.status(500).json({ error: 'Failed to create audio stream: ' + streamResult.error });
        }
        
        ffmpeg(streamResult.stream)
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
