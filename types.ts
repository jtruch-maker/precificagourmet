export interface Insumo {
  id: string;
  nome: string;
  custoBase: number;
  unidadeBase: string;
  fatorConversao: number; // Ex: 1000 se base é kg e uso é g
}

export interface ItemFichaTecnica {
  idInsumo: string;
  quantidadeUsada: number;
  unidadeUso: string;
}

export interface CustosOperacionais {
  custoFixoRateado: number;
  percentualImposto: number; // 0-100
  percentualLucroDesejado: number; // 0-100
}

export interface Produto {
  id: string;
  nome: string;
  fichaTecnica: ItemFichaTecnica[];
  custos: CustosOperacionais;
}

export interface AnaliseImpactoResult {
  custoDiretoAntigo: number;
  pvAntigo: number;
  custoDiretoNovo: number;
  pvNovo: number;
  diferencaPreco: number;
  mensagem: string;
}

// Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
