import { PageContainer } from "@/components/layout";
import { EmptyState, LinkButton } from "@/components/ui";

export default function DashboardNotFound() {
  return (
    <PageContainer>
      <EmptyState
        title="Not found"
        description="We couldn't find what you were looking for."
        action={<LinkButton href="/dashboard">Back to dashboard</LinkButton>}
      />
    </PageContainer>
  );
}
