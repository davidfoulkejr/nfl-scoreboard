// API Service for ESPN NFL Data
class APIService {
    constructor() {
        this.baseApiUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
        this.cache = new Map();
    }

    // Load data for all regular season weeks (1-18)
    async loadAllWeeks() {
        const weekData = new Map();
        const weekPromises = [];
        
        // Create promises for weeks 1-18
        for (let week = 1; week <= 18; week++) {
            weekPromises.push(this.fetchWeekData(week));
        }

        try {
            const results = await Promise.allSettled(weekPromises);
            
            // Process successful results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const weekNumber = index + 1;
                    weekData.set(weekNumber, result.value);
                    
                    // Only cache non-offline responses
                    if (!result.value.offline) {
                        this.cache.set(weekNumber, result.value);
                    }
                }
            });

            // If we have any data (cached or live), return it
            if (weekData.size > 0) {
                return weekData;
            }
            
            // No data at all - return empty map
            return new Map();
        } catch (error) {
            console.error('Error loading week data:', error);
            return new Map();
        }
    }

    // Fetch data for a specific week
    async fetchWeekData(weekNumber) {
        // Check cache first
        if (this.cache.has(weekNumber)) {
            return this.cache.get(weekNumber);
        }

        try {
            const url = `${this.baseApiUrl}?week=${weekNumber}&seasontype=2&year=2025`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Check if this is an offline response from service worker
            if (data.offline) {
                console.log('Received offline response from service worker');
                return data; // Return the offline response as-is
            }
            
            // Validate data structure for live data
            if (!data.events || !Array.isArray(data.events)) {
                return null;
            }

            // Cache successful response
            this.cache.set(weekNumber, data);
            
            return data;

        } catch (error) {
            // Check if this might be an offline response from service worker
            if (error.message && error.message.includes('offline')) {
                console.log('Detected offline mode from service worker');
                // Return cached data if available
                return this.cache.get(weekNumber) || null;
            }
            
            console.warn(`Failed to fetch week ${weekNumber} data:`, error.message);
            return null;
        }
    }

    // Check if we're currently offline
    isOffline() {
        return !navigator.onLine;
    }

    // Get offline status message
    getOfflineStatus() {
        if (this.isOffline()) {
            return {
                offline: true,
                message: 'You are currently offline. Showing cached data where available.'
            };
        }
        return { offline: false };
    }

    // Get cached week data
    getCachedWeekData(weekNumber) {
        return this.cache.get(weekNumber);
    }

    // Clear cache (for manual refresh)
    clearCache() {
        this.cache.clear();
    }

    // Refresh specific week data
    async refreshWeekData(weekNumber) {
        this.cache.delete(weekNumber);
        return await this.fetchWeekData(weekNumber);
    }
}

export default APIService;