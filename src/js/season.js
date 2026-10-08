export function getNFLSeasonYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  return month < 2 ? year - 1 : year;
}
