'use client'
import { useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Music, Video, Loader2, Link, PlayCircle, Clock, Hash, Play } from 'lucide-react'

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
      const response = await fetch(`/api/download?videoId=${videoId}&format=${format}&quality=highest`)
      
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-950">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative">
            <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 tracking-tight">
              Downlyst
            </h1>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform any YouTube playlist into personal media library with one click
          </p>
        </div>

        {/* URL Input Card */}
        <Card className="mb-8 shadow-2xl border-0 bg-white/80 backdrop-blur-sm ring-1 ring-white/20">
          <CardContent >
            
            {/* Info Section */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50">
              <div className="flex items-center gap-3">
              </div>
              <div className=" gap-4">
                <div className="flex items-start gap-3">

                  <div>
                    <p className="text-blue-800 font-medium">Paste playlist URL</p>
                    <p className="text-blue-600 text-sm">Any YouTube playlist link works</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">

                  <div>
                    <p className="text-blue-800 font-medium">Browse videos</p>
                    <p className="text-blue-600 text-sm">View all playlist content</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-blue-800 font-medium">Direct download</p>
                    <p className="text-blue-600 text-sm">MP4 video or MP3 audio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-blue-800 font-medium">Bulk download</p>
                    <p className="text-blue-600 text-sm">Get entire playlist at once</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="h-14 pl-6 pr-16 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white/70 focus:bg-white/90"
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 hover:bg-blue-50 rounded-lg"
                  onClick={() => navigator.clipboard.readText().then(setUrl)}
                  title="Paste from clipboard"
                >
                  <Link className="w-5 h-5" />
                </button>
              </div>
              <Button 
                onClick={fetchVideos} 
                disabled={loading}
                className="h-14 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    Fetching...
                  </>
                ) : (
                  <>
                    Fetch Playlist
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Playlist Results */}
        {playlist && (
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm ring-1 ring-white/20">
            <CardHeader className="pb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl shadow-lg">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>

                </div>
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{playlist.playlistTitle}</CardTitle>
                  <CardDescription className="text-lg text-gray-600 flex items-center gap-2">
                    <span className="flex items-center gap-2">

                      <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full font-medium hover:bg-red-100 transition-colors cursor-pointer border border-red-200">
                        {playlist.playlistAuthor}
                      </span>
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                      {playlist.videos.length} videos
                    </span>
                  </CardDescription>
                </div>
              </div>
              
              {/* Bulk Download Options */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Bulk Download Options</h3>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => downloadAllVideos('mp4')}
                  >
                    <Video className="w-5 h-5 mr-3" />
                    Download All as MP4
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-sm">
                      {playlist.videos.length}
                    </span>
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => downloadAllVideos('mp3')}
                  >
                    <Music className="w-5 h-5 mr-3" />
                    Download All as MP3
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-sm">
                      {playlist.videos.length}
                    </span>
                  </Button>
                </div>
              </div>
              
              {/* Info Messages */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-200">
                  <div className="flex-shrink-0 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">Large playlists may take time</p>
                    <p className="text-amber-600 text-xs mt-1">Each video is processed individually for best quality</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-6">
                {playlist.videos.map((video: VideoInfo, index: number) => (
                  <div 
                    key={video.id} 
                    className="group relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:border-blue-200"
                  >
                    <div className="flex items-center p-6">
                      {/* Video Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <div className="absolute -top-3 -left-3 z-10 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg ring-4 ring-white">
                          {index + 1}
                        </div>
                        {video.thumbnail && (
                          <div className="relative overflow-hidden rounded-2xl shadow-lg">
                            <Image 
                              src={video.thumbnail} 
                              alt={video.title} 
                              width={180}
                              height={101}
                              className="w-45 h-28 object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/90 text-white text-xs px-2 py-1 rounded-lg font-medium backdrop-blur-sm">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {video.duration || '0:00'}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            {/* Play button overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <PlayCircle className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Video Details */}
                      <div className="flex-1 min-w-0 ml-6">
                        <h3 className="font-bold text-gray-900 text-xl mb-3 leading-tight group-hover:text-blue-600 transition-colors duration-300" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {video.title}
                        </h3>
                        
                        {/* Video Meta */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                            <Hash className="w-3 h-3" />
                            Video {index + 1}
                          </span>
                          {video.duration && (
                            <span className="flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                              <Clock className="w-3 h-3" />
                              {video.duration}
                            </span>
                          )}
                        </div>
                        
                        {/* Download Buttons */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadVideo(video.id, 'mp3')}
                            disabled={downloading === video.id}
                            className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 border-purple-200 hover:border-purple-300 px-6 py-3 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading === video.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Music className="h-4 w-4 mr-2" />
                            )}
                            Audio (MP3)
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadVideo(video.id, 'mp4')}
                            disabled={downloading === video.id}
                            className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200 hover:border-green-300 px-6 py-3 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {downloading === video.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Video className="h-4 w-4 mr-2" />
                            )}
                            Video (MP4)
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Loading Overlay */}
                    {downloading === video.id && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                        <div className="flex items-center gap-3 text-blue-600">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="font-medium">Preparing download...</span>
                        </div>
                      </div>
                    )}
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
