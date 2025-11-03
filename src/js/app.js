import APIService from './apiService.js';
import ScoreboardView from './scoreboard.js';
import GameDetailView from './gameDetail.js';
import TeamScheduleView from './teamSchedule.js';
import '../styles/styles.css';

// Main Application Router and Controller
class NFLApp {
    constructor() {
        this.currentRoute = null;
        this.weekData = new Map();
        this.apiService = new APIService();
        this.scoreboard = new ScoreboardView(this);
        this.gameDetail = new GameDetailView(this);
        this.teamSchedule = new TeamScheduleView(this);
        this.refreshInterval = null;
        
        this.initializeRouter();
        this.bindEvents();
        this.registerServiceWorker();
        this.loadInitialData();
    }

    // Initialize hash-based routing
    initializeRouter() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
        window.addEventListener('load', () => this.handleRouteChange());
    }

    // Bind global event listeners
    bindEvents() {
        // Global error retry
        document.getElementById('retry-btn')?.addEventListener('click', () => this.loadInitialData());
        
        // Online/offline detection
        window.addEventListener('online', () => this.handleOnlineStatus());
        window.addEventListener('offline', () => this.handleOfflineStatus());
        
        // Check initial online status
        if (!navigator.onLine) {
            this.handleOfflineStatus();
        }
    }

    // Handle route changes
    handleRouteChange() {
        const hash = window.location.hash || '#/';
        const route = this.parseRoute(hash);
        this.navigateToRoute(route);
    }

    // Parse hash into route object
    parseRoute(hash) {
        // Remove leading #/
        const path = hash.replace(/^#\/?/, '');
        const parts = path.split('/');

        if (!path || path === '') {
            return { view: 'scoreboard', week: null };
        }

        if (parts[0] === 'week' && parts[1]) {
            const week = parseInt(parts[1]);
            
            if (parts[2] === 'game' && parts[3]) {
                return { 
                    view: 'game-detail', 
                    week: week, 
                    gameId: parts[3] 
                };
            }
            
            return { view: 'scoreboard', week: week };
        }

        if (parts[0] === 'team' && parts[1]) {
            const teamAbbr = parts[1].toUpperCase();
            
            if (parts[2] === 'schedule') {
                return {
                    view: 'team-schedule',
                    teamAbbr: teamAbbr
                };
            }
        }

        // Default fallback
        return { view: 'scoreboard', week: null };
    }

    // Navigate to specific route
    navigateToRoute(route) {
        this.currentRoute = route;

        // Hide all views initially
        this.hideAllViews();

        // Scroll to top of page on route change
        window.scrollTo(0, 0);

        // Get main container for class management
        const mainContainer = document.querySelector('.main-container');

        // Show appropriate view based on route
        switch (route.view) {
            case 'scoreboard':
                mainContainer.classList.remove('game-detail-mode', 'team-schedule-mode');
                this.scoreboard.show(route.week);
                break;
            case 'game-detail':
                mainContainer.classList.remove('team-schedule-mode');
                mainContainer.classList.add('game-detail-mode');
                this.gameDetail.show(route.week, route.gameId);
                break;
            case 'team-schedule':
                mainContainer.classList.remove('game-detail-mode');
                mainContainer.classList.add('team-schedule-mode');
                this.teamSchedule.show(route.teamAbbr);
                break;
            default:
                mainContainer.classList.remove('game-detail-mode', 'team-schedule-mode');
                this.scoreboard.show();
        }
    }

    // Hide all main views
    hideAllViews() {
        // Completely hide elements instead of just removing visible class
        const weekNav = document.getElementById('week-navigation');
        const gamesContainer = document.getElementById('games-container');
        const gameDetailContainer = document.getElementById('game-detail-container');
        const teamScheduleContainer = document.getElementById('team-schedule-container');
        const noGames = document.getElementById('no-games');
        
        weekNav.classList.remove('visible');
        weekNav.style.display = 'none';
        
        gamesContainer.classList.remove('visible');
        gamesContainer.style.display = 'none';
        
        gameDetailContainer.classList.remove('visible');
        gameDetailContainer.style.display = 'none';
        
        teamScheduleContainer.classList.remove('visible');
        teamScheduleContainer.style.display = 'none';
        
        noGames.classList.remove('visible');
        noGames.style.display = 'none';
    }

    // Load all NFL data on startup
    async loadInitialData() {
        this.showLoading();
        
        try {
            const weekData = await this.apiService.loadAllWeeks();
            this.weekData = weekData;
            
            if (this.weekData.size === 0) {
                throw new Error('No data could be loaded');
            }

            // Initialize views with data
            this.scoreboard.initialize(this.weekData);
            this.gameDetail.initialize(this.weekData);
            this.teamSchedule.initialize(this.weekData);
            
            this.showContent();
            
            // Start auto-refresh if there are live games
            this.startAutoRefresh();
            
            // Handle current route
            this.handleRouteChange();

        } catch (error) {
            this.showError();
        }
    }

    // Navigate to specific week
    navigateToWeek(weekNumber) {
        window.location.hash = `#/week/${weekNumber}`;
    }

    // Navigate to game detail
    navigateToGame(weekNumber, gameId) {
        window.location.hash = `#/week/${weekNumber}/game/${gameId}`;
    }

    // Navigate to team schedule
    navigateToTeamSchedule(teamAbbr) {
        window.location.hash = `#/team/${teamAbbr.toLowerCase()}/schedule`;
    }

    // Navigate back to scoreboard
    navigateToScoreboard(weekNumber = null) {
        if (weekNumber) {
            window.location.hash = `#/week/${weekNumber}`;
        } else {
            window.location.hash = '#/';
        }
    }

    // Show loading state
    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('error').style.display = 'none';
        this.hideAllViews();
    }

    // Show error state
    showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'flex';
        this.hideAllViews();
    }

    // Show main content
    showContent() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'none';
    }

    // Get data for specific week
    getWeekData(weekNumber) {
        return this.weekData.get(weekNumber);
    }

    // Get specific game data
    getGameData(weekNumber, gameId) {
        const weekData = this.getWeekData(weekNumber);
        if (!weekData || !weekData.events) return null;
        
        return weekData.events.find(event => event.id === gameId);
    }

    // Get list of available weeks
    getAvailableWeeks() {
        return Array.from(this.weekData.keys()).sort((a, b) => a - b);
    }

    // Check if there are any live games currently
    hasLiveGames() {
        return this.getCurrentWeekWithLiveGames() !== null;
    }

    // Find the current week with live games
    getCurrentWeekWithLiveGames() {
        const today = new Date();
        
        for (const [weekNumber, weekData] of this.weekData) {
            if (weekData && weekData.events) {
                const hasLiveGames = weekData.events.some(event => {
                    const competition = event.competitions?.[0];
                    return competition?.status?.type?.state === 'in';
                });
                
                if (hasLiveGames) {
                    return weekNumber;
                }
            }
        }
        return null;
    }

    // Start auto-refresh for live games
    startAutoRefresh() {
        // Clear any existing interval
        this.stopAutoRefresh();
        
        // Don't start auto-refresh if offline
        if (!navigator.onLine) {
            console.log('Skipping auto-refresh - currently offline');
            return;
        }
        
        if (this.hasLiveGames()) {
            this.refreshInterval = setInterval(async () => {
                await this.refreshLiveGames();
            }, 30000); // Refresh every 30 seconds
            
            // Show live indicator
            this.showLiveIndicator();
        }
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            
            // Hide live indicator
            this.hideLiveIndicator();
        }
    }

    // Show live indicator
    showLiveIndicator() {
        const indicator = document.getElementById('live-indicator');
        if (indicator) {
            indicator.classList.add('visible');
        }
    }

    // Hide live indicator
    hideLiveIndicator() {
        const indicator = document.getElementById('live-indicator');
        if (indicator) {
            indicator.classList.remove('visible');
        }
    }

    // Refresh data for weeks with live games
    async refreshLiveGames() {
        const currentWeek = this.getCurrentWeekWithLiveGames();
        if (!currentWeek || !navigator.onLine) {
            this.stopAutoRefresh();
            return;
        }

        try {
            const refreshedData = await this.apiService.refreshWeekData(currentWeek);
            if (refreshedData) {
                this.weekData.set(currentWeek, refreshedData);
                
                // Update the currently displayed view if it's showing the refreshed week
                if ((this.currentRoute.week === currentWeek || !this.currentRoute.week)) {
                    if (this.currentRoute.view === 'scoreboard') {
                        this.scoreboard.displayWeek(currentWeek);
                    } else if (this.currentRoute.view === 'game-detail' && this.currentRoute.gameId) {
                        this.gameDetail.show(currentWeek, this.currentRoute.gameId);
                    }
                }
                
                // Check if we still have live games, stop refreshing if not
                if (!this.hasLiveGames()) {
                    this.stopAutoRefresh();
                }
            }
        } catch (error) {
            console.warn('Failed to refresh live game data:', error);
        }
    }

    // Register service worker for PWA capabilities (production only)
    async registerServiceWorker() {
        // Only register service worker in production
        if (import.meta.env.DEV) {
            console.log('⚠️ Service worker disabled in development mode');
            return;
        }
        
        if ('serviceWorker' in navigator) {
            try {
                console.log('Registering service worker...');
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                console.log('Service worker registered successfully:', registration.scope);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New service worker found, installing...');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New update available
                                console.log('New app version available');
                                this.showUpdateNotification();
                            } else {
                                // First install
                                console.log('App is now available offline');
                                this.showOfflineNotification();
                            }
                        }
                    });
                });
                
            } catch (error) {
                console.error('Service worker registration failed:', error);
            }
        } else {
            console.log('Service workers not supported in this browser');
        }
    }

    // Show notification that app update is available
    showUpdateNotification() {
        // You could show a banner or notification here
        console.log('🔄 App update available - refresh to get the latest version');
        
        // Optionally auto-refresh after a delay
        // setTimeout(() => window.location.reload(), 5000);
    }

    // Show notification that app is now available offline
    showOfflineNotification() {
        console.log('📱 App installed successfully - now available offline!');
        
        // You could show a toast notification here
        // this.showToast('App is now available offline!');
    }

    // Handle when app goes online
    handleOnlineStatus() {
        console.log('🌐 Back online');
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.classList.remove('visible');
        }
        
        // Resume auto-refresh if there are live games
        this.startAutoRefresh();
        
        // Optionally refresh current data
        if (this.currentRoute?.view === 'scoreboard' && this.currentRoute.week) {
            this.refreshCurrentWeek();
        }
    }

    // Handle when app goes offline
    handleOfflineStatus() {
        console.log('📱 Gone offline');
        const offlineIndicator = document.getElementById('offline-indicator');
        if (offlineIndicator) {
            offlineIndicator.classList.add('visible');
        }
        
        // Hide live indicator when offline
        this.hideLiveIndicator();
        
        // Stop auto-refresh when offline
        this.stopAutoRefresh();
    }

    // Refresh current week data
    async refreshCurrentWeek() {
        if (!this.currentRoute?.week) return;
        
        try {
            const refreshedData = await this.apiService.refreshWeekData(this.currentRoute.week);
            if (refreshedData) {
                this.weekData.set(this.currentRoute.week, refreshedData);
                this.scoreboard.displayWeek(this.currentRoute.week);
            }
        } catch (error) {
            console.warn('Failed to refresh current week:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nflApp = new NFLApp();
});

export default NFLApp;