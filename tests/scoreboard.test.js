import test from 'node:test';
import assert from 'node:assert/strict';
import ScoreboardView from '../src/js/scoreboard.js';

function createView() {
  const view = Object.create(ScoreboardView.prototype);
  const classList = { toggle() {} };
  const emptyMessage = {};
  view.filters = { status: 'all' };
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
    statusFilter: { value: 'post' },
    gamesSummary: {},
    clearFilters: { classList },
  };
  view.renderGames = events => {
    view.rendered = events;
  };
  return view;
}

test('weekly status filter shows all, live, upcoming and final games', () => {
  const view = createView();
  view.applyFilters();
  assert.equal(view.rendered.length, 3);
  assert.equal(view.elements.gamesSummary.textContent, '3 games this week');
  for (const status of ['pre', 'in', 'post']) {
    view.filters.status = status;
    view.applyFilters();
    assert.equal(view.rendered.length, 1);
    assert.equal(view.rendered[0].competitions[0].status.type.state, status);
    assert.equal(view.elements.gamesSummary.textContent, '1 of 3 game');
  }
});

test('clearing status restores every game without removed filter elements', () => {
  const view = createView();
  view.filters.status = 'post';
  view.resetFilters();
  assert.deepEqual(view.filters, { status: 'all' });
  assert.equal(view.elements.statusFilter.value, 'all');
  assert.equal(view.rendered.length, 3);
});

test('status filter has an explicit empty state', () => {
  const view = createView();
  view.weekData.get(5).events = [];
  view.filters.status = 'in';
  view.applyFilters();
  assert.equal(view.elements.gamesContainer.style.display, 'none');
  assert.equal(view.elements.noGames.style.display, 'block');
  assert.equal(
    view.elements.noGames.querySelector('p').textContent,
    'No games match this status.'
  );
});
