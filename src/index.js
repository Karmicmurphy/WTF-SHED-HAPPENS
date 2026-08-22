import { MetabolicEngine } from './metabolic-engine.js';
import { ProjectVault } from './project-vault.js';
import {
  getResearchCache,
  persistResearch,
  processLibraryQueue,
  searchLibrary,
  storageCapabilities
} from './library-stack.js';

export { MetabolicEngine, ProjectVault };

const VERSION = '0.5.0';
const AI_MODEL = '@cf/zai-org/glm-4.7-flash';
const STT_MODEL = '@cf/openai/whisper-large-v3-turbo';
const TTS_MODEL = '@cf/myshell-ai/melotts';
const MAX_RESEARCH_CHARS = 18_000;
const MAX_UPLOAD_BYTES = 8_000_000;
const MAX_AUDIO_BYTES = 8_000_000;
const MAX_TTS_CHARS = 3_500;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' }
  });
}

function clientId(request) {
  const value = request.headers.get('x-wtf-client') || '';
  return /^[a-zA-Z0-9_-]{8,100}$/.test(value) ? value : null;
}

function track(env, event, detail = '') {
  try {
    env.ANALYTICS?.writeDataPoint({
      blobs: [event, detail.slice(0, 100)],
      doubles: [1],
      indexes: ['wtf-shed-happens']
    });
  } catch {}
}

function safeWebUrl(value) {
  try {
    const u = new URL(value);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local') || h === '0.0.0.0' || h === '127.0.0.1' || h === '::1') return null;
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(h)) return null;
    if (h === '169.254.169.254' || h.endsWith('.internal')) return null;
    return u;
  } catch {
    return null;
  }
}

function gatewayOptions(extra = {}) {
  return {
    gateway: {
      id: 'default',
      skipCache: false,
      collectLog: true,
      ...extra
    }
  };
}

function projectContext(project = {}) {
  const inventory = Array.isArray(project.inventory)
    ? project.inventory.slice(0, 20).map(item => `${item.qty ?? '?'} × ${item.name || 'item'} [${item.source || 'unknown'} / ${item.condition || 'unknown'}]`).join('; ')
    : '';
  const notes = Array.isArray(project.notes)
    ? project.notes.slice(-5).map(note => note.text).filter(Boolean).join(' | ')
    : '';
  return [
    `Project name: ${project.name || 'unknown'}`,
    `Type: ${project.type || 'unknown'}`,
    `Size: ${project.length || '?'} ft x ${project.width || '?'} ft`,
    `Wall height: ${project.wallHeight || '?'} ft`,
    `Stage: ${project.stage || 'unknown'}`,
    `Priority: ${project.priority || 'unknown'}`,
    inventory ? `Known materials: ${inventory}` : 'Known materials: none entered',
    notes ? `Recent field notes: ${notes}` : 'Recent field notes: none'
  ].join('\n');
}

async function runAssistant(request, env) {
  if (!env.AI) return json({ ok: false, error: 'AI_NOT_CONFIGURED' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
  const message = String(body?.message || '').trim();
  if (!message) return json({ ok: false, error: 'MESSAGE_REQUIRED' }, 400);
  const project = body?.project || {};
  const system = `You are the WTF Stupid Simple Builder assistant. Your job is to translate building and DIY information for a beginner who learns by seeing and doing. Use plain language first and trade language second. Be concise, practical, visual, and honest about uncertainty. Never claim a structural plan is approved. Never invent measurements, lumber grade, species, soil capacity, load ratings, manufacturer requirements, or hidden conditions. When one of those matters, say exactly what must be checked. Prefer one clear next step before alternatives. Treat reclaimed, free, Marketplace, barter, scrap, and used materials as legitimate when their condition is suitable. When useful, format the answer as: WHAT IT IS / WHAT TO DO / WHAT TO CHECK / WHY. Do not bury the user in information unless they ask for the deeper explanation.`;
  try {
    const result = await env.AI.run(AI_MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${projectContext(project)}\n\nQuestion: ${message}` }
      ]
    }, gatewayOptions({ cacheTtl: 300 }));
    const response = result?.response || result?.result?.response || result?.text || String(result || '');
    track(env, 'ai', project.type || 'unknown');
    return json({ ok: true, response, model: AI_MODEL, gatewayLogId: env.AI.aiGatewayLogId || null });
  } catch (error) {
    return json({ ok: false, error: 'AI_FAILED', message: String(error?.message || error) }, 502);
  }
}

async function describeUpload(request, env) {
  if (!env.AI) return json({ ok: false, error: 'AI_NOT_CONFIGURED' }, 503);
  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'FORM_DATA_REQUIRED' }, 400); }
  const file = form.get('file');
  const question = String(form.get('question') || '').trim();
  if (!(file instanceof File)) return json({ ok: false, error: 'FILE_REQUIRED' }, 400);
  if (file.size > MAX_UPLOAD_BYTES) return json({ ok: false, error: 'FILE_TOO_LARGE', maxBytes: MAX_UPLOAD_BYTES }, 413);

  try {
    const converted = await env.AI.toMarkdown(
      { name: file.name || 'upload', blob: new Blob([await file.arrayBuffer()], { type: file.type || 'application/octet-stream' }) },
      { conversionOptions: { image: { descriptionLanguage: 'en' }, output: { format: 'text' } } }
    );
    const description = String(converted?.data || converted?.[0]?.data || '');
    if (!description) return json({ ok: false, error: 'NO_DESCRIPTION' }, 502);

    let answer = description;
    if (question) {
      try {
        const ai = await env.AI.run(AI_MODEL, {
          messages: [
            { role: 'system', content: 'Help a beginner identify what is visible in a construction or DIY image/document. Use only the supplied description. Clearly separate what is visible from what cannot be verified. Never declare structural safety, hidden rot, lumber grade, electrical safety, gas safety, soil bearing, or load capacity from an image alone.' },
            { role: 'user', content: `Converted file description:\n${description}\n\nUser question: ${question}` }
          ]
        }, gatewayOptions({ cacheTtl: 120 }));
        answer = ai?.response || ai?.result?.response || ai?.text || description;
      } catch {}
    }
    track(env, 'vision', file.type || 'unknown');
    return json({ ok: true, description, answer, filename: file.name, mimetype: file.type });
  } catch (error) {
    return json({ ok: false, error: 'VISION_FAILED', message: String(error?.message || error) }, 502);
  }
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + step, bytes.length)));
  }
  return btoa(binary);
}

async function transcribeAudio(request, env) {
  if (!env.AI) return json({ ok: false, error: 'AI_NOT_CONFIGURED' }, 503);
  let form;
  try { form = await request.formData(); } catch { return json({ ok: false, error: 'FORM_DATA_REQUIRED' }, 400); }
  const file = form.get('audio') || form.get('file');
  if (!(file instanceof File)) return json({ ok: false, error: 'AUDIO_REQUIRED' }, 400);
  if (file.size > MAX_AUDIO_BYTES) return json({ ok: false, error: 'AUDIO_TOO_LARGE', maxBytes: MAX_AUDIO_BYTES }, 413);
  try {
    const base64 = bufferToBase64(await file.arrayBuffer());
    const result = await env.AI.run(STT_MODEL, {
      audio: base64,
      task: 'transcribe',
      language: 'en',
      vad_filter: true,
      condition_on_previous_text: false,
      initial_prompt: 'DIY construction vocabulary: joist, rim joist, beam, runner, girder, rafter, stud, sill plate, top plate, subfloor, OSB, plywood, two by four, two by six, two by eight, two by ten, two by twelve.'
    }, gatewayOptions({ skipCache: true }));
    const text = String(result?.text || result?.transcription_info?.text || result?.result?.text || '').trim();
    if (!text) return json({ ok: false, error: 'NO_TRANSCRIPT' }, 502);
    track(env, 'stt', file.type || 'audio');
    return json({ ok: true, text, model: STT_MODEL });
  } catch (error) {
    return json({ ok: false, error: 'STT_FAILED', message: String(error?.message || error) }, 502);
  }
}

async function synthesizeSpeech(request, env) {
  if (!env.AI) return json({ ok: false, error: 'AI_NOT_CONFIGURED' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
  const text = String(body?.text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TTS_CHARS);
  if (!text) return json({ ok: false, error: 'TEXT_REQUIRED' }, 400);
  try {
    const raw = await env.AI.run(TTS_MODEL, { prompt: text, lang: 'en' }, {
      ...gatewayOptions({ skipCache: false, cacheTtl: 600 }),
      returnRawResponse: true
    });
    track(env, 'tts', String(text.length));
    if (raw instanceof Response) {
      return new Response(raw.body, {
        status: raw.status,
        headers: {
          'content-type': raw.headers.get('content-type') || 'audio/mpeg',
          'cache-control': 'private, max-age=600'
        }
      });
    }
    if (raw instanceof ArrayBuffer) {
      return new Response(raw, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=600' } });
    }
    if (raw?.audio) {
      const audio = typeof raw.audio === 'string'
        ? Uint8Array.from(atob(raw.audio), c => c.charCodeAt(0)).buffer
        : raw.audio;
      return new Response(audio, { headers: { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=600' } });
    }
    return json({ ok: false, error: 'TTS_NO_AUDIO' }, 502);
  } catch (error) {
    return json({ ok: false, error: 'TTS_FAILED', message: String(error?.message || error) }, 502);
  }
}

async function researchPage(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
  const target = safeWebUrl(body?.url);
  if (!target) return json({ ok: false, error: 'VALID_PUBLIC_URL_REQUIRED' }, 400);
  if (!env.BROWSER) return json({ ok: false, error: 'BROWSER_NOT_CONFIGURED' }, 503);
  const question = String(body?.question || '').trim();

  const cached = await getResearchCache(env, target.toString(), question);
  if (cached) {
    track(env, 'research-cache', target.hostname);
    return json(cached);
  }

  try {
    const browserResponse = await env.BROWSER.quickAction('markdown', {
      url: target.toString(),
      gotoOptions: { waitUntil: 'networkidle2', timeout: 20_000 },
      rejectRequestPattern: ['/^.*\\.(css|woff2?|ttf)(\\?.*)?$/i']
    });

    let payload;
    try { payload = await browserResponse.json(); } catch { payload = null; }
    const markdown = String(payload?.result || payload?.markdown || payload || '').slice(0, MAX_RESEARCH_CHARS);
    if (!markdown) return json({ ok: false, error: 'NO_READABLE_CONTENT' }, 502);

    let summary = '';
    let related = true;
    if (env.AI) {
      try {
        const ai = await env.AI.run(AI_MODEL, {
          messages: [
            { role: 'system', content: 'This is an app-content-only research tool for DIY/building/construction. First line must be exactly RELEVANCE: YES or RELEVANCE: NO. Then summarize only useful facts, terminology, dimensions, materials, warnings, manufacturer requirements, installation limits, and uncertainties. Do not invent information. If the page is unrelated to building, tools, materials, manufacturer documentation, repairs, or the current project, say it is outside the app scope.' },
            { role: 'user', content: `URL: ${target}\n${question ? `User question: ${question}\n` : ''}\nPAGE CONTENT:\n${markdown}` }
          ]
        }, gatewayOptions({ cacheTtl: 1800 }));
        summary = String(ai?.response || ai?.result?.response || ai?.text || '');
        related = !/^RELEVANCE:\s*NO/im.test(summary);
        summary = summary.replace(/^RELEVANCE:\s*(YES|NO)\s*/im, '').trim();
      } catch {}
    }

    const stored = await persistResearch(env, {
      url: target.toString(),
      title: question || target.hostname,
      question,
      markdown,
      summary,
      related
    });

    track(env, 'research', target.hostname);
    return json({ ok: true, cached: false, url: target.toString(), markdown, summary, related, libraryId: stored.id, queued: stored.queued });
  } catch (error) {
    return json({ ok: false, error: 'RESEARCH_FAILED', message: String(error?.message || error) }, 502);
  }
}

async function librarySearch(request, env) {
  let query = '';
  if (request.method === 'GET') {
    query = new URL(request.url).searchParams.get('q') || '';
  } else {
    try { query = String((await request.json())?.query || ''); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
  }
  const result = await searchLibrary(env, query);
  track(env, 'library-search', result.engine || 'unknown');
  return json(result, result.ok === false ? 400 : 200);
}

async function cloudRoute(request, env) {
  const id = clientId(request);
  if (!id) return json({ ok: false, error: 'CLIENT_ID_REQUIRED' }, 400);
  if (!env.VAULT) return json({ ok: false, error: 'CLOUD_STORAGE_NOT_CONFIGURED' }, 503);
  const stub = env.VAULT.get(env.VAULT.idFromName(id));
  track(env, 'cloud', request.method);
  return stub.fetch(request);
}

function capabilities(env) {
  const storage = storageCapabilities(env);
  return {
    worker: true,
    staticAssets: true,
    durableObjects: Boolean(env.VAULT),
    workersAI: Boolean(env.AI),
    aiGateway: Boolean(env.AI),
    imageUnderstanding: Boolean(env.AI),
    cloudSTT: Boolean(env.AI),
    cloudTTS: Boolean(env.AI),
    browserRun: Boolean(env.BROWSER),
    analyticsEngine: Boolean(env.ANALYTICS),
    pwa: true,
    browserSpeechFallback: true,
    storage,
    optionalBindings: {
      d1: storage.d1,
      r2: storage.r2,
      kv: storage.kv,
      aiSearch: storage.aiSearch,
      queues: storage.queues,
      vectorize: Boolean(env.VECTORIZE)
    }
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health' || url.pathname === '/api/stack') {
      return json({
        ok: true,
        app: 'WTF — Shed Happens',
        version: VERSION,
        models: { assistant: AI_MODEL, stt: STT_MODEL, tts: TTS_MODEL },
        capabilities: capabilities(env)
      });
    }

    if (url.pathname === '/api/assistant' && request.method === 'POST') return runAssistant(request, env);
    if (url.pathname === '/api/vision' && request.method === 'POST') return describeUpload(request, env);
    if (url.pathname === '/api/stt' && request.method === 'POST') return transcribeAudio(request, env);
    if (url.pathname === '/api/tts' && request.method === 'POST') return synthesizeSpeech(request, env);
    if (url.pathname === '/api/research' && request.method === 'POST') return researchPage(request, env);
    if (url.pathname === '/api/library/search' && ['GET', 'POST'].includes(request.method)) return librarySearch(request, env);
    if (url.pathname.startsWith('/api/cloud/')) return cloudRoute(request, env);

    if (url.pathname.startsWith('/api/engine/')) {
      const id = clientId(request) || 'anonymous';
      const stub = env.ENGINE.get(env.ENGINE.idFromName(id));
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ ok: false, error: 'NOT_FOUND' }, 404);
    }

    return env.ASSETS.fetch(request);
  },

  async queue(batch, env) {
    await processLibraryQueue(batch, env);
  }
};
