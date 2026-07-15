import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RebaFlix',
    short_name: 'RebaFlix',
    description: 'Original movies, series, live TV, documentaries, and exclusive streaming.',
    start_url: '/',
    display: 'standalone',
    background_color: '#141414',
    theme_color: '#141414',
    icons: [
      {
        src: '/rebaflix-logo.png',
        sizes: '518x576',
        type: 'image/png',
      },
    ],
  }
}
