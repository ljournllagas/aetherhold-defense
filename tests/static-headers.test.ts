import headers from '../public/_headers?raw';
import { expect, it } from 'vitest';

it('protects HTML while allowing the current local assets and styles', () => {
  expect(headers).toMatch(/^\/\*/);
  for (const directive of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "font-src 'self'", "script-src 'self'"]) expect(headers).toContain(directive);
  expect(headers.match(/script-src[^;]+/)?.[0]).not.toContain('unsafe-');
  expect(headers.split('\n').every((line) => line.length <= 2000)).toBe(true);
});
