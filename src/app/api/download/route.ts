import { NextRequest, NextResponse } from "next/server"
import ytdl from '@distube/ytdl-core'

// 🔥 ULTRA AGGRESSIVE 2025 VERCEL BYPASS HEADERS
const ULTRA_BYPASS_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7,es;q=0.6',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Cache-Control': 'max-age=0',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Ch-Ua-Arch': '"x86"',
  'Sec-Ch-Ua-Bitness': '"64"',
  'Sec-Ch-Ua-Full-Version': '"131.0.6778.108"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Connection': 'keep-alive',
  'DNT': '1',
  'Sec-GPC': '1',
}

// Generate random cookies and headers for each request with ULTRA BYPASS
function getRandomizedHeaders() {
  const randomIP = `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`
  const timestamp = Date.now()
  const sessionId = Math.random().toString(36).substring(2, 15)
  const visitorId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  return {
    ...ULTRA_BYPASS_HEADERS,
    'X-Forwarded-For': randomIP,
    'X-Real-IP': randomIP,
    'X-Client-IP': randomIP,
    'CF-Connecting-IP': randomIP,
    'True-Client-IP': randomIP,
    'X-Forwarded-Proto': 'https',
    'X-Forwarded-Port': '443',
    'Cookie': `CONSENT=YES+cb.20240719-17-p0.en+FX+700; PREF=f1=50000000&f4=4000000&f5=30000&f6=8&hl=en&gl=US; YSC=${sessionId}; VISITOR_INFO1_LIVE=${visitorId}; GPS=1; __Secure-3PAPISID=${timestamp}; LOGIN_INFO=AFmmF2swRAIgYtKAJSiRK1b; SID=${sessionId}_${timestamp}`,
    'Origin': 'https://www.youtube.com',
    'Referer': 'https://www.youtube.com/',
    'Authority': 'www.youtube.com',
    'X-YouTube-Client-Name': '1',
    'X-YouTube-Client-Version': '2.20240719.00.00',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Goog-AuthUser': '0',
    'X-Goog-Visitor-Id': visitorId,
    'X-Origin': 'https://www.youtube.com',
  }
}

// Main download function with ULTRA AGGRESSIVE fallback configurations
async function downloadVideoWithFallbacks(videoUrl: string, format: 'mp4' | 'mp3') {
  // Create custom agents with different configurations
  const chromeAgent = ytdl.createAgent(undefined, {})
  const firefoxAgent = ytdl.createAgent(undefined, {})

  const configurations = [
    {
      name: '🔥 ULTRA Chrome Bypass',
      agent: chromeAgent,
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
        requestOptions: {
          headers: getRandomizedHeaders(),
          timeout: 45000,
          maxRetries: 3,
          retryDelay: 2000,
        }
      }
    },
    {
      name: '🚀 Mobile Chrome Spoof',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const, 
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
            'Cookie': `CONSENT=YES+cb.20240719-17-p0.en+FX+700; PREF=hl=en&gl=US`,
            'X-Forwarded-For': `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`,
          },
          timeout: 35000,
        }
      }
    },
    {
      name: '⚡ Firefox ESR Bypass',
      agent: firefoxAgent,
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
            'Cookie': 'CONSENT=YES+cb; PREF=hl=en',
          },
          timeout: 30000,
        }
      }
    },
    {
      name: '🍎 Safari Desktop Bypass',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const, 
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
            'Cookie': 'CONSENT=YES+cb.20240719-17-p0.en+FX+700',
          },
          timeout: 25000,
        }
      }
    },
    {
      name: '🤖 Edge Bypass',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Ch-Ua': '"Microsoft Edge";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com/',
          },
          timeout: 20000,
        }
      }
    }
  ]

  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i]
    try {
      console.log(`🔄 ${config.name} (${i + 1}/${configurations.length})...`)
      
      // Randomized delay between attempts (1-4 seconds)
      const delay = Math.random() * 3000 + 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      console.log(`📡 Getting video info with ${config.name}...`)
      const info = await ytdl.getInfo(videoUrl, {
        agent: config.agent,
        requestOptions: config.options.requestOptions
      })
      
      console.log(`✅ ${config.name} SUCCESS! Title:`, info.videoDetails.title)
      console.log(`📊 Available formats:`, info.formats.length)
      
      // Create stream with the same config
      const stream = ytdl(videoUrl, {
        ...config.options,
        agent: config.agent,
      })
      
      return { success: true, stream, info }
      
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error'
      console.error(`❌ ${config.name} FAILED:`, errorMessage)
      
      // If it's the last config, don't wait
      if (i === configurations.length - 1) {
        console.error('💥 All configurations exhausted!')
        break
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
      continue
    }
  }
  
  return { success: false, error: 'All ultra bypass methods failed - YouTube 2025 protection too strong' }
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

    // All methods failed - Ultra aggressive response
    console.error('💥 ALL ULTRA BYPASS METHODS FAILED!')
    return NextResponse.json({
      success: false,
      error: 'ULTRA BYPASS FAILED: YouTube 2025 protection defeated all methods.',
      suggestion: 'This video has maximum protection. Try: 1) Different video 2) Wait 10+ minutes 3) Try during off-peak hours',
      methods: ['🔥 ULTRA Chrome', '🚀 Mobile Chrome', '⚡ Firefox ESR', '🍎 Safari Desktop', '🤖 Edge Bypass'],
      protection_level: 'MAXIMUM',
      timestamp: new Date().toISOString(),
      debug_info: 'All 5 ultra-aggressive bypass methods exhausted'
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