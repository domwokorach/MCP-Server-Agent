
interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground" role="status" aria-live="polite">
      <span className="size-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
