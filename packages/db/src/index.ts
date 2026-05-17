import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export function createDb(binding: D1Database) {
  return drizzle(binding, { schema });
}

export type AppDatabase = ReturnType<typeof createDb>;
export { schema };

export {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
export type { SQL } from "drizzle-orm";
