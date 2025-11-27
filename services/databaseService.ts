import { Insumo, Produto } from '../types';
import { MOCK_PRODUTO, MOCK_INSUMOS } from '../constants';

const DB_KEY_PRODUTOS = 'app_produtos_db';
const DB_KEY_INSUMOS = 'app_insumos_db';

// Função segura para gerar IDs em qualquer ambiente (http ou https)
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback se falhar
    }
  }
  // Fallback manual: Timestamp + Random
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9);
};

// Inicializa o banco de dados com dados de exemplo se estiver vazio
const initDB = () => {
  if (!localStorage.getItem(DB_KEY_PRODUTOS)) {
    // Garante IDs únicos para os mocks
    const mockProd = { ...MOCK_PRODUTO, id: generateId() };
    localStorage.setItem(DB_KEY_PRODUTOS, JSON.stringify([mockProd]));
  }
  if (!localStorage.getItem(DB_KEY_INSUMOS)) {
    localStorage.setItem(DB_KEY_INSUMOS, JSON.stringify(MOCK_INSUMOS));
  }
};

export const dbService = {
  // --- INSUMOS ---
  getInsumos: (): Insumo[] => {
    initDB();
    return JSON.parse(localStorage.getItem(DB_KEY_INSUMOS) || '[]');
  },

  addInsumo: (novoInsumo: Insumo): Insumo[] => {
    const insumos = dbService.getInsumos();
    // Garante que o ID existe
    if (!novoInsumo.id) novoInsumo.id = generateId();
    
    insumos.push(novoInsumo);
    localStorage.setItem(DB_KEY_INSUMOS, JSON.stringify(insumos));
    return insumos;
  },

  // --- PRODUTOS ---
  getProdutos: (): Produto[] => {
    initDB();
    return JSON.parse(localStorage.getItem(DB_KEY_PRODUTOS) || '[]');
  },

  getProdutoById: (id: string): Produto | undefined => {
    const produtos = dbService.getProdutos();
    return produtos.find(p => p.id === id);
  },

  saveProduto: (produto: Produto): void => {
    const produtos = dbService.getProdutos();
    const index = produtos.findIndex(p => p.id === produto.id);
    
    if (index >= 0) {
      produtos[index] = produto;
    } else {
      produtos.push(produto);
    }
    
    localStorage.setItem(DB_KEY_PRODUTOS, JSON.stringify(produtos));
  },

  deleteProduto: (id: string): Produto[] => {
    const produtos = dbService.getProdutos();
    const novosProdutos = produtos.filter(p => p.id !== id);
    localStorage.setItem(DB_KEY_PRODUTOS, JSON.stringify(novosProdutos));
    return novosProdutos;
  },

  createProduto: (nome: string): Produto => {
    const novoProduto: Produto = {
      id: generateId(),
      nome,
      custos: {
        custoFixoRateado: 0,
        percentualImposto: 0,
        percentualLucroDesejado: 20
      },
      fichaTecnica: []
    };
    dbService.saveProduto(novoProduto);
    return novoProduto;
  }
};