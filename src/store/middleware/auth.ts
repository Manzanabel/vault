import { redirect } from "react-router";
import { apiSlice, store } from "../store";

export const authMiddleware = async () => {
  const promise = store.dispatch(apiSlice.endpoints.me.initiate());

  try {
    await promise.unwrap();
  } catch {
    throw redirect("/login");
  } finally {
    promise.unsubscribe();
  }
};
