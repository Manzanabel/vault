import { Outlet } from "react-router";
import Header from "./components/Header";
import { Toaster } from "sonner";

function App() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

export default App;
