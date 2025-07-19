import { NextRequest, NextResponse } from "next/server"
import ytdl from '@distube/ytdl-core'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 🔥 2025 ULTIMATE BYPASS HEADERS - MOST AGGRESSIVE
const ULTRA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
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
  'Cookie': 'CONSENT=YES+cb.20220419-17-p0.en+FX+700; PREF=f1=50000000&f4=4000000&f5=30000&f6=8&hl=en;',
  'X-Forwarded-For': `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255) + 1}`,
  'Origin': 'https://www.youtube.com',
  'Referer': 'https://www.youtube.com/',
}

// 🚀 METHOD 1: YT-DLP CLI (Most Reliable 2025)
async function downloadWithYtDlp(videoUrl: string, format: 'mp4' | 'mp3'): Promise<{ success: boolean; directUrl?: string; title?: string; error?: string }> {
  try {
    console.log('🔥 YT-DLP CLI ULTRA BYPASS (2025)...')
    
    // Get video info
    const infoCommand = `yt-dlp --no-warnings --dump-single-json --add-header "User-Agent:${ULTRA_HEADERS['User-Agent']}" --add-header "Accept:*/*" --add-header "Origin:https://www.youtube.com" --add-header "Referer:https://www.youtube.com/" --geo-bypass --geo-bypass-country US "${videoUrl}"`
    
    const { stdout: info } = await execAsync(infoCommand)
    const videoInfo = JSON.parse(info.trim())
    console.log('✅ Got video info:', videoInfo.title)
    
    // Get direct URL
    const urlCommand = format === 'mp3'
      ? `yt-dlp --no-warnings -f "bestaudio/best" --get-url --add-header "User-Agent:${ULTRA_HEADERS['User-Agent']}" --add-header "Accept:*/*" --add-header "Origin:https://www.youtube.com" --add-header "Referer:https://www.youtube.com/" --geo-bypass "${videoUrl}"`
      : `yt-dlp --no-warnings -f "best[ext=mp4]/best" --get-url --add-header "User-Agent:${ULTRA_HEADERS['User-Agent']}" --add-header "Accept:*/*" --add-header "Origin:https://www.youtube.com" --add-header "Referer:https://www.youtube.com/" --geo-bypass "${videoUrl}"`
    
    const { stdout: url } = await execAsync(urlCommand)
    const directUrl = url.trim()
    
    if (directUrl && directUrl.startsWith('http')) {
      console.log('🎉 YT-DLP SUCCESS!')
      return { success: true, directUrl, title: videoInfo.title }
    }
    throw new Error('No direct URL')
  } catch (error) {
    console.error('❌ YT-DLP failed:', error)
    return { success: false, error: String(error) }
  }
}

// 🔧 METHOD 2: Advanced YTDL-CORE
async function downloadWithYtdl(videoUrl: string, format: 'mp4' | 'mp3'): Promise<{ success: boolean; stream?: NodeJS.ReadableStream; info?: ytdl.videoInfo; error?: string }> {
  const configurations = [
    {
      name: 'Chrome Ultra',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
      }
    },
    {
      name: 'Safari Mobile',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
      }
    },
    {
      name: 'Firefox',
      agent: ytdl.createAgent(undefined, {}),
      options: {
        quality: format === 'mp3' ? 'highestaudio' as const : 'highest' as const,
        filter: format === 'mp3' ? 'audioonly' as const : 'audioandvideo' as const,
      }
    }
  ]

  for (const config of configurations) {
    try {
      console.log(`🔄 Trying ${config.name}...`)
      
      // Anti-detection delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
      
      const info = await ytdl.getInfo(videoUrl, { agent: config.agent })
      console.log(`✅ ${config.name} got info:`, info.videoDetails.title)
      
      const stream = ytdl(videoUrl, {
        agent: config.agent,
        ...config.options
      })
      
      return { success: true, stream, info }
    } catch (error) {
      console.error(`❌ ${config.name} failed:`, error)
      continue
    }
  }
  
  return { success: false, error: 'All YTDL configs failed' }
}

// 🎯 MAIN HANDLER
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
      return new NextResponse('Missing videoId', { status: 400, headers: corsHeaders })
    }

    if (!['mp4', 'mp3'].includes(format)) {
      return new NextResponse('Invalid format', { status: 400, headers: corsHeaders })
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    console.log('🚀 ULTRA BYPASS INITIATED:', videoUrl, format)

    // METHOD 1: YT-DLP CLI
    const ytdlpResult = await downloadWithYtDlp(videoUrl, format as 'mp4' | 'mp3')
    
    if (ytdlpResult.success && ytdlpResult.directUrl) {
      console.log('🎉 YT-DLP SUCCESS! Proxying stream...')
      
      const response = await fetch(ytdlpResult.directUrl, {
        headers: ULTRA_HEADERS
      })
      
      if (response.ok) {
        const title = (ytdlpResult.title || 'video')
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50)
        
        return new NextResponse(response.body, {
          status: 200,
          headers: {
            'Content-Type': format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${title}_ULTRA2025.${format}"`,
            'Cache-Control': 'no-cache',
            ...corsHeaders
          }
        })
      }
    }

    // METHOD 2: YTDL-CORE
    const ytdlResult = await downloadWithYtdl(videoUrl, format as 'mp4' | 'mp3')
    
    if (ytdlResult.success && ytdlResult.stream && ytdlResult.info) {
      console.log('🎉 YTDL SUCCESS! Streaming...')
      
      const title = ytdlResult.info.videoDetails.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50)
      
      let streamClosed = false
      const readable = new ReadableStream({
        start(controller) {
          ytdlResult.stream!.on('data', (chunk: Buffer) => {
            if (!streamClosed) {
              controller.enqueue(new Uint8Array(chunk))
            }
          })
          
          ytdlResult.stream!.on('end', () => {
            if (!streamClosed) {
              controller.close()
              streamClosed = true
            }
          })
          
          ytdlResult.stream!.on('error', (error: Error) => {
            if (!streamClosed) {
              controller.error(error)
              streamClosed = true
            }
          })
        },
        cancel() {
          streamClosed = true
          const stream = ytdlResult.stream as unknown
          if (stream && typeof (stream as { destroy?: () => void }).destroy === 'function') {
            (stream as { destroy: () => void }).destroy()
          }
        }
      })

      return new NextResponse(readable, {
        status: 200,
        headers: {
          'Content-Type': format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${title}_ULTRA2025.${format}"`,
          'Cache-Control': 'no-cache',
          ...corsHeaders
        }
      })
    }

    // ALL METHODS FAILED
    console.error('💥 ALL METHODS FAILED')
    return NextResponse.json({
      success: false,
      error: 'YouTube blocked all advanced bypass methods. Video may be heavily protected.',
      methods: ['YT-DLP CLI', 'YTDL-CORE Multi-Config'],
      suggestion: 'YouTube 2025 protection is very strong. Try again in a few minutes.'
    }, { 
      status: 503, 
      headers: corsHeaders 
    })

  } catch (error: unknown) {
    console.error('💥 CRITICAL ERROR:', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'
    
    if (errorMessage.includes('429')) {
      return new NextResponse('Rate limited by YouTube. Wait 5-10 minutes.', {
        status: 429, headers: corsHeaders
      })
    }
    
    if (errorMessage.includes('403')) {
      return new NextResponse('Access forbidden. Video may be private or restricted.', {
        status: 403, headers: corsHeaders
      })
    }
    
    if (errorMessage.includes('404')) {
      return new NextResponse('Video not found or removed.', {
        status: 404, headers: corsHeaders
      })
    }

    return new NextResponse('Failed with all ultra-aggressive methods. YouTube protection is very strong.', {
      status: 500, headers: corsHeaders
    })
  }
}
