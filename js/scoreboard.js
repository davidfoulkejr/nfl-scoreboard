// Scoreboard View - Handles week display and game cards
class ScoreboardView {
    constructor(app) {
        this.app = app;
        this.weekData = null;
        this.currentWeek = 1;
        this.regularSeasonWeeks = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            weekNav: document.getElementById('week-navigation'),
            gamesContainer: document.getElementById('games-container'),
            gamesGrid: document.getElementById('games-grid'),
            noGames: document.getElementById('no-games'),
            prevWeekBtn: document.getElementById('prev-week'),
            nextWeekBtn: document.getElementById('next-week'),
            weekSelect: document.getElementById('week-select'),
            currentWeekTitle: document.getElementById('current-week-title'),
            currentWeekDates: document.getElementById('current-week-dates')
        };
    }

    // Bind event listeners
    bindEvents() {
        this.elements.prevWeekBtn.addEventListener('click', () => this.navigateWeek(-1));
        this.elements.nextWeekBtn.addEventListener('click', () => this.navigateWeek(1));
        this.elements.weekSelect.addEventListener('change', (e) => this.goToWeek(parseInt(e.target.value)));
    }

    // Initialize with week data
    initialize(weekData) {
        this.weekData = weekData;
        this.regularSeasonWeeks = Array.from(weekData.keys()).sort((a, b) => a - b);
        this.currentWeek = this.findCurrentWeek() || 1;
        this.populateWeekSelector();
    }

    // Show scoreboard view
    show(weekNumber = null) {
        // Properly show elements
        this.elements.weekNav.classList.add('visible');
        this.elements.weekNav.style.display = 'block';
        
        if (weekNumber && this.regularSeasonWeeks.includes(weekNumber)) {
            this.currentWeek = weekNumber;
        }
        
        this.displayWeek(this.currentWeek);
        this.updateNavigationState();
    }

    // Find the current week based on today's date
    findCurrentWeek() {
        const today = new Date();
        
        for (const [weekNum, data] of this.weekData) {
            if (data.events && data.events.length > 0) {
                const weekStart = new Date(data.events[0].date);
                const weekEnd = new Date(data.events[data.events.length - 1].date);
                
                // Add buffer time around the week
                weekStart.setDate(weekStart.getDate() - 1);
                weekEnd.setDate(weekEnd.getDate() + 1);
                
                if (today >= weekStart && today <= weekEnd) {
                    return weekNum;
                }
            }
        }
        
        return null;
    }

    // Populate week selector dropdown
    populateWeekSelector() {
        this.elements.weekSelect.innerHTML = '';
        
        this.regularSeasonWeeks.forEach(weekNum => {
            const option = document.createElement('option');
            option.value = weekNum;
            option.textContent = `Week ${weekNum}`;
            this.elements.weekSelect.appendChild(option);
        });
    }

    // Navigate to previous or next week
    navigateWeek(direction) {
        const currentIndex = this.regularSeasonWeeks.indexOf(this.currentWeek);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.regularSeasonWeeks.length) {
            this.app.navigateToWeek(this.regularSeasonWeeks[newIndex]);
        }
    }

    // Go to specific week
    goToWeek(weekNumber) {
        if (this.regularSeasonWeeks.includes(weekNumber)) {
            this.app.navigateToWeek(weekNumber);
        }
    }

    // Display games for a specific week
    displayWeek(weekNumber) {
        const weekData = this.weekData.get(weekNumber);
        
        if (!weekData) {
            this.elements.noGames.classList.add('visible');
            this.elements.gamesContainer.classList.remove('visible');
            return;
        }

        // Update week info
        this.elements.currentWeekTitle.textContent = `Week ${weekNumber}`;
        this.elements.weekSelect.value = weekNumber;
        
        // Calculate and display week date range
        const dateRange = this.calculateWeekDateRange(weekData.events);
        this.elements.currentWeekDates.textContent = dateRange;

        // Render games
        if (weekData.events && weekData.events.length > 0) {
            this.renderGames(weekData.events, weekNumber);
            this.elements.gamesContainer.classList.add('visible');
            this.elements.gamesContainer.style.display = 'block';
            this.elements.noGames.classList.remove('visible');
            this.elements.noGames.style.display = 'none';
        } else {
            this.elements.noGames.classList.add('visible');
            this.elements.noGames.style.display = 'block';
            this.elements.gamesContainer.classList.remove('visible');
            this.elements.gamesContainer.style.display = 'none';
        }
    }

    // Calculate date range for the week
    calculateWeekDateRange(events) {
        if (!events || events.length === 0) return '';
        
        const dates = events.map(event => new Date(event.date)).sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        if (startDate.toDateString() === endDate.toDateString()) {
            return formatDate(startDate);
        }
        
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    // Update navigation button states
    updateNavigationState() {
        const currentIndex = this.regularSeasonWeeks.indexOf(this.currentWeek);
        
        this.elements.prevWeekBtn.disabled = currentIndex === 0;
        this.elements.nextWeekBtn.disabled = currentIndex === this.regularSeasonWeeks.length - 1;
    }

    // Render all games for a week
    renderGames(events, weekNumber) {
        this.elements.gamesGrid.innerHTML = '';
        
        // Sort events by date
        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedEvents.forEach(event => {
            const gameCard = this.createGameCard(event, weekNumber);
            this.elements.gamesGrid.appendChild(gameCard);
        });
    }

    // Create individual game card
    createGameCard(event, weekNumber) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.style.cursor = 'pointer';
        
        // Add click handler for navigation to game detail
        card.addEventListener('click', () => {
            this.app.navigateToGame(weekNumber, event.id);
        });
        
        const competition = event.competitions[0];
        const status = competition.status;
        const competitors = competition.competitors;
        
        // Get teams (home/away)
        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');
        
        // Format game date and time
        const gameDate = new Date(event.date);
        const dateStr = gameDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = gameDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
        });

        card.innerHTML = `
            <div class="game-header">
                <div class="game-date">${dateStr}</div>
                <div class="game-time">${timeStr}</div>
                <div class="game-status ${this.getStatusClass(status)}">${status.type.shortDetail}</div>
            </div>
            
            <div class="teams-container">
                <div class="team-matchup">
                    ${this.createTeamHTML(awayTeam, status.type.completed)}
                    <div class="vs-separator">@</div>
                    ${this.createTeamHTML(homeTeam, status.type.completed)}
                </div>
            </div>
            
            <div class="game-details">
                <div class="venue-info">${competition.venue.fullName}, ${competition.venue.address.city}</div>
                ${this.createGameDetailsHTML(competition, status)}
                <div class="click-hint">Click for details</div>
            </div>
        `;
        
        return card;
    }

    // Create team HTML section
    createTeamHTML(competitor, isCompleted) {
        const team = competitor.team;
        const score = competitor.score || '0';
        const isWinner = competitor.winner || false;
        
        // Get team logo (fallback to ESPN default)
        const logoUrl = team.logo || `https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbreviation.toLowerCase()}.png`;
        
        return `
            <div class="team">
                <img src="${logoUrl}" alt="${team.displayName}" class="team-logo" 
                     onerror="this.src='https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png'">
                <div class="team-name">${team.location}</div>
                <div class="team-city">${team.name}</div>
                ${isCompleted ? `<div class="team-score ${isWinner ? 'winner' : ''}">${score}</div>` : ''}
            </div>
        `;
    }

    // Create game details section (odds for scheduled, broadcast for others)
    createGameDetailsHTML(competition, status) {
        let detailsHTML = '';
        
        // Show betting odds for scheduled games
        if (status.type.state === 'pre' && competition.odds && competition.odds.length > 0) {
            const odds = competition.odds[0];
            detailsHTML += `
                <div class="betting-odds">
                    <div class="odds-item">
                        <div class="odds-label">Spread</div>
                        <div class="odds-value">${odds.details || 'N/A'}</div>
                    </div>
                    <div class="odds-item">
                        <div class="odds-label">O/U</div>
                        <div class="odds-value">${odds.overUnder || 'N/A'}</div>
                    </div>
                    <div class="odds-item">
                        <div class="odds-label">Favorite</div>
                        <div class="odds-value">
                            ${odds.homeTeamOdds.favorite ? odds.homeTeamOdds.team.abbreviation : 
                              odds.awayTeamOdds.favorite ? odds.awayTeamOdds.team.abbreviation : 'EVEN'}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Show broadcast info if available
        if (competition.broadcasts && competition.broadcasts.length > 0) {
            const networks = competition.broadcasts[0].names.join(', ');
            detailsHTML += `
                <div class="broadcast-info">
                    <span class="broadcast-networks">${networks}</span>
                </div>
            `;
        }
        
        return detailsHTML;
    }

    // Get CSS class for game status
    getStatusClass(status) {
        switch (status.type.state) {
            case 'pre':
                return 'scheduled';
            case 'in':
                return 'live';
            case 'post':
                return 'completed';
            default:
                return 'scheduled';
        }
    }
}