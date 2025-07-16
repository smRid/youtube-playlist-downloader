import { NextRequest, NextResponse } from "next/server"
import ytdl from '@distube/ytdl-core'

// Advanced bot protection bypass configuration
const YTDL_AGENT_OPTIONS = {
  localAddress: undefined,
  family: 4,
  agent: false,
  highWaterMark: 1024 * 1024 * 32,
}

// YouTube bypass cookies and headers
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

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    console.log('Attempting to download:', videoUrl, 'format:', format, 'quality: highest')

    // Advanced bot protection bypass - validate URL with enhanced options
    try {
      const isValid = ytdl.validateURL(videoUrl)
      if (!isValid) {
        console.error('Invalid YouTube URL:', videoUrl)
        return new NextResponse('Invalid YouTube URL', { status: 400 })
      }
    } catch (validateError) {
      console.error('URL validation error:', validateError)
      return new NextResponse('Error validating YouTube URL', { status: 400 })
    }

    try {
      // Enhanced info retrieval with bot protection bypass
      console.log('Getting video info with advanced bot protection bypass...')
      
      // Create agent with enhanced options for bot protection bypass
      const agent = ytdl.createAgent(undefined, {
        ...YTDL_AGENT_OPTIONS,
      })
      
      const info = await ytdl.getInfo(videoUrl, { 
        agent,
        requestOptions: {
          headers: BYPASS_HEADERS,
        }
      })
      
      console.log('Video info retrieved successfully:', info.videoDetails.title)
      
      // Enhanced format filtering with quality prioritization
      const availableFormats = ytdl.filterFormats(info.formats, 'audioandvideo')
      console.log('Available video formats:', availableFormats.map(f => `${f.qualityLabel} - ${f.container} - ${f.contentLength ? Math.round(parseInt(f.contentLength) / 1024 / 1024) : 'unknown'} MB`))
      
      const availableAudioFormats = ytdl.filterFormats(info.formats, 'audioonly')
      console.log('Available audio formats:', availableAudioFormats.map(f => `${f.audioBitrate}kbps - ${f.container}`))
      
      const title = info.videoDetails.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50) // Limit filename length
      
      if (format === 'mp3') {
        // Enhanced audio download with better quality selection
        console.log('Starting high-quality audio stream with bot protection bypass...')
        
        // Get the best audio format with high bitrate and bypass protection
        const audioOptions = {
          quality: 'highestaudio' as const,
          filter: 'audioonly' as const,
          highWaterMark: 1024 * 1024 * 32, // 32MB buffer for smoother streaming
          requestOptions: {
            headers: BYPASS_HEADERS,
          },
          agent,
        }
        
        const stream = ytdl(videoUrl, audioOptions)
        
        // Add timeout handling for stream
        const streamTimeout = setTimeout(() => {
          console.log('Stream timeout - destroying stream')
          stream.destroy()
        }, 60000) // 60 second timeout
        
        // Convert Node.js stream to Web API ReadableStream
        const readable = new ReadableStream({
          start(controller) {
            stream.on('data', (chunk: Buffer) => {
              controller.enqueue(new Uint8Array(chunk))
            })
            
            stream.on('end', () => {
              console.log('High-quality audio stream ended')
              clearTimeout(streamTimeout)
              controller.close()
            })
            
            stream.on('error', (error: Error) => {
              console.error('Audio stream error:', error)
              clearTimeout(streamTimeout)
              controller.error(error)
            })
          },
          cancel() {
            console.log('Audio stream cancelled')
            clearTimeout(streamTimeout)
            stream.destroy()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${title}_HQ.mp3"`,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } else {
        // Enhanced video download with highest quality and bot protection
        console.log('Starting high-quality video stream with bot protection bypass...')
        
        // Always use highest quality with enhanced buffering and bypass protection
        const qualityOptions = {
          quality: 'highest' as const,
          filter: 'audioandvideo' as const,
          highWaterMark: 1024 * 1024 * 32, // 32MB buffer
          requestOptions: {
            headers: BYPASS_HEADERS,
          },
          agent,
        }
        
        const stream = ytdl(videoUrl, qualityOptions)
        
        // Add timeout handling for stream
        const streamTimeout = setTimeout(() => {
          console.log('Stream timeout - destroying stream')
          stream.destroy()
        }, 60000) // 60 second timeout
        
        // Convert Node.js stream to Web API ReadableStream
        const readable = new ReadableStream({
          start(controller) {
            stream.on('data', (chunk: Buffer) => {
              controller.enqueue(new Uint8Array(chunk))
            })
            
            stream.on('end', () => {
              console.log('High-quality video stream ended')
              clearTimeout(streamTimeout)
              controller.close()
            })
            
            stream.on('error', (error: Error) => {
              console.error('Video stream error:', error)
              clearTimeout(streamTimeout)
              controller.error(error)
            })
          },
          cancel() {
            console.log('Video stream cancelled')
            clearTimeout(streamTimeout)
            stream.destroy()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${title}_HQ.mp4"`,
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    } catch (ytdlError) {
      console.error('YTDL Error:', ytdlError)
      
      // Provide more specific error messages
      if (ytdlError instanceof Error) {
        const errorMessage = ytdlError.message.toLowerCase()
        
        if (errorMessage.includes('video unavailable')) {
          return new NextResponse('Video is unavailable or private', { status: 404 })
        }
        if (errorMessage.includes('age')) {
          return new NextResponse('Video is age-restricted', { status: 403 })
        }
        if (errorMessage.includes('region')) {
          return new NextResponse('Video is not available in your region', { status: 403 })
        }
        if (errorMessage.includes('extract')) {
          return new NextResponse('YouTube extraction failed. Please try again later.', { status: 500 })
        }
        if (errorMessage.includes('rate')) {
          return new NextResponse('Rate limited by YouTube. Please try again later.', { status: 429 })
        }
      }
      
      return new NextResponse('Failed to download video. Please try again later.', { status: 500 })
    }
  } catch (error) {
    console.error('General download error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
