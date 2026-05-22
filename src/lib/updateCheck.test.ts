import { describe, expect, it } from 'vitest';
import { compareVersions, isSafeReleaseUrl } from './updateCheck';

describe('compareVersions', () => {
  it('treats identical versions as equal', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });

  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.3.0', '1.2.9')).toBeGreaterThan(0);
    expect(compareVersions('1.2.4', '1.2.3')).toBeGreaterThan(0);
    expect(compareVersions('1.2.3', '1.2.4')).toBeLessThan(0);
  });

  it('ignores a leading v on either side', () => {
    expect(compareVersions('v1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('v2.0.0', 'v1.0.0')).toBeGreaterThan(0);
  });

  it('treats a missing segment as zero', () => {
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
    expect(compareVersions('1', '1.0.1')).toBeLessThan(0);
    expect(compareVersions('1.2.3', '1.2')).toBeGreaterThan(0);
  });

  it('ignores a non-numeric pre-release suffix', () => {
    expect(compareVersions('1.2.3-beta', '1.2.3')).toBe(0);
    expect(compareVersions('2.0.0-rc1', '1.9.0')).toBeGreaterThan(0);
  });

  it('handles a malformed segment as zero rather than NaN', () => {
    expect(compareVersions('1.x.3', '1.0.3')).toBe(0);
  });
});

describe('isSafeReleaseUrl', () => {
  it('accepts an https github.com URL', () => {
    expect(isSafeReleaseUrl('https://github.com/rupprath/aom-counters/releases/tag/v1.0.0')).toBe(
      true,
    );
  });

  it('rejects non-github, non-https, and non-string values', () => {
    expect(isSafeReleaseUrl('http://github.com/x')).toBe(false);
    expect(isSafeReleaseUrl('https://evil.example.com/')).toBe(false);
    expect(isSafeReleaseUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeReleaseUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeReleaseUrl('https://github.com.evil.com/')).toBe(false);
    expect(isSafeReleaseUrl(undefined)).toBe(false);
    expect(isSafeReleaseUrl(42)).toBe(false);
  });
});
