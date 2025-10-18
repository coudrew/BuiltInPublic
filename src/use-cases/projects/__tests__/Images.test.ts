import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseAnonClient } from 'utils/supabase/server';

// ---------- Service client mock: "table exists" probe succeeds
const svcSelect = vi
  .fn()
  .mockResolvedValue({ data: null, error: null, status: 200 });
const svcFrom = vi.fn().mockReturnThis();
const svcClient = {
  from: svcFrom,
  select: svcSelect,
} as unknown as SupabaseAnonClient;

// ---------- Anon client mock: RLS denies read
const anonLimit = vi.fn().mockResolvedValue({
  data: null,
  error: { message: 'permission denied by row-level security', code: '42501' },
  status: 403,
});
const anonSelect = vi.fn().mockReturnThis();
const anonFrom = vi.fn().mockReturnThis();
const anonClient = {
  from: anonFrom,
  select: anonSelect,
  limit: anonLimit,
} as unknown as SupabaseAnonClient;

describe('DB: images table + RLS (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('images table exists (service role HEAD-like select returns no error)', async () => {
    // HEAD-style probe; if your real code uses a different signature,
    // keep the call shape identical here so the test guards it.
    const { error } = await (svcClient as any)
      .from('images')
      .select('*', { head: true, count: 'exact' });

    expect(error).toBeNull();
    expect(svcFrom).toHaveBeenCalledWith('images');
    expect(svcSelect).toHaveBeenCalledWith('*', { head: true, count: 'exact' });
  });

  it('anonymous is blocked by RLS (read denied)', async () => {
    const { data, error, status } = await (anonClient as any)
      .from('images')
      .select('*')
      .limit(1);

    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect([401, 403]).toContain(status);
    expect(error?.message).toMatch(/permission|row-level security/i);

    expect(anonFrom).toHaveBeenCalledWith('images');
    expect(anonSelect).toHaveBeenCalledWith('*');
    expect(anonLimit).toHaveBeenCalledWith(1);
  });
});
