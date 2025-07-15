const express = require('express');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

const router = express.Router();
ffmpeg.setFfmpegPath(ffmpegPath);

// Test endpoint to check if a video is available
router.get('/test', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const isValid = await ytdl.validateURL(url);
    if (!isValid) {
      return res.json({ valid: false, error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    res.json({ 
      valid: true, 
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      formats: info.formats.length
    });
  } catch (err) {
    res.json({ valid: false, error: err.message });
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
    // First, check if the video is available
    const isValid = await ytdl.validateURL(url);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase();
    
    console.log(`Video title: ${info.videoDetails.title}`);
    console.log(`Sanitized filename: ${title}`);

    if (format === 'mp3') {
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      try {
        const audioStream = ytdl(url, { 
          quality: 'highestaudio',
          filter: 'audioonly'
        });
        
        ffmpeg(audioStream)
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
        const videoStream = ytdl(url, { 
          quality: 'highest'
        });
        
        videoStream.on('error', (err) => {
          console.error('Video stream error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download video: ' + err.message });
          }
        });
        
        videoStream.on('end', () => {
          console.log('Video download completed');
        });
        
        videoStream.pipe(res);
      } catch (streamError) {
        console.error('Video stream creation error:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to create video stream: ' + streamError.message });
        }
      }
    }
  } catch (err) {
    console.error('Download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download video. Error: ' + err.message });
    }
  }
});

module.exports = router;
