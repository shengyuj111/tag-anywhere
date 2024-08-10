import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { IndexCacheGuard } from "./pages/index-cache-guard.tsx";
import { SetupPage } from "./pages/setup/setup-page.tsx";
import { AllFilesPage } from "./pages/all-files/all-files-page.tsx";
import { TagsManagementPage } from "./pages/tags-management/tags-management-page.tsx";
import { Navbar } from "./pages/navbar.tsx";
import { StoreProvider } from "./components/provider/store-provider/StoreProvider.tsx";
import { DialogServiceProvider } from "./components/provider/dialog-provider/dialog-service-provider.tsx";
import { ThemeProvider } from "./components/provider/theme-provider/theme-provider.tsx";
import { StorageProvider } from "./components/provider/storage-provider/storage-provider.tsx";
import { TestPage } from "./pages/test/test-page.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import { FileDetailsPage } from "./pages/all-files/details/file-details-page.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { TagDetailsPage } from "./pages/tags-management/details/tag-details-page.tsx";

import { LibraryDetailsPage } from "./pages/home/library-details/library-details.tsx";
import { LibraryPage } from "./pages/home/library-page.tsx";
import { SettingsPage } from "./pages/settings/settings-page.tsx";
import { RootPage } from "./pages/root.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootPage />,
    children: [
      {
        path: "",
        element: <IndexCacheGuard />,
        children: [
          {
            path: "",
            element: <Navbar />,
            children: [
              {
                path: "",
                element: <Navigate to="/library" />,
              },
              {
                path: "",
                children: [
                  {
                    path: "library",
                    element: <LibraryPage />,
                  },
                  {
                    path: "library/:libraryId",
                    element: <LibraryDetailsPage />,
                  },
                ],
              },
              {
                path: "all-files",
                children: [
                  {
                    path: "",
                    element: <AllFilesPage />,
                  },
                  {
                    path: "details/:fileId",
                    element: <FileDetailsPage />,
                  },
                ],
              },
              {
                path: "tags",
                children: [
                  {
                    path: "",
                    element: <TagsManagementPage />,
                  },
                  {
                    path: "details/:tagId",
                    element: <TagDetailsPage />,
                  },
                ],
              },
              {
                path: "settings",
                element: <SettingsPage />,
              },
              {
                path: "test",
                element: <TestPage />,
              },
            ],
          },
        ],
      },
      {
        path: "setup",
        element: <SetupPage />,
      },
    ],
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StoreProvider>
      <ThemeProvider>
        <StorageProvider>
          <TooltipProvider>
            <DialogServiceProvider>
              <RouterProvider router={router} />
              <Toaster />
            </DialogServiceProvider>
          </TooltipProvider>
        </StorageProvider>
      </ThemeProvider>
    </StoreProvider>
  </React.StrictMode>,
);
