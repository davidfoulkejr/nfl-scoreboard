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
                    this.cache.set(weekNumber, result.value);
                }
            });

            return weekData;
        } catch (error) {
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
            
            // Validate data structure
            if (!data.events || !Array.isArray(data.events)) {
                return null;
            }

            // Cache successful response
            this.cache.set(weekNumber, data);
            
            return data;

        } catch (error) {
            return null;
        }
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