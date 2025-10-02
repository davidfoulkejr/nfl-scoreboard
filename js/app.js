// Main Application Router and Controller
class NFLApp {
    constructor() {
        this.currentRoute = null;
        this.weekData = new Map();
        this.apiService = new APIService();
        this.scoreboard = new ScoreboardView(this);
        this.gameDetail = new GameDetailView(this);
        this.teamSchedule = new TeamScheduleView(this);
        
        this.initializeRouter();
        this.bindEvents();
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
            const teamId = parts[1];
            
            if (parts[2] === 'schedule') {
                return {
                    view: 'team-schedule',
                    teamId: teamId
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
                this.teamSchedule.show(route.teamId);
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
    navigateToTeamSchedule(teamId) {
        window.location.hash = `#/team/${teamId}/schedule`;
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nflApp = new NFLApp();
});