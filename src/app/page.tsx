'use client'
import { useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Music, Video, Loader2 } from 'lucide-react'

interface VideoInfo {
  id: string
  title: string
  duration?: string
  thumbnail?: string
  url: string
}

interface PlaylistInfo {
  videos: VideoInfo[]
  playlistTitle: string
  playlistAuthor: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchVideos = async () => {
    if (!url.trim()) {
      toast.error('Please enter a YouTube playlist URL')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/fetch', { url })
      setPlaylist(res.data)
      toast.success(`Found ${res.data.videos.length} videos in playlist`)
    } catch (error) {
      console.error('Fetch error:', error)
      toast.error('Failed to fetch playlist. Please check the URL and try again.')
    } finally {
      setLoading(false)
    }
  }

  const downloadVideo = async (videoId: string, format: 'mp4' | 'mp3') => {
    setDownloading(videoId)
    try {
      const response = await fetch(`/api/download?videoId=${videoId}&format=${format}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Download failed')
      }
      
      // Check if response is a file download
      const contentDisposition = response.headers.get('content-disposition')
      
      if (contentDisposition && contentDisposition.includes('attachment')) {
        // Direct file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Extract filename from content-disposition header
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        const filename = filenameMatch ? filenameMatch[1] : `video_${videoId}.${format}`
        
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success(`${format.toUpperCase()} download started!`)
      } else {
        // Handle JSON response (fallback for errors)
        const data = await response.json()
        
        if (data.downloadOptions) {
          // Multiple download options available (fallback)
          const options = data.downloadOptions
          
          // Create a floating options panel
          const optionsPanel = document.createElement('div')
          optionsPanel.className = 'fixed top-20 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 z-50 max-w-sm'
          optionsPanel.innerHTML = `
            <div class="mb-3 font-semibold text-gray-800 border-b pb-2">
              Download ${format.toUpperCase()} - ${data.videoTitle || 'Video'}
            </div>
            <div class="space-y-2">
              ${options.map((option: { name: string; url: string; description: string }) => `
                <button 
                  onclick="window.open('${option.url}', '_blank')"
                  class="block w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                >
                  <div class="font-medium text-blue-700">${option.name}</div>
                  <div class="text-xs text-gray-600">${option.description}</div>
                </button>
              `).join('')}
            </div>
            <button 
              onclick="this.parentElement.remove()"
              class="mt-3 w-full px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Close Options
            </button>
          `
          
          document.body.appendChild(optionsPanel)
          
          // Auto-remove after 45 seconds
          setTimeout(() => {
            if (optionsPanel.parentNode) {
              optionsPanel.remove()
            }
          }, 45000)
          
          toast.success(`${format.toUpperCase()} download options opened! Choose your preferred service.`, {
            duration: 5000
          })
        } else {
          throw new Error('No download options available')
        }
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error(`Download failed: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setDownloading(null)
    }
  }

  const downloadAllVideos = async (format: 'mp4' | 'mp3') => {
    if (!playlist?.videos.length) return
    
    const totalVideos = playlist.videos.length
    toast.info(`Starting bulk download of ${totalVideos} videos as ${format.toUpperCase()}...`, {
      duration: 3000
    })
    
    // Show a warning for large playlists
    if (totalVideos > 10) {
      toast.warning(`Large playlist detected! This will open ${totalVideos} download pages. Consider using a download manager.`, {
        duration: 8000
      })
    }
    
    // Download videos with a delay to avoid overwhelming the browser
    for (let i = 0; i < totalVideos; i++) {
      const video = playlist.videos[i]
      setTimeout(() => {
        // Show progress
        toast.info(`Processing video ${i + 1} of ${totalVideos}: ${video.title}`, {
          duration: 2000
        })
        downloadVideo(video.id, format)
      }, i * 2000) // 2 second delay between each download
    }
    
    // Show completion message
    setTimeout(() => {
      toast.success(`All ${totalVideos} videos have been processed! Check your download tabs.`, {
        duration: 5000
      })
    }, totalVideos * 2000 + 1000)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-blue-900">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Downlyst
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Paste a YouTube playlist URL to view and download videos individually
          </p>
        </div>

        {/* URL Input Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-8">
            
            {/* Info Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-800 mb-2">🚀 How it works:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Paste a YouTube playlist URL below</li>
                <li>• Browse all videos in the playlist</li>
                <li>• Click download buttons to access multiple download services</li>
                <li>• Choose your preferred service and quality</li>
                <li>• For bulk downloads, use &quot;Download All&quot; buttons</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="h-12 pl-4 pr-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-lg"
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => navigator.clipboard.readText().then(setUrl)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <Button 
                onClick={fetchVideos} 
                disabled={loading}
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Playlist'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Playlist Results */}
        {playlist && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Music className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">{playlist.playlistTitle}</CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    By {playlist.playlistAuthor} • {playlist.videos.length} videos found
                  </CardDescription>
                </div>
              </div>
              
              {/* Bulk Download Options */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                  onClick={() => downloadAllVideos('mp4')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Download All as MP4 ({playlist.videos.length})
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                  onClick={() => downloadAllVideos('mp3')}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Download All as MP3 ({playlist.videos.length})
                </Button>
              </div>
              
              {/* Info Messages */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Bulk download will open multiple browser windows. Make sure to allow popups for this site.
                </div>
                <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  YouTube may temporarily block some downloads. If a video fails, try again later.
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {playlist.videos.map((video: VideoInfo, index: number) => (
                  <div 
                    key={video.id} 
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      {video.thumbnail && (
                        <div className="relative">
                          <Image 
                            src={video.thumbnail} 
                            alt={video.title} 
                            width={120}
                            height={68}
                            className="w-30 h-17 object-cover rounded-lg"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                            {video.duration || '0:00'}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-base mb-1">{video.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>#{index + 1}</span>
                          {video.duration && (
                            <>
                              <span>•</span>
                              <span>{video.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVideo(video.id, 'mp3')}
                        disabled={downloading === video.id}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 px-4 py-2 font-medium"
                      >
                        {downloading === video.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Music className="h-4 w-4 mr-1" />
                        )}
                        Download MP3
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadVideo(video.id, 'mp4')}
                        disabled={downloading === video.id}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 px-4 py-2 font-medium"
                      >
                        {downloading === video.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Video className="h-4 w-4 mr-1" />
                        )}
                        Download MP4
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
