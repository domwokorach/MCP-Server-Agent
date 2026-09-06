import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { CircleAlert } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Stack
      spacing={1.5}
      role="alert"
      sx={{
        alignItems: "center",
        textAlign: "center",
        py: 6,
        px: 3
      }}>
      <CircleAlert size={40} color="var(--mui-palette-error-main)" aria-hidden />
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          maxWidth: 360
        }}>
        {description}
      </Typography>
      {onRetry && (
        <Button variant="outlined" size="small" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Stack>
  );
}
