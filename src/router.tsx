import { createBrowserRouter } from "react-router";
import App from "./App";
import Login from "./features/Login/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/file-list",
    element: <div>File List</div>,
  },
]);
