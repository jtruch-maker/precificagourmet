import { Insumo, ItemFichaTecnica, CustosOperacionais, Produto, AnaliseImpactoResult } from '../types';

/**
 * Calcula o custo de um item específico da ficha técnica com base no insumo cadastrado.
 */
export const calcularCustoItem = (item: ItemFichaTecnica, insumo: Insumo): number => {
  if (!insumo) return 0;
  // (Custo_Base / Fator_Conversao) * Quantidade_Usada
  return (insumo.custoBase / insumo.fatorConversao) * item.quantidadeUsada;
};

/**
 * a) Cálculo do Custo Direto (Matéria-Prima)
 */
export const calcularCustoDiretoTotal = (fichaTecnica: ItemFichaTecnica[], insumos: Insumo[]): number => {
  return fichaTecnica.reduce((total, item) => {
    const insumo = insumos.find(i => i.id === item.idInsumo);
    if (!insumo) return total;
    return total + calcularCustoItem(item, insumo);
  }, 0);
};

/**
 * b) Cálculo do Preço de Venda Sugerido (PV)
 * PV = (Custo Direto + Custo Fixo Rateado) / (1 - (Imposto + Lucro)/100)
 */
export const calcularPrecoVenda = (custoDireto: number, custos: CustosOperacionais): number => {
  const divisor = 1 - ((custos.percentualImposto + custos.percentualLucroDesejado) / 100);
  
  if (divisor <= 0) {
    // Evita divisão por zero ou negativa se as margens forem irreais (>100%)
    return 0;
  }

  const numerador = custoDireto + custos.custoFixoRateado;
  return numerador / divisor;
};

/**
 * 3. A Função de Análise de Impacto (Requisito Premium)
 */
export const analisarImpacto = (
  produto: Produto,
  novaFichaTecnica: ItemFichaTecnica[],
  insumos: Insumo[]
): AnaliseImpactoResult => {
  // 1. Calcular PV Atual (Original)
  const custoDiretoAntigo = calcularCustoDiretoTotal(produto.fichaTecnica, insumos);
  const pvAntigo = calcularPrecoVenda(custoDiretoAntigo, produto.custos);

  // 2. Calcular PV Novo (Simulado)
  const custoDiretoNovo = calcularCustoDiretoTotal(novaFichaTecnica, insumos);
  const pvNovo = calcularPrecoVenda(custoDiretoNovo, produto.custos);

  // 3. Diferença
  const diferencaPreco = pvNovo - pvAntigo;

  const formatMoney = (val: number) => `R$ ${val.toFixed(2)}`;

  let mensagem = '';
  if (diferencaPreco > 0) {
    mensagem = `A alteração aumentou o custo direto em ${formatMoney(custoDiretoNovo - custoDiretoAntigo)}. O preço de venda precisa subir ${formatMoney(diferencaPreco)} para manter a margem de ${produto.custos.percentualLucroDesejado}%.`;
  } else if (diferencaPreco < 0) {
    mensagem = `A alteração gerou uma economia de ${formatMoney(custoDiretoAntigo - custoDiretoNovo)} no custo direto. Você pode reduzir o preço em ${formatMoney(Math.abs(diferencaPreco))} e manter a mesma margem.`;
  } else {
    mensagem = 'Nenhuma alteração significativa no preço final.';
  }

  return {
    custoDiretoAntigo,
    pvAntigo,
    custoDiretoNovo,
    pvNovo,
    diferencaPreco,
    mensagem
  };
};