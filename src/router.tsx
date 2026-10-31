import { createBrowserRouter } from "react-router";
import Login from "./features/Login/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
]);
