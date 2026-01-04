import type { Statement } from "@/src/models/statement";

import {
  deleteStatement as removeStatement,
  getAllStatements,
  getLatestStatement as getLatest,
  upsertStatement,
} from "@/src/storage/statements";

export async function listStatements(): Promise<Statement[]> {
  return getAllStatements();
}

export async function getLatestStatement(): Promise<Statement | null> {
  return getLatest();
}

export async function saveStatement(statement: Statement): Promise<void> {
  await upsertStatement(statement);
}

export async function deleteStatement(id: string): Promise<void> {
  await removeStatement(id);
}
