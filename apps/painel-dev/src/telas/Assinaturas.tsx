import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, Cartao, Carregando, Indicador, Selo, Vazio } from "../ui";

const reais = (centavos: number) => "R$ " + (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Quem assina, quem está no teste grátis e quanto entrou no mês. As contas do dono e dos testadores não entram na conta. */
export function Assinaturas() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando } = useBusca(() => api.assinaturas(), 30_000, endereco);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador rotulo="Assinantes" valor={String(dado.assinantes)} detalhe="com o plano pago em dia" tom="ok" />
        <Indicador rotulo="No teste grátis" valor={String(dado.emTeste)} detalhe="ainda não pagaram" />
        <Indicador rotulo="Entrou no mês" valor={reais(dado.mes.centavos)} detalhe={`${dado.mes.pagamentos} ${dado.mes.pagamentos === 1 ? "pagamento" : "pagamentos"}`} tom="ok" />
        <Indicador rotulo="Vencem em 7 dias" valor={String(dado.vencendoEm7)} detalhe="avise para renovar" tom={dado.vencendoEm7 > 0 ? "aviso" : "neutro"} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador rotulo="Vencidos" valor={String(dado.venceram)} detalhe="já pagaram e não renovaram" tom={dado.venceram > 0 ? "aviso" : "neutro"} />
        <Indicador rotulo="Sem teste" valor={String(dado.semTeste)} detalhe="pedem pagamento ao entrar" />
        <Indicador rotulo="Testadores" valor={String(dado.testadores)} detalhe="acesso livre, fora da conta" />
      </div>
      <Cartao titulo="Assinantes por plano">
        {dado.pacotes.length === 0 ? <Vazio>Ainda não há assinantes pagos.</Vazio> : (
          <ul className="divide-y divide-borda">
            {dado.pacotes.map((p) => (
              <li key={p.chave} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1 truncate">{p.nome}</span><span className="num font-semibold">{p.n}</span></li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Últimos pagamentos" descricao="Confirmados pelo Mercado Pago ou pela InfinitePay.">
        {dado.recentes.length === 0 ? <Vazio>Nenhum pagamento confirmado ainda.</Vazio> : (
          <ul className="divide-y divide-borda">
            {dado.recentes.map((p) => (
              <li key={p.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="num font-semibold">{reais(p.valor)}</span><span className="text-xs text-suave">{haQuanto(p.quando)}</span></div>
                <div className="mt-0.5 break-all text-xs text-suave">{p.email || "conta sem e-mail"}</div>
                <div className="mt-1.5 flex flex-wrap gap-2"><Selo>{p.pacote}</Selo><Selo>{p.gateway === "mercadopago" ? "Mercado Pago" : "InfinitePay"}</Selo>{p.aguardandoLiberacao && <Selo tom="aviso">Aguardando liberar</Selo>}</div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
