const MAX_QUEUE = 3;
const HISTORY_LIMIT = 100;

function json(data, status = 200) {
  return Response.json(data, { status });
}

export class MetabolicEngine {
  constructor(state, env) {
    this.state = state;
    this.storage = state.storage;
    this.env = env;
  }

  async load() {
    const stored = await this.storage.get('engineState');
    if (stored) return stored;

    const initial = {
      queue: [],
      history: [],
      violationCount: 0,
      cooldownUntil: 0,
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    await this.storage.put('engineState', initial);
    return initial;
  }

  async save(engineState) {
    engineState.lastUpdated = Date.now();
    await this.storage.put('engineState', engineState);
  }

  normalize(input) {
    return String(input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  classify(input) {
    if (/https?:\/\/|www\./i.test(input)) return 'GHOST_LINK';
    if (/\bfix\b|\brepair\b|\bdebug\b/i.test(input)) return 'FIX';
    if (/\bbuild\b|\bmake\b|\bimplement\b/i.test(input)) return 'BUILD';
    if (/\blearn\b|\bstudy\b|\bresearch\b/i.test(input)) return 'LEARN';
    if (/\bfeel\b|\bstress\b|\bangry\b|\bsad\b/i.test(input)) return 'FEEL';
    if (input.length < 5) return 'TRASH';
    return 'CREATE';
  }

  calculateHeat(input, type) {
    let heat = 10;
    if (type === 'GHOST_LINK') heat += 45;
    if (type === 'FIX') heat += 20;
    if (type === 'BUILD') heat += 15;
    if (input.length > 120) heat += 10;
    if (/\burgent\b|\basap\b|\bnow\b|\btoday\b/i.test(input)) heat += 20;
    return Math.min(100, heat);
  }

  fingerprint(normalized) {
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) {
      hash ^= normalized.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  async ingest(input) {
    return this.state.blockConcurrencyWhile(async () => {
      const engineState = await this.load();
      const normalized = this.normalize(input);

      if (!normalized || normalized.length < 3) {
        return json({ ok: false, error: 'INVALID_INPUT' }, 400);
      }

      const now = Date.now();
      if (engineState.cooldownUntil > now) {
        return json({ ok: false, error: 'COOLDOWN', cooldownUntil: engineState.cooldownUntil }, 423);
      }

      const fp = this.fingerprint(normalized);
      const duplicate = engineState.queue.find(item => item.fingerprint === fp || item.normalized === normalized);
      if (duplicate) {
        duplicate.lastTouchedAt = now;
        duplicate.duplicateCount = (duplicate.duplicateCount || 0) + 1;
        await this.save(engineState);
        return json({ ok: true, action: 'MERGED', intent: duplicate, state: this.publicState(engineState) });
      }

      if (engineState.queue.length >= MAX_QUEUE) {
        engineState.violationCount += 1;
        await this.save(engineState);
        return json({ ok: false, error: 'QUEUE_LOCKED', maxQueue: MAX_QUEUE, state: this.publicState(engineState) }, 423);
      }

      const type = this.classify(normalized);
      const intent = {
        id: crypto.randomUUID(),
        input: String(input),
        normalized,
        type,
        heat: this.calculateHeat(normalized, type),
        status: 'PENDING',
        fingerprint: fp,
        duplicateCount: 0,
        createdAt: now,
        lastTouchedAt: now
      };

      engineState.queue.push(intent);
      await this.save(engineState);
      return json({ ok: true, action: 'ACCEPTED', intent, state: this.publicState(engineState) }, 201);
    });
  }

  async complete(id) {
    return this.state.blockConcurrencyWhile(async () => {
      const engineState = await this.load();
      const index = engineState.queue.findIndex(item => item.id === id);
      if (index === -1) return json({ ok: false, error: 'NOT_FOUND' }, 404);

      const [intent] = engineState.queue.splice(index, 1);
      intent.status = 'DONE';
      intent.lastTouchedAt = Date.now();
      engineState.history.unshift(intent);
      engineState.history = engineState.history.slice(0, HISTORY_LIMIT);
      await this.save(engineState);
      return json({ ok: true, intent, state: this.publicState(engineState) });
    });
  }

  async deleteIntent(id) {
    return this.state.blockConcurrencyWhile(async () => {
      const engineState = await this.load();
      const index = engineState.queue.findIndex(item => item.id === id);
      if (index === -1) return json({ ok: false, error: 'NOT_FOUND' }, 404);

      const [intent] = engineState.queue.splice(index, 1);
      intent.status = 'BLOCKED';
      intent.lastTouchedAt = Date.now();
      engineState.history.unshift(intent);
      engineState.history = engineState.history.slice(0, HISTORY_LIMIT);
      await this.save(engineState);
      return json({ ok: true, intent, state: this.publicState(engineState) });
    });
  }

  publicState(engineState) {
    return {
      queue: engineState.queue,
      queueCount: engineState.queue.length,
      maxQueue: MAX_QUEUE,
      locked: engineState.queue.length >= MAX_QUEUE,
      violationCount: engineState.violationCount,
      cooldownUntil: engineState.cooldownUntil,
      lastUpdated: engineState.lastUpdated
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/engine/, '') || '/';

    if (request.method === 'GET' && path === '/state') {
      const engineState = await this.load();
      return json({ ok: true, state: this.publicState(engineState) });
    }

    if (request.method === 'GET' && path === '/next') {
      const engineState = await this.load();
      const next = [...engineState.queue].sort((a, b) => b.heat - a.heat || a.createdAt - b.createdAt)[0] || null;
      return json({ ok: true, next, state: this.publicState(engineState) });
    }

    if (request.method === 'POST' && path === '/ingest') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
      return this.ingest(body?.input);
    }

    if (request.method === 'POST' && path === '/complete') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
      return this.complete(body?.id);
    }

    if (request.method === 'POST' && path === '/delete') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
      return this.deleteIntent(body?.id);
    }

    return json({ ok: false, error: 'Not found' }, 404);
  }
}
