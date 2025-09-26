// Game Detail View - Handles individual game display with leaders and box scores
class GameDetailView {
    constructor(app) {
        this.app = app;
        this.weekData = null;
        this.currentGame = null;
        this.currentWeek = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    // Initialize DOM elements
    initializeElements() {
        this.elements = {
            container: document.getElementById('game-detail-container'),
            backButton: document.getElementById('back-to-scoreboard'),
            header: document.getElementById('game-detail-header'),
            boxScore: document.getElementById('box-score-container'),
            teamLeaders: document.getElementById('team-leaders-container'),
            gameInfo: document.getElementById('game-info-container')
        };
    }

    // Bind event listeners
    bindEvents() {
        this.elements.backButton.addEventListener('click', () => {
            this.app.navigateToScoreboard(this.currentWeek);
        });
    }

    // Initialize with week data
    initialize(weekData) {
        this.weekData = weekData;
    }

    // Show game detail view
    show(weekNumber, gameId) {
        this.currentWeek = weekNumber;
        this.currentGame = this.app.getGameData(weekNumber, gameId);
        
        if (!this.currentGame) {
            this.app.navigateToScoreboard(weekNumber);
            return;
        }

        // Properly show the game detail container
        this.elements.container.classList.add('visible');
        this.elements.container.style.display = 'block';
        this.renderGameDetail();
    }

    // Render complete game detail view
    renderGameDetail() {
        this.renderGameHeader();
        this.renderBoxScore();
        this.renderTeamLeaders();
        this.renderGameInfo();
    }

    // Render game header with teams and score
    renderGameHeader() {
        const competition = this.currentGame.competitions[0];
        const status = competition.status;
        const competitors = competition.competitors;
        
        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');
        
        // Format game date and time
        const gameDate = new Date(this.currentGame.date);
        const dateStr = gameDate.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const timeStr = gameDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
        });

        this.elements.header.innerHTML = `
            <div class="game-detail-teams">
                <div class="team-detail ${awayTeam.winner ? 'winner' : ''}">
                    <img src="${awayTeam.team.logo}" alt="${awayTeam.team.displayName}" class="team-detail-logo">
                    <div class="team-detail-info">
                        <div class="team-detail-name">${awayTeam.team.displayName}</div>
                        <div class="team-detail-record">${this.getTeamRecord(awayTeam)}</div>
                    </div>
                    <div class="team-detail-score">${awayTeam.score || '0'}</div>
                </div>
                
                <div class="vs-detail">
                    <div class="game-detail-status ${this.getStatusClass(status)}">${status.type.description}</div>
                    <div class="game-detail-time">${status.type.completed ? 'Final' : status.displayClock}</div>
                </div>
                
                <div class="team-detail ${homeTeam.winner ? 'winner' : ''}">
                    <div class="team-detail-score">${homeTeam.score || '0'}</div>
                    <div class="team-detail-info">
                        <div class="team-detail-name">${homeTeam.team.displayName}</div>
                        <div class="team-detail-record">${this.getTeamRecord(homeTeam)}</div>
                    </div>
                    <img src="${homeTeam.team.logo}" alt="${homeTeam.team.displayName}" class="team-detail-logo">
                </div>
            </div>
            
            <div class="game-detail-meta">
                <div class="game-date">${dateStr}</div>
                <div class="game-time">${timeStr}</div>
                <div class="venue-detail">${competition.venue.fullName}, ${competition.venue.address.city}, ${competition.venue.address.state}</div>
            </div>
        `;
    }

    // Render quarter-by-quarter box score
    renderBoxScore() {
        const competition = this.currentGame.competitions[0];
        const competitors = competition.competitors;
        
        const homeTeam = competitors.find(c => c.homeAway === 'home');
        const awayTeam = competitors.find(c => c.homeAway === 'away');
        
        // Check if linescore data is available
        const hasLinescores = homeTeam.linescores && awayTeam.linescores && 
                            homeTeam.linescores.length > 0 && awayTeam.linescores.length > 0;

        if (!hasLinescores) {
            this.elements.boxScore.innerHTML = `
                <div class="no-data-message">
                    <p>Box score not available for this game</p>
                </div>
            `;
            return;
        }

        // Build box score table
        const maxPeriods = Math.max(homeTeam.linescores.length, awayTeam.linescores.length);
        
        let headerRow = '<th class="team-header">Team</th>';
        for (let i = 1; i <= maxPeriods; i++) {
            headerRow += `<th class="period-header">${i <= 4 ? i : 'OT'}</th>`;
        }
        headerRow += '<th class="total-header">Total</th>';

        const awayRow = this.createBoxScoreRow(awayTeam, maxPeriods);
        const homeRow = this.createBoxScoreRow(homeTeam, maxPeriods);

        this.elements.boxScore.innerHTML = `
            <table class="box-score-table">
                <thead>
                    <tr>${headerRow}</tr>
                </thead>
                <tbody>
                    ${awayRow}
                    ${homeRow}
                </tbody>
            </table>
        `;
    }

    // Create box score row for a team
    createBoxScoreRow(competitor, maxPeriods) {
        const team = competitor.team;
        const linescores = competitor.linescores || [];
        const isWinner = competitor.winner || false;
        
        let row = `<td class="team-cell ${isWinner ? 'winner' : ''}">`;
        row += `<img src="${team.logo}" alt="${team.abbreviation}" class="box-score-logo">`;
        row += `<span>${team.abbreviation}</span>`;
        row += `</td>`;

        // Period scores
        for (let i = 0; i < maxPeriods; i++) {
            const score = linescores[i] ? linescores[i].displayValue : '-';
            row += `<td class="period-cell">${score}</td>`;
        }

        // Total score
        row += `<td class="total-cell ${isWinner ? 'winner' : ''}">${competitor.score || '0'}</td>`;

        return `<tr>${row}</tr>`;
    }

    // Render team leaders (passing, rushing, receiving)
    renderTeamLeaders() {
        const competition = this.currentGame.competitions[0];
        const leaders = competition.leaders || [];

        if (leaders.length === 0) {
            this.elements.teamLeaders.innerHTML = `
                <div class="no-data-message">
                    <p>Game leaders not available for this game</p>
                </div>
            `;
            return;
        }

        // Organize leaders by category
        const leaderCategories = {
            passing: leaders.find(l => l.name === 'passingLeader' || l.name === 'passingYards'),
            rushing: leaders.find(l => l.name === 'rushingLeader' || l.name === 'rushingYards'), 
            receiving: leaders.find(l => l.name === 'receivingLeader' || l.name === 'receivingYards')
        };

        let leadersHTML = '<div class="leaders-grid">';

        Object.entries(leaderCategories).forEach(([category, leaderData]) => {
            if (leaderData && leaderData.leaders) {
                leadersHTML += this.createLeaderSection(category, leaderData);
            }
        });

        leadersHTML += '</div>';
        this.elements.teamLeaders.innerHTML = leadersHTML;
    }

    // Create leader section for specific category
    createLeaderSection(category, leaderData) {
        const categoryTitles = {
            passing: 'Passing Leader',
            rushing: 'Rushing Leader',
            receiving: 'Receiving Leader'
        };

        let section = `<div class="leader-section">`;
        section += `<h4 class="leader-category">${categoryTitles[category] || leaderData.displayName}</h4>`;
        
        leaderData.leaders.forEach(leader => {
            const athlete = leader.athlete;
            const teamId = leader.team.id;
            
            // Find the team info from the competitors to get the proper team name
            const competition = this.currentGame.competitions[0];
            const competitors = competition.competitors || [];
            const teamInfo = competitors.find(c => c.team.id === teamId);
            const teamName = teamInfo ? teamInfo.team.abbreviation : `Team ${teamId}`;
            
            section += `
                <div class="leader-card">
                    <img src="${athlete.headshot}" alt="${athlete.displayName}" class="leader-photo" 
                         onerror="this.src='https://via.placeholder.com/80x80?text=${athlete.shortName}'">
                    <div class="leader-info">
                        <div class="leader-name">${athlete.displayName}</div>
                        <div class="leader-position">${athlete.position.abbreviation} • #${athlete.jersey}</div>
                        <div class="leader-team">${teamName}</div>
                        <div class="leader-stats">${leader.displayValue}</div>
                    </div>
                </div>
            `;
        });
        
        section += `</div>`;
        return section;
    }

    // Render additional game information
    renderGameInfo() {
        const competition = this.currentGame.competitions[0];
        const status = competition.status;
        
        let infoHTML = '<div class="game-info-grid">';

        // Game Status
        infoHTML += `
            <div class="info-section">
                <h4>Game Status</h4>
                <div class="info-content">
                    <div>Status: ${status.type.description}</div>
                    ${status.type.completed ? 
                        `<div>Final Score</div>` : 
                        `<div>Clock: ${status.displayClock}</div>
                         <div>Period: ${status.period || 'N/A'}</div>`
                    }
                </div>
            </div>
        `;

        // Betting Odds (if available and game is scheduled)
        if (competition.odds && competition.odds.length > 0 && status.type.state === 'pre') {
            const odds = competition.odds[0];
            infoHTML += `
                <div class="info-section">
                    <h4>Betting Odds</h4>
                    <div class="info-content">
                        <div>Spread: ${odds.details || 'N/A'}</div>
                        <div>Over/Under: ${odds.overUnder || 'N/A'}</div>
                        <div>Favorite: ${odds.homeTeamOdds.favorite ? odds.homeTeamOdds.team.abbreviation : 
                                       odds.awayTeamOdds.favorite ? odds.awayTeamOdds.team.abbreviation : 'Even'}</div>
                    </div>
                </div>
            `;
        }

        // Broadcast Information
        if (competition.broadcasts && competition.broadcasts.length > 0) {
            const networks = competition.broadcasts[0].names.join(', ');
            infoHTML += `
                <div class="info-section">
                    <h4>Broadcast</h4>
                    <div class="info-content">
                        <div>Networks: ${networks}</div>
                    </div>
                </div>
            `;
        }

        // Venue Information
        infoHTML += `
            <div class="info-section">
                <h4>Venue</h4>
                <div class="info-content">
                    <div>${competition.venue.fullName}</div>
                    <div>${competition.venue.address.city}, ${competition.venue.address.state}</div>
                    <div>${competition.venue.indoor ? 'Indoor' : 'Outdoor'} Stadium</div>
                </div>
            </div>
        `;

        infoHTML += '</div>';
        this.elements.gameInfo.innerHTML = infoHTML;
    }

    // Get team record string
    getTeamRecord(competitor) {
        if (competitor.records && competitor.records.length > 0) {
            const overallRecord = competitor.records.find(r => r.name === 'Overall' || r.type === 'total');
            return overallRecord ? overallRecord.summary : '';
        }
        return '';
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