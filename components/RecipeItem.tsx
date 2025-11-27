import React from 'react';
import { Insumo, ItemFichaTecnica } from '../types';
import { Trash2 } from 'lucide-react';

interface RecipeItemProps {
  item: ItemFichaTecnica;
  insumo: Insumo;
  onUpdate: (newItem: ItemFichaTecnica) => void;
  onRemove: () => void;
  custoCalculado: number;
}

export const RecipeItem: React.FC<RecipeItemProps> = ({ item, insumo, onUpdate, onRemove, custoCalculado }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-lg shadow-sm hover:border-orange-300 transition-all group">
      <div className="flex-1">
        <div className="font-medium text-stone-800 text-sm">{insumo.nome}</div>
        <div className="text-[10px] text-stone-400 uppercase tracking-wide mt-0.5">
          R$ {insumo.custoBase.toFixed(2)} / {insumo.unidadeBase}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-md border border-stone-200 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100 transition-all">
          <input 
            type="number" 
            value={item.quantidadeUsada}
            onChange={(e) => onUpdate({ ...item, quantidadeUsada: parseFloat(e.target.value) || 0 })}
            className="w-16 p-1 text-right bg-transparent border-none focus:ring-0 text-sm font-semibold text-stone-700 outline-none"
          />
          <span className="text-[10px] font-bold text-stone-400 uppercase pr-2">{item.unidadeUso}</span>
        </div>
        
        <div className="w-20 text-right">
          <span className="block text-sm font-bold text-stone-800">R$ {custoCalculado.toFixed(2)}</span>
        </div>

        <button 
          onClick={onRemove}
          className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="Remover insumo"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};