// Scoreboard View - Handles week display and game cards
class ScoreboardView {
  constructor(app) {
    this.app = app;
    this.weekData = null;
    this.currentWeek = 1;
    this.regularSeasonWeeks = [];
    this.filters = {
      team: 'all',
      status: 'all',
      day: 'all',
    };

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
      currentWeekDates: document.getElementById('current-week-dates'),
      toolbar: document.getElementById('scoreboard-toolbar'),
      teamFilter: document.getElementById('team-filter'),
      statusFilter: document.getElementById('status-filter'),
      dayFilter: document.getElementById('day-filter'),
      clearFilters: document.getElementById('clear-filters'),
      gamesSummary: document.getElementById('games-summary'),
    };
  }

  // Bind event listeners
  bindEvents() {
    this.elements.prevWeekBtn.addEventListener('click', () =>
      this.navigateWeek(-1)
    );
    this.elements.nextWeekBtn.addEventListener('click', () =>
      this.navigateWeek(1)
    );
    this.elements.weekSelect.addEventListener('change', e =>
      this.goToWeek(parseInt(e.target.value))
    );
    this.elements.teamFilter.addEventListener('change', e => {
      this.filters.team = e.target.value;
      this.applyFilters();
    });
    this.elements.statusFilter.addEventListener('change', e => {
      this.filters.status = e.target.value;
      this.applyFilters();
    });
    this.elements.dayFilter.addEventListener('change', e => {
      this.filters.day = e.target.value;
      this.applyFilters();
    });
    this.elements.clearFilters.addEventListener('click', () =>
      this.resetFilters()
    );
  }

  // Initialize with week data
  initialize(weekData) {
    this.weekData = weekData;
    this.regularSeasonWeeks = Array.from(weekData.keys()).sort((a, b) => a - b);
    this.currentWeek = this.findCurrentWeek() || 1;
    this.populateWeekSelector();
    this.populateTeamFilter();
  }

  // Show scoreboard view
  show(weekNumber = null) {
    // Properly show elements
    this.elements.weekNav.classList.add('visible');
    this.elements.weekNav.style.display = 'block';
    this.elements.toolbar.classList.add('visible');

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

        today.setUTCHours(0, 0, 0, 0);
        weekStart.setUTCHours(0, 0, 0, 0);
        weekEnd.setUTCHours(0, 0, 0, 0);

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
    const weekData = this.weekData?.get(weekNumber);

    if (!weekData) {
      this.showNoGamesMessage(`No data available for Week ${weekNumber}`);
      return;
    }

    // Update week info
    this.elements.currentWeekTitle.textContent = `Week ${weekNumber}`;
    this.elements.weekSelect.value = weekNumber;

    // Handle offline data
    if (weekData.offline) {
      this.showNoGamesMessage(
        weekData.error ||
          'No cached games available for this week - connect to internet to load games'
      );
      return;
    }

    // Calculate and display week date range
    const dateRange = this.calculateWeekDateRange(weekData.events);
    this.elements.currentWeekDates.textContent = dateRange;
    this.populateDayFilter(weekData.events);

    // Render games
    if (weekData.events && weekData.events.length > 0) {
      this.applyFilters();
    } else {
      this.showNoGamesMessage(`No games scheduled for Week ${weekNumber}`);
    }
  }

  // Show no games message with custom text
  showNoGamesMessage(message) {
    // Update the message text if there's a message element
    const messageElement = this.elements.noGames.querySelector('p');
    if (messageElement) {
      messageElement.textContent = message;
    }

    this.elements.noGames.classList.add('visible');
    this.elements.noGames.style.display = 'block';
    this.elements.gamesContainer.classList.remove('visible');
    this.elements.gamesContainer.style.display = 'none';
    this.elements.gamesSummary.textContent = 'No games available';
  }

  // Calculate date range for the week
  calculateWeekDateRange(events) {
    if (!events || events.length === 0) return '';

    const dates = events
      .map(event => new Date(event.date))
      .sort((a, b) => a - b);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    const formatDate = date => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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
    this.elements.nextWeekBtn.disabled =
      currentIndex === this.regularSeasonWeeks.length - 1;
  }

  populateTeamFilter() {
    const teams = new Map();

    for (const weekData of this.weekData.values()) {
      for (const event of weekData.events || []) {
        for (const competitor of event.competitions?.[0]?.competitors || []) {
          teams.set(competitor.team.abbreviation, competitor.team.displayName);
        }
      }
    }

    const options = Array.from(teams.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(
        ([abbreviation, name]) =>
          `<option value="${abbreviation}">${name}</option>`
      )
      .join('');

    this.elements.teamFilter.innerHTML =
      '<option value="all">All teams</option>' + options;
  }

  populateDayFilter(events) {
    const selectedDay = this.filters.day;
    const days = new Map();

    for (const event of events || []) {
      const date = new Date(event.date);
      const key = this.getLocalDateKey(date);
      days.set(
        key,
        date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    }

    const options = Array.from(days.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => `<option value="${key}">${label}</option>`)
      .join('');

    this.elements.dayFilter.innerHTML =
      '<option value="all">All days</option>' + options;

    if (days.has(selectedDay)) {
      this.elements.dayFilter.value = selectedDay;
    } else {
      this.filters.day = 'all';
    }
  }

  resetFilters() {
    this.filters = { team: 'all', status: 'all', day: 'all' };
    this.elements.teamFilter.value = 'all';
    this.elements.statusFilter.value = 'all';
    this.elements.dayFilter.value = 'all';
    this.applyFilters();
  }

  applyFilters() {
    const weekData = this.weekData?.get(this.currentWeek);
    if (!weekData?.events) return;

    const filteredEvents = weekData.events.filter(event => {
      const competition = event.competitions?.[0];
      const matchesTeam =
        this.filters.team === 'all' ||
        competition?.competitors?.some(
          competitor => competitor.team.abbreviation === this.filters.team
        );
      const matchesStatus =
        this.filters.status === 'all' ||
        competition?.status?.type?.state === this.filters.status;
      const matchesDay =
        this.filters.day === 'all' ||
        this.getLocalDateKey(new Date(event.date)) === this.filters.day;

      return matchesTeam && matchesStatus && matchesDay;
    });

    this.renderGames(filteredEvents, this.currentWeek);
    this.updateFilterSummary(filteredEvents.length, weekData.events.length);

    const hasGames = filteredEvents.length > 0;
    this.elements.gamesContainer.classList.toggle('visible', hasGames);
    this.elements.gamesContainer.style.display = hasGames ? 'block' : 'none';
    this.elements.noGames.classList.toggle('visible', !hasGames);
    this.elements.noGames.style.display = hasGames ? 'none' : 'block';

    if (!hasGames) {
      this.elements.noGames.querySelector('p').textContent =
        'No games match these filters.';
    }
  }

  updateFilterSummary(filteredCount, totalCount) {
    const activeFilters = Object.values(this.filters).filter(
      value => value !== 'all'
    ).length;
    const gameLabel = filteredCount === 1 ? 'game' : 'games';

    this.elements.gamesSummary.textContent =
      activeFilters > 0
        ? `${filteredCount} of ${totalCount} ${gameLabel}`
        : `${totalCount} ${totalCount === 1 ? 'game' : 'games'} this week`;
    this.elements.clearFilters.classList.toggle('visible', activeFilters > 0);
  }

  getLocalDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Render all games for a week
  renderGames(events, weekNumber) {
    this.elements.gamesGrid.innerHTML = '';

    // Sort events by date
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    let currentDay = null;
    sortedEvents.forEach(event => {
      const gameDate = new Date(event.date);
      const dayKey = this.getLocalDateKey(gameDate);

      if (dayKey !== currentDay) {
        currentDay = dayKey;
        const heading = document.createElement('h3');
        heading.className = 'game-day-heading';
        heading.textContent = gameDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        this.elements.gamesGrid.appendChild(heading);
      }

      const gameCard = this.createGameCard(event, weekNumber);
      this.elements.gamesGrid.appendChild(gameCard);
    });
  }

  // Create individual game card
  createGameCard(event, weekNumber) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.cursor = 'pointer';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View game details for ${event.name}`);

    // Add click handler for navigation to game detail
    card.addEventListener('click', e => {
      const teamButton = e.target.closest('.team-name');
      if (teamButton?.dataset.teamAbbr) {
        e.stopPropagation();
        this.app.navigateToTeamSchedule(teamButton.dataset.teamAbbr);
        return;
      }

      // Otherwise navigate to game detail
      this.app.navigateToGame(weekNumber, event.id);
    });
    card.addEventListener('keydown', e => {
      if (e.target.closest('.team-name')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.app.navigateToGame(weekNumber, event.id);
      }
    });

    const competition = event.competitions[0];
    const status = competition.status;
    const competitors = competition.competitors;

    // Get teams (home/away)
    const homeTeam = competitors.find(c => c.homeAway === 'home');
    const awayTeam = competitors.find(c => c.homeAway === 'away');

    // Format game date and time
    const gameDate = new Date(event.date);
    const timeStr = gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    card.innerHTML = `
            <div class="game-header">
                <div class="game-time">${timeStr}</div>
                <div class="game-status ${this.getStatusClass(status)}">${status.type.shortDetail}</div>
            </div>
            
            <div class="teams-container">
                <div class="team-matchup">
                    ${this.createTeamHTML(awayTeam, status)}
                    ${this.createTeamHTML(homeTeam, status)}
                </div>
            </div>
            
            <div class="game-details">
                <div class="venue-info">${competition.venue?.fullName || 'Venue TBD'}${competition.venue?.address?.city ? ` · ${competition.venue.address.city}` : ''}</div>
                ${this.createGameDetailsHTML(competition, status)}
            </div>
        `;

    return card;
  }

  // Create team HTML section
  createTeamHTML(competitor, status) {
    const team = competitor.team;
    const score = competitor.score || '0';
    const isWinner = competitor.winner || false;
    const showScore =
      status.type.state === 'in' || status.type.state === 'post';

    // Get team logo (fallback to ESPN default)
    const logoUrl =
      team.logo ||
      `https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbreviation.toLowerCase()}.png`;

    return `
            <div class="team">
                <img src="${logoUrl}" alt="" class="team-logo"
                     onerror="this.src='https://a.espncdn.com/i/teamlogos/nfl/500/default-team.png'">
                <div class="team-info">
                    <button class="team-name" data-team-abbr="${team.abbreviation}" title="View ${team.displayName} schedule">
                      <span class="team-abbreviation">${team.abbreviation}</span>
                      <span class="team-city">${team.displayName}</span>
                    </button>
                </div>
                ${showScore ? `<div class="team-score ${isWinner ? 'winner' : ''}">${score}</div>` : ''}
            </div>
        `;
  }

  // Create game details section (odds for scheduled, live info for in-progress, broadcast for others)
  createGameDetailsHTML(competition, status) {
    let detailsHTML = '';

    // Show live game info for in-progress games
    if (status.type.state === 'in') {
      detailsHTML += `
                <div class="live-game-info">
                    <div class="game-clock">
                        <span class="clock-icon">🕐</span>
                        <span class="clock-text">${status.displayClock} - ${this.formatPeriod(status.period)}</span>
                    </div>
                    ${this.createSituationInfo(competition)}
                </div>
            `;
    }

    // Show betting odds for scheduled games
    if (
      status.type.state === 'pre' &&
      competition.odds &&
      competition.odds.length > 0
    ) {
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
                            ${
                              odds.homeTeamOdds.favorite
                                ? odds.homeTeamOdds.team.abbreviation
                                : odds.awayTeamOdds.favorite
                                  ? odds.awayTeamOdds.team.abbreviation
                                  : 'EVEN'
                            }
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

  // Format period number to readable quarter
  formatPeriod(period) {
    switch (period) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      case 4:
        return '4th';
      default:
        return `${period > 4 ? 'OT' : period}`;
    }
  }

  // Create situation info for live games
  createSituationInfo(competition) {
    if (!competition.situation) return '';

    const situation = competition.situation;
    let situationHTML = '';

    // Show possession if available
    if (situation.possession) {
      const possessionTeam = competition.competitors.find(
        c => c.id === situation.possession
      );
      if (possessionTeam) {
        situationHTML += `
                    <div class="possession-info">
                        <span class="possession-icon">🏈</span>
                        <span>${possessionTeam.team.abbreviation} has possession</span>
                    </div>
                `;
      }
    }

    // Show down and distance if available
    if (situation.shortDownDistanceText) {
      situationHTML += `
                <div class="down-distance">
                    ${situation.shortDownDistanceText}
                </div>
            `;
    }

    return situationHTML;
  }
}

export default ScoreboardView;
