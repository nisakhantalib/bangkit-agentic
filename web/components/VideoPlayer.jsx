'use client'

import { useState } from 'react'

export default function VideoPlayer({ videoUrl }) {
  const [isLoading, setIsLoading] = useState(true)

  // Handle undefined or null videoUrl
  if (!videoUrl) {
    return null // Don't render anything if no URL provided
  }

  // Extract video ID from YouTube URL if needed
  const getEmbedUrl = (url) => {
    // Check if URL is valid string
    if (!url || typeof url !== 'string') {
      return null
    }

    // If already an embed URL, return it
    if (url.includes('embed')) return url

    // Handle different YouTube URL formats
    let videoId = ''
    
    if (url.includes('youtube.com/watch')) {
      // Format: https://www.youtube.com/watch?v=VIDEO_ID
      const urlParams = new URLSearchParams(url.split('?')[1])
      videoId = urlParams.get('v')
    } else if (url.includes('youtu.be')) {
      // Format: https://youtu.be/VIDEO_ID
      videoId = url.split('/').pop().split('?')[0]
    } else if (url.includes('youtube.com/embed')) {
      // Already embed format
      return url
    } else {
      // Assume it's just the video ID
      videoId = url
    }

    if (!videoId) {
      return null
    }

    return `https://www.youtube.com/embed/${videoId}`
  }

  const embedUrl = getEmbedUrl(videoUrl)

  // If we couldn't parse a valid URL, don't render
  if (!embedUrl) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
        Invalid video URL
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
        </div>
      )}
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}