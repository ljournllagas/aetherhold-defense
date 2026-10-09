ALTER TABLE scores ADD COLUMN waves_completed INTEGER NOT NULL DEFAULT 0 CHECK (waves_completed BETWEEN 0 AND 500);
ALTER TABLE scores ADD COLUMN outcome TEXT NOT NULL DEFAULT 'defeat' CHECK (outcome IN ('victory','defeat','siege-failed'));
ALTER TABLE scores ADD COLUMN siege_bosses_defeated INTEGER NOT NULL DEFAULT 0 CHECK (siege_bosses_defeated BETWEEN 0 AND 7);
