// Team Schedule View - Handles individual team schedule display across the season
class TeamScheduleView {
    constructor(app) {
        this.app = app;
        this.weekData = null;
        this.currentTeam = null;
        this.teamSchedule = [];
        
        this.initializeElements();
        this.bindEvents();
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            container: document.getElementById('team-schedule-container'),
            backButton: document.getElementById('back-from-team-schedule'),
            header: document.getElementById('team-schedule-header'),
            games: document.getElementById('team-schedule-games')
        };
    }

    // Bind event listeners
    bindEvents() {
        this.elements.backButton.addEventListener('click', () => {
            this.app.navigateToScoreboard();
        });
    }

    // Initialize with week data
    initialize(weekData) {
        this.weekData = weekData;
    }

    // Show team schedule view
    show(teamId) {
        this.currentTeam = this.getTeamInfo(teamId);
        
        if (!this.currentTeam) {
            this.app.navigateToScoreboard();
            return;
        }

        // Build team schedule from all weeks
        this.buildTeamSchedule(teamId);
        
        // Show the container
        this.elements.container.classList.add('visible');
        this.elements.container.style.display = 'block';
        
        // Render the team schedule
        this.renderTeamSchedule();
    }

    // Get team information from any game data
    getTeamInfo(teamId) {
        for (const [weekNum, weekData] of this.weekData) {
            if (weekData.events) {
                for (const event of weekData.events) {
                    const competition = event.competitions[0];
                    for (const competitor of competition.competitors) {
                        if (competitor.team.id === teamId) {
                            return competitor.team;
                        }
                    }
                }
            }
        }
        return null;
    }

    // Build complete team schedule from all weeks
    buildTeamSchedule(teamId) {
        this.teamSchedule = [];
        
        for (const [weekNum, weekData] of this.weekData) {
            if (weekData.events) {
                for (const event of weekData.events) {
                    const competition = event.competitions[0];
                    const teamGame = this.getTeamGameFromEvent(event, teamId);
                    
                    if (teamGame) {
                        this.teamSchedule.push({
                            week: weekNum,
                            event: event,
                            competition: competition,
                            opponent: teamGame.opponent,
                            isHome: teamGame.isHome,
                            teamScore: teamGame.teamScore,
                            opponentScore: teamGame.opponentScore,
                            result: teamGame.result,
                            gameStatus: competition.status
                        });
                    }
                }
            }
        }
        
        // Sort by week number
        this.teamSchedule.sort((a, b) => a.week - b.week);
    }

    // Extract team-specific game information from event
    getTeamGameFromEvent(event, teamId) {
        const competition = event.competitions[0];
        const competitors = competition.competitors;
        
        let teamCompetitor = null;
        let opponentCompetitor = null;
        
        for (const competitor of competitors) {
            if (competitor.team.id === teamId) {
                teamCompetitor = competitor;
            } else {
                opponentCompetitor = competitor;
            }
        }
        
        if (!teamCompetitor || !opponentCompetitor) {
            return null;
        }
        
        const teamScore = parseInt(teamCompetitor.score || '0');
        const opponentScore = parseInt(opponentCompetitor.score || '0');
        let result = null;
        
        // Determine result if game is completed
        if (competition.status.type.completed) {
            if (teamScore > opponentScore) {
                result = 'W';
            } else if (teamScore < opponentScore) {
                result = 'L';
            } else {
                result = 'T';
            }
        }
        
        return {
            opponent: opponentCompetitor.team,
            isHome: teamCompetitor.homeAway === 'home',
            teamScore: teamScore,
            opponentScore: opponentScore,
            result: result
        };
    }

    // Render complete team schedule
    renderTeamSchedule() {
        this.renderTeamHeader();
        this.renderScheduleGames();
    }

    // Render team header with logo and info
    renderTeamHeader() {
        const record = this.calculateTeamRecord();
        
        this.elements.header.innerHTML = `
            <div class="team-schedule-title">
                <img src="${this.currentTeam.logo}" alt="${this.currentTeam.displayName}" class="team-schedule-logo">
                <div class="team-schedule-info">
                    <h1 class="team-schedule-name">${this.currentTeam.displayName}</h1>
                    <div class="team-schedule-record">${record.wins}-${record.losses}${record.ties > 0 ? '-' + record.ties : ''}</div>
                </div>
            </div>
            <div class="schedule-stats">
                <div class="stat-item">
                    <span class="stat-label">Home</span>
                    <span class="stat-value">${record.homeWins}-${record.homeLosses}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Away</span>
                    <span class="stat-value">${record.awayWins}-${record.awayLosses}</span>
                </div>
            </div>
        `;
    }

    // Calculate team record from schedule
    calculateTeamRecord() {
        let wins = 0, losses = 0, ties = 0;
        let homeWins = 0, homeLosses = 0;
        let awayWins = 0, awayLosses = 0;
        
        for (const game of this.teamSchedule) {
            if (game.result === 'W') {
                wins++;
                if (game.isHome) homeWins++;
                else awayWins++;
            } else if (game.result === 'L') {
                losses++;
                if (game.isHome) homeLosses++;
                else awayLosses++;
            } else if (game.result === 'T') {
                ties++;
            }
        }
        
        return { wins, losses, ties, homeWins, homeLosses, awayWins, awayLosses };
    }

    // Render all schedule games
    renderScheduleGames() {
        const gamesHtml = this.teamSchedule.map(game => this.renderGameCard(game)).join('');
        
        this.elements.games.innerHTML = `
            <div class="team-schedule-grid">
                ${gamesHtml}
            </div>
        `;
        
        // Add click listeners after rendering
        this.addGameCardListeners();
    }

    // Render individual game card
    renderGameCard(game) {
        const gameDate = new Date(game.event.date);
        const dateStr = gameDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        const timeStr = gameDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        
        const isCompleted = game.gameStatus.type.completed;
        const resultClass = game.result ? `result-${game.result.toLowerCase()}` : '';
        const homeAwayIcon = game.isHome ? 'vs' : '@';
        
        return `
            <div class="team-game-card ${resultClass}" data-game-id="${game.event.id}" data-week="${game.week}">
                <div class="game-week">Week ${game.week}</div>
                <div class="game-matchup">
                    <div class="matchup-indicator">${homeAwayIcon}</div>
                    <img src="${game.opponent.logo}" alt="${game.opponent.displayName}" class="opponent-logo">
                    <div class="opponent-info">
                        <div class="opponent-name">${game.opponent.displayName}</div>
                        <div class="game-date">${dateStr}</div>
                    </div>
                </div>
                <div class="game-result">
                    ${isCompleted ? 
                        `<div class="final-score">
                            <div class="score ${game.result === 'W' ? 'winner' : ''}">${game.teamScore}</div>
                            <div class="score ${game.result === 'L' ? 'winner' : ''}">${game.opponentScore}</div>
                        </div>
                        <div class="result-badge ${resultClass}">${game.result}</div>` :
                        `<div class="game-time">${timeStr}</div>
                         <div class="game-status">${game.gameStatus.type.description}</div>`
                    }
                </div>
            </div>
        `;
    }

    // Add click handlers for game cards after rendering
    addGameCardListeners() {
        const gameCards = this.elements.games.querySelectorAll('.team-game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.gameId;
                const week = card.dataset.week;
                this.app.navigateToGame(parseInt(week), gameId);
            });
        });
    }
}