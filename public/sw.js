// NFL Scoreboard Service Worker
const CACHE_NAME = 'nfl-scoreboard-v2';
const STATIC_CACHE_NAME = 'nfl-static-v2';
const API_CACHE_NAME = 'nfl-api-v2';

// Core resources that are always available (these paths don't change)
const CORE_RESOURCES = [
  '/',  // This will be handled by the server (Vite dev server or production server)
  '/favicon.svg',
  '/manifest.json',
  '/team-colors.json',
  '/icons/player-fallback.svg'
];

// Pattern-based caching for production build assets
const ASSET_PATTERNS = [
  /\/assets\/.*\.(js|css|woff2?|ttf|eot)$/,  // Vite bundled assets
  /\/icons\/.*\.(svg|png|jpg|jpeg|ico)$/     // App icons
];

// API endpoints we want to cache
const API_PATTERNS = [
  /https:\/\/site\.api\.espn\.com\/apis\/site\/v2\/sports\/football\/nfl\/scoreboard(\?.*)?/
];

// Install event - cache core resources and discover assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache core resources that exist
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          console.log('[SW] Caching core resources');
          return cacheResourcesSafely(cache, CORE_RESOURCES);
        }),
      
      // Discover and cache bundled assets by fetching index.html
      discoverAndCacheAssets()
    ])
    .then(() => {
      console.log('[SW] Resources cached successfully');
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('[SW] Failed to cache resources:', error);
      // Still proceed with installation even if some caching fails
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old versions of our caches
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests (ESPN NFL data) - check this first since they're external
  if (API_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Only handle same-origin requests for static resources
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle navigation requests (for SPA routing)
  if (request.mode === 'navigate' || 
      (request.method === 'GET' && 
       request.headers.get('accept') && 
       request.headers.get('accept').includes('text/html'))) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle static resources and bundled assets
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  }
});

// Strategy for Navigation requests: Always serve cached index.html for SPA
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  // Always serve cached index.html for navigation requests
  // This allows the SPA router to handle hash-based routing client-side
  const cachedIndex = await cache.match('/index.html') || await cache.match('/');
  
  if (cachedIndex) {
    return cachedIndex;
  }
  
  // If no cached index, try network
  try {
    const response = await fetch('/index.html');
    
    if (response.ok) {
      // Cache the response for next time
      cache.put('/', response.clone());
      cache.put('/index.html', response.clone());
      return response;
    }
  } catch (error) {
    // Continue to fallback
  }
  
  // Final fallback: offline page
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>NFL Scoreboard - Offline</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          text-align: center; 
          padding: 50px 20px;
          background-color: #f5f5f5;
          color: #333;
          margin: 0;
        }
        .offline-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .offline-icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #013369; margin-bottom: 16px; }
        p { color: #666; margin-bottom: 24px; line-height: 1.5; }
        button {
          background: #013369;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover { background: #0747a6; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">🏈</div>
        <h1>You're Offline</h1>
        <p>Please check your internet connection and try again to load fresh NFL scores.</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
    status: 200
  });
}

// Strategy for API requests: Network First with Cache Fallback
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the fresh response
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error(`HTTP ${networkResponse.status}`);
    
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available, return offline indicator response
    return new Response(
      JSON.stringify({ 
        events: [],
        leagues: [],
        offline: true,
        error: 'No cached data available - please connect to internet to load games'
      }),
      { 
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Strategy for static resources: Cache First with Network Fallback
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const url = new URL(request.url);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache if it's a core resource or matches asset patterns
      const shouldCache = CORE_RESOURCES.includes(url.pathname) ||
                         ASSET_PATTERNS.some(pattern => pattern.test(url.pathname));
      
      if (shouldCache) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Return 404 for missing static resources when offline
    return new Response('Resource not available offline', { 
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CLEAR_CACHE':
        clearAllCaches();
        break;
    }
  }
});

// Discover and cache bundled assets from index.html
async function discoverAndCacheAssets() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    
    // Fetch index.html to discover bundled asset URLs
    const response = await fetch('/index.html');
    const html = await response.text();
    
    // Cache the index.html under both keys
    await cache.put('/', response.clone());
    await cache.put('/index.html', response.clone());
    
    // Extract asset URLs from HTML using regex
    const assetUrls = new Set();
    
    // Find CSS links: <link rel="stylesheet" href="/assets/...">
    const cssMatches = html.match(/href="(\/assets\/[^"]+\.css[^"]*)"/g);
    if (cssMatches) {
      cssMatches.forEach(match => {
        const url = match.match(/href="([^"]+)"/)[1];
        assetUrls.add(url);
      });
    }
    
    // Find JS script sources: <script src="/assets/...">
    const jsMatches = html.match(/src="(\/assets\/[^"]+\.js[^"]*)"/g);
    if (jsMatches) {
      jsMatches.forEach(match => {
        const url = match.match(/src="([^"]+)"/)[1];
        assetUrls.add(url);
      });
    }
    
    // Cache discovered assets
    if (assetUrls.size > 0) {
      await cache.addAll(Array.from(assetUrls));
    }
    
  } catch (error) {
    // Don't throw - let the service worker install anyway
  }
}

// Clear all caches (useful for development)
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Safely cache resources, skipping any that don't exist
async function cacheResourcesSafely(cache, resources) {
  const cachePromises = resources.map(async (resource) => {
    try {
      const response = await fetch(resource);
      
      if (response.ok) {
        await cache.put(resource, response);
      }
    } catch (error) {
      // Don't throw - just skip this resource and continue
    }
  });
  
  // Wait for all cache attempts to complete
  await Promise.all(cachePromises);
}

// Clean up old caches
async function cleanupCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => {
      if (cacheName !== STATIC_CACHE_NAME && cacheName !== API_CACHE_NAME) {
        return caches.delete(cacheName);
      }
    })
  );
}