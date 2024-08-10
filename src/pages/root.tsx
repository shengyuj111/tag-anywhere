import { useEffect } from "react";
import { Outlet } from "react-router-dom";

export const RootPage = () => {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.code === "KeyF") || e.code === "F5") {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return <Outlet />;
};
