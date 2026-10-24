import { describe, expect, it } from 'vitest';
import { SPLASH_SCRIPT } from '../splash';

function run(storage: { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } | null) {
  const document = { documentElement: { dataset: {} as Record<string, string> } };
  const sessionStorage = storage ?? {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  new Function('document', 'sessionStorage', SPLASH_SCRIPT)(document, sessionStorage);
  return document.documentElement.dataset.splash;
}

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } };
}

describe('opening intro script', () => {
  it('plays on the first load of a session and is skipped after that', () => {
    const storage = memoryStorage();
    expect(run(storage)).toBeUndefined();
    expect(run(storage)).toBe('off');
    expect(run(storage)).toBe('off');
  });

  it('still plays when storage is blocked', () => {
    expect(run(null)).toBeUndefined();
  });
});
