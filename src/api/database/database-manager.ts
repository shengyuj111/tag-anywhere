const DATABASE_NAME = "index.db";

import Database from "tauri-plugin-sql-api";

class DatabaseManager {
  private static instance: DatabaseManager;
  private static resolve: () => void;
  private static reject: (reason?: unknown) => void;
  private static readyPromise: Promise<void> = new Promise<void>(
    (resolve, reject) => {
      DatabaseManager.resolve = resolve;
      DatabaseManager.reject = reject;
    },
  );
  private initialized: boolean = false;
  private db!: Database;

  private constructor() {
    // Private constructor
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public static async init(dbPath: string): Promise<void> {
    const singleton = DatabaseManager.getInstance();
    try {
      singleton.db = await createDatabase(dbPath);
      singleton.initialized = true;
      DatabaseManager.resolve();
    } catch (error) {
      DatabaseManager.reject(error);
    }
  }

  public static async waitForReady(): Promise<void> {
    await DatabaseManager.readyPromise;
  }

  public async executeQuery(sql: string): Promise<unknown> {
    if (!this.initialized) {
      throw new Error("DatabaseManager is not initialized yet.");
    }
    return this.db.execute(sql);
  }

  public async getDbInstance(): Promise<Database> {
    await DatabaseManager.readyPromise;
    return this.db;
  }
}

async function createDatabase(dbPath: string) {
  const db = await Database.load(`sqlite:${dbPath}\\${DATABASE_NAME}`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Tag (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE,
      type TEXT NOT NULL,
      description TEXT,
      color TEXT,
      coverPath TEXT NOT NULL
    );
  `);

  await db.execute(`
      CREATE TABLE IF NOT EXISTS FileData (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT UNIQUE,
        rsa TEXT,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        coverPath TEXT NOT NULL
      );
  `);

  await db.execute(`
      CREATE TABLE IF NOT EXISTS FileComposition (
        composite_file_id INTEGER NOT NULL,
        file_id INTEGER NOT NULL,
        FOREIGN KEY (composite_file_id) REFERENCES FileData (id),
        FOREIGN KEY (file_id) REFERENCES FileData (id),
        PRIMARY KEY (composite_file_id, file_id)
      );
  `);

  await db.execute(`
      CREATE TABLE IF NOT EXISTS FileTag (
        file_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY (file_id) REFERENCES FileData (id),
        FOREIGN KEY (tag_id) REFERENCES Tag (id),
        PRIMARY KEY (file_id, tag_id)
      );
  `);

  await db.execute(`
      CREATE TABLE IF NOT EXISTS TagComposition (
        composite_tag_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        FOREIGN KEY (composite_tag_id) REFERENCES Tag (id),
        FOREIGN KEY (tag_id) REFERENCES Tag (id),
        PRIMARY KEY (composite_tag_id, tag_id)
      );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Library (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      coverPath TEXT NOT NULL,
      includeInName TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS LibraryIncludeTag (
      library_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (library_id) REFERENCES Library (id),
      FOREIGN KEY (tag_id) REFERENCES Tag (id),
      PRIMARY KEY (library_id, tag_id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS LibraryExcludeTag (
      library_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      FOREIGN KEY (library_id) REFERENCES Library (id),
      FOREIGN KEY (tag_id) REFERENCES Tag (id),
      PRIMARY KEY (library_id, tag_id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS LibraryIncludeFile (
      library_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      FOREIGN KEY (library_id) REFERENCES Library (id),
      FOREIGN KEY (file_id) REFERENCES FileData (id),
      PRIMARY KEY (library_id, file_id)
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS LibraryExcludeFile (
      library_id INTEGER NOT NULL,
      file_id INTEGER NOT NULL,
      FOREIGN KEY (library_id) REFERENCES Library (id),
      FOREIGN KEY (file_id) REFERENCES FileData (id),
      PRIMARY KEY (library_id, file_id)
    );
  `);

  return db;
}

const databaseManager = DatabaseManager.getInstance();
export { databaseManager as default, DatabaseManager };
