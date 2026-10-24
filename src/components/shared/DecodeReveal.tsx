'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { decodeText, revealTimes } from '@/lib/glyphs';

// Wraps the page content. Whenever a GlyphSkeleton is replaced by real content,
// that content's text decodes into place glyph by glyph, in a wave from the
// centre of what just loaded. Other updates (live scores, menus, typing) are
// left alone. Off with reduced motion.

const MAX_CHARS = 2500; // a huge table just appears; decoding it wouldn't read anyway
const SKIP = 'input, textarea, script, style, svg, [data-no-decode]';

function isSkeleton(node: Node) {
  return node instanceof Element && node.matches('[data-glyph-skeleton]');
}

function containsSkeleton(node: Node) {
  return node instanceof Element && (isSkeleton(node) || node.querySelector('[data-glyph-skeleton]') !== null);
}

interface Item {
  node: Text;
  original: string;
  times: number[];
  written: string;
  live: boolean;
}

// Scrambles the text in `elements` straight away (before the browser paints)
// and resolves it over the next ~0.7 s. Returns a function that stops early
// and puts the real text back.
function decode(elements: Element[], onDone: () => void): () => void {
  const rects = elements.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 || r.height > 0);
  if (rects.length === 0) {
    onDone();
    return () => undefined;
  }
  const left = Math.min(...rects.map((r) => r.left));
  const right = Math.max(...rects.map((r) => r.right));
  const top = Math.min(...rects.map((r) => r.top));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const reach = Math.hypot(right - left, bottom - top) / 2 || 1;

  const items: Item[] = [];
  let budget = MAX_CHARS;
  for (const el of elements) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (!(node as Text).data.trim() || node.parentElement?.closest(SKIP)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT),
    });
    for (let node = walker.nextNode() as Text | null; node && budget > 0; node = walker.nextNode() as Text | null) {
      const box = node.parentElement!.getBoundingClientRect();
      const distance = Math.hypot(box.left + box.width / 2 - cx, box.top + box.height / 2 - cy) / reach;
      budget -= node.data.length;
      items.push({ node, original: node.data, times: revealTimes(node.data, distance), written: node.data, live: true });
    }
  }
  const end = Math.max(0, ...items.map((item) => item.times[item.times.length - 1] ?? 0));
  const start = performance.now();
  let frame = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frame);
    // Restore only text we still own: if React rendered new text meanwhile, it wins.
    for (const item of items) if (item.live && item.node.data === item.written) item.node.data = item.original;
    onDone();
  };

  const tick = () => {
    const elapsed = performance.now() - start;
    for (const item of items) {
      if (!item.live) continue;
      if (item.node.data !== item.written) {
        item.live = false;
        continue;
      }
      const next = decodeText(item.original, item.times, elapsed);
      if (next !== item.written) {
        item.node.data = next;
        item.written = next;
      }
    }
    if (elapsed >= end) finish();
    else frame = requestAnimationFrame(tick);
  };

  tick();
  return finish;
}

export default function DecodeReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const running = new Set<() => void>();

    const observer = new MutationObserver((records) => {
      const loaderRemoved = records.some((record) => Array.from(record.removedNodes).some(containsSkeleton));
      if (!loaderRemoved) return;
      const added = records
        .flatMap((record) => Array.from(record.addedNodes))
        .filter((node): node is Element => node instanceof Element && node.isConnected && !isSkeleton(node));
      if (added.length === 0) return;
      // decode can finish synchronously (nothing visible to decode), so the
      // stop function is registered through a holder rather than a const.
      const run = { stop: () => undefined as void, done: false };
      run.stop = decode(added, () => {
        run.done = true;
        running.delete(run.stop);
      });
      if (!run.done) running.add(run.stop);
    });

    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      running.forEach((stop) => stop());
    };
  }, []);

  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
}
