import { NextRequest, NextResponse } from 'next/server'
import ytdl from '@distube/ytdl-core'

// Advanced bot protection bypass configuration
const YTDL_AGENT_OPTIONS = {
  localAddress: undefined,
  family: 4,
  agent: false,
  highWaterMark: 1024 * 1024 * 32,
}

// YouTube bypass headers
const BYPASS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Connection': 'keep-alive',
  'Cache-Control': 'max-age=0',
}

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

    // Validate YouTube URL
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return NextResponse.json({ error: 'Please provide a valid YouTube URL' }, { status: 400 })
    }

    // Check if it's a playlist URL
    const playlistIdMatch = url.match(/[?&]list=([^&]+)/)
    if (playlistIdMatch) {
      const playlistId = playlistIdMatch[1]
      
      // Fetch playlist data from YouTube
      const playlistData = await fetchYouTubePlaylist(playlistId)
      
      if (!playlistData) {
        return NextResponse.json({ error: 'Failed to fetch playlist data' }, { status: 500 })
      }

      return NextResponse.json(playlistData)
    }

    // Check if it's a single video URL
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    if (videoIdMatch) {
      const videoId = videoIdMatch[1]
      
      // Fetch single video data
      const videoData = await fetchYouTubeVideo(videoId)
      
      if (!videoData) {
        return NextResponse.json({ error: 'Failed to fetch video data' }, { status: 500 })
      }

      return NextResponse.json(videoData)
    }

    return NextResponse.json({ error: 'Invalid YouTube URL. Please provide a valid playlist or video URL.' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching YouTube data:', error)
    return NextResponse.json({ error: 'Failed to fetch YouTube data. Please check the URL and try again.' }, { status: 500 })
  }
}

// Helper function to extract channel name from YouTube's structured data
function extractChannelFromYtData(ytData: Record<string, unknown>): string | null {
  try {
    // Try to find the channel name in various locations within ytInitialData
    const paths = [
      // Playlist sidebar
      ['sidebar', 'playlistSidebarRenderer', 'items', 0, 'playlistSidebarPrimaryInfoRenderer', 'ownerText', 'runs', 0, 'text'],
      ['sidebar', 'playlistSidebarRenderer', 'items', 1, 'playlistSidebarSecondaryInfoRenderer', 'videoOwner', 'videoOwnerRenderer', 'title', 'runs', 0, 'text'],
      
      // Contents area
      ['contents', 'twoColumnBrowseResultsRenderer', 'tabs', 0, 'tabRenderer', 'content', 'sectionListRenderer', 'contents', 0, 'itemSectionRenderer', 'contents', 0, 'playlistVideoListRenderer', 'header', 'playlistHeaderRenderer', 'ownerText', 'runs', 0, 'text'],
      
      // Header area
      ['header', 'playlistHeaderRenderer', 'ownerText', 'runs', 0, 'text'],
      
      // Microformat
      ['microformat', 'microformatDataRenderer', 'ownerChannelName'],
      
      // Video details (if present)
      ['videoDetails', 'author']
    ]
    
    for (const path of paths) {
      let current: unknown = ytData
      let found = true
      
      for (const key of path) {
        if (current && typeof current === 'object' && current !== null && key in current) {
          current = (current as Record<string, unknown>)[key]
        } else {
          found = false
          break
        }
      }
      
      if (found && current && typeof current === 'string' && current.length > 0) {
        console.log(`Found channel name via structured data: ${current}`)
        return current
      }
    }
    
    // If direct paths don't work, try to search recursively
    const searchResult = recursiveSearch(ytData, ['title', 'text', 'author', 'ownerChannelName', 'channelName'])
    if (searchResult) {
      return searchResult
    }
    
  } catch (error) {
    console.log('Error extracting channel from ytData:', error)
  }
  
  return null
}

// Recursive search function to find channel names
function recursiveSearch(obj: unknown, targetKeys: string[]): string | null {
  if (!obj || typeof obj !== 'object' || obj === null) return null
  
  const objRecord = obj as Record<string, unknown>
  
  for (const key in objRecord) {
    if (targetKeys.includes(key) && typeof objRecord[key] === 'string' && objRecord[key].length > 0) {
      // Check if this looks like a channel name (not a video title or other text)
      if (key === 'author' || key === 'ownerChannelName' || key === 'channelName') {
        return objRecord[key] as string
      }
      
      // For 'title' and 'text', we need to be more careful
      if ((key === 'title' || key === 'text') && (objRecord[key] as string).length < 100) {
        // Check if there's a navigation endpoint that suggests this is a channel
        const parent = JSON.stringify(obj)
        if (parent.includes('navigationEndpoint') && parent.includes('browseEndpoint')) {
          return objRecord[key] as string
        }
      }
    }
    
    // Recursively search in nested objects and arrays
    if (typeof objRecord[key] === 'object') {
      const result = recursiveSearch(objRecord[key], targetKeys)
      if (result) return result
    }
  }
  
  return null
}

// Helper function to extract videos from YouTube's structured data
function extractVideosFromYtData(ytData: Record<string, unknown>): VideoInfo[] {
  const videos: VideoInfo[] = []
  
  try {
    // Look for video data in different locations
    const videoSearchPaths = [
      ['contents', 'twoColumnBrowseResultsRenderer', 'tabs', 0, 'tabRenderer', 'content', 'sectionListRenderer', 'contents', 0, 'itemSectionRenderer', 'contents', 0, 'playlistVideoListRenderer', 'contents'],
      ['contents', 'singleColumnBrowseResultsRenderer', 'tabs', 0, 'tabRenderer', 'content', 'sectionListRenderer', 'contents', 0, 'itemSectionRenderer', 'contents', 0, 'playlistVideoListRenderer', 'contents'],
      ['contents', 'twoColumnSearchResultsRenderer', 'primaryContents', 'sectionListRenderer', 'contents', 0, 'itemSectionRenderer', 'contents']
    ]
    
    for (const path of videoSearchPaths) {
      let current: unknown = ytData
      
      for (const key of path) {
        if (current && typeof current === 'object' && current !== null && key in current) {
          current = (current as Record<string, unknown>)[key]
        } else {
          current = null
          break
        }
      }
      
      if (current && Array.isArray(current)) {
        for (const item of current) {
          if (item && typeof item === 'object' && 'playlistVideoRenderer' in item) {
            const video = extractVideoFromRenderer(item.playlistVideoRenderer)
            if (video) {
              videos.push(video)
            }
          }
        }
        
        if (videos.length > 0) {
          console.log(`Found ${videos.length} videos in structured data`)
          break
        }
      }
    }
  } catch (error) {
    console.error('Error extracting videos from structured data:', error)
  }
  
  return videos
}

// Helper function to extract video info from a video renderer
function extractVideoFromRenderer(renderer: unknown): VideoInfo | null {
  if (!renderer || typeof renderer !== 'object' || renderer === null) return null
  
  try {
    const videoRenderer = renderer as Record<string, unknown>
    
    // Extract video ID
    const videoId = videoRenderer.videoId as string
    if (!videoId || videoId.length !== 11) return null
    
    // Extract title
    let title = `Video ${videoId}`
    if (videoRenderer.title && typeof videoRenderer.title === 'object') {
      const titleObj = videoRenderer.title as Record<string, unknown>
      if (titleObj.runs && Array.isArray(titleObj.runs) && titleObj.runs[0]) {
        const titleRun = titleObj.runs[0] as Record<string, unknown>
        if (titleRun.text && typeof titleRun.text === 'string') {
          title = titleRun.text
        }
      } else if (titleObj.simpleText && typeof titleObj.simpleText === 'string') {
        title = titleObj.simpleText
      }
    }
    
    // Extract duration
    let duration: string | null = null
    if (videoRenderer.lengthText && typeof videoRenderer.lengthText === 'object') {
      const lengthObj = videoRenderer.lengthText as Record<string, unknown>
      if (lengthObj.simpleText && typeof lengthObj.simpleText === 'string') {
        duration = lengthObj.simpleText
        console.log(`Found duration from lengthText: ${duration} for video ${videoId}`)
      }
    }
    
    // Also check thumbnailOverlays for duration
    if (!duration && videoRenderer.thumbnailOverlays && Array.isArray(videoRenderer.thumbnailOverlays)) {
      for (const overlay of videoRenderer.thumbnailOverlays) {
        if (overlay && typeof overlay === 'object' && 'thumbnailOverlayTimeStatusRenderer' in overlay) {
          const timeRenderer = (overlay as Record<string, unknown>).thumbnailOverlayTimeStatusRenderer as Record<string, unknown>
          if (timeRenderer.text && typeof timeRenderer.text === 'object') {
            const textObj = timeRenderer.text as Record<string, unknown>
            if (textObj.simpleText && typeof textObj.simpleText === 'string') {
              duration = textObj.simpleText
              console.log(`Found duration from thumbnailOverlay: ${duration} for video ${videoId}`)
              break
            }
          }
        }
      }
    }
    
    // Additional check for duration in different formats
    if (!duration && videoRenderer.lengthInSeconds && typeof videoRenderer.lengthInSeconds === 'number') {
      const seconds = videoRenderer.lengthInSeconds
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      console.log(`Found duration from lengthInSeconds: ${duration} for video ${videoId}`)
    }
    
    if (!duration) {
      console.log(`No duration found for video ${videoId}, available keys:`, Object.keys(videoRenderer))
    }
    
    return {
      id: videoId,
      title: title,
      duration: duration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`
    }
  } catch (error) {
    console.error('Error extracting video from renderer:', error)
    return null
  }
}

async function fetchYouTubePlaylist(playlistId: string): Promise<PlaylistResponse | null> {
  try {
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`
    
    // Create agent with bot protection bypass
    const agent = ytdl.createAgent(undefined, YTDL_AGENT_OPTIONS)
    
    const response = await fetch(playlistUrl, {
      headers: BYPASS_HEADERS,
      // Add additional options for better success rate
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract playlist title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const playlistTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Playlist'
    
    // Extract playlist author with multiple fallback patterns
    let playlistAuthor = 'Unknown Channel'
    
    // First, try to extract from ytInitialData which is more reliable
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});/)
    let ytData = null
    
    if (ytInitialDataMatch) {
      try {
        ytData = JSON.parse(ytInitialDataMatch[1])
        console.log('Successfully parsed ytInitialData')
        
        // Try to extract channel name from ytInitialData
        const channelFromData = extractChannelFromYtData(ytData)
        if (channelFromData) {
          playlistAuthor = channelFromData
          console.log(`✓ Found channel name from ytInitialData: ${playlistAuthor}`)
        }
      } catch (e) {
        console.log('Failed to parse ytInitialData:', e)
      }
    }
    
    // If still not found, try regex patterns
    if (playlistAuthor === 'Unknown Channel') {
      // Try different patterns to extract channel name
      const authorPatterns = [
        // Primary patterns for current YouTube structure
        /"ownerText":{"runs":\[{"text":"([^"]+)"}/,
        /"channelName":"([^"]+)"/,
        /"ownerChannelName":"([^"]+)"/,
        
        // Secondary patterns
        /"shortBylineText":{"runs":\[{"text":"([^"]+)"}/,
        /"longBylineText":{"runs":\[{"text":"([^"]+)"}/,
        /"uploaderName":"([^"]+)"/,
        /"author":"([^"]+)"/,
        
        // More specific patterns for playlist pages
        /"sidebar":{"playlistSidebarRenderer":{"items":\[{"playlistSidebarPrimaryInfoRenderer":.*?"title":"([^"]+)"/,
        /"playlistSidebarSecondaryInfoRenderer":{"videoOwner":{"videoOwnerRenderer":.*?"title":{"runs":\[{"text":"([^"]+)"}/,
        
        // Video owner patterns
        /"videoOwnerRenderer":{"thumbnail".*?"title":{"runs":\[{"text":"([^"]+)"}/,
        /"channelRenderer":{"channelId".*?"title":{"simpleText":"([^"]+)"}/,
        
        // Navigation endpoint patterns
        /"text":"([^"]+)","navigationEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"\/channel\//,
        /"browseEndpoint":{"browseId":"UC[^"]*"},"text":"([^"]+)"/,
        
        // Metadata patterns
        /"videoDetails":.*?"author":"([^"]+)"/,
        /"microformat":.*?"ownerChannelName":"([^"]+)"/,
        
        // Fallback patterns
        /"title":{"runs":\[{"text":"([^"]+)"}.*?"navigationEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"\/channel\//,
        /"ownerText":{"runs":\[{"text":"([^"]+)","navigationEndpoint"/,
        /"videoOwner":{"videoOwnerRenderer":{"thumbnail".*?"title":{"runs":\[{"text":"([^"]+)"}/,
        /"playlistVideoListRenderer":.*?"ownerText":{"runs":\[{"text":"([^"]+)"}/
      ]
      
      console.log('Attempting to extract channel name with regex patterns...')
      
      for (let i = 0; i < authorPatterns.length; i++) {
        const pattern = authorPatterns[i]
        const match = html.match(pattern)
        console.log(`Pattern ${i + 1}: ${pattern.toString().substring(0, 50)}... - ${match ? 'MATCH: ' + match[1] : 'No match'}`)
        
        if (match && match[1] && match[1] !== 'Unknown' && match[1].length > 0 && match[1] !== 'null') {
          playlistAuthor = match[1]
          console.log(`✓ Found channel name: ${playlistAuthor}`)
          break
        }
      }
    }
    
    // If still not found, try to find any channel-related text
    if (playlistAuthor === 'Unknown Channel') {
      // Look for channel links in the HTML
      const channelPatterns = [
        /"text":"([^"]+)","navigationEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"\/channel\/[^"]+"}}/g,
        /"title":"([^"]+)","navigationEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"\/channel\/[^"]+"}}/g,
        /"runs":\[{"text":"([^"]+)","navigationEndpoint":{"commandMetadata":{"webCommandMetadata":{"url":"\/channel\/[^"]+"}}/g
      ]
      
      for (const pattern of channelPatterns) {
        const matches = html.match(pattern)
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const channelMatch = match.match(/"text":"([^"]+)"/) || match.match(/"title":"([^"]+)"/)
            if (channelMatch && channelMatch[1] && channelMatch[1].length > 0 && channelMatch[1] !== 'null') {
              playlistAuthor = channelMatch[1]
              console.log(`✓ Found channel name via pattern matching: ${playlistAuthor}`)
              break
            }
          }
          if (playlistAuthor !== 'Unknown Channel') break
        }
      }
    }
    
    // Last resort: look for any text followed by channel URL
    if (playlistAuthor === 'Unknown Channel') {
      const lastResortPattern = /href="\/channel\/[^"]+">([^<]+)<\/a>/g
      const lastResortMatches = html.match(lastResortPattern)
      if (lastResortMatches && lastResortMatches.length > 0) {
        const match = lastResortMatches[0].match(/>([^<]+)<\/a>/)
        if (match && match[1] && match[1].length > 0) {
          playlistAuthor = match[1]
          console.log(`✓ Found channel name via last resort: ${playlistAuthor}`)
        }
      }
    }
    
    // Final fallback: try to extract from the first video's channel information
    if (playlistAuthor === 'Unknown Channel') {
      // Look for video owner patterns in the video list
      const videoOwnerPatterns = [
        /"videoRenderer":{"videoId":"[^"]+","thumbnail".*?"ownerText":{"runs":\[{"text":"([^"]+)"/g,
        /"videoRenderer":{"videoId":"[^"]+","thumbnail".*?"shortBylineText":{"runs":\[{"text":"([^"]+)"/g,
        /"videoRenderer":{"videoId":"[^"]+","thumbnail".*?"longBylineText":{"runs":\[{"text":"([^"]+)"/g
      ]
      
      for (const pattern of videoOwnerPatterns) {
        const matches = html.match(pattern)
        if (matches && matches.length > 0) {
          for (const match of matches) {
            const ownerMatch = match.match(/"text":"([^"]+)"/)
            if (ownerMatch && ownerMatch[1] && ownerMatch[1].length > 0 && ownerMatch[1] !== 'null') {
              playlistAuthor = ownerMatch[1]
              console.log(`✓ Found channel name from video owner: ${playlistAuthor}`)
              break
            }
          }
          if (playlistAuthor !== 'Unknown Channel') break
        }
      }
    }
    
    console.log(`Final channel name: ${playlistAuthor}`)
    
    // Extract video data using enhanced parsing
    const videos: VideoInfo[] = []
    
    // First, try to extract from ytInitialData if available
    if (ytData) {
      const videosFromData = extractVideosFromYtData(ytData)
      if (videosFromData.length > 0) {
        videos.push(...videosFromData)
        console.log(`Extracted ${videosFromData.length} videos from structured data`)
        
        // Log duration info for debugging
        const videosWithDuration = videosFromData.filter(v => v.duration)
        const videosWithoutDuration = videosFromData.filter(v => !v.duration)
        console.log(`Videos with duration: ${videosWithDuration.length}, without duration: ${videosWithoutDuration.length}`)
        
        if (videosWithDuration.length > 0) {
          console.log(`Sample durations: ${videosWithDuration.slice(0, 3).map(v => v.duration).join(', ')}`)
        }
      }
    }
    
    // If we didn't get videos from structured data, use regex patterns
    if (videos.length === 0) {
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
          
          // Look for duration patterns - try multiple patterns
          const durationPatterns = [
            new RegExp(`"videoId":"${videoId}"[^}]*"lengthText":{"simpleText":"([^"]+)"}`, 'g'),
            new RegExp(`"videoId":"${videoId}"[^}]*"lengthText":{"accessibility":{"accessibilityData":{"label":"[^"]*"}},"simpleText":"([^"]+)"}`, 'g'),
            new RegExp(`"videoId":"${videoId}"[^}]*"thumbnailOverlays":\\[{"thumbnailOverlayTimeStatusRenderer":{"text":{"simpleText":"([^"]+)"}`, 'g'),
            new RegExp(`"videoId":"${videoId}"[^}]*"videoRenderer":{[^}]*"lengthText":{"simpleText":"([^"]+)"}`, 'g')
          ]
          
          let duration = null
          for (const pattern of durationPatterns) {
            const durationMatch = pattern.exec(html)
            if (durationMatch && durationMatch[1]) {
              duration = durationMatch[1]
              break
            }
          }
          
          const title = titleMatch ? titleMatch[1] : `Video ${videoId}`
          
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
    }
    
    if (videos.length === 0) {
      // Fallback: try a different approach with better patterns
      console.log('Using fallback video extraction...')
      
      // Try to find video renderer patterns
      const videoRendererRegex = /"videoRenderer":\{[^}]*"videoId":"([A-Za-z0-9_-]{11})"[^}]*"title":\{[^}]*"text":"([^"]+)"[^}]*(?:"lengthText":\{[^}]*"simpleText":"([^"]+)"|"thumbnailOverlays":\[[^]]*"thumbnailOverlayTimeStatusRenderer":\{[^}]*"text":\{[^}]*"simpleText":"([^"]+)")/g
      
      let fallbackMatch
      while ((fallbackMatch = videoRendererRegex.exec(html)) !== null) {
        const videoId = fallbackMatch[1]
        const title = fallbackMatch[2] || `Video ${videoId}`
        const duration = fallbackMatch[3] || fallbackMatch[4] || null
        
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
      
      // If still no videos, try the original fallback approach
      if (videos.length === 0) {
        const fallbackVideoRegex = /"videoId":"([A-Za-z0-9_-]{11})"/g
        const fallbackMatches = html.match(fallbackVideoRegex)
        
        if (fallbackMatches) {
          const uniqueIds = [...new Set(fallbackMatches.map(m => {
            const match = m.match(/"videoId":"([A-Za-z0-9_-]{11})"/)
            return match ? match[1] : null
          }).filter(Boolean))].slice(0, 20)
          
          uniqueIds.forEach(videoId => {
            if (videoId) {
              // Try to find duration for this specific video
              const durationRegex = new RegExp(`"videoId":"${videoId}"[^}]*(?:"lengthText":\\{[^}]*"simpleText":"([^"]+)"|"thumbnailOverlays":\\[[^]]*"thumbnailOverlayTimeStatusRenderer":\\{[^}]*"text":\\{[^}]*"simpleText":"([^"]+)")`)
              const durationMatch = html.match(durationRegex)
              const duration = durationMatch ? (durationMatch[1] || durationMatch[2]) : null
              
              videos.push({
                id: videoId,
                title: `Video ${videoId}`,
                duration: duration,
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`
              })
            }
          })
        }
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

async function fetchYouTubeVideo(videoId: string): Promise<PlaylistResponse | null> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    // Enhanced bot protection bypass for single video
    const agent = ytdl.createAgent(undefined, YTDL_AGENT_OPTIONS)
    
    // Try to get video info using ytdl-core first for better metadata
    let ytdlVideoInfo = null
    try {
      console.log('Fetching video info using ytdl-core with bot protection bypass...')
      ytdlVideoInfo = await ytdl.getInfo(videoUrl, { 
        agent,
        requestOptions: {
          headers: BYPASS_HEADERS,
        }
      })
      console.log('Successfully fetched video info via ytdl-core')
    } catch (ytdlError) {
      console.warn('ytdl-core failed, falling back to HTML parsing:', ytdlError)
    }
    
    // If ytdl-core worked, use its data
    if (ytdlVideoInfo) {
      const details = ytdlVideoInfo.videoDetails
      
      // Format duration properly
      const formatDuration = (seconds: string) => {
        const totalSeconds = parseInt(seconds)
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const secs = totalSeconds % 60
        
        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        } else {
          return `${minutes}:${secs.toString().padStart(2, '0')}`
        }
      }
      
      const video: VideoInfo = {
        id: videoId,
        title: details.title,
        duration: details.lengthSeconds ? formatDuration(details.lengthSeconds) : null,
        thumbnail: details.thumbnails && details.thumbnails.length > 0 
          ? details.thumbnails[details.thumbnails.length - 1].url 
          : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: videoUrl
      }
      
      return {
        videos: [video],
        playlistTitle: details.title,
        playlistAuthor: details.author?.name || 'Unknown Channel'
      }
    }
    
    // Fallback to HTML parsing if ytdl-core fails
    const response = await fetch(videoUrl, {
      headers: BYPASS_HEADERS,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract video title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    let videoTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '') : `Video ${videoId}`
    
    // Extract channel name
    let channelName = 'Unknown Channel'
    
    // Try to extract from ytInitialData first
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});/)
    let ytData = null
    
    if (ytInitialDataMatch) {
      try {
        ytData = JSON.parse(ytInitialDataMatch[1])
        console.log('Successfully parsed ytInitialData for video')
        
        // Extract channel name from video data
        const channelFromData = extractChannelFromYtData(ytData)
        if (channelFromData) {
          channelName = channelFromData
          console.log(`✓ Found channel name from video ytInitialData: ${channelName}`)
        }
        
        // Extract video title from structured data
        if (ytData.videoDetails && ytData.videoDetails.title) {
          videoTitle = ytData.videoDetails.title
          console.log(`✓ Found video title from ytInitialData: ${videoTitle}`)
        }
      } catch (e) {
        console.log('Failed to parse ytInitialData for video:', e)
      }
    }
    
    // Extract duration from video data
    let duration: string | null = null
    
    if (ytData) {
      // Try to get duration from videoDetails
      if (ytData.videoDetails && ytData.videoDetails.lengthSeconds) {
        const seconds = parseInt(ytData.videoDetails.lengthSeconds)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
        console.log(`✓ Found duration from videoDetails: ${duration}`)
      }
    }
    
    // Fallback regex patterns for channel name if not found
    if (channelName === 'Unknown Channel') {
      const authorPatterns = [
        /"author":"([^"]+)"/,
        /"channelName":"([^"]+)"/,
        /"ownerChannelName":"([^"]+)"/,
        /"uploaderName":"([^"]+)"/
      ]
      
      for (const pattern of authorPatterns) {
        const match = html.match(pattern)
        if (match && match[1] && match[1].length > 0) {
          channelName = match[1]
          console.log(`✓ Found channel name via regex: ${channelName}`)
          break
        }
      }
    }
    
    // Fallback regex patterns for duration if not found
    if (!duration) {
      const durationPatterns = [
        /"lengthSeconds":"(\d+)"/,
        /"duration":"PT(\d+)M(\d+)S"/,
        /"approxDurationMs":"(\d+)"/
      ]
      
      for (const pattern of durationPatterns) {
        const match = html.match(pattern)
        if (match) {
          if (pattern.source.includes('lengthSeconds')) {
            const seconds = parseInt(match[1])
            const minutes = Math.floor(seconds / 60)
            const remainingSeconds = seconds % 60
            duration = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
          } else if (pattern.source.includes('PT')) {
            const minutes = parseInt(match[1])
            const seconds = parseInt(match[2])
            duration = `${minutes}:${seconds.toString().padStart(2, '0')}`
          } else if (pattern.source.includes('approxDurationMs')) {
            const milliseconds = parseInt(match[1])
            const totalSeconds = Math.floor(milliseconds / 1000)
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60
            duration = `${minutes}:${seconds.toString().padStart(2, '0')}`
          }
          console.log(`✓ Found duration via regex: ${duration}`)
          break
        }
      }
    }
    
    // Create video info object
    const singleVideoInfo: VideoInfo = {
      id: videoId,
      title: videoTitle,
      duration: duration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`
    }
    
    // Return as a single-video playlist
    return {
      videos: [singleVideoInfo],
      playlistTitle: videoTitle,
      playlistAuthor: channelName
    }
    
  } catch (error) {
    console.error('Error fetching YouTube video:', error)
    return null
  }
}
