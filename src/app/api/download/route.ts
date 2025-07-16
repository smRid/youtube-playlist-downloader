import { NextRequest, NextResponse } from "next/server"
import ytdl from '@distube/ytdl-core'

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

    // Validate URL first
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
      // Get video info first
      console.log('Getting video info...')
      const info = await ytdl.getInfo(videoUrl)
      console.log('Video info retrieved:', info.videoDetails.title)
      
      // Log available formats for debugging
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
        console.log('Starting high-quality audio stream...')
        
        // Get the best audio format with high bitrate
        const audioOptions = {
          quality: 'highestaudio' as const,
          filter: 'audioonly' as const,
          highWaterMark: 1024 * 1024 * 32, // 32MB buffer for smoother streaming
        }
        
        const stream = ytdl(videoUrl, audioOptions)
        
        // Convert Node.js stream to Web API ReadableStream
        const readable = new ReadableStream({
          start(controller) {
            stream.on('data', (chunk: Buffer) => {
              controller.enqueue(new Uint8Array(chunk))
            })
            
            stream.on('end', () => {
              console.log('High-quality audio stream ended')
              controller.close()
            })
            
            stream.on('error', (error: Error) => {
              console.error('Audio stream error:', error)
              controller.error(error)
            })
          },
          cancel() {
            console.log('Audio stream cancelled')
            stream.destroy()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${title}_HQ.mp3"`,
            'Cache-Control': 'no-cache',
          },
        })
      } else {
        // Enhanced video download with highest quality
        console.log('Starting high-quality video stream...')
        
        // Always use highest quality with enhanced buffering
        const qualityOptions = {
          quality: 'highest' as const,
          filter: 'audioandvideo' as const,
          highWaterMark: 1024 * 1024 * 32, // 32MB buffer
        }
        
        const stream = ytdl(videoUrl, qualityOptions)
        
        // Convert Node.js stream to Web API ReadableStream
        const readable = new ReadableStream({
          start(controller) {
            stream.on('data', (chunk: Buffer) => {
              controller.enqueue(new Uint8Array(chunk))
            })
            
            stream.on('end', () => {
              console.log('High-quality video stream ended')
              controller.close()
            })
            
            stream.on('error', (error: Error) => {
              console.error('Video stream error:', error)
              controller.error(error)
            })
          },
          cancel() {
            console.log('Video stream cancelled')
            stream.destroy()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${title}_HQ.mp4"`,
            'Cache-Control': 'no-cache',
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
