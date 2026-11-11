// Código compartilhado entre assistente e Vênus Robô. Sem nada de loja/site aqui.
export const URL_API: string =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL ??
  "https://venus-servidor.tonysantquees95.workers.dev";

export interface RespostaSaude {
  ok: boolean;
  versao?: string;
}

export async function saudeDoServidor(base: string = URL_API): Promise<RespostaSaude> {
  const r = await fetch(`${base}/saude`);
  if (!r.ok) throw new Error(`Servidor respondeu ${r.status}`);
  return (await r.json()) as RespostaSaude;
}

/** Detecta se o app roda dentro do APK (Capacitor) ou no navegador (web/PWA). */
export function rodandoNoApp(): boolean {
  return typeof (globalThis as { Capacitor?: unknown }).Capacitor !== "undefined" &&
    Boolean((globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
}
