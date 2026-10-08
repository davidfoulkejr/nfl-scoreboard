import test from 'node:test';
import assert from 'node:assert/strict';
import ScoreboardView from '../src/js/scoreboard.js';

function createView() {
  const view = Object.create(ScoreboardView.prototype);
  const classList = { toggle() {} };
  const emptyMessage = {};
  view.filters = { statuses: new Set() };
  view.currentWeek = 5;
  view.weekData = new Map([
    [
      5,
      {
        events: ['pre', 'in', 'post'].map((state, index) => ({
          id: String(index),
          competitions: [{ status: { type: { state } } }],
        })),
      },
    ],
  ]);
  view.elements = {
    gamesContainer: { classList, style: {} },
    noGames: { classList, style: {}, querySelector: () => emptyMessage },
    statusButtons: ['pre', 'in', 'post'].map(status => ({
      dataset: { status },
      setAttribute(name, value) {
        this[name] = value;
      },
    })),
    gamesSummary: {},
  };
  view.renderGames = events => {
    view.rendered = events;
  };
  return view;
}

function pressed(view) {
  return view.elements.statusButtons
    .filter(button => button['aria-pressed'] === 'true')
    .map(button => button.dataset.status);
}

test('no selections defaults to all games with no pressed pills', () => {
  const view = createView();
  view.applyFilters();
  assert.equal(view.rendered.length, 3);
  assert.equal(view.elements.gamesSummary.textContent, '3 games this week');
  assert.deepEqual(pressed(view), []);
});

test('all eight status combinations match the union of selected statuses', () => {
  const statuses = ['pre', 'in', 'post'];
  for (let mask = 0; mask < 8; mask++) {
    const view = createView();
    const selected = statuses.filter((status, index) => mask & (1 << index));
    view.filters.statuses = new Set(selected);
    view.applyFilters();
    assert.deepEqual(
      view.rendered.map(event => event.competitions[0].status.type.state),
      selected.length === 0 ? statuses : selected,
      `Combination ${mask}`
    );
    assert.deepEqual(pressed(view), selected);
  }
});

test('Upcoming + Live hides finished games and preserves both selected pills', () => {
  const view = createView();
  view.toggleStatus('pre');
  view.toggleStatus('in');
  assert.deepEqual(
    view.rendered.map(event => event.id),
    ['0', '1']
  );
  assert.deepEqual(pressed(view), ['pre', 'in']);
  assert.equal(view.elements.gamesSummary.textContent, '2 of 3 games');
  view.applyFilters();
  assert.deepEqual(pressed(view), ['pre', 'in']);
});

test('toggling the final selected status off restores all games', () => {
  const view = createView();
  view.toggleStatus('post');
  assert.equal(view.rendered.length, 1);
  assert.equal(view.elements.gamesSummary.textContent, '1 of 3 games');
  view.toggleStatus('post');
  assert.equal(view.filters.statuses.size, 0);
  assert.equal(view.rendered.length, 3);
  assert.deepEqual(pressed(view), []);
});

test('deselecting one status leaves the other selected until all are toggled off', () => {
  const view = createView();
  view.toggleStatus('pre');
  view.toggleStatus('in');
  view.toggleStatus('pre');
  assert.deepEqual(pressed(view), ['in']);
  assert.deepEqual(
    view.rendered.map(event => event.id),
    ['1']
  );
  view.toggleStatus('in');
  assert.equal(view.filters.statuses.size, 0);
  assert.equal(view.rendered.length, 3);
  assert.deepEqual(pressed(view), []);
});

test('combination with no matching games has an explicit empty state', () => {
  const view = createView();
  view.weekData.get(5).events = view.weekData.get(5).events.slice(2);
  view.toggleStatus('pre');
  view.toggleStatus('in');
  assert.equal(view.elements.gamesContainer.style.display, 'none');
  assert.equal(view.elements.noGames.style.display, 'block');
  assert.equal(
    view.elements.noGames.querySelector('p').textContent,
    'No games match the selected statuses.'
  );
  assert.deepEqual(pressed(view), ['pre', 'in']);
});

test('statuses remain selected across week changes', () => {
  const view = createView();
  view.toggleStatus('pre');
  view.toggleStatus('in');
  view.weekData.set(6, {
    events: [
      { id: '6', competitions: [{ status: { type: { state: 'post' } } }] },
    ],
  });
  view.currentWeek = 6;
  view.applyFilters();
  assert.equal(view.rendered.length, 0);
  assert.deepEqual(pressed(view), ['pre', 'in']);
  view.currentWeek = 5;
  view.applyFilters();
  assert.equal(view.rendered.length, 2);
});

test('pill state updates even when week data is unavailable', () => {
  const view = createView();
  view.weekData.clear();
  view.toggleStatus('in');
  assert.deepEqual(pressed(view), ['in']);
  view.toggleStatus('in');
  assert.deepEqual(pressed(view), []);
});

test('game summary uses singular for a one-game week', () => {
  const view = createView();
  view.weekData.get(5).events = view.weekData.get(5).events.slice(0, 1);
  view.toggleStatus('pre');
  assert.equal(view.elements.gamesSummary.textContent, '1 of 1 game');
  view.toggleStatus('pre');
  assert.equal(view.elements.gamesSummary.textContent, '1 game this week');
});
