# TAE 2026

An Express website for the TAE class delivery schedule and Session 1 activity.

## Routes

- `/`: shared delivery schedule, grouped by student group and date.
- `/session1`: Rule or AI? activity.
- `/session1/host`: PIN-protected activity host view.
- `/how-ai-writes`: optional LLM explainer.

Click a student to save one course/unit name shared across their presentations.
Use **Edit schedule** and the separate organiser PIN to change dates/times or
add/remove assignments. Overlaps within a group require explicit confirmation.
Recent changes are visible while organiser editing is unlocked.

Each presentation has a **Matt**, **David**, or **Recorded** badge. Each student's
three presentations should have one of each. The PIN-protected presentation editor
includes an assistance/recording selector; selecting a label already used by that
student offers an atomic swap with their other presentation. Both versions are
checked so concurrent edits cannot silently overwrite either session. A date/time
move keeps the label. Swaps and all other label changes appear in recent changes.

Instructor checks span all groups: Matt or David cannot assist two overlapping
presentations without an explicit organiser override. Recordings may run in
parallel. Overrides remain visibly flagged, and the group view and student details
flag missing, repeated or unassigned labels after assignments are added or removed.

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
- `HOST_PIN`: PIN for the Session 1 host, independent of the schedule PIN.
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

The `presentation-supervision-v1` import adds labels once against the actual saved
timetable, using a constraint search to give each student one of each while avoiding
instructor double-booking. It changes only labels and presentation versions and
audits the allocation. Later restarts preserve edits. If an edited timetable has no
conflict-free allocation, the initial labels still provide one of each for students
with three sessions, and any conflicts are displayed for organiser correction.

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
Supervision tests cover allocation, concurrent recordings, protected edits, atomic
swaps, stale versions, instructor overrides, label-preserving moves, audit history,
and one-time migration of an already edited timetable.

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
