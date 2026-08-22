const SEARCH_INSTANCE = 'wtf-shed-happens-library';
const CACHE_TTL = 60 * 60 * 24;

function safeText(value, max = 18000) {
  return String(value ?? '').slice(0, max);
}

export async function hashText(value) {
  const bytes = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function ensureLibrarySchema(env) {
  if (!env.DB) return false;
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS research_library (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      question TEXT,
      summary TEXT,
      r2_key TEXT,
      related INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_research_created ON research_library(created_at DESC)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_research_url ON research_library(url)`).run();
  return true;
}

export async function getResearchCache(env, url, question = '') {
  if (!env.APP_KV) return null;
  const id = await hashText(`${url}\n${question}`);
  try {
    const cached = await env.APP_KV.get(`research:${id}`, 'json');
    return cached && typeof cached === 'object' ? cached : null;
  } catch {
    return null;
  }
}

async function ensureSearchInstance(env) {
  if (!env.AI_SEARCH) return null;
  let instance = env.AI_SEARCH.get(SEARCH_INSTANCE);
  try {
    await instance.info();
    return instance;
  } catch {}
  try {
    instance = await env.AI_SEARCH.create({
      id: SEARCH_INSTANCE,
      ai_gateway_id: 'default',
      cache: true,
      rewrite_query: true,
      reranking: true,
      max_num_results: 8
    });
    return instance;
  } catch {
    return null;
  }
}

async function indexInAiSearch(env, record) {
  const instance = await ensureSearchInstance(env);
  if (!instance) return false;
  const body = [
    `TITLE: ${record.title}`,
    `SOURCE: ${record.url}`,
    record.question ? `QUESTION: ${record.question}` : '',
    '',
    record.summary || '',
    '',
    record.markdown || ''
  ].filter(Boolean).join('\n');
  try {
    const bytes = new TextEncoder().encode(body).buffer;
    await instance.items.upload(`${record.id}.md`, bytes);
    return true;
  } catch {
    return false;
  }
}

export async function persistResearch(env, input) {
  const id = input.id || await hashText(`${input.url}\n${input.question || ''}`);
  const createdAt = input.createdAt || new Date().toISOString();
  const record = {
    id,
    url: safeText(input.url, 2048),
    title: safeText(input.title || input.question || input.url, 300),
    question: safeText(input.question || '', 1000),
    summary: safeText(input.summary || '', 18000),
    markdown: safeText(input.markdown || '', 30000),
    related: input.related !== false,
    createdAt
  };
  const r2Key = `research/${id}.md`;

  if (env.APP_KV) {
    try {
      await env.APP_KV.put(`research:${id}`, JSON.stringify({
        ok: true,
        cached: true,
        url: record.url,
        markdown: record.markdown,
        summary: record.summary,
        related: record.related,
        libraryId: id
      }), { expirationTtl: CACHE_TTL });
    } catch {}
  }

  if (env.MEDIA) {
    try {
      await env.MEDIA.put(r2Key, record.markdown || record.summary, {
        httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
        customMetadata: { source: record.url.slice(0, 1024), researchId: id }
      });
    } catch {}
  }

  if (env.DB) {
    try {
      await ensureLibrarySchema(env);
      await env.DB.prepare(`
        INSERT INTO research_library (id, url, title, question, summary, r2_key, related, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          question = excluded.question,
          summary = excluded.summary,
          r2_key = excluded.r2_key,
          related = excluded.related,
          updated_at = excluded.updated_at
      `).bind(
        id, record.url, record.title, record.question, record.summary,
        r2Key, record.related ? 1 : 0, createdAt, new Date().toISOString()
      ).run();
    } catch {}
  }

  const job = { type: 'index-research', record };
  if (env.JOBS) {
    try {
      await env.JOBS.send(job);
      return { id, queued: true };
    } catch {}
  }
  const indexed = await indexInAiSearch(env, record);
  return { id, queued: false, indexed };
}

function normalizeAiSearch(result) {
  const raw = result?.result || result?.results || result?.data || [];
  const list = Array.isArray(raw) ? raw : raw?.results || raw?.chunks || [];
  return (Array.isArray(list) ? list : []).slice(0, 8).map((item, index) => ({
    id: item?.id || item?.item_id || item?.source?.id || `result-${index + 1}`,
    score: item?.score ?? item?.similarity ?? null,
    text: safeText(item?.text || item?.content || item?.chunk?.text || item?.snippet || '', 3000),
    source: item?.source || item?.metadata || null
  }));
}

export async function searchLibrary(env, query) {
  const q = String(query || '').trim();
  if (!q) return { ok: false, error: 'QUERY_REQUIRED', results: [] };

  if (env.AI_SEARCH) {
    try {
      const instance = await ensureSearchInstance(env);
      if (instance) {
        const result = await instance.search({ messages: [{ role: 'user', content: q }] });
        const normalized = normalizeAiSearch(result);
        if (normalized.length) return { ok: true, engine: 'ai-search', results: normalized };
      }
    } catch {}
  }

  if (env.DB) {
    try {
      await ensureLibrarySchema(env);
      const needle = `%${q.replace(/[%_]/g, '')}%`;
      const rows = await env.DB.prepare(`
        SELECT id, url, title, summary, related, created_at
        FROM research_library
        WHERE related = 1 AND (title LIKE ? OR summary LIKE ? OR question LIKE ?)
        ORDER BY updated_at DESC
        LIMIT 8
      `).bind(needle, needle, needle).all();
      return { ok: true, engine: 'd1-fallback', results: rows?.results || [] };
    } catch {}
  }

  return { ok: true, engine: 'none', results: [] };
}

export async function processLibraryQueue(batch, env) {
  for (const message of batch.messages || []) {
    try {
      if (message.body?.type === 'index-research' && message.body.record) {
        const ok = await indexInAiSearch(env, message.body.record);
        if (!ok) throw new Error('AI_SEARCH_INDEX_FAILED');
      }
      message.ack();
    } catch {
      message.retry();
    }
  }
}

export function storageCapabilities(env) {
  return {
    kv: Boolean(env.APP_KV),
    d1: Boolean(env.DB),
    r2: Boolean(env.MEDIA),
    queues: Boolean(env.JOBS),
    aiSearch: Boolean(env.AI_SEARCH)
  };
}
