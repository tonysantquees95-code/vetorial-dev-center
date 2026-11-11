// Configuração Vite compartilhada. Três modos de build:
//   web        -> site estático (base "/")
//   web + PWA  -> o mesmo build, com service worker e manifest (padrão do modo "production")
//   capacitor  -> dentro do APK (base "./", sem service worker)
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Endereço onde o site fica (GitHub Pages usa /vetorial-dev-center/); define com a variável BASE_URL no build.
const BASE = (process.env.BASE_URL || "/").replace(/\/?$/, "/");

export function criarConfigVite({ nome, nomeCurto, descricao, corTema, corFundo, porta, plugins = [] }) {
  return defineConfig(({ mode }) => {
    const nativo = mode === "capacitor";
    return {
      base: nativo ? "./" : BASE,
      server: { port: porta, strictPort: true, host: true },
      build: { outDir: "dist", sourcemap: !nativo, target: "es2020" },
      plugins: [
        ...plugins,
        !nativo &&
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icons/*.png"],
            // iOS: o service worker assume o controle na hora e limpa caches antigos (o Safari apaga caches de apps esquecidos)
            injectRegister: "auto",
            manifest: {
              name: nome,
              short_name: nomeCurto,
              description: descricao,
              lang: "pt-BR",
              start_url: BASE,
              scope: BASE,
              id: BASE,
              display: "standalone",
              display_override: ["standalone", "minimal-ui"],
              categories: ["business", "productivity"],
              orientation: "portrait",
              theme_color: corTema,
              background_color: corFundo,
              icons: [
                { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
                { src: "icons/apple-touch-180.png", sizes: "180x180", type: "image/png" },
                { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
                { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
              ]
            },
            workbox: {
              navigateFallback: BASE + "index.html",
              // chamadas ao servidor (login, sincronização, /id, /v1) nunca vêm do cache
              navigateFallbackDenylist: [/^\/id(\/|$)/, /^\/v1\//, /^\/loja\//],
              globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              skipWaiting: true
            }
          })
      ].filter(Boolean)
    };
  });
}
