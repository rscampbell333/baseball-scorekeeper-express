CREATE TABLE games (
    id UUID PRIMARY KEY,
    date DATE,
    home_team TEXT,
    away TEXT
);

CREATE TABLE at_bats (
    game_id UUID REFERENCES games(id),
    player TEXT,
    inning SMALLINT,
    balls SMALLINT,
    strikes SMALLINT,
    position SMALLINT,
    result TEXT
);