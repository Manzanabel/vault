import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import Login from "./features/Login/Login";
import FileList from "./features/FileList/FileList";
import { authMiddleware } from "./store/middleware/auth";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    middleware: [authMiddleware],
    Component: App,
    children: [
      {
        index: true,
        element: (
          <Navigate
            to="/file-list"
            replace
          />
        ),
      },
      { path: "/file-list", element: <FileList /> },
    ],
  },
]);
