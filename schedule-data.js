// Transcribed from IMG_4315–4318. Red names are delivery assignments.
// Original source for the first import; schedule-plan.js supplies the corrected timetable.
export const SCHEDULE_DATES = ['2026-11-06', '2026-11-13', '2026-11-20', '2026-11-27'];
// Calendar dates are independent of the photographic import and its one-time correction.
export const DELIVERY_DATES = [...SCHEDULE_DATES, '2026-12-04'];
const early = [0, 2], late = [1, 3], every = [0, 1, 2, 3];
export const SCHEDULE_STUDENTS = [
  [1, 'Rachel', early], [1, 'Ali', early], [1, 'Liam', every], [1, 'Olivia', every], [1, 'Cyril', late], [1, 'Sam', late],
  [2, 'Carly', early], [2, 'Nadira', early], [2, 'Jaslyn', every], [2, 'Sylvia', every], [2, 'Helen', late], [2, 'Nada', late],
  [3, 'Ket', early], [3, 'Kylie', early], [3, 'Dylan', early], [3, 'Grace', every], [3, 'Ben', late], [3, 'Remi', late], [3, 'Abbey', late],
].map(([group, name, days], order) => ({ id: name.toLowerCase(), group, name, order, dates: days.map(i => SCHEDULE_DATES[i]), notes: name === 'Abbey' ? 'Away on 6 November.' : '' }));
