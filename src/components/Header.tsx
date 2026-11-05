import { useNavigate } from "react-router";
import { apiSlice, useLogoutMutation } from "../store/store";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export default function Header() {
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  const { data: meData } = useAppSelector(apiSlice.endpoints.me.select());
  const dispatch = useAppDispatch();

  const onLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      await logout().unwrap();
      dispatch(apiSlice.util.resetApiState());
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <span className="text-xl font-semibold text-slate-900">Vault</span>

        <div className="flex items-center gap-4">
          {meData?.name && (
            <span className="text-sm text-slate-600">{meData.name}</span>
          )}
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoading}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
