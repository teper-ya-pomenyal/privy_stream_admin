import { rawRequest } from './http';

// Admin-эндпоинта /health в API v1 нет. Состояние сервисов выводим косвенно:
// шлём безопасные запросы, ответ на которые формирует конкретный сервис за Gateway.

export type SvcStatus = 'UP' | 'DEGRADED' | 'DOWN';

export interface ServiceProbe {
  name: string;
  proto: string;
  status: SvcStatus;
  ms: number | null;
  note: string;
  uptime: number; // доля успешных проверок за сессию, 0..1
}

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
const SLOW_MS = 1500;
const HISTORY = 60;
const history = new Map<string, boolean[]>();

interface ProbeDef {
  name: string;
  proto: string;
  run: () => Promise<Response>;
  judge: (status: number) => { status: SvcStatus; note: string };
}

const probes: ProbeDef[] = [
  {
    name: 'gateway',
    proto: 'HTTP · chi',
    // Без токена auth-middleware отвечает 401, не обращаясь к upstream.
    run: () => rawRequest('GET', `/catalog/tracks/${ZERO_UUID}/exists`, { auth: false, silent: true }),
    judge: (s) =>
      s === 401 || (s >= 200 && s < 500)
        ? { status: 'UP', note: `auth middleware · ${s}` }
        : { status: 'DOWN', note: `ответ ${s}` },
  },
  {
    name: 'user_service',
    proto: 'gRPC · /refresh',
    // Заведомо невалидный refresh: живой сервис вернёт Unauthenticated → 401.
    run: () => rawRequest('POST', '/refresh', { auth: false, silent: true, body: { refresh_token: 'healthcheck' } }),
    judge: (s) =>
      s === 401 || s === 400
        ? { status: 'UP', note: 'Unauthenticated на пробный токен' }
        : s >= 500
          ? { status: 'DOWN', note: `gRPC Internal/Unavailable · ${s}` }
          : { status: 'DEGRADED', note: `неожиданный ответ ${s}` },
  },
  {
    name: 'catalog_service',
    proto: 'gRPC · + postgres, redis',
    run: () => rawRequest('GET', `/catalog/tracks/${ZERO_UUID}/exists`, { silent: true }),
    judge: (s) =>
      s === 200
        ? { status: 'UP', note: 'TrackExists отвечает' }
        : s >= 500
          ? { status: 'DOWN', note: `gRPC Internal/Unavailable · ${s}` }
          : { status: 'DEGRADED', note: `ответ ${s}` },
  },
  {
    name: 'streaming_service',
    proto: 'HTTP proxy · Range',
    // Несуществующий трек: живой streaming_service спросит каталог и вернёт 404.
    run: () => rawRequest('GET', `/stream/${ZERO_UUID}`, { silent: true }),
    judge: (s) =>
      s === 404 || s === 206 || s === 200
        ? { status: 'UP', note: `проксирование работает · ${s}` }
        : s === 502 || s === 503 || s === 504
          ? { status: 'DOWN', note: `прокси не достучался · ${s}` }
          : { status: 'DEGRADED', note: `ответ ${s}` },
  },
];

function record(name: string, ok: boolean) {
  const h = [...(history.get(name) ?? []), ok].slice(-HISTORY);
  history.set(name, h);
  return h.filter(Boolean).length / h.length;
}

export async function probeServices(): Promise<ServiceProbe[]> {
  return Promise.all(
    probes.map(async (p): Promise<ServiceProbe> => {
      const started = performance.now();
      try {
        const res = await p.run();
        const ms = Math.round(performance.now() - started);
        let { status, note } = p.judge(res.status);
        if (status === 'UP' && ms > SLOW_MS) {
          status = 'DEGRADED';
          note = `медленно · ${note}`;
        }
        return { name: p.name, proto: p.proto, status, ms, note, uptime: record(p.name, status !== 'DOWN') };
      } catch {
        return { name: p.name, proto: p.proto, status: 'DOWN', ms: null, note: 'Gateway недоступен', uptime: record(p.name, false) };
      }
    }),
  );
}

export function overallStatus(list: ServiceProbe[] | undefined): SvcStatus | null {
  if (!list?.length) return null;
  if (list.some((s) => s.status === 'DOWN')) return 'DOWN';
  if (list.some((s) => s.status === 'DEGRADED')) return 'DEGRADED';
  return 'UP';
}
