import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '咩nu - 團購點餐小幫手',
    short_name: '咩nu',
    description: '手機優先、極速開團點餐與對帳小幫手',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0284c7',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
