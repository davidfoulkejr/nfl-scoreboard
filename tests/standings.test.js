import test from 'node:test';
import assert from 'node:assert/strict';
import APIService from '../src/js/apiService.js';
import { getStatDisplay } from '../src/js/standings.js';

function standingsData() {
  return {
    children: [
      {
        name: 'AFC',
        children: [
          {
            name: 'AFC East',
            standings: {
              entries: [
                {
                  team: { abbreviation: 'BUF', displayName: 'Buffalo Bills' },
                  stats: [
                    { name: 'wins', value: 0, displayValue: '0' },
                    { name: 'ties', value: 1, displayValue: '1' },
                    { name: 'winPercent', value: 0.5, displayValue: '.500' },
                    {
                      name: 'pointDifferential',
                      value: -7,
                      displayValue: '-7',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

test('standings request uses selected regular season and caches results', async t => {
  const data = standingsData();
  const requests = [];
  t.mock.method(globalThis, 'fetch', async url => {
    requests.push(url);
    return { ok: true, json: async () => data };
  });
  const service = new APIService();
  service.seasonYear = 2026;
  const [first, second] = await Promise.all([
    service.fetchStandings(),
    service.fetchStandings(),
  ]);
  assert.equal(first, data);
  assert.equal(second, data);
  assert.equal(await service.fetchStandings(), data);
  assert.equal(requests.length, 1);
  assert.match(requests[0], /season=2026&type=2&level=3$/);
  await service.fetchStandings(true);
  assert.equal(requests.length, 2);
  service.standingsLoadedAt = Date.now() - 31000;
  await service.fetchStandings();
  assert.equal(requests.length, 3);
});

test('standings failures reject and allow retry', async t => {
  const service = new APIService();
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Network unavailable');
  });
  await assert.rejects(service.fetchStandings(), /Network unavailable/);
  assert.equal(service.standingsRequest, null);
  fetch.mock.mockImplementation(async () => ({
    ok: true,
    json: async () => standingsData(),
  }));
  await service.fetchStandings();
  assert.ok(service.standingsCache);
});

test('HTTP, offline-without-cache, empty and malformed data are errors', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => ({
    ok: false,
    status: 503,
    statusText: 'Unavailable',
  }));
  await assert.rejects(new APIService().fetchStandings(), /HTTP 503/);
  for (const data of [
    { offline: true },
    { children: [] },
    { children: [{ children: [] }] },
    { children: [{ children: [{ standings: { entries: [{}] } }] }] },
  ]) {
    fetch.mock.mockImplementation(async () => ({
      ok: true,
      json: async () => data,
    }));
    await assert.rejects(
      new APIService().fetchStandings(),
      /unavailable or incomplete/
    );
  }
});

test('stat display preserves zeroes, ties, percentages and negative values', () => {
  const entry = standingsData().children[0].children[0].standings.entries[0];
  assert.equal(getStatDisplay(entry, 'wins'), '0');
  assert.equal(getStatDisplay(entry, 'ties'), '1');
  assert.equal(getStatDisplay(entry, 'winPercent'), '.500');
  assert.equal(getStatDisplay(entry, 'pointDifferential'), '-7');
  assert.equal(getStatDisplay(entry, 'streak'), '-');
  assert.equal(
    getStatDisplay({ stats: [{ name: 'wins', value: 0 }] }, 'wins'),
    '0'
  );
});
