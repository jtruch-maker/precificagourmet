import { Insumo, Produto } from './types';

export const MOCK_INSUMOS: Insumo[] = [
  { id: '1', nome: 'Farinha de Trigo Especial', custoBase: 5.00, unidadeBase: 'Kg', fatorConversao: 1000 },
  { id: '2', nome: 'Queijo Mussarela', custoBase: 38.00, unidadeBase: 'Kg', fatorConversao: 1000 },
  { id: '3', nome: 'Molho de Tomate Pelati', custoBase: 12.00, unidadeBase: 'Lata (2kg)', fatorConversao: 2000 },
  { id: '4', nome: 'Manjericão Fresco', custoBase: 4.50, unidadeBase: 'Maço', fatorConversao: 50 }, // assume maço 50g
  { id: '5', nome: 'Azeite Extra Virgem', custoBase: 45.00, unidadeBase: 'Litro', fatorConversao: 1000 },
  { id: '6', nome: 'Embalagem Pizza', custoBase: 2.50, unidadeBase: 'Un', fatorConversao: 1 },
];

export const MOCK_PRODUTO: Produto = {
  id: 'prod_1',
  nome: 'Pizza Margherita Clássica',
  custos: {
    custoFixoRateado: 8.00, // Aluguel, luz, gás rateado
    percentualImposto: 12, // Simples + Taxa Maquininha
    percentualLucroDesejado: 25
  },
  fichaTecnica: [
    { idInsumo: '1', quantidadeUsada: 350, unidadeUso: 'g' }, // Massa
    { idInsumo: '3', quantidadeUsada: 120, unidadeUso: 'g' }, // Molho
    { idInsumo: '2', quantidadeUsada: 280, unidadeUso: 'g' }, // Queijo
    { idInsumo: '4', quantidadeUsada: 10, unidadeUso: 'g' },  // Manjericão
    { idInsumo: '5', quantidadeUsada: 15, unidadeUso: 'ml' }, // Azeite
    { idInsumo: '6', quantidadeUsada: 1, unidadeUso: 'un' },  // Caixa
  ]
};