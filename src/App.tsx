import { Outlet } from "react-router";
import Header from "./components/Header";

function App() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <Outlet />
    </div>
  );
}

export default App;
