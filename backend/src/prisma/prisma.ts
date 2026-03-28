import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcrypt";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter, log: [ 'info', 'warn', 'error'] }).$extends({
    query: {
        manager: {
            async create({ args, query }) {
                if (args.data.password) {
                    args.data.password = await bcrypt.hash(args.data.password, 10);
                }
                return query(args);
            },
            async update({ args, query }) {
                if (args.data.password && typeof args.data.password === "string") {
                    args.data.password = await bcrypt.hash(args.data.password, 10);
                }
                return query(args);
            },
        },
        staff: {
            async create({ args, query }) {
                if (args.data.password) {
                    args.data.password = await bcrypt.hash(args.data.password, 10);
                }
                return query(args);
            },
            async update({ args, query }) {
                if (args.data.password && typeof args.data.password === "string") {
                    args.data.password = await bcrypt.hash(args.data.password, 10);
                }
                return query(args);
            },
        },
    },
});

export { prisma };