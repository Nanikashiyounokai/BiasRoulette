import { useEffect, useState } from 'react';

/** 描画に使う現在時刻。描画中に Date.now() を呼ぶと再描画のたびに値が変わるので、1 分ごとに更新する */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
