import { prisma } from "../src/lib/prisma";
import { ALL_TOOLS } from "../apps/mcp/src/server/create-server";

async function main() {
  for (const tool of ALL_TOOLS) {
    await prisma.mcpToolConfig.upsert({
      where: { name: tool.name },
      update: { description: tool.description, requiredRole: tool.requiredRole },
      create: { name: tool.name, description: tool.description, requiredRole: tool.requiredRole },
    });
  }
  console.info(`Seeded ${ALL_TOOLS.length} MCP tool registry entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
