import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import Database from "tauri-plugin-sql-api";
import { DatabaseManager } from "../../../api/database/database-manager";
import { PathSetUp } from "@/api/schema/setup";

interface StorageData {
  currentDatabase: Database | null;
  config: PathSetUp | null;
  setConfig: (config: PathSetUp) => void;
}

// Create a context with undefined as initial value
const StorageContext = createContext<StorageData | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<DatabaseProviderProps> = ({
  children,
}) => {
  const [config, setConfig] = useState<PathSetUp | null>(null);
  const [currentDatabase, setCurrentDatabase] = useState<Database | null>(null);

  useEffect(() => {
    if (!config) {
      return;
    }
    const { indexPath } = config;
    const loadDatabase = async () => {
      const databaseManager = DatabaseManager.getInstance();
      DatabaseManager.init(indexPath);
      await DatabaseManager.waitForReady();
      const db = await databaseManager.getDbInstance();
      setCurrentDatabase(db);
    };

    loadDatabase();
  }, [config]);

  return (
    <StorageContext.Provider
      value={{
        currentDatabase,
        config,
        setConfig,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = (): StorageData | undefined => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
};
