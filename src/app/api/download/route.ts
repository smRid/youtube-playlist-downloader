import { NextRequest, NextResponse } from "next/server"
import ytdl from 'ytdl-core'

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

    // Validate URL
    if (!ytdl.validateURL(videoUrl)) {
      return new NextResponse('Invalid YouTube URL', { status: 400 })
    }

    try {
      // Get video info
      const info = await ytdl.getInfo(videoUrl)
      const title = info.videoDetails.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
      
      if (format === 'mp3') {
        // Audio only download
        const audioStream = ytdl(videoUrl, {
          quality: 'highestaudio',
          filter: 'audioonly',
        })

        // Set headers for audio download
        const headers = new Headers({
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${title}.mp3"`,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        })

        // Create a ReadableStream from the Node.js stream
        const readableStream = new ReadableStream({
          start(controller) {
            audioStream.on('data', (chunk) => {
              controller.enqueue(chunk)
            })
            
            audioStream.on('end', () => {
              controller.close()
            })
            
            audioStream.on('error', (error) => {
              controller.error(error)
            })
          }
        })

        return new Response(readableStream, { headers })
      } else {
        // Video download
        const videoStream = ytdl(videoUrl, {
          quality: 'highest',
          filter: 'audioandvideo',
        })

        // Set headers for video download
        const headers = new Headers({
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${title}.mp4"`,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        })

        // Create a ReadableStream from the Node.js stream
        const readableStream = new ReadableStream({
          start(controller) {
            videoStream.on('data', (chunk) => {
              controller.enqueue(chunk)
            })
            
            videoStream.on('end', () => {
              controller.close()
            })
            
            videoStream.on('error', (error) => {
              controller.error(error)
            })
          }
        })

        return new Response(readableStream, { headers })
      }
    } catch (ytdlError) {
      console.error('YTDL Error:', ytdlError)
      
      // If ytdl-core fails, return helpful error message
      if (ytdlError instanceof Error) {
        if (ytdlError.message.includes('Video unavailable')) {
          return new NextResponse('Video is unavailable or private', { status: 404 })
        }
        if (ytdlError.message.includes('age')) {
          return new NextResponse('Video is age-restricted', { status: 403 })
        }
        if (ytdlError.message.includes('region')) {
          return new NextResponse('Video is not available in your region', { status: 403 })
        }
      }
      
      return new NextResponse('Failed to download video. Please try again later.', { status: 500 })
    }
  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
