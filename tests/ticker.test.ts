import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { subscribe, subscriberCount, isRunning } from '../src/lib/ticker';

/**
 * The shared rAF ticker is the piece that guarantees the app opens exactly one
 * animation frame loop rather than one per animated component, and that an idle
 * page schedules no frames at all. Both of those are invisible until they
 * regress, which is precisely why they are worth pinning down in tests.
 *
 * Node has no `requestAnimationFrame`, so one is installed here that is driven
 * manually. That is an advantage rather than a workaround: frames advance only
 * when the test says so, making every assertion deterministic.
 */

interface FrameHarness {
  /** Runs exactly one pending frame, if the loop has scheduled it. */
  advance(timeMs?: number): void;
  /** Frames the loop has scheduled and not yet had run. */
  pending(): number;
  reset(): void;
}

const scheduled = new Map<number, FrameRequestCallback>();
let nextHandle = 1;

const frames: FrameHarness = {
  advance(timeMs = 16.67) {
    // Snapshot first: a callback that re-schedules must not be run again within
    // the same advance, or a single call would spin the loop forever.
    const due = [...scheduled.entries()];
    scheduled.clear();
    for (const [, callback] of due) callback(timeMs);
  },
  pending: () => scheduled.size,
  reset() {
    scheduled.clear();
    nextHandle = 1;
  },
};

globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
  const handle = nextHandle++;
  scheduled.set(handle, callback);
  return handle;
}) as typeof requestAnimationFrame;

globalThis.cancelAnimationFrame = ((handle: number) => {
  scheduled.delete(handle);
}) as typeof cancelAnimationFrame;

// The import above is static, which is safe here only because the ticker never
// touches `requestAnimationFrame` at module scope — it reads the global lazily,
// inside `subscribe`. By then the stubs above are installed.

describe('shared ticker', () => {
  beforeEach(() => {
    frames.reset();
  });

  test('does not schedule a frame until something subscribes', () => {
    assert.equal(subscriberCount(), 0);
    assert.equal(isRunning(), false);
    assert.equal(frames.pending(), 0);
  });

  test('starts on the first subscriber and invokes it each frame', () => {
    let ticks = 0;
    const stop = subscribe(() => {
      ticks++;
    });

    assert.equal(isRunning(), true);

    frames.advance();
    assert.equal(ticks, 1);

    frames.advance();
    assert.equal(ticks, 2);

    stop();
  });

  test('drives every subscriber from a single scheduled frame', () => {
    let a = 0;
    let b = 0;
    let c = 0;
    const stopA = subscribe(() => { a++; });
    const stopB = subscribe(() => { b++; });
    const stopC = subscribe(() => { c++; });

    // The whole point of the module: three animations, one frame.
    assert.equal(frames.pending(), 1, 'three subscribers must share one frame');

    frames.advance();
    assert.deepEqual([a, b, c], [1, 1, 1]);

    stopA();
    stopB();
    stopC();
  });

  test('stops scheduling once the last subscriber leaves', () => {
    const stop = subscribe(() => {});
    frames.advance();
    assert.equal(isRunning(), true);

    stop();
    assert.equal(subscriberCount(), 0);

    // An idle page must cost nothing. This is the regression that the four
    // always-on loops in the original layout represented.
    frames.advance();
    assert.equal(frames.pending(), 0, 'no frame may be scheduled with no subscribers');
    assert.equal(isRunning(), false);
  });

  test('keeps running while other subscribers remain', () => {
    let kept = 0;
    const stopFirst = subscribe(() => {});
    const stopSecond = subscribe(() => { kept++; });

    stopFirst();
    assert.equal(isRunning(), true, 'one subscriber left, so the loop lives');

    frames.advance();
    assert.equal(kept, 1);

    stopSecond();
  });

  test('unsubscribing twice does not remove a later subscriber', () => {
    const stop = subscribe(() => {});
    stop();
    stop();

    let ran = 0;
    const stopNew = subscribe(() => { ran++; });
    frames.advance();

    // React StrictMode runs effect cleanups twice in development. If the
    // returned unsubscribe were not idempotent, the second call could delete a
    // freshly-registered subscriber and silently kill its animation.
    assert.equal(ran, 1, 'a double unsubscribe must not affect a new subscriber');
    stopNew();
  });

  test('a subscriber may unsubscribe itself mid-tick', () => {
    let ticks = 0;
    let stopSelf: (() => void) | null = null;
    stopSelf = subscribe(() => {
      ticks++;
      stopSelf?.();
    });

    frames.advance();
    assert.equal(ticks, 1);

    frames.advance();
    assert.equal(ticks, 1, 'must not be invoked after removing itself');
  });

  test('a throwing subscriber is dropped without stalling the others', () => {
    let healthy = 0;
    const stopThrower = subscribe(() => {
      throw new Error('subscriber blew up');
    });
    const stopHealthy = subscribe(() => { healthy++; });

    frames.advance();
    assert.equal(healthy, 1, 'a broken subscriber must not stop the loop');
    assert.equal(subscriberCount(), 1, 'the thrower must be evicted');

    frames.advance();
    assert.equal(healthy, 2);

    stopThrower();
    stopHealthy();
  });

  test('clamps the delta so returning from a background tab does not jump', () => {
    const deltas: number[] = [];
    const stop = subscribe((_time, delta) => deltas.push(delta));

    frames.advance(1_000);
    // A ten-second gap would otherwise be handed to every interpolation at
    // once, teleporting the cursor and the scroll instead of easing them.
    frames.advance(11_000);

    assert.ok(deltas[1] <= 64, `delta must be clamped, got ${deltas[1]}`);
    stop();
  });

  test('reports a sane delta on the very first frame', () => {
    const deltas: number[] = [];
    const stop = subscribe((_time, delta) => deltas.push(delta));

    // The first frame has no predecessor to subtract from. It must not hand out
    // the raw timestamp, which would be an enormous bogus delta.
    frames.advance(123_456);
    assert.ok(deltas[0] > 0 && deltas[0] <= 64, `implausible first delta: ${deltas[0]}`);

    stop();
  });
});
