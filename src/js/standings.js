import { withReturnRoute } from './navigation.js';

const columns = [
  ['wins', 'W', 'Wins'],
  ['losses', 'L', 'Losses'],
  ['ties', 'T', 'Ties'],
  ['winPercent', 'PCT', 'Winning percentage'],
  ['divisionRecord', 'DIV', 'Division record'],
  ['pointDifferential', 'DIFF', 'Point differential'],
];

export function getStatDisplay(entry, name) {
  const stat = entry.stats?.find(stat => stat.name === name);
  return stat?.displayValue ?? (stat?.value != null ? String(stat.value) : '-');
}

class StandingsView {
  constructor(app) {
    this.app = app;
    this.container = document.getElementById('standings-container');
    this.content = document.getElementById('standings-content');
    this.status = document.getElementById('standings-status');
    this.retryButton = document.getElementById('retry-standings');
    this.retryButton.addEventListener('click', () => this.show(true));
    this.content.addEventListener('click', event => {
      const row = event.target.closest('tr[data-team]');
      if (!row || event.target.closest('a')) return;
      const link = row.querySelector('a');
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        return;
      }
      link.click();
    });
  }

  async show(forceRefresh = false) {
    this.container.classList.add('visible');
    this.container.style.display = 'block';
    this.status.textContent = 'Loading standings...';
    this.retryButton.hidden = true;
    this.content.replaceChildren();
    this.container.setAttribute('aria-busy', 'true');

    try {
      const data = await this.app.apiService.fetchStandings(forceRefresh);
      this.render(data);
      this.status.textContent =
        data.offline || this.app.apiService.isOffline()
          ? 'Offline - showing cached standings.'
          : 'Select any team to view its season schedule. Order provided by ESPN.';
    } catch (error) {
      console.error('Failed to load standings:', error);
      this.status.textContent =
        'Unable to load standings. Check your connection and try again.';
      this.retryButton.hidden = false;
    } finally {
      this.container.setAttribute('aria-busy', 'false');
    }
  }

  render(data) {
    const fragment = document.createDocumentFragment();
    for (const conference of data.children) {
      const section = document.createElement('section');
      section.className = 'standings-conference';
      const heading = document.createElement('h3');
      heading.textContent = conference.name;
      section.append(heading);
      const divisions = document.createElement('div');
      divisions.className = 'standings-divisions';
      for (const division of conference.children) {
        divisions.append(this.renderDivision(division));
      }
      section.append(divisions);
      fragment.append(section);
    }
    this.content.replaceChildren(fragment);
  }

  renderDivision(division) {
    const wrapper = document.createElement('div');
    wrapper.className = 'standings-table-wrapper';
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', `${division.name} standings`);
    const table = document.createElement('table');
    table.className = 'standings-table';
    const caption = table.createCaption();
    caption.textContent = division.name;
    const header = table.createTHead().insertRow();
    for (const [, label, description] of [
      ['team', 'Team', 'Team'],
      ...columns,
    ]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      cell.title = description;
      header.append(cell);
    }
    const body = table.createTBody();
    for (const entry of division.standings.entries) {
      const row = body.insertRow();
      row.dataset.team = entry.team.abbreviation;
      const cell = document.createElement('th');
      cell.scope = 'row';
      const link = document.createElement('a');
      link.className = 'standings-team-link';
      link.href = withReturnRoute(
        `#/team/${entry.team.abbreviation.toLowerCase()}/schedule`,
        '#/standings'
      );
      link.setAttribute(
        'aria-label',
        `${entry.team.displayName} season schedule`
      );
      const logoUrl = entry.team.logos?.[0]?.href;
      if (logoUrl) {
        const logo = document.createElement('img');
        logo.src = logoUrl;
        logo.alt = '';
        logo.width = 28;
        logo.height = 28;
        logo.loading = 'lazy';
        link.append(logo);
      }
      const name = document.createElement('span');
      name.textContent = entry.team.displayName;
      link.append(name);
      cell.append(link);
      row.append(cell);
      for (const [statName] of columns) {
        const statCell = row.insertCell();
        statCell.textContent = getStatDisplay(entry, statName);
        if (statName === 'pointDifferential') {
          const value = entry.stats?.find(
            stat => stat.name === statName
          )?.value;
          if (value > 0) statCell.className = 'positive-differential';
          if (value < 0) statCell.className = 'negative-differential';
        }
      }
    }
    wrapper.append(table);
    return wrapper;
  }
}

export default StandingsView;
