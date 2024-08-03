import { createContext, useContext } from "react";

export type ProviderValue = { [key: string]: object };

const DataContext = createContext<ProviderValue | undefined>(undefined);

function useData<T>(id: string): T {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  if (!(id in context)) {
    throw new Error(`No data available for id ${id}`);
  }
  return context[id] as T;
}

export { useData, DataContext };
