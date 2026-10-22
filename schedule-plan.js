// Corrected timetable: the groups run in parallel, with three deliveries per student.
// Keep original delivery dates wherever possible; transfer five extras and add nine slots.
export const DAILY_PRESENTERS = {
  '2026-11-06': {
    1: ['rachel', 'ali', 'olivia', 'cyril'],
    2: ['carly', 'nadira', 'jaslyn', 'sylvia', 'nada'],
    3: ['dylan', 'grace', 'ben', 'remi', 'ket', 'kylie'],
  },
  '2026-11-13': {
    1: ['liam', 'cyril', 'sam', 'rachel'],
    2: ['helen', 'nada', 'carly', 'jaslyn', 'sylvia'],
    3: ['ben', 'remi', 'abbey', 'ket', 'dylan'],
  },
  '2026-11-20': {
    1: ['olivia', 'sam', 'rachel', 'ali', 'liam'],
    2: ['sylvia', 'helen', 'carly', 'nadira'],
    3: ['ket', 'kylie', 'dylan', 'grace', 'abbey'],
  },
  '2026-11-27': {
    1: ['cyril', 'sam', 'ali', 'liam', 'olivia'],
    2: ['nada', 'nadira', 'jaslyn', 'helen'],
    3: ['abbey', 'kylie', 'grace', 'ben', 'remi'],
  },
};
// Every group/day starts at 09:00, finishes at 13:00, and has at least a
// ten-minute break between presentations. Start times use five-minute increments.
const STARTS = {
  4: [540, 610, 680, 750],
  5: [540, 590, 645, 700, 750],
  6: [540, 580, 625, 665, 710, 750],
};
const time = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
export const BALANCED_PRESENTATIONS = Object.entries(DAILY_PRESENTERS).flatMap(([date, groups]) =>
  Object.entries(groups).flatMap(([group, students]) => students.map((studentId, index) => ({
    studentId, group: Number(group), date,
    startTime: time(STARTS[students.length][index]),
    endTime: time(STARTS[students.length][index] + 30),
  })))
);
