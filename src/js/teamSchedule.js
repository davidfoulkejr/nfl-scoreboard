import { getBackNavigation } from './navigation.js';

// Team Schedule View - Handles individual team schedule display across the season
class TeamScheduleView {
  constructor(app) {
    this.app = app;
    this.weekData = null;
    this.currentTeam = null;
    this.teamSchedule = [];
    this.teamColors = null;

    this.initializeElements();
    this.bindEvents();
    this.loadTeamColors();
  }

  // Load team colors data
  async loadTeamColors() {
    try {
      const response = await fetch('/team-colors.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.teamColors = await response.json();
      if (this.currentTeam) this.renderTeamHeader();
    } catch (error) {
      console.warn('Unable to load team colors; using ESPN team color:', error);
      this.teamColors = null;
    }
  }

  getTeamColor() {
    const color =
      this.teamColors?.[this.currentTeam.abbreviation]?.colors?.hex?.[0] ||
      this.currentTeam.color;
    return /^#?[a-f\d]{6}$/i.test(color)
      ? `#${color.replace(/^#/, '')}`
      : '#2d7ff9';
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      container: document.getElementById('team-schedule-container'),
      backButton: document.getElementById('back-from-team-schedule'),
      header: document.getElementById('team-schedule-header'),
      games: document.getElementById('team-schedule-games'),
    };
  }

  // Bind event listeners
  bindEvents() {
    this.elements.backButton.addEventListener('click', () => {
      this.app.navigateBack();
    });
  }

  // Initialize with week data
  initialize(weekData) {
    this.weekData = weekData;
  }

  // Show team schedule view
  show(teamAbbr) {
    document.getElementById('team-schedule-back-label').textContent =
      getBackNavigation(this.app.currentRoute).label;
    this.currentTeam = this.getTeamInfoByAbbr(teamAbbr);

    if (!this.currentTeam) {
      this.app.navigateToScoreboard();
      return;
    }

    // Build team schedule from all weeks
    this.buildTeamSchedule(this.currentTeam.id);

    // Show the container
    this.elements.container.classList.add('visible');
    this.elements.container.style.display = 'block';

    // Render the team schedule
    this.renderTeamSchedule();
  }

  // Get team information by abbreviation from any game data
  getTeamInfoByAbbr(teamAbbr) {
    for (const [weekNum, weekData] of this.weekData) {
      if (weekData.events) {
        for (const event of weekData.events) {
          const competition = event.competitions[0];
          for (const competitor of competition.competitors) {
            if (competitor.team.abbreviation === teamAbbr) {
              return competitor.team;
            }
          }
        }
      }
    }
    return null;
  }

  // Get team information by ID from any game data (for internal use)
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
              gameStatus: competition.status,
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
      result: result,
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
    const formatRecord = (wins, losses, ties) =>
      `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;

    this.elements.header.innerHTML = `
            <div class="team-schedule-title">
                <img src="${this.currentTeam.logo}" alt="" class="team-schedule-logo">
                <div class="team-schedule-info">
                    <p class="eyebrow">${this.app.apiService.seasonYear} Regular Season</p>
                    <h2 class="team-schedule-name">${this.currentTeam.displayName}</h2>
                    <p class="team-schedule-subtitle">Team schedule</p>
                </div>
            </div>
            <div class="schedule-stats" aria-label="Season record">
                <div class="stat-item">
                    <span class="stat-label">Overall</span>
                    <span class="stat-value">${formatRecord(record.wins, record.losses, record.ties)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Home</span>
                    <span class="stat-value">${formatRecord(record.homeWins, record.homeLosses, record.homeTies)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Away</span>
                    <span class="stat-value">${formatRecord(record.awayWins, record.awayLosses, record.awayTies)}</span>
                </div>
            </div>
        `;
    this.elements.header.style.setProperty(
      '--team-accent',
      this.getTeamColor()
    );
  }

  // Calculate team record from schedule
  calculateTeamRecord() {
    let wins = 0,
      losses = 0,
      ties = 0;
    let homeWins = 0,
      homeLosses = 0,
      homeTies = 0;
    let awayWins = 0,
      awayLosses = 0,
      awayTies = 0;

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
        if (game.isHome) homeTies++;
        else awayTies++;
      }
    }

    return {
      wins,
      losses,
      ties,
      homeWins,
      homeLosses,
      homeTies,
      awayWins,
      awayLosses,
      awayTies,
    };
  }

  // Render all schedule games
  renderScheduleGames() {
    this.elements.games.innerHTML = `
            <div class="team-schedule-summary">
                <div>
                    <h3>Season schedule</h3>
                    <p>${this.teamSchedule.length} games this season</p>
                </div>
                <p class="interaction-hint">Select a game for details</p>
            </div>
            <div class="team-schedule-grid"></div>
        `;

    const grid = this.elements.games.querySelector('.team-schedule-grid');
    if (this.teamSchedule.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'no-data-message';
      empty.textContent = 'No schedule data available for this team.';
      grid.append(empty);
      return;
    }
    for (const [state, title] of [
      ['post', 'Completed games'],
      ['in', 'Live now'],
      ['pre', 'Upcoming games'],
    ]) {
      const games = this.teamSchedule.filter(game =>
        state === 'pre'
          ? !['post', 'in'].includes(game.gameStatus.type.state)
          : game.gameStatus.type.state === state
      );
      if (games.length === 0) continue;
      const heading = document.createElement('h4');
      heading.className = 'game-day-heading';
      heading.textContent = `${title} (${games.length})`;
      grid.append(heading);
      for (const game of games) grid.append(this.renderGameCard(game));
    }
  }

  // Render individual game card
  renderGameCard(game) {
    const card = this.app.scoreboard.createGameCard(game.event, game.week, {
      teamLinks: false,
    });
    card.classList.add('team-game-card');
    card.dataset.gameId = game.event.id;
    card.dataset.week = game.week;
    const gameDate = new Date(game.event.date);
    const dateStr = gameDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const time = card.querySelector('.game-header .game-time');
    const kickoff = time.textContent;
    time.textContent = `Week ${game.week} | ${dateStr}`;
    card.querySelectorAll('.team').forEach(team => {
      if (
        team.querySelector('.team-abbreviation').textContent ===
        this.currentTeam.abbreviation
      ) {
        team.classList.add('selected-team');
      }
    });

    const meta = document.createElement('div');
    meta.className = 'team-schedule-game-meta';
    const location = document.createElement('span');
    location.textContent = game.isHome ? 'Home' : 'Away';
    meta.append(location);
    const result = document.createElement('span');
    if (game.result) {
      result.className = `result-badge result-${game.result.toLowerCase()}`;
      result.textContent = { W: 'Win', L: 'Loss', T: 'Tie' }[game.result];
    } else if (game.gameStatus.type.state === 'pre') {
      result.textContent = kickoff;
    }
    meta.append(result);
    card.querySelector('.game-details').prepend(meta);
    return card;
  }
}

export default TeamScheduleView;
