export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T12:00:00`);
  return Number.isFinite(d.getTime()) && dateKey(d) === value ? value : null;
}
export function programPeriod(program) {
  const start = validDate(program.applicationStartDate);
  const end = validDate(program.applicationEndDate);
  return start && end && start > end ? { start: null, end: null } : { start, end };
}
export function programsOnDate(programs, key) {
  return programs.filter(p => {
    const { start, end } = programPeriod(p);
    if (start && end) return start <= key && key <= end;
    return key === (end || start);
  });
}
export function monthCells(year, month) {
  const first = new Date(year, month, 1, 12);
  return Array.from({length:42},(_,i)=>new Date(year,month,1-first.getDay()+i,12));
}
