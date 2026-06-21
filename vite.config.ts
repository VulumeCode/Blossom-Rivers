import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: '/Blossom-Rivers/',
  plugins: [svgr(), preact()
    ,
    VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      "name": "花川 - Blossom Rivers",
      "short_name": "花川",
      "description": "Blossom Rivers hanafuda game",
      "display": "standalone",
      "background_color": "#592116",
      "theme_color": "#592116",
      "categories": [
        "games"
      ],
      "lang": "en",
      "id": "com.vulumecode.blossomrivers",
      "icons": [
        {
          src: '/Blossom-Rivers/hanafudaicon-192.png',
          sizes: '192x192',
          type: 'image/png',
          "purpose": "any"
        },
        {
          src: '/Blossom-Rivers/hanafudaicon-512.png',
          sizes: '512x512',
          type: 'image/png',
          "purpose": "any"
        },
        {
          "src": "/Blossom-Rivers/hanafudaicon.svg",
          "sizes": "any",
          type: 'image/svg+xml',
          "purpose": "any"
        }
      ],
    }
  })

  ],
  build: {
    target: ['chrome120', 'firefox117', 'safari17.2', 'edge120'],
    chunkSizeWarningLimit: 2000,
  },
  server: {
    allowedHosts: ["tuf-vincent"]
  }
});
