import { ReactNode, useContext } from "react";
import { DataContext } from "./data-context";

interface DataProviderProps {
  id: string;
  data: object;
  children: ReactNode;
}

function DataProvider({ id, data, children }: DataProviderProps) {
  const parentContext = useContext(DataContext) || {};
  const combinedContext = { ...parentContext, [id]: data };

  return (
    <DataContext.Provider value={combinedContext}>
      {children}
    </DataContext.Provider>
  );
}

export { DataProvider };
