import type { CapacitorConfig } from "@capacitor/cli";

// Esquema http dentro do app: deixa o seletor de ambiente chamar o servidor de teste local (http) sem bloqueio de conteúdo misto.
// O servidor de produção e o de homologação continuam em https.
const config: CapacitorConfig = {
  appId: "com.vetorialtech.venus.dev",
  appName: "Vetorial Dev",
  webDir: "dist",
  android: { allowMixedContent: true },
  server: { androidScheme: "http", cleartext: true }
};

export default config;
