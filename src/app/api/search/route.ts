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
    const { query } = await req.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Search YouTube
    const searchResults = await searchYouTube(query)
    
    if (!searchResults) {
      return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 500 })
    }

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error('Error searching YouTube:', error)
    return NextResponse.json({ error: 'Failed to search YouTube. Please try again.' }, { status: 500 })
  }
}

async function searchYouTube(query: string): Promise<PlaylistResponse | null> {
  try {
    // Encode the search query for URL
    const encodedQuery = encodeURIComponent(query)
    const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract search results
    const videos: VideoInfo[] = []
    
    // Try to extract from ytInitialData
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});/)
    
    if (ytInitialDataMatch) {
      try {
        const ytData = JSON.parse(ytInitialDataMatch[1])
        console.log('Successfully parsed ytInitialData for search')
        
        // Navigate to search results
        const searchResults = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents
        
        if (searchResults && Array.isArray(searchResults)) {
          for (const section of searchResults) {
            if (section?.itemSectionRenderer?.contents) {
              for (const item of section.itemSectionRenderer.contents) {
                if (item.videoRenderer) {
                  const videoRenderer = item.videoRenderer
                  
                  // Extract video ID
                  const videoId = videoRenderer.videoId
                  if (!videoId || videoId.length !== 11) continue
                  
                  // Extract title
                  let title = `Video ${videoId}`
                  if (videoRenderer.title?.runs?.[0]?.text) {
                    title = videoRenderer.title.runs[0].text
                  }
                  
                  // Extract duration
                  let duration: string | null = null
                  if (videoRenderer.lengthText?.simpleText) {
                    duration = videoRenderer.lengthText.simpleText
                  }
                  
                  // Check thumbnail overlays for duration
                  if (!duration && videoRenderer.thumbnailOverlays) {
                    for (const overlay of videoRenderer.thumbnailOverlays) {
                      if (overlay.thumbnailOverlayTimeStatusRenderer?.text?.simpleText) {
                        duration = overlay.thumbnailOverlayTimeStatusRenderer.text.simpleText
                        break
                      }
                    }
                  }
                  
                  videos.push({
                    id: videoId,
                    title: title,
                    duration: duration,
                    thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                    url: `https://www.youtube.com/watch?v=${videoId}`
                  })
                  
                  // Limit to 20 results
                  if (videos.length >= 20) break
                }
              }
            }
            if (videos.length >= 20) break
          }
        }
      } catch (e) {
        console.log('Failed to parse ytInitialData for search:', e)
      }
    }
    
    // Fallback regex approach if structured data fails
    if (videos.length === 0) {
      console.log('Using fallback regex for search results...')
      
      // Look for video renderer patterns
      const videoRendererRegex = /"videoRenderer":\{[^}]*"videoId":"([A-Za-z0-9_-]{11})"[^}]*"title":\{[^}]*"text":"([^"]+)"[^}]*(?:"lengthText":\{[^}]*"simpleText":"([^"]+)"|"thumbnailOverlays":\[[^]]*"thumbnailOverlayTimeStatusRenderer":\{[^}]*"text":\{[^}]*"simpleText":"([^"]+)")/g
      
      let match
      while ((match = videoRendererRegex.exec(html)) !== null && videos.length < 20) {
        const videoId = match[1]
        const title = match[2] || `Video ${videoId}`
        const duration = match[3] || match[4] || null
        
        if (videoId && videoId.length === 11) {
          videos.push({
            id: videoId,
            title: title,
            duration: duration,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${videoId}`
          })
        }
      }
    }
    
    // Final fallback - simple video ID extraction
    if (videos.length === 0) {
      const videoIdRegex = /"videoId":"([A-Za-z0-9_-]{11})"/g
      const foundIds = new Set<string>()
      
      let match
      while ((match = videoIdRegex.exec(html)) !== null && foundIds.size < 20) {
        const videoId = match[1]
        if (videoId && videoId.length === 11 && !foundIds.has(videoId)) {
          foundIds.add(videoId)
          
          videos.push({
            id: videoId,
            title: `Video ${videoId}`,
            duration: null,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${videoId}`
          })
        }
      }
    }
    
    return {
      videos: videos,
      playlistTitle: `Search Results for "${query}"`,
      playlistAuthor: 'YouTube Search'
    }
    
  } catch (error) {
    console.error('Error searching YouTube:', error)
    return null
  }
}
