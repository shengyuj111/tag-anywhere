import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import Database from "tauri-plugin-sql-api";
import { DatabaseManager } from "../../../api/database/database-manager";
import { GlobalSettings } from "@/api/api/settings-api";


interface StorageData {
  currentDatabase: Database | null;
  settings: GlobalSettings | null;
  setSettings: (settings: GlobalSettings) => void;
}

// Create a context with undefined as initial value
const StorageContext = createContext<StorageData | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const StorageProvider: React.FC<DatabaseProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [currentDatabase, setCurrentDatabase] = useState<Database | null>(null);

  useEffect(() => {
    if (!settings || !settings.indexPath) {
      return;
    }
    const { indexPath } = settings;
    const loadDatabase = async () => {
      const databaseManager = DatabaseManager.getInstance();
      DatabaseManager.init(indexPath);
      await DatabaseManager.waitForReady();
      const db = await databaseManager.getDbInstance();
      setCurrentDatabase(db);
    };

    loadDatabase();
  }, [settings]);

  return (
    <StorageContext.Provider
      value={{
        currentDatabase,
        settings,
        setSettings,
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
