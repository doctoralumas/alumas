import { currentUser } from "../auth";

export async function getSessionUser() {
  return await currentUser();
}
