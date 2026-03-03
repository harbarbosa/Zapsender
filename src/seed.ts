import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const apiKey = randomBytes(24).toString("base64url");
  const hash = await bcrypt.hash(apiKey, 12);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Default Tenant",
      apiKeyHash: hash,
      rateLimitPerMinute: 60
    }
  });

  console.log("TENANT_ID:", tenant.id);
  console.log("API_KEY (save once):", apiKey);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
