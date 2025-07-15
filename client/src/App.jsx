import { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'https://yt-playlist-downloader-server.vercel.app';

function App() {
  const [url, setUrl] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const fetchPlaylist = async () => {
    if (!url.trim()) {
      alert('Please enter a playlist URL');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/playlist?url=${encodeURIComponent(url)}`);
      setVideos(res.data.videos);
      setPlaylistTitle(res.data.playlistTitle);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch playlist. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const download = async (id, format) => {
    try {
      const downloadUrl = `${API_BASE_URL}/api/download?videoId=${id}&format=${format}`;
      
      // Test the download endpoint first
      const testResponse = await axios.get(`${API_BASE_URL}/api/download/test?videoId=${id}`);
      if (!testResponse.data.valid) {
        alert(`Cannot download video: ${testResponse.data.error}`);
        return;
      }
      
      // If test passes, proceed with download
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download test failed:', error);
      alert('Failed to initiate download. Please try again.');
    }
  };

  const downloadAll = async (format) => {
    if (videos.length === 0) {
      alert('No videos to download');
      return;
    }

    let confirmationMessage = `Are you sure you want to download all ${videos.length} videos as ${format.toUpperCase()}? This will open multiple download windows.`;
    
    if (videos.length > 10) {
      confirmationMessage += `\n\nWarning: You're about to download ${videos.length} videos. This may take a while and could overwhelm your browser.`;
    }

    const confirmation = confirm(confirmationMessage);
    if (!confirmation) return;

    setDownloading(true);
    setDownloadProgress('');
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      setDownloadProgress(`Downloading ${i + 1} of ${videos.length}: ${video.title}`);
      
      try {
        // Test the download endpoint first
        const testResponse = await axios.get(`${API_BASE_URL}/api/download/test?videoId=${video.id}`);
        if (testResponse.data.valid) {
          const downloadUrl = `${API_BASE_URL}/api/download?videoId=${video.id}&format=${format}`;
          window.open(downloadUrl, '_blank');
          successCount++;
          
          // Add delay between downloads to prevent overwhelming the server
          const delay = videos.length > 20 ? 2000 : 1000; // Longer delay for larger playlists
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`Failed to download ${video.title}:`, testResponse.data.error);
          failCount++;
        }
      } catch (error) {
        console.error(`Error downloading ${video.title}:`, error);
        failCount++;
      }
    }

    setDownloading(false);
    setDownloadProgress('');
    
    if (failCount === 0) {
      alert(`Successfully initiated download for all ${successCount} videos!`);
    } else {
      alert(`Download initiated for ${successCount} videos. ${failCount} videos failed to download.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
            Downlyst
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube playlist URL here..."
                className={`w-full border-2 border-gray-200 rounded-xl px-6 py-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 ${loading ? 'animate-pulse-glow' : ''}`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            <button
              onClick={fetchPlaylist}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Fetch Playlist
                </>
              )}
            </button>
          </div>
        </div>

        {/* Playlist Info & Download All Section */}
        {playlistTitle && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {playlistTitle}
                </h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                    {videos.length} videos found
                  </span>
                </p>
              </div>
            </div>
            
            {/* Download All Buttons */}
            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => downloadAll('mp4')}
                disabled={downloading || videos.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Download All as MP4 ({videos.length})
                  </>
                )}
              </button>
              <button
                onClick={() => downloadAll('mp3')}
                disabled={downloading || videos.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                    </svg>
                    Download All as MP3 ({videos.length})
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Bulk download will open multiple browser windows. Make sure to allow popups for this site.
              </p>
            </div>
            
            {/* Progress indicator */}
            {downloading && downloadProgress && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800 mb-1">Processing Downloads</p>
                    <p className="text-xs text-blue-600 truncate">{downloadProgress}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Videos Grid */}
        <div className="grid gap-6">
          {videos.map((video, index) => (
            <div key={video.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6 hover:shadow-2xl transition-all duration-300 group">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Thumbnail */}
                <div className="flex-shrink-0 lg:w-80">
                  <div className="relative overflow-hidden rounded-xl">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      #{index + 1}
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                    {video.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-6 text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {video.duration}
                    </span>
                  </div>
                  
                  {/* Download Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => download(video.id, 'mp4')}
                      disabled={downloading}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Download MP4
                    </button>
                    <button
                      onClick={() => download(video.id, 'mp3')}
                      disabled={downloading}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
                      </svg>
                      Download MP3
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {videos.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zm12-3c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to Download</h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto">
              Enter a YouTube playlist URL above to get started with downloading your favorite videos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
