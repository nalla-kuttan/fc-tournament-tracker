-- ============================================
-- FC Tournament Tracker - Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================

-- REGISTERED PLAYER (global registry)
CREATE TABLE registered_player (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  base_team TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TOURNAMENT
CREATE TABLE tournament (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('league', 'knockout', 'cup')),
  pin TEXT NOT NULL, -- bcrypt hashed
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PLAYER (tournament-specific instance)
CREATE TABLE player (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  registered_player_id UUID NOT NULL REFERENCES registered_player(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  seed INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, registered_player_id)
);

CREATE INDEX idx_player_tournament ON player(tournament_id);
CREATE INDEX idx_player_registered ON player(registered_player_id);

-- MATCH
CREATE TABLE match (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournament(id) ON DELETE CASCADE,
  home_player_id UUID REFERENCES player(id) ON DELETE SET NULL,
  away_player_id UUID REFERENCES player(id) ON DELETE SET NULL,
  home_score INT,
  away_score INT,
  round_number INT NOT NULL,
  match_number INT NOT NULL DEFAULT 0,
  stage TEXT, -- 'R16', 'QF', 'SF', 'F', or NULL for league
  is_played BOOLEAN NOT NULL DEFAULT false,
  is_bye BOOLEAN NOT NULL DEFAULT false,
  stats JSONB DEFAULT '{}'::jsonb,
  match_order INT,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_match_tournament ON match(tournament_id);
CREATE INDEX idx_match_round ON match(tournament_id, round_number);
CREATE INDEX idx_match_home ON match(home_player_id);
CREATE INDEX idx_match_away ON match(away_player_id);

-- GOAL
CREATE TABLE goal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES match(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES player(id) ON DELETE CASCADE,
  minute INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goal_match ON goal(match_id);
CREATE INDEX idx_goal_player ON goal(player_id);

-- MUSIC TRACK
CREATE TABLE music_track (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  url TEXT NOT NULL,
  duration INT
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE registered_player ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament ENABLE ROW LEVEL SECURITY;
ALTER TABLE player ENABLE ROW LEVEL SECURITY;
ALTER TABLE match ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_track ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone with the link can view)
CREATE POLICY "Public read" ON registered_player FOR SELECT USING (true);
CREATE POLICY "Public read" ON tournament FOR SELECT USING (true);
CREATE POLICY "Public read" ON player FOR SELECT USING (true);
CREATE POLICY "Public read" ON match FOR SELECT USING (true);
CREATE POLICY "Public read" ON goal FOR SELECT USING (true);
CREATE POLICY "Public read" ON music_track FOR SELECT USING (true);

-- Write access is handled via service_role key in API routes (bypasses RLS)

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE match;
ALTER PUBLICATION supabase_realtime ADD TABLE goal;
ALTER PUBLICATION supabase_realtime ADD TABLE player;

-- ============================================
-- STANDINGS VIEW
-- ============================================

CREATE OR REPLACE VIEW standings AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.team,
  p.tournament_id,
  COUNT(m.id) FILTER (WHERE m.is_played AND NOT m.is_bye) AS played,
  COUNT(m.id) FILTER (WHERE m.is_played AND NOT m.is_bye AND (
    (m.home_player_id = p.id AND m.home_score > m.away_score) OR
    (m.away_player_id = p.id AND m.away_score > m.home_score)
  )) AS wins,
  COUNT(m.id) FILTER (WHERE m.is_played AND NOT m.is_bye AND m.home_score = m.away_score AND (
    m.home_player_id = p.id OR m.away_player_id = p.id
  )) AS draws,
  COUNT(m.id) FILTER (WHERE m.is_played AND NOT m.is_bye AND (
    (m.home_player_id = p.id AND m.home_score < m.away_score) OR
    (m.away_player_id = p.id AND m.away_score < m.home_score)
  )) AS losses,
  COALESCE(SUM(CASE
    WHEN m.home_player_id = p.id THEN m.home_score
    WHEN m.away_player_id = p.id THEN m.away_score
  END) FILTER (WHERE m.is_played AND NOT m.is_bye), 0) AS goals_for,
  COALESCE(SUM(CASE
    WHEN m.home_player_id = p.id THEN m.away_score
    WHEN m.away_player_id = p.id THEN m.home_score
  END) FILTER (WHERE m.is_played AND NOT m.is_bye), 0) AS goals_against
FROM player p
LEFT JOIN match m ON (m.home_player_id = p.id OR m.away_player_id = p.id)
  AND m.tournament_id = p.tournament_id
GROUP BY p.id, p.name, p.team, p.tournament_id;
