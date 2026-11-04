import React from 'react';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

interface SupabaseAuthFormProps {
  isSubmitting: boolean;
  authError: string | null;
  authMessage: string | null;
  handleGoogleSignIn: () => void;
}

export const SupabaseAuthForm: React.FC<SupabaseAuthFormProps> = ({
  isSubmitting,
  authError,
  authMessage,
  handleGoogleSignIn,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col items-center justify-center p-3 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent-primary shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-text-primary">Otentikasi Aman 1-Tap</h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Masuk dengan Google untuk mengaktifkan sinkronisasi otomatis antar perangkat & penyimpanan cloud.
          </p>
        </div>

        {/* Primary Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2.5 px-5 py-2.5 text-xs font-semibold text-text-primary bg-bg-surface border border-border-default hover:border-accent-primary hover:bg-bg-hover rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-accent-primary" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          Masuk dengan Google
        </button>
      </div>

      {authError && (
        <div className="flex items-start gap-2 p-3 text-xs text-status-error bg-status-error-bg border border-status-error/20 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}
      {authMessage && (
        <div className="flex items-start gap-2 p-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{authMessage}</span>
        </div>
      )}
    </div>
  );
};
