import test from 'node:test';
import assert from 'node:assert/strict';
import TeamScheduleView from '../src/js/teamSchedule.js';
import ScoreboardView from '../src/js/scoreboard.js';

const home = {
  homeAway: 'home',
  score: '21',
  team: { id: '1', abbreviation: 'BUF', displayName: 'Buffalo Bills' },
};
const away = {
  homeAway: 'away',
  score: '14',
  team: { id: '2', abbreviation: 'NE', displayName: 'New England Patriots' },
};

test('team results are relative to the selected team and exclude unfinished games', () => {
  const view = Object.create(TeamScheduleView.prototype);
  const event = {
    competitions: [
      {
        competitors: [home, away],
        status: { type: { completed: true } },
      },
    ],
  };
  assert.equal(view.getTeamGameFromEvent(event, '1').result, 'W');
  assert.equal(view.getTeamGameFromEvent(event, '2').result, 'L');
  event.competitions[0].status.type.completed = false;
  assert.equal(view.getTeamGameFromEvent(event, '1').result, null);
  event.competitions[0].status.type.completed = true;
  event.competitions[0].competitors = [home, { ...away, score: '21' }];
  assert.equal(view.getTeamGameFromEvent(event, '1').result, 'T');
});

test('overall, home and away records include ties but exclude upcoming games', () => {
  const view = Object.create(TeamScheduleView.prototype);
  view.teamSchedule = [
    { result: 'W', isHome: true },
    { result: 'L', isHome: false },
    { result: 'T', isHome: true },
    { result: 'T', isHome: false },
    { result: null, isHome: true },
  ];
  assert.deepEqual(view.calculateTeamRecord(), {
    wins: 1,
    losses: 1,
    ties: 2,
    homeWins: 1,
    homeLosses: 0,
    homeTies: 1,
    awayWins: 0,
    awayLosses: 1,
    awayTies: 1,
  });
});

test('team accent uses local branding, then ESPN color, then default', () => {
  const view = Object.create(TeamScheduleView.prototype);
  view.currentTeam = { abbreviation: 'BUF', color: '00338D' };
  assert.equal(view.getTeamColor(), '#00338D');
  view.teamColors = { BUF: { colors: { hex: ['#abcdef'] } } };
  assert.equal(view.getTeamColor(), '#abcdef');
  view.teamColors = null;
  view.currentTeam.color = 'invalid';
  assert.equal(view.getTeamColor(), '#2d7ff9');
});

test('header displays the season and tie-inclusive split records with an accent', () => {
  const view = Object.create(TeamScheduleView.prototype);
  const styles = new Map();
  view.currentTeam = { ...home.team, color: '00338D', logo: 'team.png' };
  view.app = { apiService: { seasonYear: 2026 } };
  view.teamSchedule = [
    { result: 'W', isHome: true },
    { result: 'L', isHome: false },
    { result: 'T', isHome: true },
    { result: 'T', isHome: false },
  ];
  view.elements = {
    header: {
      style: { setProperty: (name, value) => styles.set(name, value) },
    },
  };
  view.renderTeamHeader();
  assert.match(view.elements.header.innerHTML, /2026 Regular Season/);
  assert.match(view.elements.header.innerHTML, /class="stat-value">1-1-2/);
  assert.match(view.elements.header.innerHTML, /class="stat-value">1-0-1/);
  assert.match(view.elements.header.innerHTML, /class="stat-value">0-1-1/);
  assert.equal(styles.get('--team-accent'), '#00338D');
});

test('weekly cards keep team links while schedule cards use static team labels', () => {
  const view = Object.create(ScoreboardView.prototype);
  const status = { type: { state: 'in' } };
  const weekly = view.createTeamHTML(home, status);
  const schedule = view.createTeamHTML(home, status, false);
  assert.match(weekly, /<button class="team-name"/);
  assert.match(schedule, /<span class="team-name team-name--static"/);
  assert.doesNotMatch(schedule, /<button/);
  assert.match(schedule, /class="team-score ">21/);
  assert.doesNotMatch(
    view.createTeamHTML(home, { type: { state: 'pre' } }, false),
    /class="team-score/
  );
});

test('shared betting details resolve favorites from competitors without embedded team odds', () => {
  const view = Object.create(ScoreboardView.prototype);
  const competition = {
    competitors: [home, away],
    odds: [
      { details: 'BUF -3', overUnder: 44, homeTeamOdds: { favorite: true } },
    ],
  };
  const html = view.createGameDetailsHTML(competition, {
    type: { state: 'pre' },
  });
  assert.match(html, /BUF -3/);
  assert.match(html, /44/);
  assert.match(html, /BUF/);
  competition.odds = [{ details: 'EVEN', overUnder: 44 }];
  assert.match(
    view.createGameDetailsHTML(competition, { type: { state: 'pre' } }),
    /EVEN/
  );
});
