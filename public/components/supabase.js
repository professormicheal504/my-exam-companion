/**
 * supabase.js — Shared Supabase client + data helpers for My Exam Companion
 * Include via: <script src="...components/supabase.js"></script>
 * Requires: the Supabase CDN script to be loaded first.
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 */

const MEC_SUPABASE_URL      = 'https://alwplfsqzrijxqujrpyu.supabase.co';
const MEC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsd3BsZnNxenJpanhxdWpycHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5MjQ4OTUsImV4cCI6MjEwMTUwMDg5NX0.m73Ag_LllwlfqVacWq5UbBjLeMDpb-xsg8W3ZFYv3oI';
const TABLE_EXAM_RESULTS    = 'exam_results';

let _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient) {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('[MEC Supabase] SDK not loaded. Add CDN script before supabase.js.');
      return null;
    }
    _supabaseClient = window.supabase.createClient(MEC_SUPABASE_URL, MEC_SUPABASE_ANON_KEY);
  }
  return _supabaseClient;
}

async function getCurrentUser() {
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data: { user }, error } = await sb.auth.getUser();
    if (error) { console.warn('[MEC Supabase] getCurrentUser:', error.message); return null; }
    return user || null;
  } catch (err) {
    console.error('[MEC Supabase] getCurrentUser exception:', err);
    return null;
  }
}

/**
 * Saves a completed CBT result. Falls back to localStorage if not logged in.
 * @param {object} result  { exam_id, title, subjects, totalScore, maxScore, year, timeSpentSecs, answers, questions }
 */
async function saveExamResult(result) {
  try {
    const user = await getCurrentUser();

    const weakSubjects = (result.subjects || [])
      .filter(s => s.total > 0 && (s.score / s.total) < 0.5)
      .map(s => ({ name: s.name, score: s.score, total: s.total, pct: Math.round((s.score / s.total) * 100) }));

    const percentage = result.maxScore > 0
      ? parseFloat(((result.totalScore / result.maxScore) * 100).toFixed(2)) : 0;

    const examIdParts = (result.exam_id || '').split('/');
    const countrySlug = examIdParts[0] || '';
    const examBody    = (examIdParts[1] || '').toUpperCase() || result.title || '';
    const COUNTRY_SLUGS = { nigeria: 'ng', gh: 'gh', ghana: 'gh', us: 'us', usa: 'us', 'united states': 'us' };
    const countryCode = COUNTRY_SLUGS[countrySlug.toLowerCase()] || countrySlug;

    // Store full question+answer data so the user can review later
    const reviewData = {
      answers:   result.answers   || [],
      questions: result.questions || [],
      queryParams: result.queryParams || '',
    };

    if (!user) {
      const pending = JSON.parse(localStorage.getItem('mec_pending_results') || '[]');
      pending.unshift({
        ...result, exam_body: examBody, country: countryCode,
        percentage, weak_subjects: weakSubjects, review_data: reviewData,
        created_at: new Date().toISOString(), _local_id: 'local_' + Date.now(),
      });
      localStorage.setItem('mec_pending_results', JSON.stringify(pending.slice(0, 50)));
      console.log('[MEC Supabase] Not logged in — saved locally as pending.');
      return { saved: false, pending: true };
    }

    const meta     = user.user_metadata || {};
    const userName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Student';
    const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    const row = {
      user_id: user.id, user_name: userName, avatar_initials: initials,
      country: countryCode, exam_id: result.exam_id || '',
      exam_body: examBody, subjects: result.subjects || [],
      total_score: result.totalScore || 0, max_score: result.maxScore || 100,
      percentage, year: result.year || new Date().getFullYear(),
      time_spent_secs: result.timeSpentSecs || 0,
      weak_subjects: weakSubjects, review_data: reviewData,
    };

    const sb = getSupabase();
    const { data, error } = await sb.from(TABLE_EXAM_RESULTS).insert(row).select('id').single();
    if (error) { console.error('[MEC Supabase] saveExamResult:', error.message); return { saved: false, error: error.message }; }

    // Update global rank in profile
    try {
      const { data: resultsData } = await sb.from(TABLE_EXAM_RESULTS)
        .select('subjects')
        .eq('user_id', user.id);
      
      if (resultsData) {
        let globalPoints = 0;
        resultsData.forEach(r => {
          if (r.subjects && Array.isArray(r.subjects)) {
            r.subjects.forEach(s => globalPoints += (s.score || 0));
          }
        });
        
        let level = 1;
        const RANK_LEVELS = [0, 100, 300, 800, 1500, 2500, 4500, 7000, 10000, 15000, 25000, 40000, 65000, 100000, 1000000];
        for (let i = 0; i < RANK_LEVELS.length; i++) {
          if (globalPoints >= RANK_LEVELS[i]) level = i + 1;
          else break;
        }

        await sb.from('profiles').update({ 
          global_points: globalPoints, 
          rank_level: level 
        }).eq('id', user.id);
      }
    } catch (e) {
      console.error('[MEC Supabase] saveExamResult update profile rank error:', e);
    }


    console.log('[MEC Supabase] Result saved! id:', data.id);
    return { saved: true, id: data.id };
  } catch (err) {
    console.error('[MEC Supabase] saveExamResult exception:', err);
    return { saved: false, error: err.message };
  }
}

/**
 * Fetches the current user's history.
 * @param {object} filters { period: 'today'|'week'|'month'|'all', exam_body: string, limit: number }
 */
async function getUserHistory(filters = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { rows: [], error: 'not_logged_in' };

    const sb = getSupabase();
    let query = sb.from(TABLE_EXAM_RESULTS)
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50);

    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let from;
      if (filters.period === 'today') from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      if (filters.period === 'week')  from = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
      if (filters.period === 'month') from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      if (from) query = query.gte('created_at', from);
    }
    if (filters.exam_body && filters.exam_body !== 'all') {
      query = query.eq('exam_body', filters.exam_body.toUpperCase());
    }

    const { data, error } = await query;
    if (error) { console.error('[MEC Supabase] getUserHistory:', error.message); return { rows: [], error: error.message }; }
    return { rows: data || [] };
  } catch (err) {
    console.error('[MEC Supabase] getUserHistory exception:', err);
    return { rows: [], error: err.message };
  }
}

/**
 * Fetches another user's history by matric (exam_id).
 */
async function getFriendHistory(matric, filters = {}) {
  try {
    const sb = getSupabase();
    if (!sb) return { rows: [], error: 'no_client' };

    const { data: profile, error: pError } = await sb
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('exam_id', matric)
      .single();
      
    if (pError || !profile) {
      console.error('[MEC Supabase] getFriendHistory profile error:', pError);
      return { rows: [], error: 'friend_not_found', profile: null };
    }

    let query = sb.from(TABLE_EXAM_RESULTS)
      .select('*').eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 50);

    if (filters.period && filters.period !== 'all') {
      const now = new Date();
      let from;
      if (filters.period === 'today') from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      if (filters.period === 'week')  from = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
      if (filters.period === 'month') from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      if (from) query = query.gte('created_at', from);
    }
    if (filters.exam_body && filters.exam_body !== 'all') {
      query = query.eq('exam_body', filters.exam_body.toUpperCase());
    }

    const { data, error } = await query;
    if (error) { 
      console.error('[MEC Supabase] getFriendHistory results:', error.message); 
      return { rows: [], error: error.message, profile }; 
    }
    return { rows: data || [], profile };
  } catch (err) {
    console.error('[MEC Supabase] getFriendHistory exception:', err);
    return { rows: [], error: err.message, profile: null };
  }
}

/**
 * Fetches leaderboard data with optional filters.
 * @param {object} filters { country: string, exam_body: string, period: string, limit: number }
 */
async function getLeaderboard(filters = {}) {
  try {
    const sb = getSupabase();
    if (!sb) return { rows: [], error: 'no_client' };

    // We select 'subjects' now so we can filter and score by subject in JS
    let query = sb.from(TABLE_EXAM_RESULTS)
      .select('user_id, user_name, avatar_initials, country, exam_body, total_score, max_score, percentage, created_at, subjects')
      .order('percentage', { ascending: false })
      .limit(filters.limit || 1000);

    if (filters.country && filters.country !== 'all') {
      if (filters.country === 'us') {
        query = query.in('country', ['us', 'usa']);
      } else {
        query = query.eq('country', filters.country);
      }
    }
    if (filters.exam_body && filters.exam_body !== 'all') query = query.eq('exam_body', filters.exam_body.toUpperCase());
    if (filters.period    && filters.period    !== 'all') {
      const now = new Date();
      let from;
      if (filters.period === 'today') from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      if (filters.period === 'week')  from = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
      if (filters.period === 'month') from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      if (from) query = query.gte('created_at', from);
    }

    const { data, error } = await query;
    if (error) { console.error('[MEC Supabase] getLeaderboard:', error.message); return { rows: [], error: error.message }; }

    let resultsData = data || [];

    if (resultsData.length > 0) {
      const userIds = [...new Set(resultsData.map(r => r.user_id))];
      // Fetch avatar_urls from profiles
      const { data: profiles } = await sb.from('profiles').select('id, avatar_url').in('id', userIds);
      if (profiles) {
        const avatarMap = {};
        profiles.forEach(p => avatarMap[p.id] = p.avatar_url);
        resultsData.forEach(r => r.avatar_url = avatarMap[r.user_id]);
      }
    }
    
    // Extract unique subjects across all users for dynamic subject dropdown
    const availableSubjectsSet = new Set();
    resultsData.forEach(row => {
      if (row.subjects && Array.isArray(row.subjects)) {
        row.subjects.forEach(s => {
          if (s.name) availableSubjectsSet.add(s.name.toLowerCase().replace(/_/g, ' '));
        });
      }
    });
    const availableSubjects = Array.from(availableSubjectsSet).sort();

    // In-memory Subject Filter & Score extraction
    if (filters.subject && filters.subject !== 'all') {
      const searchSubj = filters.subject.toLowerCase().replace(/_/g, ' ');
      
      const filteredData = [];
      for (const row of resultsData) {
        if (!row.subjects || !Array.isArray(row.subjects)) continue;
        
        // Find if user took this subject
        const match = row.subjects.find(s => 
          s.name && (s.name.toLowerCase() === searchSubj || 
          s.name.toLowerCase().replace(/_/g, ' ') === searchSubj)
        );
        
        if (match) {
          // Temporarily override the score for this leaderboard context
          row.display_score = match.score || 0;
          row.display_max = match.total || 0;
          row.display_pct = row.display_max > 0 ? (row.display_score / row.display_max) * 100 : 0;
          filteredData.push(row);
        }
      }
      resultsData = filteredData;
    } else {
      // Not filtering by subject: use the global exam score
      for (const row of resultsData) {
        row.display_score = row.total_score || 0;
        row.display_max = row.max_score || 0;
        row.display_pct = row.percentage || 0;
      }
    }

    // Best score per user — keep only the single highest-scoring attempt per student.
    // We compare display_score first; if tied, fall back to display_pct so that
    // e.g. 300/400 beats 30/400 and always wins over a lower attempt.
    const bestPerUser = {};
    for (const row of resultsData) {
      const existing = bestPerUser[row.user_id];
      if (!existing) {
        bestPerUser[row.user_id] = row;
      } else {
        const isBetter =
          row.display_score > existing.display_score ||
          (row.display_score === existing.display_score && row.display_pct > existing.display_pct);
        if (isBetter) {
          bestPerUser[row.user_id] = row;
        }
      }
    }
    const ranked = Object.values(bestPerUser).sort((a, b) => {
      // Primary sort: raw points (descending). Secondary: percentage for cross-exam fairness.
      if (b.display_score !== a.display_score) return b.display_score - a.display_score;
      return b.display_pct - a.display_pct;
    });

    const user = await getCurrentUser();
    let currentUserRow = null;
    if (user) {
      const idx = ranked.findIndex(r => r.user_id === user.id);
      if (idx !== -1) { 
        currentUserRow = { ...ranked[idx], rank: idx + 1 }; 
        ranked[idx]._isCurrentUser = true; 
      }
    }
    return { rows: ranked.slice(0, 100), currentUserRow, availableSubjects };
  } catch (err) {
    console.error('[MEC Supabase] getLeaderboard exception:', err);
    return { rows: [], error: err.message };
  }
}

/** Syncs pending offline results once user logs in. */
async function syncPendingResults() {
  try {
    const pending = JSON.parse(localStorage.getItem('mec_pending_results') || '[]');
    if (!pending.length) return;
    const user = await getCurrentUser();
    if (!user) return;
    console.log(`[MEC Supabase] Syncing ${pending.length} pending result(s)...`);
    let synced = 0;
    for (const r of pending) {
      // Clean up injected local fields before resubmitting
      const cleanPayload = {
        exam_id: r.exam_id, title: r.title, subjects: r.subjects,
        totalScore: r.totalScore, maxScore: r.maxScore, year: r.year,
        timeSpentSecs: r.timeSpentSecs, answers: r.review_data?.answers || [],
        questions: r.review_data?.questions || [], queryParams: r.review_data?.queryParams || ''
      };
      const res = await saveExamResult(cleanPayload);
      if (res.saved) synced++;
    }
    localStorage.removeItem('mec_pending_results');
    console.log(`[MEC Supabase] Synced ${synced}/${pending.length} results.`);
  } catch (err) {
    console.error('[MEC Supabase] syncPendingResults exception:', err);
  }
}

window.MECSupabase = { getSupabase, getCurrentUser, saveExamResult, getUserHistory, getFriendHistory, getLeaderboard, syncPendingResults };
