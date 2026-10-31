import { describe, expect, it } from 'vitest';
import { nonNegativeNumber, positiveNumber, required } from './validation';

describe('form validation', () => {
  it('trims required values', () => {
    expect(required('  worker  ', 'Name')).toBe('worker');
  });

  it('rejects empty required values', () => {
    expect(() => required(' ', 'Name')).toThrow('Name is required.');
  });

  it('accepts positive numbers', () => {
    expect(positiveNumber('220', 'Rate')).toBe(220);
  });

  it('rejects zero and invalid positive numbers', () => {
    expect(() => positiveNumber('0', 'Rate')).toThrow('Rate must be greater than zero.');
    expect(() => positiveNumber('invalid', 'Rate')).toThrow('Rate must be greater than zero.');
  });

  it('accepts zero for non-negative values', () => {
    expect(nonNegativeNumber('0', 'Advance')).toBe(0);
  });
});
