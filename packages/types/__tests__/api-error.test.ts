import { describe, it, expect } from 'vitest';
import { apiError } from '../src/api-error';

describe('apiError', () => {
  it('creates error with code + message', () => {
    expect(apiError('not_found', 'Niet gevonden')).toEqual({
      error: 'not_found',
      message: 'Niet gevonden',
    });
  });

  it('includes issues when provided', () => {
    const issues = [{ code: 'invalid_type', path: ['email'], message: 'fout' } as any];
    expect(apiError('validation_error', 'Ongeldig', issues)).toEqual({
      error: 'validation_error',
      message: 'Ongeldig',
      issues,
    });
  });

  it('omits issues key when not provided', () => {
    const result = apiError('foo', 'bar');
    expect('issues' in result).toBe(false);
  });
});
