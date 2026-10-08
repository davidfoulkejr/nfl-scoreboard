export function parseRoute(hash) {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/');
  const returnTo = new URLSearchParams(query).get('from');

  if (path === 'standings') {
    return { view: 'standings' };
  }

  if (parts[0] === 'week' && parts[1]) {
    const week = parseInt(parts[1]);
    if (parts[2] === 'game' && parts[3]) {
      return { view: 'game-detail', week, gameId: parts[3], returnTo };
    }
    return { view: 'scoreboard', week };
  }

  if (parts[0] === 'team' && parts[1] && parts[2] === 'schedule') {
    return {
      view: 'team-schedule',
      teamAbbr: parts[1].toUpperCase(),
      returnTo,
    };
  }

  return { view: 'scoreboard', week: null };
}

export function withReturnRoute(hash, returnTo) {
  return `${hash}?${new URLSearchParams({ from: returnTo })}`;
}

export function getRouteScrollKey(route, currentWeek) {
  switch (route.view) {
    case 'standings':
      return 'standings';
    case 'team-schedule':
      return `team:${route.teamAbbr}`;
    case 'game-detail':
      return `game:${route.week}:${route.gameId}`;
    default:
      return `week:${currentWeek}`;
  }
}

export function getBackNavigation(route, fallbackWeek) {
  const returnTo = route?.returnTo;
  if (returnTo === '#/standings') {
    return { href: returnTo, label: 'Back to Standings' };
  }
  if (/^#\/week\/([1-9]|1[0-8])$/.test(returnTo)) {
    return { href: returnTo, label: 'Back to Scoreboard' };
  }
  if (route?.view === 'game-detail' && returnTo) {
    const [path, query = ''] = returnTo.split('?');
    if (/^#\/team\/[a-z0-9]+\/schedule$/i.test(path)) {
      const parent = new URLSearchParams(query).get('from');
      if (
        !parent ||
        parent === '#/standings' ||
        /^#\/week\/([1-9]|1[0-8])$/.test(parent)
      ) {
        return { href: returnTo, label: 'Back to Team Schedule' };
      }
    }
  }
  return {
    href: fallbackWeek ? `#/week/${fallbackWeek}` : '#/',
    label: 'Back to Scoreboard',
  };
}

export function getNavigationSection(route) {
  if (route.view === 'standings' || route.returnTo === '#/standings') {
    return 'standings';
  }
  if (route.view === 'game-detail') {
    const parent = parseRoute(getBackNavigation(route, route.week).href);
    if (parent.returnTo === '#/standings') return 'standings';
  }
  return 'scoreboard';
}
