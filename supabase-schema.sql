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
CREATE UNIQUE INDEX idx_match_tournament_match_number_unique ON match(tournament_id, match_number);

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

-- ============================================
-- ATOMIC MATCH RESULT SAVE
-- ============================================

CREATE OR REPLACE FUNCTION save_match_result_atomic(
  p_match_id UUID,
  p_home_score INT,
  p_away_score INT,
  p_stats JSONB DEFAULT '{}'::jsonb,
  p_goals JSONB DEFAULT '[]'::jsonb,
  p_advance_bracket BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match match%ROWTYPE;
  v_goal JSONB;
  v_goal_player_id UUID;
  v_goal_minute INT;
  v_winner_id UUID;
  v_round1_count INT;
  v_total_match_count INT;
  v_cumulative INT := 0;
  v_matches_in_round INT;
  v_position_in_round INT;
  v_next_match_number INT;
  v_next_match_id UUID;
  v_final BOOLEAN := false;
  v_updated_match JSONB;
  v_home_goal_count INT := 0;
  v_away_goal_count INT := 0;
BEGIN
  IF p_home_score IS NULL OR p_away_score IS NULL OR p_home_score < 0 OR p_away_score < 0 THEN
    RAISE EXCEPTION 'Scores must be non-negative whole numbers';
  END IF;

  IF jsonb_typeof(p_goals) <> 'array' THEN
    RAISE EXCEPTION 'Goals must be an array';
  END IF;

  SELECT *
  INTO v_match
  FROM match
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.is_bye THEN
    RAISE EXCEPTION 'BYE matches cannot be edited';
  END IF;

  FOR v_goal IN SELECT * FROM jsonb_array_elements(p_goals)
  LOOP
    v_goal_player_id := (v_goal ->> 'player_id')::UUID;
    v_goal_minute := NULLIF(v_goal ->> 'minute', '')::INT;

    IF v_goal_player_id IS DISTINCT FROM v_match.home_player_id
      AND v_goal_player_id IS DISTINCT FROM v_match.away_player_id THEN
      RAISE EXCEPTION 'Goals must use match players';
    END IF;

    IF v_goal_minute IS NOT NULL AND (v_goal_minute < 1 OR v_goal_minute > 130) THEN
      RAISE EXCEPTION 'Goal minutes must be between 1 and 130';
    END IF;

    IF v_goal_player_id = v_match.home_player_id THEN
      v_home_goal_count := v_home_goal_count + 1;
    ELSIF v_goal_player_id = v_match.away_player_id THEN
      v_away_goal_count := v_away_goal_count + 1;
    END IF;
  END LOOP;

  IF v_home_goal_count <> p_home_score OR v_away_goal_count <> p_away_score THEN
    RAISE EXCEPTION 'Goal scorers must match each player score';
  END IF;

  UPDATE match
  SET
    home_score = p_home_score,
    away_score = p_away_score,
    stats = COALESCE(p_stats, '{}'::jsonb),
    is_played = true,
    played_at = now()
  WHERE id = p_match_id
  RETURNING to_jsonb(match.*) INTO v_updated_match;

  DELETE FROM goal
  WHERE match_id = p_match_id;

  FOR v_goal IN SELECT * FROM jsonb_array_elements(p_goals)
  LOOP
    INSERT INTO goal (match_id, player_id, minute)
    VALUES (
      p_match_id,
      (v_goal ->> 'player_id')::UUID,
      NULLIF(v_goal ->> 'minute', '')::INT
    );
  END LOOP;

  IF p_advance_bracket
    AND v_match.stage IS NOT NULL
    AND p_home_score <> p_away_score THEN
    v_winner_id := CASE
      WHEN p_home_score > p_away_score THEN v_match.home_player_id
      ELSE v_match.away_player_id
    END;

    IF v_winner_id IS NULL THEN
      RAISE EXCEPTION 'Cannot determine winner';
    END IF;

    SELECT count(*)
    INTO v_round1_count
    FROM match
    WHERE tournament_id = v_match.tournament_id
      AND round_number = 1;

    SELECT count(*)
    INTO v_total_match_count
    FROM match
    WHERE tournament_id = v_match.tournament_id;

    IF v_match.match_number = v_total_match_count THEN
      UPDATE tournament
      SET status = 'completed'
      WHERE id = v_match.tournament_id;

      v_final := true;
    ELSE
      v_matches_in_round := v_round1_count;

      WHILE v_cumulative + v_matches_in_round < v_match.match_number LOOP
        v_cumulative := v_cumulative + v_matches_in_round;
        v_matches_in_round := v_matches_in_round / 2;
      END LOOP;

      v_position_in_round := v_match.match_number - v_cumulative - 1;
      v_next_match_number := v_cumulative + v_matches_in_round + 1 + floor(v_position_in_round / 2.0)::INT;

      SELECT id
      INTO v_next_match_id
      FROM match
      WHERE tournament_id = v_match.tournament_id
        AND match_number = v_next_match_number
      FOR UPDATE;

      IF v_next_match_id IS NULL THEN
        RAISE EXCEPTION 'Next match not found';
      END IF;

      IF v_position_in_round % 2 = 0 THEN
        UPDATE match
        SET home_player_id = v_winner_id
        WHERE id = v_next_match_id;
      ELSE
        UPDATE match
        SET away_player_id = v_winner_id
        WHERE id = v_next_match_id;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'match', v_updated_match,
    'bracketAdvanced', p_advance_bracket AND v_match.stage IS NOT NULL AND p_home_score <> p_away_score,
    'final', v_final,
    'nextMatchId', v_next_match_id,
    'winnerId', v_winner_id
  );
END;
$$;
