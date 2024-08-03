// database-helper.ts

import Database from "tauri-plugin-sql-api";

export type SelectOneErrorMessages = {
  noDataFound: string;
  multipleRowsFound: string;
  error: string;
};

export const selectOne = async function <T>(
  db: Database,
  query: string,
  bindValues: unknown[] = [],
  errorMessages: SelectOneErrorMessages = {
    noDataFound: "No data found",
    multipleRowsFound: "Multiple rows found",
    error: "Error",
  },
): Promise<T> {
  try {
    const rows: T[] = await db.select(query, bindValues);
    if (rows.length === 0) {
      throw new Error(errorMessages.noDataFound);
    }
    if (rows.length > 1) {
      throw new Error(errorMessages.multipleRowsFound);
    }
    return rows[0];
  } catch (error) {
    throw new Error(errorMessages.error + ": " + (error as Error).message);
  }
};

export type SelectOneOrNullErrorMessages = {
  error: string;
  multipleRowsFound: string;
};

export const selectOneOrNull = async function <T>(
  db: Database,
  query: string,
  bindValues: unknown[] = [],
  errorMessages: SelectOneOrNullErrorMessages = {
    error: "Error",
    multipleRowsFound: "Multiple rows found",
  },
): Promise<T | null> {
  try {
    const rows: T[] = await db.select(query, bindValues);
    if (rows.length > 1) {
      throw new Error(errorMessages.multipleRowsFound);
    }
    return rows.length === 0 ? null : rows[0];
  } catch (error) {
    throw new Error(errorMessages.error + ": " + (error as Error).message);
  }
};
