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

The original photographic import has been corrected to 57 assignments: exactly
three per student. Five extra assignments were transferred and nine additional
slots were added, preserving original delivery days wherever possible. Abbey
remains off 6 November. Groups run in parallel on the four November dates.
Every group/day starts at 09:00 and finishes at 13:00, with 30-minute
presentations and breaks of at least 10 minutes (10–40 minutes in the plan).
All times are Australia/Melbourne local time. Filtering by date lists students
in presentation order.

The server checks 30-minute durations within 09:00–13:00 and warns if an edit
overlaps another presentation or leaves less than a 10-minute break. An
organiser can explicitly confirm a conflicting time if an exception is needed.

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

Do not commit `.env`. Railway stores production credentials as service variables.
The schedule PIN is checked on the server and is never included in public files.
Organiser access expires after eight hours or a restart. Lock editing when done.

## Validation

`TEST_DATABASE_URL` must point to a PostgreSQL instance where the test user can
create and drop schemas. Run `npm test` with that environment variable set.
The integration test creates a randomly named schema, validates the original
assignments, the one-time rebalance, saves, persistence, authentication,
stale-edit conflicts, invalid inputs, session durations, breaks and overlap handling, then drops only its test schema. Without the
variable, the database integration test is skipped.

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
