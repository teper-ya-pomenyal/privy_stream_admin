import { useCallback, useEffect, useRef, useState } from 'react';
import { stream } from '../api/endpoints';

// Превью трека из /stream/{id}. Файл забирается целиком в blob, потому что
// <audio> не может передать Bearer-токен. Прослушивание (/listened) не засчитываем.
export function usePreview(onError: (e: unknown) => void) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const stop = useCallback(() => {
    abort.current?.abort();
    audio.current?.pause();
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = null;
    setPlaying(null);
    setLoading(null);
  }, []);

  useEffect(() => stop, [stop]);

  const toggle = useCallback(
    async (trackId: string) => {
      if (playing === trackId || loading === trackId) {
        stop();
        return;
      }
      stop();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setLoading(trackId);
      try {
        const blob = await stream.blob(trackId, ctrl.signal);
        if (ctrl.signal.aborted) return;
        url.current = URL.createObjectURL(blob);
        audio.current ??= new Audio();
        audio.current.src = url.current;
        audio.current.onended = () => setPlaying(null);
        await audio.current.play();
        setPlaying(trackId);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') onError(e);
      } finally {
        setLoading((l) => (l === trackId ? null : l));
      }
    },
    [playing, loading, stop, onError],
  );

  return { playing, loading, toggle, stop };
}
