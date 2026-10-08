import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRoute,
  withReturnRoute,
  getBackNavigation,
  getNavigationSection,
  getRouteScrollKey,
} from '../src/js/navigation.js';

test('standings has a shareable route', () => {
  assert.deepEqual(parseRoute('#/standings'), { view: 'standings' });
  assert.deepEqual(parseRoute('#/week/5'), { view: 'scoreboard', week: 5 });
});

test('scroll keys use the displayed week, including root and invalid-week routes', () => {
  assert.equal(getRouteScrollKey(parseRoute('#/'), 5), 'week:5');
  assert.equal(getRouteScrollKey(parseRoute('#/week/5'), 5), 'week:5');
  assert.equal(getRouteScrollKey(parseRoute('#/week/99'), 5), 'week:5');
  assert.notEqual(getRouteScrollKey(parseRoute('#/week/6'), 6), 'week:5');
});

test('team scroll position is shared across return contexts, but games remain distinct', () => {
  assert.equal(
    getRouteScrollKey(
      parseRoute(withReturnRoute('#/team/buf/schedule', '#/standings'))
    ),
    getRouteScrollKey(
      parseRoute(withReturnRoute('#/team/buf/schedule', '#/week/5'))
    )
  );
  assert.equal(getRouteScrollKey(parseRoute('#/standings')), 'standings');
  assert.equal(
    getRouteScrollKey(parseRoute('#/week/5/game/123')),
    'game:5:123'
  );
  assert.notEqual(
    getRouteScrollKey(parseRoute('#/week/5/game/123')),
    getRouteScrollKey(parseRoute('#/week/5/game/456'))
  );
});
test('standings to schedule to game preserves both return links', () => {
  const schedule = withReturnRoute('#/team/buf/schedule', '#/standings');
  const teamRoute = parseRoute(schedule);
  assert.equal(teamRoute.teamAbbr, 'BUF');
  assert.deepEqual(getBackNavigation(teamRoute), {
    href: '#/standings',
    label: 'Back to Standings',
  });
  const gameRoute = parseRoute(withReturnRoute('#/week/5/game/123', schedule));
  assert.deepEqual(getBackNavigation(gameRoute, 5), {
    href: schedule,
    label: 'Back to Team Schedule',
  });
  assert.equal(getNavigationSection(teamRoute), 'standings');
  assert.equal(getNavigationSection(gameRoute), 'standings');
});

test('scoreboard return preserves the selected week', () => {
  const route = parseRoute(withReturnRoute('#/team/buf/schedule', '#/week/7'));
  assert.equal(getBackNavigation(route).href, '#/week/7');
  assert.equal(getNavigationSection(route), 'scoreboard');
});

test('direct schedule and game links have a scoreboard fallback', () => {
  assert.equal(getBackNavigation(parseRoute('#/team/buf/schedule')).href, '#/');
  assert.equal(
    getBackNavigation(parseRoute('#/week/5/game/123'), 5).href,
    '#/week/5'
  );
});

test('return navigation rejects external and unsupported destinations', () => {
  for (const destination of [
    'https://example.com',
    'javascript:alert(1)',
    '#/week/99',
    '#/week/5/game/123',
    '#/team/buf/schedule?from=https%3A%2F%2Fexample.com',
  ]) {
    assert.equal(
      getBackNavigation({ view: 'game-detail', returnTo: destination }, 5).href,
      '#/week/5'
    );
  }
});
