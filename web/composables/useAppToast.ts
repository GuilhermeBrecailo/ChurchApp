import { useState } from "#app";

export type AppToast = {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
  /** Ação opcional, ex.: "Desfazer". */
  actionLabel?: string;
  onAction?: () => void;
  timeout: number;
};

let nextToastId = 1;

/**
 * Aviso curto no rodapé da tela ("Escala confirmada", "Não foi possível
 * salvar"). Um de cada vez; o host fica nos layouts (UtilsToastHost).
 */
export const useAppToast = () => {
  const queue = useState<AppToast[]>("app-toast-queue", () => []);

  const show = (
    message: string,
    options: Partial<Omit<AppToast, "id" | "message">> = {},
  ) => {
    const toast: AppToast = {
      id: nextToastId++,
      message,
      tone: options.tone ?? "success",
      actionLabel: options.actionLabel,
      onAction: options.onAction,
      timeout: options.timeout ?? (options.actionLabel ? 6000 : 3500),
    };
    queue.value = [...queue.value, toast];
    return toast.id;
  };

  return {
    queue,
    success: (message: string, options?: Partial<Omit<AppToast, "id" | "message" | "tone">>) =>
      show(message, { ...options, tone: "success" }),
    error: (message: string, options?: Partial<Omit<AppToast, "id" | "message" | "tone">>) =>
      show(message, { ...options, tone: "error", timeout: options?.timeout ?? 6000 }),
    info: (message: string, options?: Partial<Omit<AppToast, "id" | "message" | "tone">>) =>
      show(message, { ...options, tone: "info" }),
    dismiss: (id: number) => {
      queue.value = queue.value.filter((toast) => toast.id !== id);
    },
  };
};
