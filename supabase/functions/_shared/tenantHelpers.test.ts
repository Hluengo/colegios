import { vi, describe, it, expect, beforeEach } from 'vitest';
import { warnMissingTenant } from './tenantHelpers.ts';

describe('tenantHelpers.warnMissingTenant', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls fetch when TENANT_MISSING_MONITOR_URL is set', async () => {
    // Stub global Deno.env.get
    // @ts-ignore
    global.Deno = { env: { get: (k: string) => (k === 'TENANT_MISSING_MONITOR_URL' ? 'https://example.test/monitor' : undefined) } };

    const fetchMock = vi.fn(async () => ({ ok: true } as any));
    // @ts-ignore
    global.fetch = fetchMock;

    await warnMissingTenant('test.context', { a: 1 });

    expect(fetchMock).toHaveBeenCalled();
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe('https://example.test/monitor');
    expect(call[1].method).toBe('POST');
  });

  it('does not call fetch and warns when monitor url unset', async () => {
    // @ts-ignore
    global.Deno = { env: { get: (k: string) => undefined } };
    const fetchMock = vi.fn();
    // @ts-ignore
    global.fetch = fetchMock;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {} as any);

    await warnMissingTenant('no-monitor', { b: 2 });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
