import { useEffect, useState } from 'react';

/**
 * Re-runs `load()` every `ms` and hands back the newest result.
 *
 * Two deliberate choices: a chained setTimeout instead of setInterval, so a
 * slow request can never overlap the next one; and a pause while the browser
 * tab is hidden, so a laptop left open during a demo isn't hammering the API.
 *
 * `setData` is returned so a screen can apply the result of its own action
 * immediately instead of waiting for the next tick.
 */
export function usePoll(load, ms, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    let first = true;
    let timer;

    async function tick() {
      if (!first && document.hidden) {
        timer = setTimeout(tick, ms);
        return;
      }
      first = false;

      try {
        const next = await load();
        if (!alive) return;
        setData(next);
        setError('');
      } catch (err) {
        if (alive) setError(err.message);
      }

      if (alive) {
        setLoading(false);
        timer = setTimeout(tick, ms);
      }
    }

    setLoading(true);
    tick();

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, deps);

  return { data, error, loading, setData };
}
