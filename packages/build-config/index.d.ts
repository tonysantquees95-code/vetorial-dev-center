import type { PluginOption, UserConfigFnObject } from "vite";

export interface OpcoesVite {
  nome: string;
  nomeCurto: string;
  descricao: string;
  corTema: string;
  corFundo: string;
  porta: number;
  plugins?: PluginOption[];
}

export function criarConfigVite(opcoes: OpcoesVite): UserConfigFnObject;
