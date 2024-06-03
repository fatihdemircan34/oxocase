const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
	await prisma.user.create({
		data: {
			name: "Ahmet Yılmaz",
			email: "ahmet@example.com",
			password: "$2b$10$BRcyASlwa8XE/51mP3PdB.j4Qpw0aE4XGRLkhUifuU3lzP1MmO9vu" //  password123
		}
	});


	console.log("Başlangıç verileri başarıyla eklendi.");
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
