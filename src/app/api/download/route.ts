import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get('videoId')
    const format = searchParams.get('format') || 'mp4'
    
    if (!videoId) {
      return new NextResponse('Missing videoId', { status: 400 })
    }

    if (!['mp4', 'mp3'].includes(format)) {
      return new NextResponse('Invalid format. Use mp4 or mp3', { status: 400 })
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    try {
      // Try to get video info first to validate the video
      const videoInfoResponse = await fetch(`https://www.youtube.com/oembed?url=${youtubeUrl}&format=json`)
      let videoTitle = `video_${videoId}`
      
      if (videoInfoResponse.ok) {
        const videoInfo = await videoInfoResponse.json()
        videoTitle = videoInfo.title?.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || videoTitle
      }

      if (format === 'mp3') {
        // For MP3 downloads, provide multiple converter options
        const mp3Options = [
          {
            name: 'YT1s.com',
            url: `https://www.yt1s.com/youtube-to-mp3?q=${encodeURIComponent(youtubeUrl)}`,
            description: 'Fast MP3 converter'
          },
          {
            name: 'Y2mate',
            url: `https://www.y2mate.com/youtube-mp3/${videoId}`,
            description: 'High quality MP3'
          },
          {
            name: 'MP3Convert',
            url: `https://mp3convert.io/youtube-to-mp3?url=${encodeURIComponent(youtubeUrl)}`,
            description: 'Simple MP3 converter'
          }
        ]
        
        return NextResponse.json({ 
          downloadOptions: mp3Options,
          videoTitle,
          youtubeUrl,
          message: 'Choose an MP3 converter service',
          videoId,
          format: 'mp3'
        })
      } else {
        // For MP4, provide multiple download options
        const mp4Options = [
          {
            name: 'SaveFrom.net',
            url: `https://sfrom.net/${youtubeUrl}`,
            description: 'Popular video downloader'
          },
          {
            name: 'Y2mate Video',
            url: `https://www.y2mate.com/youtube/${videoId}`,
            description: 'Multiple quality options'
          },
          {
            name: 'KeepVid',
            url: `https://keepvid.pro/youtube-downloader?url=${encodeURIComponent(youtubeUrl)}`,
            description: 'High quality downloads'
          },
          {
            name: 'ClipConverter',
            url: `https://www.clipconverter.cc/download/youtube/${videoId}/`,
            description: 'Advanced conversion options'
          }
        ]
        
        return NextResponse.json({ 
          downloadOptions: mp4Options,
          videoTitle,
          youtubeUrl,
          message: 'Choose a video download service',
          videoId,
          format: 'mp4'
        })
      }
    } catch (fetchError) {
      console.error('Error fetching video info:', fetchError)
      
      // Fallback options if video info fetch fails
      const fallbackOptions = [
        {
          name: 'Direct YouTube',
          url: youtubeUrl,
          description: 'View on YouTube (use browser extension)'
        },
        {
          name: 'Generic Downloader',
          url: `https://www.genericdownloader.com/?url=${encodeURIComponent(youtubeUrl)}`,
          description: 'Universal video downloader'
        }
      ]
      
      return NextResponse.json({ 
        downloadOptions: fallbackOptions,
        videoTitle: `video_${videoId}`,
        youtubeUrl,
        message: 'Video info unavailable - using fallback options',
        videoId,
        format
      })
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: 'Download service unavailable',
      message: 'Please try again later or use a browser extension'
    }, { status: 500 })
  }
}
