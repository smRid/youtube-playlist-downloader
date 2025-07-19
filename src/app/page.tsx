'use client'
import { useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Music, Video, Loader2, Link, PlayCircle, Clock, Hash, Play, Search } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'search'>('url')

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

  const searchYouTube = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setSearching(true)
    try {
      const res = await axios.post('/api/search', { query: searchQuery })
      setPlaylist(res.data)
      toast.success(`Found ${res.data.videos.length} search results`)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search YouTube. Please try again.')
    } finally {
      setSearching(false)
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-2 sm:px-4 sm:py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center sm:mt-4">
          <div className="relative inline-block">
            <h1 className="text-3xl sm:text-4xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-6 tracking-tight">
              Downlyst
            </h1>
            <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-3 h-3 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse blur-sm"></div>
            <div className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-2 h-2 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce blur-sm" style={{animationDelay: '0.5s'}}></div>
          </div>
          <p className="text-base sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-light px-4">
            Transform any YouTube playlist or video into your personal media library with <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">one click</span>
          </p>
        </div>

        {/* Introduction */}
        <div className="mb-4 sm:mb-8">
          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-2xl shadow-blue-500/10 ring-1 ring-white/20 hover:shadow-blue-500/20 transition-all duration-500">
            <CardContent className="p-3 sm:p-4 md:p-1">
              <div className="text-center">
                <div className="flex flex-row justify-center items-center gap-2 sm:gap-4 md:gap-8">
                  <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                      <Link className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm md:text-base text-gray-900">Paste URL</p>
                      <p className="text-xs sm:text-xs md:text-sm text-gray-600 hidden sm:block">Direct YouTube link</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                      <Search className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm md:text-base text-gray-900">Search YouTube</p>
                      <p className="text-xs sm:text-xs md:text-sm text-gray-600 hidden sm:block">Find content directly</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                      <Video className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm md:text-base text-gray-900">High Quality</p>
                      <p className="text-xs sm:text-xs md:text-sm text-gray-600 hidden sm:block">MP4 video or MP3 audio</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation and Input Area */}
        <div className="mb-8 sm:mb-12">
          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-2xl shadow-blue-500/10 ring-1 ring-white/20 hover:shadow-blue-500/20 transition-all duration-500">
            <CardContent className="p-4 sm:p-6 md:p-2">
              {/* Navigation Tabs */}
              <div className=" sm:mb-2">
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                  {/* URL Tab */}
                  <div 
                    className={`flex-1 max-w-full sm:max-w-xs p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeTab === 'url' 
                        ? 'bg-blue-100/80 border-2 border-blue-300/50 shadow-md' 
                        : 'bg-white/50 border-2 border-transparent hover:bg-blue-50/50 hover:border-blue-200/30'
                    }`}
                    onClick={() => setActiveTab('url')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md ${
                        activeTab === 'url' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <Link className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold text-xs sm:text-sm ${
                          activeTab === 'url' ? 'text-blue-900' : 'text-gray-700'
                        }`}>
                          Paste URL
                        </p>
                        <p className={`text-xs ${
                          activeTab === 'url' ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          Any YouTube link
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Search Tab */}
                  <div 
                    className={`flex-1 max-w-full sm:max-w-xs p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeTab === 'search' 
                        ? 'bg-purple-100/80 border-2 border-purple-300/50 shadow-md' 
                        : 'bg-white/50 border-2 border-transparent hover:bg-purple-50/50 hover:border-purple-200/30'
                    }`}
                    onClick={() => setActiveTab('search')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md ${
                        activeTab === 'search' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                      }`}>
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      <div className="text-center">
                        <p className={`font-semibold text-xs sm:text-sm ${
                          activeTab === 'search' ? 'text-purple-900' : 'text-gray-700'
                        }`}>
                          Search YouTube
                        </p>
                        <p className={`text-xs ${
                          activeTab === 'search' ? 'text-purple-600' : 'text-gray-500'
                        }`}>
                          Find videos directly
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              {activeTab === 'url' ? (
                <div>
                  <div className="mb-4 sm:mb-6 sm:mt-4 text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Paste YouTube URL</h2>
                    <p className="text-sm sm:text-base text-gray-600 px-2">Enter any YouTube playlist or video URL to get started</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <div className="relative flex-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl blur-xl"></div>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/playlist?list=... or https://www.youtube.com/watch?v=..."
                        className="relative h-12 sm:h-16 pl-4 sm:pl-8 pr-12 sm:pr-20 text-sm sm:text-lg border-2 border-gray-200/50 focus:border-blue-500/50 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 focus:bg-white/95 shadow-lg focus:shadow-xl"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            fetchVideos()
                          }
                        }}
                      />
                      <button 
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-gray-400 hover:text-blue-600 transition-colors duration-200 hover:bg-blue-50 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg"
                        onClick={() => navigator.clipboard.readText().then(setUrl)}
                        title="Paste from clipboard"
                      >
                        <Link className="w-4 h-4 sm:w-6 sm:h-6" />
                      </button>
                    </div>
                    <Button 
                      onClick={fetchVideos} 
                      disabled={loading}
                      className="h-12 sm:h-16 px-6 sm:px-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin mr-2 sm:mr-3" />
                          <span className="text-sm sm:text-base">Fetching...</span>
                        </>
                      ) : (
                        <>
                          <p className='text-sm sm:text-xl'>Fetch </p>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 sm:mb-6 text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Search YouTube</h2>
                    <p className="text-sm sm:text-base text-gray-600 px-2">Find videos and playlists directly from YouTube</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <div className="relative flex-1">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl blur-xl"></div>
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for videos, playlists, or channels..."
                        className="relative h-12 sm:h-16 pl-4 sm:pl-8 pr-12 sm:pr-20 text-sm sm:text-lg border-2 border-gray-200/50 focus:border-purple-500/50 rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 focus:bg-white/95 shadow-lg focus:shadow-xl"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            searchYouTube()
                          }
                        }}
                      />
                      <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 text-gray-400 rounded-lg sm:rounded-xl">
                        <Search className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                    <Button 
                      onClick={searchYouTube} 
                      disabled={searching}
                      className="h-12 sm:h-16 px-6 sm:px-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="h-4 w-4 sm:h-6 sm:w-6 animate-spin mr-2 sm:mr-3" />
                          <span className="text-sm sm:text-base">Searching...</span>
                        </>
                      ) : (
                        <>
                         <p className='text-sm sm:text-xl'>Search</p>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {playlist && (
          <div className="animate-in slide-in-from-bottom-8 duration-700">
            <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-2xl shadow-gray-500/10 ring-1 ring-white/20">
              <CardHeader className="pb-6 sm:pb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl sm:rounded-3xl blur-lg opacity-50"></div>
                    <div className="relative p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl sm:rounded-3xl shadow-xl">
                      <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {playlist.playlistTitle}
                    </CardTitle>
                    <CardDescription className="text-base sm:text-lg md:text-xl text-gray-600 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="flex items-center gap-1 sm:gap-2">
                        <span className="bg-gradient-to-r from-red-50 to-red-100 text-red-700 px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold hover:from-red-100 hover:to-red-200 transition-all duration-300 cursor-pointer border border-red-200 shadow-md text-sm sm:text-base">
                          {playlist.playlistAuthor}
                        </span>
                      </span>
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <span className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold border border-blue-200 shadow-md text-sm sm:text-base">
                        {playlist.videos.length} videos
                      </span>
                    </CardDescription>
                  </div>
                </div>
                
                {/* Bulk Download Options */}
                <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100/50 shadow-lg">
                  <h3 className="font-bold text-gray-900 mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl sm:rounded-2xl flex items-center justify-center">
                      <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Bulk Download Options
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6">
                    <Button 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base md:text-lg"
                      onClick={() => downloadAllVideos('mp4')}
                    >
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3 md:mr-4" />
                      Download All as MP4
                      <span className="ml-2 sm:ml-3 bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        {playlist.videos.length}
                      </span>
                    </Button>
                    <Button 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base md:text-lg"
                      onClick={() => downloadAllVideos('mp3')}
                    >
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 sm:mr-3 md:mr-4" />
                      Download All as MP3
                      <span className="ml-2 sm:ml-3 bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        {playlist.videos.length}
                      </span>
                    </Button>
                  </div>
                </div>
                
                {/* Info Messages */}
                <div className="mt-6 sm:mt-8 space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4 text-sm text-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-amber-200/50 shadow-md backdrop-blur-sm">
                    <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mt-1 shadow-lg">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">Large playlists may take time</p>
                      <p className="text-amber-700 text-xs sm:text-sm mt-1">Each video is processed individually for optimal quality</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 px-4 sm:px-6">
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  {playlist.videos.map((video: VideoInfo, index: number) => (
                    <div 
                      key={video.id} 
                      className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-gray-100/50 shadow-lg hover:shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:border-blue-200/50 animate-in slide-in-from-bottom-4"
                      style={{animationDelay: `${index * 100}ms`}}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 md:p-8 gap-4 sm:gap-6 md:gap-8">
                        {/* Video Thumbnail */}
                        <div className="relative flex-shrink-0 w-full sm:w-auto">
                          <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-xl ring-4 ring-white/50">
                            {index + 1}
                          </div>
                          {video.thumbnail && (
                            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
                              <Image 
                                src={video.thumbnail} 
                                alt={video.title} 
                                width={200}
                                height={112}
                                className="w-full sm:w-48 md:w-50 h-32 object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/90 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium backdrop-blur-sm shadow-lg">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                {video.duration || '0:00'}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                              {/* Play button overlay */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl">
                                  <PlayCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Video Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg sm:text-xl md:text-2xl mb-2 sm:mb-3 md:mb-4 leading-tight group-hover:text-blue-600 transition-colors duration-300" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {video.title}
                          </h3>
                          
                          {/* Video Meta */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 md:mb-6">
                            <span className="flex items-center gap-1 sm:gap-2 bg-gray-100/80 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full shadow-md">
                              <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
                              Video {index + 1}
                            </span>
                            {video.duration && (
                              <span className="flex items-center gap-1 sm:gap-2 bg-blue-100/80 backdrop-blur-sm px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full text-blue-700 shadow-md">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                {video.duration}
                              </span>
                            )}
                          </div>
                          
                          {/* Download Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadVideo(video.id, 'mp3')}
                              disabled={downloading === video.id}
                              className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 border-purple-200 hover:border-purple-300 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                              {downloading === video.id ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2 sm:mr-3" />
                              ) : (
                                <Music className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                              )}
                              Audio (MP3)
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadVideo(video.id, 'mp4')}
                              disabled={downloading === video.id}
                              className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200 hover:border-green-300 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 font-bold rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                            >
                              {downloading === video.id ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2 sm:mr-3" />
                              ) : (
                                <Video className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                              )}
                              Video (MP4)
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Loading Overlay */}
                      {downloading === video.id && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                          <div className="flex items-center gap-4 text-blue-600">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="font-semibold text-lg">Preparing download...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
