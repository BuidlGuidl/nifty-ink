import { decimal, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const funding = pgTable("funding", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 18 }).notNull(),
  transactionHash: text("transaction_hash").notNull(),
  chain: text("chain"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
