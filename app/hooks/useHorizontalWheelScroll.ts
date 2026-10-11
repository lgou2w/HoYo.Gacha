import { WheelEventHandler, useCallback, useEffect, useRef } from 'react'

export interface UseHorizontalWheelScrollOptions {
  /**
   * Easing factor per frame. Higher = snappier, lower = smoother.
   * - `0.4` → "stepping" feel (a few frames per notch)
   * - `0.15` → smooth trackpad feel
   */
  ease?: number
  /** Multiplier applied to the raw wheel delta to compute the target distance. */
  step?: number
  /** Distance below which we snap to the target and stop the animation. */
  epsilon?: number
  /**
   * Return `false` to let the wheel event bubble (e.g. when the target is a
   * nested vertical scroll container). Defaults to always handling the event.
   */
  shouldHandle?: (evt: WheelEvent | React.WheelEvent) => boolean
}

/**
 * Horizontal wheel scrolling with a rAF easing loop.
 *
 * - Wheel deltas accumulate into a target position.
 * - The container smoothly eases toward the target each frame.
 * - Vertical wheel (`deltaY`) is mapped to horizontal scroll; `deltaX` is
 *   forwarded as-is (trackpad two-finger swipe).
 *
 * Returns a `WheelEventHandler` to attach via `onWheel`.
 */
export default function useHorizontalWheelScroll (
  options: UseHorizontalWheelScrollOptions = {},
): WheelEventHandler {
  const {
    ease = 0.22,
    step = 1.5,
    epsilon = 0.5,
    shouldHandle,
  } = options

  const rafRef = useRef(0)
  const targetRef = useRef(0)

  // Cancel any pending frame when the component unmounts.
  useEffect(() => () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return useCallback<WheelEventHandler>((evt) => {
    if (shouldHandle && !shouldHandle(evt)) {
      return
    }

    const el = evt.currentTarget

    // When idle, sync the target to the actual position so an ongoing
    // scrollbar drag or programmatic scroll isn't fought by the animation.
    if (!rafRef.current) {
      targetRef.current = el.scrollLeft
    }

    const max = el.scrollWidth - el.clientWidth
    const next = targetRef.current + (evt.deltaY + evt.deltaX) * step
    targetRef.current = Math.max(0, Math.min(max, next))

    if (rafRef.current) {
      return
    }

    const frame = () => {
      const diff = targetRef.current - el.scrollLeft

      if (Math.abs(diff) < epsilon) {
        el.scrollLeft = targetRef.current
        rafRef.current = 0
        return
      }

      el.scrollLeft += diff * ease
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
  }, [ease, step, epsilon, shouldHandle])
}
