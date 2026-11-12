import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { criarConfigVite } from "@venus/build-config";

export default criarConfigVite({
  nome: "Painel Dev · Vetorial Tech",
  nomeCurto: "Vetorial Dev",
  descricao: "Painel do desenvolvedor: projetos, métricas, BI e diagnóstico do ecossistema",
  corTema: "#000000",
  corFundo: "#000000",
  porta: 5176,
  plugins: [react(), tailwindcss()]
});
