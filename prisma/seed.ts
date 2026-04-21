import "dotenv/config";
import { db } from "@/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
	console.log("Start seeding...");

	const hashedPassword = await bcrypt.hash("password", 10);

	const users = [
		{
			email: "testuser@gmail.com",
			fullName: "Test User",
			userName: "test.user",
			password: hashedPassword,
		},
		{
			email: "sam@gmail.com",
			fullName: "Sam Emmanuel",
			userName: "emmasam2",
			password: hashedPassword,
		},
		{
			email: "johndoe@gmail.com",
			fullName: "John Doe",
			userName: "john.doe",
			password: hashedPassword,
		},
		{
			email: "peterpan@gmail.com",
			fullName: "Peter Pan",
			userName: "peter101",
			password: hashedPassword,
		},
		{
			email: "personjay@gmail.com",
			fullName: "Person Jay",
			userName: "jay.101",
			password: hashedPassword,
		},
		{
			email: "hosiah@gmail.com",
			fullName: "Test Hosiah",
			userName: "hosiah.user",
			password: hashedPassword,
		},
	];

	for (const u of users) {
		const user = await db.user.upsert({
			where: {
				email: u.email,
			},
			update: {
				password: hashedPassword,
			},
			create: {
				email: u.email,
				fullName: u.fullName,
				userName: u.userName,
				password: hashedPassword,
			},
		});

		await db.member.upsert({
			where: {
				userId_workspaceId: {
					userId: user.id,
					workspaceId: "45f7ee74-06f5-4867-88e8-175bdfd63050",
				},
			},
			update: {},
			create: {
				userId: user.id,
				role: "MEMBER",
				workspaceId: "45f7ee74-06f5-4867-88e8-175bdfd63050",
			},
		});
	}

	console.log("Seeding finished.");
}
main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
