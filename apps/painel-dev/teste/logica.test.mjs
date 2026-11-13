import test from "node:test";
import assert from "node:assert/strict";
import { normalizarUrl, urlDoAmbiente, moeda, compacto, bytes, haQuanto, restante, rotuloDia, variacao, pontosDaSerie, caminhoDaLinha, caminhoDaArea, tetoComum, maisPerto, tomDoStatusHttp, tomDoBuild, mesclarTrafego, filtrarTrafego, progressoMedio, ehAmbiente, soma } from "../src/logica.ts";

test("normalizarUrl: https por padrão, http só em rede local, sem usuário/senha", () => {
  assert.equal(normalizarUrl("homolog.exemplo.dev/"), "https://homolog.exemplo.dev");
  assert.equal(normalizarUrl("https://x.workers.dev/id?a=1"), "https://x.workers.dev");
  assert.equal(normalizarUrl("localhost:8787"), "http://localhost:8787");
  assert.equal(normalizarUrl("192.168.0.20:8787"), "http://192.168.0.20:8787");
  assert.equal(normalizarUrl("http://10.0.2.2:8787"), "http://10.0.2.2:8787");
  assert.equal(normalizarUrl("http://exemplo.com"), null);
  assert.equal(normalizarUrl("https://user:senha@exemplo.com"), null);
  assert.equal(normalizarUrl("javascript:alert(1)"), null);
  assert.equal(normalizarUrl("   "), null);
});

test("ambientes: produção vem fixa, os outros das urls salvas", () => {
  const urls = { homologacao: "https://h.dev", local: "http://localhost:8787" };
  assert.equal(urlDoAmbiente("producao", urls, "https://p.dev"), "https://p.dev");
  assert.equal(urlDoAmbiente("homologacao", urls, "https://p.dev"), "https://h.dev");
  assert.equal(urlDoAmbiente("local", urls, "https://p.dev"), "http://localhost:8787");
  assert.ok(ehAmbiente("local") && !ehAmbiente("teste"));
});

test("formatação em português", () => {
  assert.match(moeda(4990), /49,90/);
  assert.equal(compacto(950), "950");
  assert.equal(compacto(12_300), "12,3 mil");
  assert.equal(compacto(2_500_000), "2,5 mi");
  assert.equal(bytes(1_500_000), "1,5 MB");
  const t = 1_800_000_000_000;
  assert.equal(haQuanto(0, t), "nunca");
  assert.equal(haQuanto(t - 3000, t), "agora");
  assert.equal(haQuanto(t - 45_000, t), "há 45 s");
  assert.equal(haQuanto(t - 5 * 60_000, t), "há 5 min");
  assert.equal(haQuanto(t - 3 * 3600_000, t), "há 3 h");
  assert.equal(haQuanto(t - 2 * 86400_000, t), "há 2 d");
  assert.equal(restante(t + 100 * 60_000, t), "1 h 40 min");
  assert.equal(restante(t - 5, t), "0 min");
  assert.equal(rotuloDia("2027-01-05"), "05/01");
  assert.equal(variacao(150, 100), 50);
  assert.equal(variacao(5, 0), null);
  assert.equal(variacao(0, 0), 0);
  assert.equal(soma([1, 2, 3]), 6);
});

test("gráficos: pontos, linha, área e toque", () => {
  const p = pontosDaSerie([0, 5, 10], 100, 50, 0);
  assert.deepEqual(p.map((q) => [q.x, q.y]), [[0, 50], [50, 25], [100, 0]]);
  assert.equal(caminhoDaLinha(p), "M0.0 50.0 L50.0 25.0 L100.0 0.0");
  assert.equal(caminhoDaArea(p, 50), "M0.0 50.0 L50.0 25.0 L100.0 0.0 L100.0 50 L0.0 50 Z");
  assert.equal(caminhoDaArea([], 50), "");
  assert.equal(pontosDaSerie([0, 0], 100, 50, 0)[0]?.y, 50); // série zerada não quebra a escala
  assert.equal(pontosDaSerie([7], 100, 50, 0)[0]?.x, 50);
  assert.equal(tetoComum([[1, 9], [4]]), 9);
  assert.equal(tetoComum([[]]), 1);
  assert.equal(maisPerto(p, 60), 1);
  assert.equal(maisPerto(p, 99), 2);
  // teto comum: a série menor fica mais baixa que a maior
  const a = pontosDaSerie([2], 100, 50, 0, 10)[0];
  assert.equal(a?.y, 40);
});

test("tons e tráfego ao vivo", () => {
  assert.equal(tomDoStatusHttp(200), "ok");
  assert.equal(tomDoStatusHttp(404), "aviso");
  assert.equal(tomDoStatusHttp(503), "erro");
  assert.equal(tomDoBuild("falhou"), "erro");
  assert.equal(tomDoBuild("rodando"), "aviso");
  const l = (id, status = 200, ms = 10) => ({ id, quando: id, metodo: "GET", rota: "/x", status, ms, origem: "" });
  const m = mesclarTrafego([l(3), l(2)], [l(5), l(3), l(4)]);
  assert.deepEqual(m.map((x) => x.id), [5, 4, 3, 2]);
  assert.equal(mesclarTrafego([l(1)], [l(2), l(3)], 2).length, 2);
  const lista = [l(1, 200, 20), l(2, 404, 20), l(3, 200, 900)];
  assert.equal(filtrarTrafego(lista, "erros").length, 1);
  assert.equal(filtrarTrafego(lista, "lentas")[0]?.id, 3);
  assert.equal(filtrarTrafego(lista, "todas").length, 3);
  assert.equal(progressoMedio([{ progresso: 100 }, { progresso: 50 }]), 75);
  assert.equal(progressoMedio([]), 0);
});

import { buildDaTag, ultimoApk, plataformaDe } from "../src/logica.ts";
test("aplicativos: build da tag, último APK e plataforma", () => {
  assert.equal(buildDaTag("dev-1.42"), 42);
  assert.equal(buildDaTag("v2"), 0);
  const r = [
    { tag_name: "dev-1.7", assets: [{ name: "VenusDev.apk", browser_download_url: "https://x/7.apk" }] },
    { tag_name: "dev-1.9", assets: [{ name: "VenusDev.apk", browser_download_url: "https://x/9.apk" }] },
    { tag_name: "dev-1.10", draft: true, assets: [{ name: "VenusDev.apk", browser_download_url: "https://x/10.apk" }] },
    { tag_name: "dev-1.11", assets: [] },
  ];
  assert.deepEqual(ultimoApk(r), { build: 9, url: "https://x/9.apk" });
  assert.equal(ultimoApk(null), null);
  assert.equal(plataformaDe("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "windows");
  assert.equal(plataformaDe("Mozilla/5.0 (Linux; Android 14; Pixel)"), "android");
  assert.equal(plataformaDe("Mozilla/5.0 (Macintosh)"), "outra");
});

import { ultimoWindows } from "../src/logica.ts";
test("aplicativos: último instalador do Windows", () => {
  const r = [
    { tag_name: "dev-1.7", assets: [{ name: "VenusDev.apk", browser_download_url: "https://x/7.apk" }] },
    { tag_name: "dev-1.9", assets: [{ name: "VetorialDev-Setup.exe", browser_download_url: "https://x/9.exe" }] },
  ];
  assert.deepEqual(ultimoWindows(r), { build: 9, url: "https://x/9.exe" });
  assert.equal(ultimoWindows([]), null);
});
