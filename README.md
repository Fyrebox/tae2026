# TAE 2026

An Express website for the TAE class delivery schedule and Session 1 activity.

## Routes

- `/`: shared delivery schedule, grouped by student group and date.
- `/session1`: Rule or AI? activity.
- `/session1/host`: PIN-protected activity host view.
- `/session1/tech`: What does Bellarine already use? (fixed rule, ML, DL or manual).
- `/session2`: What do organisations automate? (match six tasks to a technology).
- `/session1/tech/host`, `/session2/host`: PIN-protected host views for those activities.
- `/bellarine`: Bellarine Pathology work brief, AI use policy, fact sheet, glossary and question stems.
- `/bellarine/role-card`, `/bellarine/links`: Operations Manager role card; vendor and policy links.
- `/report`: Bellarine AI Opportunities Report form (Sessions 1–3). `/report/1`, `/report/2` and `/report/3` show one session's sections; section 3 copies the learner's answers from `/session1/tech` on the same device.
- `/report/host`: PIN-protected list of submitted reports, with a printable view.
- `/how-ai-writes`: optional LLM explainer.

### ICTAII401 class activities

All activity host views use the same `HOST_PIN`. Like `/session1`, the tap-to-choose
activities keep answers in memory only, with an anonymous device id and no names;
**Reset for a new class** clears one activity. Decks live in `pick-decks.js`.

The report form (`report-form.js` drives the form, server validation and host view)
saves on the learner's device as they type. Submitting needs every checklist box
ticked and a first name, and replaces that device's earlier submission. Submitted
reports are held in memory until a reset or restart, so learners can also use
**Download a copy**. Bellarine Pathology and everything in it is fictional.

Click a student to save one course/unit name shared across their presentations.
Use **Edit schedule** and the separate organiser PIN to change dates/times or
add/remove assignments. Overlaps within a group require explicit confirmation.
Recent changes are visible while organiser editing is unlocked.

Each group/date has one **Matt**, **David**, or **Recorded** label. It appears
under the date heading, on phone cards, and in student details. Every presentation
in that group on that date inherits the same label. Students still present three
times; they can have a repeated label across their dates.

Click a day label and enter the organiser PIN to change it for the whole group.
If Matt or David is assigned to another group on that day, the editor offers an
atomic swap. Both group/day versions are checked, and a database constraint also
prevents assigning either instructor to two groups on one day. Multiple groups
can record. Label changes and swaps appear in recent changes. Moving a presentation
inherits the destination group's day label; there is no individual label selector.

The initial allocation rotates across the five calendar dates:

| Date (2026) | Group 1 | Group 2 | Group 3 |
| --- | --- | --- | --- |
| 6 November | Matt | David | Recorded |
| 13 November | David | Recorded | Matt |
| 20 November | Recorded | Matt | David |
| 27 November | Matt | David | Recorded |
| 4 December | David | Recorded | Matt |

New custom dates start with all groups Recorded until an organiser assigns
instructors. Empty dates keep their labels so future moved presentations inherit
them too.

The server reports actual time overlaps within the same group and date. A warning
marker on each affected group tab stays visible while browsing other groups and
regardless of the selected date/search filters. Conflicting calendar cells and
student details show **Time conflict** labels. These indicators update after
edits/moves and the existing 30-second refresh. Different groups use separate
rooms and never conflict with each other. Adjacent presentations and short breaks
are not overlap warnings; the editor checks the 10-minute break rule separately.

The original photographic import has been corrected to 57 assignments: exactly
three per student. Five extra assignments were transferred and nine additional
slots were added, preserving original delivery days wherever possible. Abbey
remains off 6 November. Groups run in parallel on the four November dates.
Every group/day starts at 09:00 and finishes at 13:00, with 30-minute
presentations and breaks of at least 10 minutes (10–40 minutes in the plan).
All times are Australia/Melbourne local time. Filtering by date lists students
in presentation order.

Friday 4 December 2026 is an additional delivery date, initially empty. Select
that date and choose **Move a presentation here**, enter the organiser PIN,
then choose a student, an existing presentation and a new start time. Moving
updates that assignment rather than adding one, preserving its ID, the student's
presentation count and their shared unit name. The finish time is set 30 minutes
later, and a free slot with the minimum break is suggested. The same move control
is available for any selected date. Five-column calendars scroll horizontally on
smaller desktop screens; phones retain the existing student cards.

The server checks 30-minute durations within 09:00–13:00 and warns if an edit
overlaps another presentation or leaves less than a 10-minute break. An
organiser can explicitly confirm a conflicting time if an exception is needed.
Each group is limited to six presentations on a date, including when a time
conflict is overridden. Groups can present in parallel.

## Configuration

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: a PostgreSQL connection string.
- `SCHEDULE_ADMIN_PIN`: a separate organiser PIN of at least six digits.
- `HOST_PIN`: PIN for every activity host view and the report host, independent of the schedule PIN.
- OpenAI variables are only needed for the LLM explainer.

Run `npm ci` then `npm start` (or `npm run dev`). If `DATABASE_URL` is missing,
the activity remains available and the schedule shows a configuration error.
With a database configured, startup creates the `class_schedule` schema and
imports the photographed assignments, then applies the versioned correction
in `schedule-plan.js` and `schedule-rebalance.js` once. Every removed, added, or
timed assignment is recorded in the change history. Existing unit names are
untouched. The correction checks the original assignment set before applying,
then records a migration marker. Subsequent starts preserve organiser edits;
former course-site database tables are not changed.

The `group-day-supervision-v1` migration creates the group/date rotation once,
including empty calendar dates and existing custom presentation dates. It audits
old individual labels and the new group allocation, preserving all presentation
IDs, dates, times, versions and entered unit names. The former individual label
column and history remain available as historical records; the API derives labels
from `group_days`. Later restarts preserve organiser changes to group labels.

Do not commit `.env`. Railway stores production credentials as service variables.
The schedule PIN is checked on the server and is never included in public files.
Organiser access expires after eight hours or a restart. Lock editing when done.

## Validation

`TEST_DATABASE_URL` must point to a PostgreSQL instance where the test user can
create and drop schemas. Run `npm test` with that environment variable set.
The integration test creates a randomly named schema, validates the original
assignments, the one-time rebalance, saves, persistence, authentication,
stale-edit conflicts, invalid inputs, session durations, breaks, overlap handling,
December moves, preserved counts and daily capacity, then drops only its test schema. Without the
variable, the database integration test is skipped.
Group/day tests cover the rotation, inherited labels, protected edits, atomic
swaps, stale versions, instructor uniqueness, recorded groups in parallel, empty
and custom dates, inherited moves, audit history and one-time migration of an
already edited timetable. Conflict tests cover exact, partial and multiple overlaps,
adjacent sessions, separate groups/dates, missing times, and warnings appearing
and clearing through the schedule API.

For a local UI preview with an isolated schema, set `NODE_ENV=test` and
`SCHEDULE_DB_SCHEMA=class_schedule_preview`; production always uses
`class_schedule`. Preview data is separate from the class schedule.

## Deployment

Production is the existing `tae2026` service in Railway's `TAEGordon` project.
GitHub pushes currently do not deploy because Railway's GitHub integration has
lost repository access. Until that integration is repaired, deploy an export of
the committed source with `railway up --path-as-root` using the existing service,
project, and production environment. Exclude local `.env` and preview settings.
Verify Railway reports `SUCCESS` and check the public home page and API after
releasing. PostgreSQL retains schedule edits across application deployments.
