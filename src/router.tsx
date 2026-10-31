import { createBrowserRouter } from "react-router";
import App from "./App";
import Login from "./features/Login/Login";
import { authMiddleware } from "./middleware/auth";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    middleware: [authMiddleware],
    Component: App,
    children: [{ path: "/file-list", element: <div>Files List</div> }],
  },
]);
