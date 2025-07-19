import { NextRequest, NextResponse } from "next/server"
import ytdl from '@distube/ytdl-core'

// Enhanced 2025 YouTube Bypass Headers
const BYPASS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Connection': 'keep-alive',
  'DNT': '1',
}

// Generate random cookies and headers for each request
function getRandomizedHeaders() {
  const randomIP = `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`
  const timestamp = Date.now()
  
  return {
    ...BYPASS_HEADERS,
    'X-Forwarded-For': randomIP,
    'X-Real-IP': randomIP,
    'X-Client-IP': randomIP,
    'Cookie': `CONSENT=YES+cb.20220419-17-p0.en+FX+700; PREF=f1=50000000&f4=4000000&f5=30000&f6=8&hl=en; YSC=${timestamp}; VISITOR_INFO1_LIVE=${timestamp}`,
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
  }
}

// Main download function with multiple fallback configurations
async function downloadVideoWithFallbacks(videoUrl: string, format: 'mp4' | 'mp3') {
  const configurations = [
    {
      name: 'Chrome Desktop Latest',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
        requestOptions: {
          headers: getRandomizedHeaders(),
          timeout: 30000,
        }
      }
    },
    {
      name: 'Firefox Fallback',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const, 
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
          },
          timeout: 25000,
        }
      }
    },
    {
      name: 'Mobile Safari Bypass',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const, 
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
          },
          timeout: 20000,
        }
      }
    }
  ]

  for (const config of configurations) {
    try {
      console.log(`🔄 Attempting ${config.name}...`)
      
      // Random delay to avoid detection
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
      
      const info = await ytdl.getInfo(videoUrl, {
        agent: config.agent,
        requestOptions: config.options.requestOptions
      })
      
      console.log(`✅ ${config.name} got video info:`, info.videoDetails.title)
      
      const stream = ytdl(videoUrl, {
        ...config.options,
        agent: config.agent,
      })
      
      return { success: true, stream, info }
      
    } catch (error) {
      console.error(`❌ ${config.name} failed:`, error)
      continue
    }
  }
  
  return { success: false, error: 'All bypass methods failed' }
}

export async function GET(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    const { searchParams } = new URL(req.url)
    const videoId = searchParams.get('videoId')
    const format = searchParams.get('format') || 'mp4'
    
    if (!videoId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing videoId parameter' 
      }, { status: 400, headers: corsHeaders })
    }

    if (!['mp4', 'mp3'].includes(format)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid format. Use mp4 or mp3' 
      }, { status: 400, headers: corsHeaders })
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    console.log('🚀 Starting download:', videoUrl, format)

    const result = await downloadVideoWithFallbacks(videoUrl, format as 'mp4' | 'mp3')
    
    if (result.success && result.stream && result.info) {
      console.log('🎉 Download successful! Starting stream...')
      
      const title = result.info.videoDetails.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50)
      
      // Create readable stream for Vercel
      let streamClosed = false
      const readable = new ReadableStream({
        start(controller) {
          result.stream!.on('data', (chunk: Buffer) => {
            if (!streamClosed) {
              controller.enqueue(new Uint8Array(chunk))
            }
          })
          
          result.stream!.on('end', () => {
            if (!streamClosed) {
              controller.close()
              streamClosed = true
            }
          })
          
          result.stream!.on('error', (error: Error) => {
            console.error('Stream error:', error)
            if (!streamClosed) {
              controller.error(error)
              streamClosed = true
            }
          })
        },
        cancel() {
          console.log('Stream cancelled by client')
          streamClosed = true
          const streamInstance = result.stream as unknown as { destroy?: () => void }
          if (streamInstance && typeof streamInstance.destroy === 'function') {
            streamInstance.destroy()
          }
        }
      })

      return new NextResponse(readable, {
        status: 200,
        headers: {
          'Content-Type': format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${title}_DownlyBot2025.${format}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          ...corsHeaders
        }
      })
    }

    // All methods failed
    console.error('💥 All download methods failed')
    return NextResponse.json({
      success: false,
      error: 'Failed to download video. YouTube may have enhanced protection on this video.',
      suggestion: 'Try a different video or wait a few minutes before retrying.',
      methods: ['Chrome Desktop', 'Firefox Fallback', 'Mobile Safari'],
      timestamp: new Date().toISOString()
    }, { 
      status: 503, 
      headers: corsHeaders 
    })

  } catch (error: unknown) {
    console.error('💥 Critical error:', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'
    
    // Enhanced error handling
    if (errorMessage.includes('Video unavailable')) {
      return NextResponse.json({
        success: false,
        error: 'Video is unavailable, private, or has been removed.',
      }, { status: 404, headers: corsHeaders })
    }
    
    if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      return NextResponse.json({
        success: false,
        error: 'Rate limited by YouTube. Please wait 5-10 minutes.',
        retryAfter: 600
      }, { status: 429, headers: corsHeaders })
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return NextResponse.json({
        success: false,
        error: 'Access forbidden. Video may be region-locked or age-restricted.',
      }, { status: 403, headers: corsHeaders })
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
      return NextResponse.json({
        success: false,
        error: 'Request timeout. Video may be too large or server is busy.',
      }, { status: 408, headers: corsHeaders })
    }

    return NextResponse.json({
      success: false,
      error: 'Server error occurred while processing the video.',
      debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500, headers: corsHeaders })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  })
}