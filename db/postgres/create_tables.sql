CREATE TABLE games (
    id UUID PRIMARY KEY,
    date TIMESTAMPTZ,
    home_team TEXT,
    away_team TEXT
);

CREATE TABLE batting_positions (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    home BOOLEAN,
    position SMALLINT,
    player TEXT,
    since SMALLINT
);

CREATE INDEX ON batting_positions(game_id);

CREATE TABLE at_bats (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    home BOOLEAN,
    inning SMALLINT,
    balls SMALLINT,
    strikes SMALLINT,
    position SMALLINT,
    result TEXT,
    farthest_base SMALLINT
);

CREATE INDEX ON at_bats(game_id);
