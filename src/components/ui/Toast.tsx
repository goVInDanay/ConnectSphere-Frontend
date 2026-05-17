import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../utils';

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  error: <XCircle className="w-4 h-4 text-rose-400" />,
  info: <Info className="w-4 h-4 text-brand-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
};

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/5',
  error: 'border-rose-500/30 bg-rose-500/5',
  info: 'border-brand-500/30 bg-brand-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border glass backdrop-blur-xl',
            'pointer-events-auto animate-fade-in shadow-card',
            STYLES[t.type]
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t.title}</p>
            {t.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
