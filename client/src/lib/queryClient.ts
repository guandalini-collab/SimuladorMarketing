import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    // Auditoria (2026-09, segunda rodada): antes, esta função sempre
    // lançava a string crua `${status}: ${text}` — e como quase toda tela
    // do app captura esse erro só com `error.message` (em onError de
    // useMutation), o usuário via mensagens tipo `400: {"error":"Email já
    // cadastrado"}` em vez de "Email já cadastrado". A maioria das rotas do
    // servidor responde erro como JSON `{ error: "..." }`; quando é esse o
    // caso, usa a mensagem amigável ali dentro. Quando o corpo não é JSON
    // (ou não tem campo "error"), mantém o texto cru como antes, para não
    // esconder informação de um erro inesperado.
    let message = text || res.statusText;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.error === "string" && parsed.error) {
          message = parsed.error;
        }
      } catch {
        // corpo não era JSON — mantém o texto bruto em message
      }
    }
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    cache: "no-store",
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiUpload(
  url: string,
  formData: FormData,
): Promise<Response> {
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
    cache: "no-store",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      cache: "no-store",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
