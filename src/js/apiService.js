import { getNFLSeasonYear } from './season.js';

// API Service for ESPN NFL Data
class APIService {
  constructor() {
    this.baseApiUrl =
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
    this.seasonYear = getNFLSeasonYear();
    this.cache = new Map();
    this.standingsCache = null;
    this.standingsLoadedAt = 0;
    this.standingsRequest = null;
  }

  async fetchStandings(forceRefresh = false) {
    if (
      !forceRefresh &&
      this.standingsCache &&
      Date.now() - this.standingsLoadedAt < 30000
    ) {
      return this.standingsCache;
    }
    if (this.standingsRequest) return this.standingsRequest;

    this.standingsRequest = this.loadStandings();
    try {
      return await this.standingsRequest;
    } finally {
      this.standingsRequest = null;
    }
  }

  async loadStandings() {
    const url = `https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${this.seasonYear}&type=2&level=3`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    if (
      !Array.isArray(data.children) ||
      data.children.length === 0 ||
      !data.children.every(
        conference =>
          Array.isArray(conference.children) &&
          conference.children.length > 0 &&
          conference.children.every(
            division =>
              Array.isArray(division.standings?.entries) &&
              division.standings.entries.length > 0 &&
              division.standings.entries.every(
                entry =>
                  typeof entry.team?.abbreviation === 'string' &&
                  typeof entry.team?.displayName === 'string' &&
                  Array.isArray(entry.stats)
              )
          )
      )
    ) {
      throw new Error('Standings data is unavailable or incomplete');
    }
    this.standingsCache = data;
    this.standingsLoadedAt = Date.now();
    return data;
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
      const url = `${this.baseApiUrl}?week=${weekNumber}&seasontype=2&year=${this.seasonYear}`;

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
        message:
          'You are currently offline. Showing cached data where available.',
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
