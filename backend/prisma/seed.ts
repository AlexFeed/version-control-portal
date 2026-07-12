import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcrypt";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminLogin = "admin";
  const adminPassword = "admin123";

  // Ищем пользователя по логину
  const existingAdmin = await prisma.user.findUnique({
    where: { login: adminLogin },
  });

  if (existingAdmin) {
    // Сценарий 1: Пользователь уже есть
    console.log("==================================================");
    console.log("'Нулевой администратор' в бд уже создан...");
    console.log(`👤 Логин:   ${existingAdmin.login}`);
    console.log(`🛡️ Роль:    ${existingAdmin.role}`);
    console.log("==================================================");
  } else {
    // Сценарий 2: Создаем нового пользователя
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = await prisma.user.create({
      data: {
        login: adminLogin,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });

    console.log("==================================================");
    console.log("✅ База данных успешно инициализирована!");
    console.log("Создан дефолтный пользователь с правами администратора.");
    console.log(`👤 Логин:   ${adminLogin}`);
    console.log(`🔑 Пароль:  ${adminPassword}`);
    console.log(`🛡️ Роль:    ${newAdmin.role}`);
    console.log("==================================================");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("❌ Произошла ошибка при выполнении seed.ts:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });