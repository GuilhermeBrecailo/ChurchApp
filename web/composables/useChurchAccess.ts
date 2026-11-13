import { computed } from "vue";
import { resolveChurchAccess } from "../app/utils/churchAccess";
import { useAuth } from "./useAuth";

/** Acesso da pessoa logada (ver app/utils/churchAccess.ts). */
export const useChurchAccess = () => {
  const { user } = useAuth();
  return computed(() => resolveChurchAccess(user.value as never));
};
