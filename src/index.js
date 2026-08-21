import { MetabolicEngine } from './metabolic-engine.js';

export { MetabolicEngine };

const PROJECT = {
  id: 'my-24x16-shed',
  name: 'My 24 × 16 Shed',
  stage: 'Floor',
  dimensions: { lengthFt: 24, widthFt: 16 },
  deck: { lengthFt: 24, depthFt: 8 },
  roof: { highFt: 10, lowFt: 9.5, type: 'single-slope' },
  philosophy: 'Complication is the enemy. Simple is the solution.'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json({
        ok: true,
        app: 'WTF — Shed Happens',
        version: '0.3.0',
        storage: 'durable-object',
        engine: 'metabolic-governor'
      });
    }

    if (url.pathname === '/api/project' && request.method === 'GET') {
      return Response.json(PROJECT);
    }

    if (url.pathname.startsWith('/api/engine/')) {
      const id = env.ENGINE.idFromName('global');
      const stub = env.ENGINE.get(id);
      return stub.fetch(request);
    }

    if (url.pathname.startsWith('/api/')) {
      return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  }
};
