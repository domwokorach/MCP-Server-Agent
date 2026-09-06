"use client";

import Box from "@mui/material/Box";
import { ErrorState } from "@/components/ui";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center" }}>
      <ErrorState
        title="Something went wrong"
        description={error.message || "An unexpected error occurred."}
        onRetry={reset}
      />
    </Box>
  );
}
