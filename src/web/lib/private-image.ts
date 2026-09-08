import { capturePrivateSession } from './private-session';

export function readPrivateImage(file: Blob, onLoad: (image: string) => void): () => void {
  const isCurrent = capturePrivateSession();
  const reader = new FileReader();
  let cancelled = false;
  reader.onload = () => {
    if (!cancelled && isCurrent() && typeof reader.result === 'string') onLoad(reader.result);
  };
  reader.readAsDataURL(file);
  return () => {
    cancelled = true;
    reader.onload = null;
    if (reader.readyState === FileReader.LOADING) reader.abort();
  };
}
