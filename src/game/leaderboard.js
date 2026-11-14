// Общий рейтинг в Supabase. Счёт не пишется напрямую в таблицу: забег
// открывается и закрывается через функции базы, которые проверяют время и очки.
import { supabase, BACKEND_ENABLED } from "../lib/supabase";

export const ONLINE = BACKEND_ENABLED;

export async function startRun(character) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("start_game_run", { p_character: character });
  if (error) throw new Error(error.message);
  return data; // uuid забега
}

export async function finishRun(runId, summary, name) {
  if (!supabase || !runId) return null;
  const { data, error } = await supabase.rpc("finish_game_run", {
    p_run: runId,
    p_dist_score: summary.distScore,
    p_bonus_score: summary.bonusScore,
    p_coins: summary.coins,
    p_name: name,
  });
  if (error) throw new Error(error.message);
  return data; // { accepted, best, rank }
}

export async function fetchTop(limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("game_leaderboard", { p_limit: limit });
  if (error) throw new Error(error.message);
  return data || [];
}
