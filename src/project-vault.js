function json(data, status = 200) {
  return Response.json(data, { status });
}

const MAX_SNAPSHOT_BYTES = 800_000;

export class ProjectVault {
  constructor(state) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api\/cloud/, '') || '/';

    if (request.method === 'GET' && path === '/load') {
      const snapshot = await this.storage.get('snapshot');
      return json({ ok: true, snapshot: snapshot || null });
    }

    if (request.method === 'POST' && path === '/save') {
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
      const raw = JSON.stringify(body?.snapshot ?? null);
      if (!body?.snapshot || raw.length > MAX_SNAPSHOT_BYTES) {
        return json({ ok: false, error: 'SNAPSHOT_TOO_LARGE_OR_EMPTY' }, 413);
      }
      const snapshot = {
        ...body.snapshot,
        cloudSavedAt: new Date().toISOString()
      };
      await this.storage.put('snapshot', snapshot);
      return json({ ok: true, cloudSavedAt: snapshot.cloudSavedAt });
    }

    if (request.method === 'DELETE' && path === '/clear') {
      await this.storage.delete('snapshot');
      return json({ ok: true });
    }

    return json({ ok: false, error: 'NOT_FOUND' }, 404);
  }
}
