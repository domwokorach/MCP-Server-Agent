import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 6 },
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }} sx={{ width: "100%", maxWidth: { xs: 520, sm: 520 } }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            justifyContent: "center"
          }}>
          <Box sx={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", bgcolor: "primary.main" }} aria-hidden />
          <Typography variant="subtitle1" sx={{
            fontWeight: 700
          }}>
            Agent Platform
          </Typography>
        </Stack>
        {children}
      </Stack>
    </Box>
  );
}
