import { GoogleGenAI } from "@google/genai";
import { Produto, Insumo, AnaliseImpactoResult } from '../types';

const LOCAL_STORAGE_KEY = 'user_gemini_api_key';

const getAiClient = () => {
  // 1. Tenta pegar a chave do usuário (LocalStorage)
  const userKey = localStorage.getItem(LOCAL_STORAGE_KEY);
  
  // 2. Se não tiver, tenta a do ambiente (Desenvolvimento/Fallback)
  const envKey = process.env.API_KEY;

  const apiKey = userKey || envKey;

  if (!apiKey) {
    throw new Error("API_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAiAnalysis = async (
  produto: Produto,
  insumos: Insumo[],
  impacto: AnaliseImpactoResult
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Prepare meaningful context for the AI
    const insumoDetails = produto.fichaTecnica.map(item => {
      const insumo = insumos.find(i => i.id === item.idInsumo);
      return `- ${insumo?.nome}: ${item.quantidadeUsada} ${item.unidadeUso}`;
    }).join('\n');

    const prompt = `
      Atue como um consultor sênior de restaurantes e finanças.
      Analise a seguinte simulação de precificação para o produto "${produto.nome}":

      Cenário Anterior:
      - Custo Direto: R$ ${impacto.custoDiretoAntigo.toFixed(2)}
      - Preço de Venda Sugerido: R$ ${impacto.pvAntigo.toFixed(2)}

      Novo Cenário (Simulação):
      - Custo Direto: R$ ${impacto.custoDiretoNovo.toFixed(2)}
      - Preço de Venda Sugerido: R$ ${impacto.pvNovo.toFixed(2)}
      
      Lista de Ingredientes (Ficha Técnica):
      ${insumoDetails}

      Margem de Lucro Alvo: ${produto.custos.percentualLucroDesejado}%
      Impostos/Taxas: ${produto.custos.percentualImposto}%

      Dê um parecer curto (máximo 3 parágrafos) sobre esta alteração. 
      Se o preço subiu, sugira como justificar isso ao cliente ou onde tentar economizar.
      Se o preço desceu, sugira se vale a pena manter o preço antigo para aumentar a margem ou repassar o desconto para ganhar volume.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error: any) {
    console.error("Erro ao chamar Gemini:", error);
    
    if (error.message === 'API_MISSING') {
      return "⚠️ Chave de API não configurada. Clique no ícone de engrenagem no topo para adicionar sua chave do Google Gemini.";
    }
    
    return "Erro ao conectar com o consultor inteligente. Verifique sua chave de API nas configurações.";
  }
};