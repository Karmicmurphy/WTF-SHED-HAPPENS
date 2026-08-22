import { MetabolicEngine } from './metabolic-engine.js';
import { ProjectVault } from './project-vault.js';

export { MetabolicEngine, ProjectVault };

const VERSION = '0.4.0';
const AI_MODEL = '@cf/zai-org/glm-4.7-flash';
const MAX_RESEARCH_CHARS = 18_000;
const MAX_UPLOAD_BYTES = 8_000_000;

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
    return u;
  } catch {
    return null;
  }
}

async function runAssistant(request, env) {
  if (!env.AI) return json({ ok: false, error: 'AI_NOT_CONFIGURED' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
  const message = String(body?.message || '').trim();
  if (!message) return json({ ok: false, error: 'MESSAGE_REQUIRED' }, 400);
  const project = body?.project || {};
  const context = [
    `Project name: ${project.name || 'unknown'}`,
    `Type: ${project.type || 'unknown'}`,
    `Size: ${project.length || '?'} ft x ${project.width || '?'} ft`,
    `Stage: ${project.stage || 'unknown'}`,
    `Priority: ${project.priority || 'unknown'}`
  ].join('\n');
  const system = `You are the WTF Stupid Simple Builder assistant. Explain construction concepts to a beginner in plain language. Be concise, visual, practical, and honest about uncertainty. Do not assume trade vocabulary. Never claim a structural plan is approved. When a decision depends on species, grade, span, load, soil, manufacturer instructions, or local conditions, say what must be verified. Prefer one recommended next step before alternatives. The app is budget-aware and treats reclaimed, free, barter, and used materials as legitimate when their condition is suitable.`;
  try {
    const result = await env.AI.run(AI_MODEL, {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${context}\n\nQuestion: ${message}` }
      ]
    }, {
      gateway: { id: 'default', skipCache: false }
    });
    const response = result?.response || result?.result?.response || result?.text || String(result || '');
    track(env, 'ai', project.type || 'unknown');
    return json({ ok: true, response, model: AI_MODEL });
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
            { role: 'system', content: 'You are helping a beginner identify what is visible in a construction or DIY image/document. Use only the supplied description. Clearly separate what is visible from what cannot be verified from the image. Never declare structural safety from an image alone.' },
            { role: 'user', content: `Converted file description:\n${description}\n\nUser question: ${question}` }
          ]
        }, { gateway: { id: 'default', skipCache: false } });
        answer = ai?.response || ai?.result?.response || ai?.text || description;
      } catch {}
    }
    track(env, 'vision', file.type || 'unknown');
    return json({ ok: true, description, answer, filename: file.name, mimetype: file.type });
  } catch (error) {
    return json({ ok: false, error: 'VISION_FAILED', message: String(error?.message || error) }, 502);
  }
}

async function researchPage(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
  const target = safeWebUrl(body?.url);
  if (!target) return json({ ok: false, error: 'VALID_PUBLIC_URL_REQUIRED' }, 400);
  if (!env.BROWSER) return json({ ok: false, error: 'BROWSER_NOT_CONFIGURED' }, 503);

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
    const question = String(body?.question || '').trim();
    if (env.AI) {
      try {
        const ai = await env.AI.run(AI_MODEL, {
          messages: [
            { role: 'system', content: 'Summarize webpage content only for a DIY/building app. Extract useful facts, terminology, dimensions, materials, warnings, manufacturer requirements, and uncertainties. Do not invent information. If the page is unrelated to building, say so.' },
            { role: 'user', content: `URL: ${target}\n${question ? `User question: ${question}\n` : ''}\nPAGE CONTENT:\n${markdown}` }
          ]
        }, { gateway: { id: 'default', skipCache: false } });
        summary = ai?.response || ai?.result?.response || ai?.text || '';
      } catch {}
    }

    track(env, 'research', target.hostname);
    return json({ ok: true, url: target.toString(), markdown, summary });
  } catch (error) {
    return json({ ok: false, error: 'RESEARCH_FAILED', message: String(error?.message || error) }, 502);
  }
}

async function cloudRoute(request, env) {
  const id = clientId(request);
  if (!id) return json({ ok: false, error: 'CLIENT_ID_REQUIRED' }, 400);
  if (!env.VAULT) return json({ ok: false, error: 'CLOUD_STORAGE_NOT_CONFIGURED' }, 503);
  const stub = env.VAULT.get(env.VAULT.idFromName(id));
  track(env, 'cloud', request.method);
  return stub.fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        app: 'WTF — Shed Happens',
        version: VERSION,
        capabilities: {
          staticAssets: true,
          durableObjects: Boolean(env.VAULT),
          workersAI: Boolean(env.AI),
          imageUnderstanding: Boolean(env.AI),
          browserRun: Boolean(env.BROWSER),
          analyticsEngine: Boolean(env.ANALYTICS),
          speech: 'browser-native'
        }
      });
    }

    if (url.pathname === '/api/assistant' && request.method === 'POST') return runAssistant(request, env);
    if (url.pathname === '/api/vision' && request.method === 'POST') return describeUpload(request, env);
    if (url.pathname === '/api/research' && request.method === 'POST') return researchPage(request, env);
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
  }
};
