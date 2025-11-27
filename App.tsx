import React, { useState, useMemo, useEffect } from 'react';
import { Insumo, Produto, ItemFichaTecnica, CustosOperacionais } from './types';
import { calcularCustoDiretoTotal, calcularPrecoVenda, analisarImpacto, calcularCustoItem } from './services/pricingEngine';
import { generateAiAnalysis } from './services/geminiService';
import { dbService } from './services/databaseService';
import { RecipeItem } from './components/RecipeItem';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { 
  Calculator, 
  ChefHat, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  PieChart,
  LogOut,
  User,
  Plus,
  X,
  ArrowLeft,
  Trash2,
  Edit3,
  Package,
  Save,
  UtensilsCrossed,
  Settings,
  Key,
  ExternalLink
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// --- COMPONENTE: MODAL DE CONFIGURAÇÕES (API KEY) ---
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('user_gemini_api_key') || '';
      setApiKey(storedKey);
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('user_gemini_api_key', apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('user_gemini_api_key');
    setApiKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <Settings size={18} /> Configurações
          </h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2 flex items-center gap-2">
              <Key size={16} className="text-orange-600" />
              Sua Chave de API (Google Gemini)
            </label>
            <p className="text-xs text-stone-500 mb-3">
              Para usar a Inteligência Artificial, insira sua chave gratuita do Google AI Studio. 
              Ela ficará salva apenas no seu navegador.
            </p>
            <input 
              type="password" 
              placeholder="Cole sua API Key aqui (começa com AIza...)"
              className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-mono"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>

          <div className="bg-stone-50 p-3 rounded border border-stone-200 text-xs text-stone-600 flex flex-col gap-2">
             <p>Não tem uma chave?</p>
             <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 font-bold hover:underline flex items-center gap-1"
            >
              Gerar Chave Gratuita <ExternalLink size={12} />
            </a>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleClear}
              className="flex-1 py-2 text-stone-500 hover:text-red-600 text-sm font-medium transition-colors"
            >
              Remover Chave
            </button>
            <button 
              onClick={handleSave}
              className={`flex-1 py-2 rounded-lg font-bold text-white transition-all shadow-md ${saved ? 'bg-green-600' : 'bg-stone-900 hover:bg-stone-800'}`}
            >
              {saved ? 'Salvo!' : 'Salvar Configuração'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE: MODAL DE INSUMOS ---
interface AddInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onRegister: (insumo: Insumo) => void;
  availableInsumos: Insumo[];
}

const AddInsumoModal: React.FC<AddInsumoModalProps> = ({ isOpen, onClose, onSelect, onRegister, availableInsumos }) => {
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  
  // Form State for new Insumo
  const [newInsumo, setNewInsumo] = useState({
    nome: '',
    precoEmbalagem: '',
    tamanhoEmbalagem: '',
    unidadeEmbalagem: 'Kg' as 'Kg' | 'L' | 'Un' | 'g' | 'ml'
  });

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const preco = parseFloat(newInsumo.precoEmbalagem);
    const tamanho = parseFloat(newInsumo.tamanhoEmbalagem);

    if (!newInsumo.nome || isNaN(preco) || isNaN(tamanho)) return;

    // Normalização para Unidade Base (Kg, L, Un)
    let custoBase = 0;
    let unidadeBase = '';
    let fatorConversao = 1;

    if (newInsumo.unidadeEmbalagem === 'Kg') {
      unidadeBase = 'Kg';
      custoBase = preco / tamanho; // Custo por 1 Kg
      fatorConversao = 1000;
    } else if (newInsumo.unidadeEmbalagem === 'g') {
      unidadeBase = 'Kg';
      custoBase = (preco / tamanho) * 1000; // Custo por 1 Kg
      fatorConversao = 1000;
    } else if (newInsumo.unidadeEmbalagem === 'L') {
      unidadeBase = 'Litro';
      custoBase = preco / tamanho;
      fatorConversao = 1000; // ml
    } else if (newInsumo.unidadeEmbalagem === 'ml') {
      unidadeBase = 'Litro';
      custoBase = (preco / tamanho) * 1000;
      fatorConversao = 1000;
    } else {
      unidadeBase = 'Un';
      custoBase = preco / tamanho;
      fatorConversao = 1;
    }

    const insumoCriado: Insumo = {
      id: '', // Será gerado pelo service
      nome: newInsumo.nome,
      custoBase,
      unidadeBase,
      fatorConversao
    };

    onRegister(insumoCriado);
    setNewInsumo({ nome: '', precoEmbalagem: '', tamanhoEmbalagem: '', unidadeEmbalagem: 'Kg' }); // Reset
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <h3 className="font-bold text-stone-800">Adicionar Ingrediente</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex border-b border-stone-100">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'select' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500 hover:text-stone-700'}`}
            onClick={() => setActiveTab('select')}
          >
            Selecionar Existente
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'create' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-stone-500 hover:text-stone-700'}`}
            onClick={() => setActiveTab('create')}
          >
            Cadastrar Novo
          </button>
        </div>

        <div className="p-2 max-h-[60vh] overflow-y-auto min-h-[300px]">
          {activeTab === 'select' ? (
            availableInsumos.length === 0 ? (
              <div className="p-8 text-center text-stone-500 flex flex-col items-center">
                <Package size={48} className="text-stone-200 mb-2" />
                <p>Nenhum insumo disponível para adicionar.</p>
                <button onClick={() => setActiveTab('create')} className="mt-2 text-orange-600 font-bold text-sm hover:underline">
                  Cadastrar um novo?
                </button>
              </div>
            ) : (
              availableInsumos.map(insumo => (
                <button
                  key={insumo.id}
                  onClick={() => onSelect(insumo.id)}
                  className="w-full text-left p-4 hover:bg-stone-50 border-b last:border-0 border-stone-100 transition-colors flex justify-between items-center group"
                >
                  <div>
                    <p className="font-medium text-stone-800">{insumo.nome}</p>
                    <p className="text-xs text-stone-400">R$ {insumo.custoBase.toFixed(2)} / {insumo.unidadeBase}</p>
                  </div>
                  <Plus size={18} className="text-stone-300 group-hover:text-orange-600" />
                </button>
              ))
            )
          ) : (
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Nome do Ingrediente</label>
                <input 
                  type="text" 
                  placeholder="Ex: Leite Integral, Farinha..."
                  className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                  value={newInsumo.nome}
                  onChange={e => setNewInsumo({...newInsumo, nome: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Preço Pago (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-orange-500 outline-none"
                    value={newInsumo.precoEmbalagem}
                    onChange={e => setNewInsumo({...newInsumo, precoEmbalagem: e.target.value})}
                    required
                  />
                </div>
                <div>
                   <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Tamanho Embalagem</label>
                   <div className="flex">
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="Ex: 1, 5, 200"
                        className="w-full p-2 border border-stone-300 rounded-l-lg focus:ring-1 focus:ring-orange-500 outline-none border-r-0"
                        value={newInsumo.tamanhoEmbalagem}
                        onChange={e => setNewInsumo({...newInsumo, tamanhoEmbalagem: e.target.value})}
                        required
                      />
                      <select 
                        className="bg-stone-100 border border-stone-300 text-stone-700 text-sm rounded-r-lg px-2 outline-none"
                        value={newInsumo.unidadeEmbalagem}
                        onChange={e => setNewInsumo({...newInsumo, unidadeEmbalagem: e.target.value as any})}
                      >
                        <option value="Kg">Kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="Un">Un</option>
                      </select>
                   </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg text-xs text-orange-800 border border-orange-100">
                <p className="font-bold mb-1">O sistema calculará:</p>
                Preço Base por {['g','Kg'].includes(newInsumo.unidadeEmbalagem) ? 'Kg' : (['L','ml'].includes(newInsumo.unidadeEmbalagem) ? 'Litro' : 'Unidade')}.
              </div>

              <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md">
                Cadastrar e Adicionar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


// --- COMPONENTE: LISTA DE PRODUTOS (HOME) ---
interface ProductListProps {
  produtos: Produto[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onOpenSettings: () => void;
}

const ProductList: React.FC<ProductListProps> = ({ produtos, onEdit, onDelete, onCreate, onOpenSettings }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Meus Produtos</h2>
          <p className="text-stone-500">Gerencie seu cardápio e precificação.</p>
        </div>
        <button 
          onClick={onCreate}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-orange-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Novo Produto
        </button>
      </div>
      
      {/* Settings Hint if empty */}
      {produtos.length > 0 && (
         <div onClick={onOpenSettings} className="mb-6 p-4 bg-stone-900 rounded-xl text-stone-300 flex items-center justify-between cursor-pointer hover:bg-stone-800 transition-colors shadow-md group">
            <div className="flex items-center gap-3">
               <div className="bg-stone-800 p-2 rounded-lg text-orange-500 group-hover:text-orange-400">
                  <Sparkles size={20} />
               </div>
               <div>
                  <p className="text-sm font-bold text-white">Ativar Inteligência Artificial</p>
                  <p className="text-xs text-stone-400">Configure sua chave de API para análises de custo.</p>
               </div>
            </div>
            <Settings size={18} className="text-stone-500 group-hover:text-white" />
         </div>
      )}

      {produtos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-stone-300">
          <div className="bg-stone-100 p-4 rounded-full inline-block mb-4 text-stone-400">
            <UtensilsCrossed size={48} />
          </div>
          <h3 className="text-lg font-bold text-stone-700 mb-2">Sua cozinha está vazia</h3>
          <p className="text-stone-500 mb-6">Comece cadastrando seu primeiro prato ou item.</p>
          <button onClick={onCreate} className="text-orange-600 font-bold hover:underline">Criar Produto Agora</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map(prod => (
            <div key={prod.id} className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow p-5 group relative cursor-pointer" onClick={() => onEdit(prod.id)}>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-100 text-orange-700 p-2.5 rounded-lg">
                  <ChefHat size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => onEdit(prod.id)} className="p-1.5 text-stone-400 hover:text-orange-600 hover:bg-orange-50 rounded-md" title="Editar">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => onDelete(prod.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md" title="Excluir">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-stone-900 mb-1">{prod.nome}</h3>
              <p className="text-xs text-stone-500 mb-4">{prod.fichaTecnica.length} ingredientes cadastrados</p>
              
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <span className="text-xs font-bold text-stone-400 uppercase">Margem Alvo</span>
                <span className="text-sm font-bold text-stone-700">{prod.custos.percentualLucroDesejado}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: DASHBOARD DE PRECIFICAÇÃO (DETALHE) ---
interface PricingDashboardProps {
  productId: string;
  onBack: () => void;
  onOpenSettings: () => void;
}

const PricingDashboard: React.FC<PricingDashboardProps> = ({ productId, onBack, onOpenSettings }) => {
  const [produto, setProduto] = useState<Produto | null>(null);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'precificacao' | 'simulacao'>('precificacao');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fichaTecnicaSimulada, setFichaTecnicaSimulada] = useState<ItemFichaTecnica[]>([]);
  
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalysing, setIsAnalysing] = useState(false);

  useEffect(() => {
    const loadedProduto = dbService.getProdutoById(productId);
    const loadedInsumos = dbService.getInsumos();
    
    if (loadedProduto) {
      setProduto(loadedProduto);
      setFichaTecnicaSimulada(loadedProduto.fichaTecnica);
    }
    setInsumos(loadedInsumos);
    setIsLoading(false);
  }, [productId]);

  useEffect(() => {
    if (produto) {
      dbService.saveProduto(produto);
    }
  }, [produto]);

  const custoDiretoTotal = useMemo(() => 
    produto ? calcularCustoDiretoTotal(produto.fichaTecnica, insumos) : 0, 
  [produto, insumos]);

  const precoVendaSugerido = useMemo(() => 
    produto ? calcularPrecoVenda(custoDiretoTotal, produto.custos) : 0, 
  [custoDiretoTotal, produto]);

  const impacto = useMemo(() => 
    produto ? analisarImpacto(produto, fichaTecnicaSimulada, insumos) : null,
  [produto, fichaTecnicaSimulada, insumos]);

  const chartData = useMemo(() => {
    if (!produto) return [];
    const impostoValor = precoVendaSugerido * (produto.custos.percentualImposto / 100);
    const lucroValor = precoVendaSugerido * (produto.custos.percentualLucroDesejado / 100);
    
    return [
      { name: 'Insumos', value: custoDiretoTotal, color: '#ea580c' }, 
      { name: 'Custos Fixos', value: produto.custos.custoFixoRateado, color: '#78716c' }, 
      { name: 'Impostos', value: impostoValor, color: '#a8a29e' }, 
      { name: 'Lucro Líquido', value: lucroValor, color: '#d6d3d1' }, 
    ];
  }, [custoDiretoTotal, precoVendaSugerido, produto]);

  if (isLoading || !produto || !impacto) return <div className="p-10 text-center text-stone-500">Carregando seus dados...</div>;

  const handleUpdateItem = (index: number, newItem: ItemFichaTecnica) => {
    const newFicha = [...produto.fichaTecnica];
    newFicha[index] = newItem;
    setProduto({ ...produto, fichaTecnica: newFicha });
    setFichaTecnicaSimulada(newFicha);
  };

  const handleUpdateSimulacao = (index: number, newItem: ItemFichaTecnica) => {
    const newFicha = [...fichaTecnicaSimulada];
    newFicha[index] = newItem;
    setFichaTecnicaSimulada(newFicha);
  };

  const handleAddInsumo = (idInsumo: string) => {
    const insumo = insumos.find(i => i.id === idInsumo);
    if (!insumo) return;

    const novoItem: ItemFichaTecnica = {
      idInsumo,
      quantidadeUsada: 0,
      unidadeUso: insumo.unidadeBase === 'Kg' ? 'g' : (insumo.unidadeBase === 'Litro' ? 'ml' : 'un')
    };

    const newFicha = [...produto.fichaTecnica, novoItem];
    setProduto({ ...produto, fichaTecnica: newFicha });
    setFichaTecnicaSimulada(newFicha);
    setIsAddModalOpen(false);
  };

  const handleRegisterInsumo = (novoInsumo: Insumo) => {
    const updatedInsumos = dbService.addInsumo(novoInsumo);
    setInsumos(updatedInsumos);
    handleAddInsumo(novoInsumo.id);
  };

  const handleCostUpdate = (field: keyof CustosOperacionais, value: number) => {
    setProduto(prev => {
      if (!prev) return null;
      return {
        ...prev,
        custos: { ...prev.custos, [field]: value }
      };
    });
  };

  const callAiConsultant = async () => {
    setIsAnalysing(true);
    setAiAnalysis("");
    const result = await generateAiAnalysis(produto, insumos, impacto);
    setAiAnalysis(result);
    setIsAnalysing(false);
  };

  const availableInsumos = insumos.filter(
    insumo => !produto.fichaTecnica.some(item => item.idInsumo === insumo.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-in slide-in-from-right duration-300">
      <button onClick={onBack} className="flex items-center gap-2 text-stone-500 hover:text-orange-600 mb-6 font-medium transition-colors">
        <ArrowLeft size={18} /> Voltar para Lista
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-stone-200 pb-6">
         <div className="flex items-center gap-4 flex-1">
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
               <Package size={24} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <input 
                type="text"
                value={produto.nome}
                onChange={(e) => setProduto({...produto, nome: e.target.value})}
                className="text-2xl font-bold text-stone-900 bg-transparent border border-transparent hover:border-stone-300 focus:border-orange-500 rounded px-2 -ml-2 w-full outline-none transition-all placeholder-stone-300"
                placeholder="Nome do Produto"
              />
              <div className="flex items-center gap-2 text-sm text-stone-500 px-1">
                 <span>Salvo automaticamente</span>
                 <Save size={12} />
              </div>
           </div>
         </div>
         
         <div className="flex bg-white rounded-lg p-1 border border-stone-200 shadow-sm shrink-0">
             <button 
              onClick={() => setActiveTab('precificacao')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'precificacao' ? 'bg-orange-100 text-orange-800' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Ficha Técnica
            </button>
            <button 
              onClick={() => setActiveTab('simulacao')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'simulacao' ? 'bg-orange-100 text-orange-800' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Simulação IA <Sparkles size={14} className={activeTab === 'simulacao' ? 'text-orange-600' : 'text-stone-400'} />
            </button>
         </div>
      </div>

      {activeTab === 'precificacao' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Ingredients */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-600" />
                  Ingredientes
                </h3>
                <span className="text-xs font-medium text-stone-600 bg-white border border-stone-200 px-2 py-1 rounded">
                  Custo Direto: R$ {custoDiretoTotal.toFixed(2)}
                </span>
              </div>
              
              <div className="p-6 space-y-2">
                {produto.fichaTecnica.length === 0 && (
                   <p className="text-center text-stone-400 py-4 italic">Nenhum ingrediente adicionado.</p>
                )}
                {produto.fichaTecnica.map((item, idx) => {
                  const insumo = insumos.find(i => i.id === item.idInsumo);
                  if (!insumo) return null;
                  return (
                    <RecipeItem 
                      key={`${item.idInsumo}-${idx}`}
                      item={item}
                      insumo={insumo}
                      custoCalculado={calcularCustoItem(item, insumo)}
                      onUpdate={(newItem) => handleUpdateItem(idx, newItem)}
                      onRemove={() => {
                        const newFicha = produto.fichaTecnica.filter((_, i) => i !== idx);
                        setProduto({ ...produto, fichaTecnica: newFicha });
                        setFichaTecnicaSimulada(newFicha);
                      }}
                    />
                  );
                })}
                
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-6 w-full py-3 border border-dashed border-stone-300 rounded-lg text-stone-400 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Adicionar Insumo
                </button>
              </div>
            </div>

            {/* Operational Costs Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                 <h3 className="text-base font-semibold text-stone-800 flex items-center gap-2">
                  <Calculator size={18} className="text-orange-600" />
                  Custos Operacionais
                </h3>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Rateio (Fixo)</label>
                  <div className="relative group">
                    <span className="absolute left-3 top-2.5 text-stone-400 text-sm font-medium">R$</span>
                    <input 
                      type="number"
                      value={produto.custos.custoFixoRateado}
                      onChange={(e) => handleCostUpdate('custoFixoRateado', parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-orange-600 focus:border-orange-600 outline-none transition-all font-medium text-stone-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Impostos (%)</label>
                  <div className="relative group">
                    <input 
                      type="number"
                      value={produto.custos.percentualImposto}
                      onChange={(e) => handleCostUpdate('percentualImposto', parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-orange-600 focus:border-orange-600 outline-none transition-all font-medium text-stone-700"
                    />
                    <span className="absolute right-3 top-2.5 text-stone-400 text-sm">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-800 uppercase tracking-wider mb-1.5">Margem Alvo (%)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={produto.custos.percentualLucroDesejado}
                      onChange={(e) => handleCostUpdate('percentualLucroDesejado', parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-8 py-2 border border-stone-300 bg-white rounded-lg focus:ring-1 focus:ring-orange-600 focus:border-orange-600 outline-none font-bold text-stone-900 shadow-sm"
                    />
                    <span className="absolute right-3 top-2.5 text-stone-400 text-sm font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing Summary */}
          <div className="space-y-6">
            <div className="bg-stone-900 text-white rounded-xl shadow-xl shadow-stone-300 p-8 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 p-4 opacity-5 rotate-12 text-orange-500">
                <DollarSign size={140} />
              </div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Preço de Venda</h3>
              <div className="text-5xl font-bold mb-6 tracking-tighter text-white">
                R$ {precoVendaSugerido.toFixed(2)}
              </div>
              
              <div className="space-y-3 border-t border-stone-800 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Custo Direto</span>
                  <span className="font-medium text-stone-300">R$ {custoDiretoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Custos Fixos</span>
                  <span className="font-medium text-stone-300">R$ {produto.custos.custoFixoRateado.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Markup Total</span>
                  <span className="font-medium text-orange-200">{(produto.custos.percentualLucroDesejado + produto.custos.percentualImposto)}%</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 h-72 flex flex-col">
               <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <PieChart size={14} /> Composição
               </h4>
               <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1c1917', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => `R$ ${value.toFixed(2)}`} 
                      />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#78716c' }} />
                    </RePieChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simulation Panel */}
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-stone-100 text-stone-900 rounded-lg">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Simulador de Cenários</h3>
                  <p className="text-sm text-stone-500">Ajuste quantidades para testar impacto</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {fichaTecnicaSimulada.map((item, idx) => {
                  const insumo = insumos.find(i => i.id === item.idInsumo);
                  if (!insumo) return null;
                  const isChanged = item.quantidadeUsada !== produto.fichaTecnica[idx].quantidadeUsada;
                  
                  return (
                    <div key={`sim-${item.idInsumo}`} className={`p-4 rounded-lg border transition-all ${isChanged ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-100'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-stone-700 text-sm">{insumo.nome}</span>
                        {isChanged && <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">ALTERADO</span>}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                         <input 
                            type="range" 
                            min={0} 
                            max={Math.max(item.quantidadeUsada * 2, 100)} 
                            step={1}
                            value={item.quantidadeUsada}
                            onChange={(e) => handleUpdateSimulacao(idx, { ...item, quantidadeUsada: parseFloat(e.target.value) })}
                            className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                         />
                         <div className="text-right w-24">
                            <span className="text-sm font-bold text-stone-900 block">{item.quantidadeUsada.toFixed(0)}</span>
                            <span className="text-[10px] text-stone-400 uppercase">{item.unidadeUso}</span>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results & AI Panel */}
          <div className="space-y-6">
            
            {/* Comparison Card */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-8">
              <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-6">Resultado da Análise</h3>
              
              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex-1">
                  <p className="text-xs text-stone-400 mb-1">Atual</p>
                  <p className="text-3xl font-bold text-stone-300">R$ {impacto.pvAntigo.toFixed(2)}</p>
                </div>
                
                <ArrowRight className="text-stone-200" />
                
                <div className="flex-1 text-right">
                  <p className="text-xs text-stone-400 mb-1">Novo Cenário</p>
                  <p className={`text-3xl font-bold ${impacto.diferencaPreco > 0 ? 'text-red-600' : (impacto.diferencaPreco < 0 ? 'text-emerald-600' : 'text-stone-800')}`}>
                    R$ {impacto.pvNovo.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-stone-50 p-5 rounded-xl border border-stone-100">
                <AlertCircle className="text-stone-800 mt-0.5 shrink-0" size={20} />
                <p className="text-sm text-stone-600 leading-relaxed">
                  {impacto.mensagem}
                </p>
              </div>
            </div>

            {/* Gemini Section */}
            <div className="bg-stone-900 rounded-xl shadow-lg p-6 text-white border border-stone-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold flex items-center gap-2 text-stone-100">
                  <Sparkles size={18} className="text-orange-400" />
                  Consultoria AI
                </h3>
                <button 
                  onClick={onOpenSettings}
                  className="p-1 text-stone-500 hover:text-white transition-colors"
                  title="Configurar Chave API"
                >
                  <Settings size={14} />
                </button>
              </div>

              {!aiAnalysis && !isAnalysing && (
                 <div className="mb-4">
                     <button 
                      onClick={callAiConsultant}
                      className="w-full px-4 py-3 bg-white text-stone-900 rounded-lg text-xs font-bold hover:bg-stone-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} className="text-orange-600" /> GERAR ANÁLISE INTELIGENTE
                    </button>
                 </div>
              )}

              {isAnalysing ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-6 h-6 border-2 border-stone-600 border-t-orange-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-stone-400 uppercase tracking-widest">Processando dados...</p>
                </div>
              ) : aiAnalysis ? (
                <div className="animate-in fade-in duration-500">
                   <div className="text-sm text-stone-300 leading-relaxed whitespace-pre-line border-l-2 border-stone-700 pl-4 mb-4">
                     {aiAnalysis}
                   </div>
                   <button 
                    onClick={callAiConsultant}
                    className="text-xs text-stone-500 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <RefreshCw size={10} /> Gerar nova análise
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic text-center">
                  Certifique-se de que sua Chave de API está configurada nas configurações.
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal de Adicionar Insumo */}
      <AddInsumoModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelect={handleAddInsumo}
        onRegister={handleRegisterInsumo}
        availableInsumos={availableInsumos}
      />
    </div>
  );
};


// --- COMPONENTE PRINCIPAL (Roteamento Simples) ---
const MainContent: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Data State for List
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Load products on mount and when returning to list
  useEffect(() => {
    if (currentView === 'list') {
      setProdutos(dbService.getProdutos());
    }
  }, [currentView]);

  const handleEdit = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('detail');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      const updated = dbService.deleteProduto(id);
      setProdutos(updated);
    }
  };

  const handleCreate = () => {
    // Agora cria imediatamente sem bloquear a UI com prompt
    const newProd = dbService.createProduto("Novo Prato (Clique para editar)");
    handleEdit(newProd.id);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header Comum */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('list')}>
            <div className="bg-orange-600 p-2 rounded-lg text-white shadow-lg shadow-orange-100">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight leading-none">Precificador Gourmet</h1>
              <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wide">Gestão Inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button
               onClick={() => setIsSettingsOpen(true)}
               className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
               title="Configurações & API Key"
             >
                <Settings size={18} />
             </button>

             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-full border border-stone-200">
                <User size={14} className="text-stone-500" />
                <span className="text-xs font-semibold text-stone-700">{user?.name}</span>
             </div>
             <button 
                onClick={logout}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sair"
             >
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </header>

      {currentView === 'list' ? (
        <ProductList 
          produtos={produtos} 
          onCreate={handleCreate} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        selectedProductId && (
          <PricingDashboard 
            productId={selectedProductId} 
            onBack={() => setCurrentView('list')} 
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
};

// Auth Wrapper
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
};

// Component to handle route protection logic
const AuthGuard: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-stone-200 border-t-orange-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MainContent />;
};

export default App;