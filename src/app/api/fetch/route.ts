import { NextRequest, NextResponse } from 'next/server'

interface VideoInfo {
  id: string
  title: string
  duration: string | null
  thumbnail: string
  url: string
}

interface PlaylistResponse {
  videos: VideoInfo[]
  playlistTitle: string
  playlistAuthor: string
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate YouTube playlist URL
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: 'Please provide a valid YouTube playlist URL' }, { status: 400 })
    }

    // Extract playlist ID from URL
    const playlistIdMatch = url.match(/[?&]list=([^&]+)/)
    if (!playlistIdMatch) {
      return NextResponse.json({ error: 'Invalid playlist URL' }, { status: 400 })
    }

    const playlistId = playlistIdMatch[1]

    // Fetch playlist data from YouTube
    const playlistData = await fetchYouTubePlaylist(playlistId)
    
    if (!playlistData) {
      return NextResponse.json({ error: 'Failed to fetch playlist data' }, { status: 500 })
    }

    return NextResponse.json(playlistData)
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json({ error: 'Failed to fetch playlist. Please check the URL and try again.' }, { status: 500 })
  }
}

async function fetchYouTubePlaylist(playlistId: string): Promise<PlaylistResponse | null> {
  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`
    
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract playlist title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const playlistTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Playlist'
    
    // Extract playlist author
    const authorMatch = html.match(/"ownerText":{"runs":\[{"text":"([^"]+)"}/)
    const playlistAuthor = authorMatch ? authorMatch[1] : 'Unknown'
    
    // Extract video data using regex patterns
    const videos: VideoInfo[] = []
    let match
    
    // Look for video entries in the HTML
    const videoIdRegex = /"videoId":"([^"]+)"/g
    const videoIds = new Set<string>()
    
    while ((match = videoIdRegex.exec(html)) !== null) {
      const videoId = match[1]
      if (videoId && videoId.length === 11 && !videoIds.has(videoId)) {
        videoIds.add(videoId)
      }
    }
    
    // For each video ID, try to extract title and duration
    for (const videoId of Array.from(videoIds).slice(0, 50)) { // Limit to first 50 videos
      try {
        // Look for title pattern around this video ID
        const titlePattern = new RegExp(`"videoId":"${videoId}"[^}]*"title":{"runs":\\[{"text":"([^"]+)"}`, 'g')
        const titleMatch = titlePattern.exec(html)
        
        // Look for duration pattern
        const durationPattern = new RegExp(`"videoId":"${videoId}"[^}]*"lengthText":{"simpleText":"([^"]+)"}`, 'g')
        const durationMatch = durationPattern.exec(html)
        
        const title = titleMatch ? titleMatch[1] : `Video ${videoId}`
        const duration = durationMatch ? durationMatch[1] : null
        
        videos.push({
          id: videoId,
          title: title,
          duration: duration,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`
        })
      } catch (error) {
        console.error(`Error processing video ${videoId}:`, error)
      }
    }
    
    if (videos.length === 0) {
      // Fallback: try a different approach
      const fallbackVideoRegex = /"videoId":"([A-Za-z0-9_-]{11})"/g
      const fallbackMatches = html.match(fallbackVideoRegex)
      
      if (fallbackMatches) {
        const uniqueIds = [...new Set(fallbackMatches.map(m => {
          const match = m.match(/"videoId":"([A-Za-z0-9_-]{11})"/)
          return match ? match[1] : null
        }).filter(Boolean))].slice(0, 20)
        
        uniqueIds.forEach(videoId => {
          if (videoId) {
            videos.push({
              id: videoId,
              title: `Video ${videoId}`,
              duration: null,
              thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${videoId}`
            })
          }
        })
      }
    }
    
    return {
      videos,
      playlistTitle,
      playlistAuthor
    }
    
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error)
    return null
  }
}
