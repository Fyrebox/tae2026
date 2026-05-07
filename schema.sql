CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  presenter   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendees (
  id         SERIAL PRIMARY KEY,
  course_id  INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, name)
);

ALTER TABLE courses DROP COLUMN IF EXISTS starts_at;
ALTER TABLE courses DROP COLUMN IF EXISTS duration_min;
ALTER TABLE courses DROP COLUMN IF EXISTS location;
ALTER TABLE courses DROP COLUMN IF EXISTS max_attendees;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_at_2 TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS meeting_link TEXT;

DROP INDEX IF EXISTS idx_courses_starts_at;
CREATE INDEX IF NOT EXISTS idx_attendees_course ON attendees(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_scheduled_at ON courses(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_courses_scheduled_at_2 ON courses(scheduled_at_2);
