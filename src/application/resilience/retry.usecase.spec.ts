import { describe, expect, it, vi } from 'vitest';
import { runWithRetry } from './retry.usecase';

describe('retry use case', () => {
    it('returns on first successful attempt', async () => {
        const operation = vi.fn().mockResolvedValue('ok');
        await expect(runWithRetry(operation, 2)).resolves.toBe('ok');
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries until success', async () => {
        const operation = vi
            .fn()
            .mockRejectedValueOnce(new Error('temporary'))
            .mockResolvedValueOnce('ok');

        await expect(runWithRetry(operation, 2)).resolves.toBe('ok');
        expect(operation).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting retries', async () => {
        const operation = vi.fn().mockRejectedValue(new Error('permanent'));
        await expect(runWithRetry(operation, 1)).rejects.toThrow('permanent');
        expect(operation).toHaveBeenCalledTimes(2);
    });
});

