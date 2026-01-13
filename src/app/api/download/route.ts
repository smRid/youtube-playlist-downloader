import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { existsSync, unlinkSync, createReadStream, statSync, readdirSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

// Helper to find yt-dlp binary
function findYtDlpSync(): string | null {
  const homeDir = process.env.USERPROFILE || process.env.HOME || ''

  const possiblePaths = [
    join(homeDir, "AppData", "Roaming", "Python", "Python313", "Scripts", "yt-dlp.exe"),
    join(homeDir, "AppData", "Roaming", "Python", "Python312", "Scripts", "yt-dlp.exe"),
    join(homeDir, "AppData", "Roaming", "Python", "Python311", "Scripts", "yt-dlp.exe"),
    join(homeDir, "AppData", "Local", "Programs", "Python", "Python313", "Scripts", "yt-dlp.exe"),
    join(homeDir, "AppData", "Local", "Programs", "Python", "Python312", "Scripts", "yt-dlp.exe"),
  ]

  for (const binPath of possiblePaths) {
    if (existsSync(binPath)) {
      console.log(`✅ Found yt-dlp at: ${binPath}`)
      return binPath
    }
  }

  console.log("❌ yt-dlp not found in any known location")
  return null
}

// Download using yt-dlp with spawn (more reliable than exec)
async function downloadWithYtDlp(videoId: string, format: 'mp4' | 'mp3'): Promise<{
  success: boolean
  filePath?: string
  fileName?: string
  error?: string
}> {
  const tempDir = tmpdir()
  const timestamp = Date.now()
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  const ytDlpPath = findYtDlpSync()

  if (!ytDlpPath) {
    return { success: false, error: "yt-dlp binary not found" }
  }

  console.log(`🎬 Starting download: ${videoUrl} as ${format}`)

  return new Promise((resolve) => {
    // Build arguments based on format
    const outputTemplate = join(tempDir, `${timestamp}_%(title).50s.%(ext)s`)

    let args: string[]
    if (format === 'mp3') {
      args = [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputTemplate,
        '--no-playlist',
        '--no-check-certificates',
        videoUrl
      ]
    } else {
      args = [
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '-o', outputTemplate,
        '--no-playlist',
        '--no-check-certificates',
        videoUrl
      ]
    }

    console.log(`🔧 Running: ${ytDlpPath} ${args.join(' ')}`)

    const child = spawn(ytDlpPath, args, {
      timeout: 300000, // 5 minute timeout
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      const line = data.toString()
      stdout += line
      console.log(`📥 ${line.trim()}`)
    })

    child.stderr?.on('data', (data) => {
      const line = data.toString()
      stderr += line
      console.warn(`⚠️ ${line.trim()}`)
    })

    child.on('error', (error) => {
      console.error(`❌ Spawn error: ${error.message}`)
      resolve({ success: false, error: error.message })
    })

    child.on('close', (code) => {
      console.log(`� yt-dlp exited with code: ${code}`)
      console.log(`📝 Full stdout: ${stdout}`)

      if (code !== 0) {
        resolve({ success: false, error: `yt-dlp exited with code ${code}: ${stderr || stdout}` })
        return
      }

      // Find the downloaded file
      try {
        const ext = format === 'mp3' ? 'mp3' : 'mp4'
        const files = readdirSync(tempDir)

        // Look for files with our timestamp prefix
        const downloadedFile = files.find((f: string) =>
          f.startsWith(`${timestamp}_`) && (f.endsWith(`.${ext}`) || f.endsWith('.webm') || f.endsWith('.m4a'))
        )

        if (downloadedFile) {
          const filePath = join(tempDir, downloadedFile)
          console.log(`✅ Found downloaded file: ${filePath}`)
          resolve({
            success: true,
            filePath,
            fileName: downloadedFile.replace(`${timestamp}_`, '').replace(/\s+/g, '_')
          })
        } else {
          // Try any file that starts with timestamp
          const anyFile = files.find((f: string) => f.startsWith(`${timestamp}_`))
          if (anyFile) {
            const filePath = join(tempDir, anyFile)
            console.log(`✅ Found file (alt): ${filePath}`)
            resolve({
              success: true,
              filePath,
              fileName: anyFile.replace(`${timestamp}_`, '').replace(/\s+/g, '_')
            })
          } else {
            console.log(`❌ No file found with prefix ${timestamp}_`)
            console.log(`📁 Files in temp: ${files.filter(f => f.includes(timestamp.toString().substring(0, 6))).join(', ')}`)
            resolve({ success: false, error: "Downloaded file not found in temp directory" })
          }
        }
      } catch (err) {
        resolve({ success: false, error: `Error finding file: ${(err as Error).message}` })
      }
    })
  })
}

// Fallback: Return external service URLs
function getExternalDownloadUrls(videoId: string, format: 'mp4' | 'mp3') {
  const videoUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)

  return [
    {
      name: "Y2Mate",
      url: `https://www.y2mate.com/youtube/${videoId}`,
      description: `Download ${format.toUpperCase()} via Y2Mate`
    },
    {
      name: "SaveFrom",
      url: `https://en.savefrom.net/1-youtube-video-downloader-1/#url=${videoUrl}`,
      description: `Download via SaveFrom.net`
    },
    {
      name: "SSYouTube",
      url: `https://ssyoutube.com/watch?v=${videoId}`,
      description: `Download via SSYouTube`
    },
    {
      name: "9xBuddy",
      url: `https://9xbuddy.com/process?url=${videoUrl}`,
      description: `Download via 9xBuddy`
    }
  ]
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
    const format = (searchParams.get('format') || 'mp4') as 'mp4' | 'mp3'

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

    console.log(`🚀 Starting download: videoId=${videoId}, format=${format}`)

    // Try yt-dlp (most reliable)
    const result = await downloadWithYtDlp(videoId, format)

    if (result.success && result.filePath && existsSync(result.filePath)) {
      console.log('🎉 yt-dlp download successful! Streaming file...')

      const stats = statSync(result.filePath)
      const fileStream = createReadStream(result.filePath)

      // Clean up the file after streaming
      fileStream.on('close', () => {
        try {
          if (existsSync(result.filePath!)) {
            unlinkSync(result.filePath!)
            console.log(`🧹 Cleaned up: ${result.filePath}`)
          }
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError)
        }
      })

      // Create a ReadableStream from Node.js stream
      const readable = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk))
          })
          fileStream.on('end', () => {
            controller.close()
          })
          fileStream.on('error', (error) => {
            controller.error(error)
          })
        },
        cancel() {
          fileStream.destroy()
        }
      })

      const safeFileName = (result.fileName || `video_${videoId}.${format}`)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 100)

      return new NextResponse(readable, {
        status: 200,
        headers: {
          'Content-Type': format === 'mp4' ? 'video/mp4' : 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${safeFileName}"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          ...corsHeaders
        }
      })
    }

    // yt-dlp failed - provide external service links as fallback
    console.log('⚠️ yt-dlp failed:', result.error)
    console.log('📎 Providing external download options')

    const externalUrls = getExternalDownloadUrls(videoId, format)

    return NextResponse.json({
      success: false,
      message: 'Direct download unavailable. Please use one of the external services below:',
      downloadOptions: externalUrls,
      videoId,
      format,
      error: result.error,
      suggestion: 'YouTube has strong protections. External services may work better.',
      timestamp: new Date().toISOString()
    }, {
      status: 200,
      headers: corsHeaders
    })

  } catch (error: unknown) {
    console.error('💥 Critical error:', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'

    const videoId = new URL(req.url).searchParams.get('videoId')
    const format = (new URL(req.url).searchParams.get('format') || 'mp4') as 'mp4' | 'mp3'

    if (videoId) {
      const externalUrls = getExternalDownloadUrls(videoId, format)
      return NextResponse.json({
        success: false,
        error: 'Download failed. Try external services:',
        downloadOptions: externalUrls,
        debug: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString()
      }, { status: 200, headers: corsHeaders })
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