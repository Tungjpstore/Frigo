import React, { useEffect, useRef, useState } from 'react';

// Production requires the site key; only local/staging configuration may omit it.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    window.onTurnstileLoad = () => resolve();
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      scriptPromise = null;
      s.remove();
      reject(new Error('Failed to load Turnstile script'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ siteKey, onToken }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(Boolean(window.turnstile));

  useEffect(() => {
    if (!ready) {
      loadTurnstileScript()
        .then(() => setReady(true))
        .catch(() => onToken(null));
    }
  }, [ready, onToken]);

  useEffect(() => {
    if (!ready || !containerRef.current || widgetIdRef.current) return;
    try {
      widgetIdRef.current = window.turnstile!.render(containerRef.current, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    } catch {
      onToken(null);
    }
    return () => {
      onToken(null);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [ready, siteKey, onToken]);

  return <div ref={containerRef} className="cf-turnstile" />;
};
