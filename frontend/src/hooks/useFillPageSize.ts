import { useCallback, useEffect, useRef, useState } from 'react';

const FALLBACK_HEADER_HEIGHT = 55;
const FALLBACK_ROW_HEIGHT = 54;

/**
 * Measures how many table rows fit in a container's available height and
 * keeps that count in sync as the container is resized. The leftover pixels
 * that don't add up to one more whole row are distributed back across the
 * rows that do fit (via `rowHeight`), so the table always ends flush with
 * the container instead of leaving a gap above the pager.
 *
 * Uses a callback ref (not useRef + useEffect) because the container may
 * only mount on a later render than the component's first one (e.g. behind
 * a loading state) — a plain useEffect tied to mount would miss it.
 *
 * Observes both the container (viewport/layout resizes) and the table body
 * (antd's Table settles real column/row heights a frame or two after first
 * paint via an internal measure pass, which changes the tbody's own size
 * without resizing the flex container that clips it). Once a stretch has
 * been committed (see `isMeasured` below — committing happens at the same
 * settle point as revealing, not on the first passing measurement), the
 * "natural" row height is frozen instead of being re-measured — otherwise
 * the tbody observer would see our own stretched height and treat it as the
 * new "natural" height, inflating it further on every tick.
 *
 * `isMeasured` flips to true once the computed size has settled against real
 * data (no further resize/measure correction for a short quiet period), so
 * callers can hold a loading state instead of flashing an interim row count.
 * Pass `ready=false` while the row data itself is still loading — the very
 * first pass otherwise runs against an empty/placeholder tbody using
 * `FALLBACK_ROW_HEIGHT`, "settles" on that wrong guess, and then flashes once
 * real rows arrive a render later and the true size is measured.
 */
export function useFillPageSize(minRows = 3, ready = true) {
  const [pageSize, setPageSize] = useState(minRows);
  const [rowHeight, setRowHeight] = useState<number | undefined>(undefined);
  const [isMeasured, setIsMeasured] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);
  const observedTbodyRef = useRef<Element | null>(null);
  const naturalRowHeightRef = useRef<number | null>(null);
  const stretchedRef = useRef(false);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(ready);
  const computeRef = useRef<(() => void) | null>(null);
  readyRef.current = ready;

  const containerRef = useCallback(
    (el: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      observedTbodyRef.current = null;
      naturalRowHeightRef.current = null;
      stretchedRef.current = false;
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = null;
      computeRef.current = null;
      setIsMeasured(false);
      if (!el) return;

      const compute = () => {
        // Hide again immediately: a later recompute (e.g. the tbody settling
        // to its real size a frame after the container was first measured)
        // must re-hide content that was already revealed, not just delay the
        // very first reveal — otherwise that later correction flashes too.
        setIsMeasured(false);

        const headerHeight = el.querySelector<HTMLElement>('.ant-table-thead')?.offsetHeight ?? FALLBACK_HEADER_HEIGHT;

        let hasRealMeasurement = naturalRowHeightRef.current !== null;
        if (!stretchedRef.current) {
          const measured = el.querySelector<HTMLElement>('.ant-table-tbody > tr:not(.ant-table-measure-row)')?.offsetHeight;
          if (measured) {
            naturalRowHeightRef.current = measured;
            hasRealMeasurement = true;
          }
        }
        const naturalRowHeight = naturalRowHeightRef.current ?? FALLBACK_ROW_HEIGHT;

        const available = el.clientHeight - headerHeight;
        const rows = Math.floor(available / naturalRowHeight);
        const fittingRows = Math.max(minRows, rows);
        setPageSize(fittingRows);
        // Don't commit the stretch (or freeze `naturalRowHeightRef` via
        // `stretchedRef`) yet — only once settled, below. Committing here,
        // on the very first passing measurement, was the actual bug: antd
        // does its own internal multi-pass column/row settling after data
        // first renders (see class doc comment), so a "real" measurement
        // taken immediately can itself still be a transient, pre-settle
        // value. Freezing on that locked the hook onto a wrong number
        // forever (since `!stretchedRef.current` above then skips all
        // future re-measurement) — reproducible by loading at a viewport
        // height where antd's transient row height happens to clear
        // `minRows` before its own settling finishes.
        if (!(rows >= minRows && hasRealMeasurement)) {
          setRowHeight(undefined);
        }

        const tbody = el.querySelector('.ant-table-tbody');
        if (tbody && tbody !== observedTbodyRef.current) {
          observerRef.current?.observe(tbody);
          observedTbodyRef.current = tbody;
        }

        // Commit (and reveal) only once no further resize correction has come
        // in for a real quiet period — the first pass or two commonly run
        // against fallback/interim dimensions, or against antd's own internal
        // "measure row" pass, and get superseded shortly after, which is what
        // caused the visible "wrong row count, then it snaps to the real one"
        // flash. A fixed frame count isn't reliable here — how many
        // correction passes antd fires, and how they're scheduled, isn't the
        // same across browser engines — so this debounces on wall-clock time
        // instead: any new compute() call within the window resets it, and it
        // only fires once things have been quiet for a stretch comfortably
        // longer than any known multi-pass correction chain. Never settle
        // while the caller says data isn't loaded yet: that pass runs against
        // an empty tbody, so its result is guaranteed to be wrong.
        if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
        if (!readyRef.current) return;
        settleTimeoutRef.current = setTimeout(() => {
          if (rows >= minRows && hasRealMeasurement) {
            setRowHeight(available / fittingRows);
            stretchedRef.current = true;
          }
          setIsMeasured(true);
        }, 150);
      };

      computeRef.current = compute;
      const observer = new ResizeObserver(compute);
      observerRef.current = observer;
      observer.observe(el);
      compute();
    },
    [minRows],
  );

  // Data can finish loading without the container/tbody resizing (e.g. a
  // short list replacing an equally-tall empty state), so re-run the
  // measurement explicitly whenever `ready` flips instead of relying solely
  // on the ResizeObserver to notice.
  useEffect(() => {
    computeRef.current?.();
  }, [ready]);

  return { containerRef, pageSize, rowHeight, isMeasured };
}
