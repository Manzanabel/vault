import { redirect } from "react-router";
import { apiSlice, store } from "../store";

export const authMiddleware = async () => {
  const promise = store.dispatch(apiSlice.endpoints.me.initiate());

  try {
    const data = await promise.unwrap();
    console.log(data);
  } catch (error: unknown) {
    console.log(error);
    throw redirect("/login");
  } finally {
    promise.unsubscribe();
  }
};
