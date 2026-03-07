import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'FC Tournament Tracker',
        short_name: 'FC Tracker',
        description: 'Manage and track FIFA/FC tournaments with detailed stats and analytics',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#22C55E',
        icons: [
            {
                src: '/icon192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}
