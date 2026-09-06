import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <Stack
      spacing={2}
      role="status"
      aria-live="polite"
      sx={{
        alignItems: "center",
        justifyContent: "center",
        py: 6
      }}>
      <CircularProgress size={28} />
      <Typography variant="body2" sx={{
        color: "text.secondary"
      }}>
        {label}
      </Typography>
    </Stack>
  );
}
