import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Package, AlertTriangle, Save, X } from 'lucide-react';
import { stockService, productsService, storesService } from '../../services/api';
import { Stock, Produit, Magasin } from '../../types';
import { safeNumber, parseNumberInput, formatNumber } from '../../utils/numbers';
import toast from 'react-hot-toast';

// Cache global pour persister les données entre les navigations
const dataCache = {
  stocks: [] as Stock[],
  produits: [] as Produit[],
  magasins: [] as Magasin[],
  lastFetch: 0,
  isInitialized: false
};

// Durée du cache (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const StockManagementPage: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>(dataCache.stocks);
  const [produits, setProduits] = useState<Produit[]>(dataCache.produits);
  const [magasins, setMagasins] = useState<Magasin[]>(dataCache.magasins);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMagasin, setSelectedMagasin] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [formData, setFormData] = useState({
    produit: '',
    magasin: '',
    quantite: 0
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fonction pour mettre à jour le cache
  const updateCache = useCallback((newStocks: Stock[], newProduits: Produit[], newMagasins: Magasin[]) => {
    dataCache.stocks = newStocks;
    dataCache.produits = newProduits;
    dataCache.magasins = newMagasins;
    dataCache.lastFetch = Date.now();
    dataCache.isInitialized = true;
  }, []);

  // Fonction pour vérifier si le cache est valide
  const isCacheValid = useCallback(() => {
    return dataCache.isInitialized && (Date.now() - dataCache.lastFetch) < CACHE_DURATION;
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      // Si le cache est valide, utiliser les données du cache
      if (isCacheValid()) {
        console.log('📦 Utilisation du cache pour les données');
        setStocks(dataCache.stocks);
        setProduits(dataCache.produits);
        setMagasins(dataCache.magasins);
        return;
      }

      // Sinon, récupérer les données depuis l'API
      await fetchData();
    };

    initializeData();
  }, [isCacheValid]);

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 Début fetchData');
      setLoading(true);
      
      // Récupérer les données en parallèle
      const [stocksData, produitsData, magasinsData] = await Promise.all([
        stockService.getStocks(),
        productsService.getProducts(),
        storesService.getStores()
      ]);

      console.log("📦 STOCKS RAW ===>", stocksData);
      console.log("🏷️ PRODUITS RAW ===>", produitsData);
      console.log("🏪 MAGASINS RAW ===>", magasinsData);
      
      // Traiter les stocks
      const processedStocks = stocksData.map((item: any) => ({
        ...item,
        quantite: safeNumber(item.quantite, 0),
        updatedAt: new Date(item.updated_at || new Date())
      }));
      
      // Traiter les produits
      const processedProduits = produitsData.map((item: any) => ({
        ...item,
        prix_unitaire: safeNumber(item.prix_unitaire, 0),
        seuil_alerte: safeNumber(item.seuil_alerte, 0),
        createdAt: new Date(item.created_at || new Date())
      }));

      // Traiter les magasins
      const processedMagasins = magasinsData.map((item: any) => ({
        ...item,
        latitude: safeNumber(item.latitude, 0),
        longitude: safeNumber(item.longitude, 0),
        createdAt: new Date(item.created_at || new Date())
      }));

      // Vérifier si le composant est encore monté avant de mettre à jour l'état
      if (isMounted.current) {
        setStocks(processedStocks);
        setProduits(processedProduits);
        setMagasins(processedMagasins);
        
        // Mettre à jour le cache
        updateCache(processedStocks, processedProduits, processedMagasins);
      }
      
      console.log('✅ fetchData terminé');
    } catch (error) {
      console.error('❌ Erreur fetchData:', error);
      if (isMounted.current) {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [updateCache]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(async () => {
    dataCache.lastFetch = 0; // Forcer le rafraîchissement
    await fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.produit || !formData.magasin) {
      toast.error('Veuillez sélectionner un produit et un magasin');
      return;
    }

    setLoading(true);

    try {
      const produitId = parseInt(formData.produit);
      const magasinId = parseInt(formData.magasin);

      const stockData = {
        produit: produitId,
        magasin: magasinId,
        quantite: safeNumber(formData.quantite, 0)
      };

      console.log('📤 Données à envoyer:', stockData);

      if (editingStock) {
        // Modification d'un stock existant
        const updatedStock = await stockService.updateStock(editingStock.id, stockData);
        console.log('✏️ Stock modifié:', updatedStock);
        
        // Mettre à jour le stock dans l'état local et le cache
        const updatedStocks = stocks.map(stock => 
          stock.id === editingStock.id 
            ? { ...updatedStock, quantite: safeNumber(updatedStock.quantite, 0), updatedAt: new Date(updatedStock.updated_at || new Date()) }
            : stock
        );
        
        setStocks(updatedStocks);
        dataCache.stocks = updatedStocks; // Mettre à jour le cache
        
        toast.success('Stock modifié avec succès');
      } else {
        // Vérifier si le stock existe déjà
        const existingStock = stocks.find(s => {
          const sProduitId = parseInt(s.produit_id.toString());
          const sMagasinId = parseInt(s.magasin_id.toString());
          return sProduitId === produitId && sMagasinId === magasinId;
        });

        if (existingStock) {
          toast.error('Un stock existe déjà pour ce produit dans ce magasin');
          return;
        }

        // Créer le nouveau stock
        const newStock = await stockService.createStock(stockData);
        console.log('✅ Nouveau stock créé:', newStock);
        
        // Ajouter le nouveau stock à l'état local et au cache
        const processedNewStock = {
          ...newStock,
          quantite: safeNumber(newStock.quantite, 0),
          updatedAt: new Date(newStock.updated_at || new Date())
        };
        
        const updatedStocks = [...stocks, processedNewStock];
        setStocks(updatedStocks);
        dataCache.stocks = updatedStocks; // Mettre à jour le cache
        
        toast.success('Stock ajouté avec succès');
      }

      resetForm();
      
    } catch (error) {
      console.error('❌ Erreur handleSubmit:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      produit: stock.produit_id.toString(),
      magasin: stock.magasin_id.toString(),
      quantite: safeNumber(stock.quantite, 0)
    });
    setShowModal(true);
  };

  const handleDelete = async (stock: Stock) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce stock ?')) return;

    try {
      await stockService.deleteStock(stock.id);
      
      // Supprimer le stock de l'état local et du cache
      const updatedStocks = stocks.filter(s => s.id !== stock.id);
      setStocks(updatedStocks);
      dataCache.stocks = updatedStocks; // Mettre à jour le cache
      
      toast.success('Stock supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      produit: '',
      magasin: '',
      quantite: 0
    });
    setEditingStock(null);
    setShowModal(false);
  };

  const handleQuantiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseNumberInput(e.target.value);
    setFormData({ ...formData, quantite: value });
  };

  const getStockWithDetails = useCallback(() => {
    console.log('🔍 Mapping des stocks avec détails...');
    
    return stocks.map(stock => {
      const stockProduitId = stock.produit_id.toString();
      const stockMagasinId = stock.magasin_id.toString();
      
      const produit = produits.find(p => p.id.toString() === stockProduitId);
      const magasin = magasins.find(m => m.id.toString() === stockMagasinId);
      
      return { stock, produit, magasin };
    }).filter(item => item.produit && item.magasin);
  }, [stocks, produits, magasins]);

  const filteredStocks = getStockWithDetails().filter(({ produit, magasin }) => {
    const matchesSearch = produit && (
      produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesMagasin = !selectedMagasin || magasin?.id.toString() === selectedMagasin;
    
    return matchesSearch && matchesMagasin;
  });

  // Afficher le loading seulement si on n'a pas de données en cache
  if (loading && stocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Stocks</h1>
          <p className="text-gray-600 mt-1">Gérez les stocks de tous vos magasins</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Nouveau Stock</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedMagasin}
            onChange={(e) => setSelectedMagasin(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les magasins</option>
            {magasins.map((magasin) => (
              <option key={magasin.id} value={magasin.id}>
                {magasin.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Magasin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière MAJ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks.map(({ stock, produit, magasin }) => {
                if (!produit || !magasin) return null;
                
                const isLowStock = safeNumber(stock.quantite, 0) <= safeNumber(produit.seuil_alerte, 0);
                
                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {produit.image_url ? (
                            <img
                              src={`http://localhost:8000${produit.image_url}`}
                              alt={produit.nom}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{produit.nom}</div>
                          <div className="text-sm text-gray-500">Réf: {produit.reference}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {magasin.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {formatNumber(safeNumber(stock.quantite, 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isLowStock ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stock bas
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.updatedAt.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(stock)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stock)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStocks.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun stock trouvé</h3>
          <p className="text-gray-600">
            {searchTerm || selectedMagasin ? 'Aucun stock ne correspond aux filtres sélectionnés.' : 'Commencez par ajouter votre premier stock.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingStock ? 'Modifier le Stock' : 'Nouveau Stock'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produit *
                  </label>
                  <select
                    required
                    disabled={!!editingStock}
                    value={formData.produit}
                    onChange={(e) => setFormData({ ...formData, produit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Sélectionner un produit</option>
                    {produits.map((produit) => (
                      <option key={produit.id} value={produit.id}>
                        {produit.nom} - {produit.reference}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Magasin *
                  </label>
                  <select
                    required
                    disabled={!!editingStock}
                    value={formData.magasin}
                    onChange={(e) => setFormData({ ...formData, magasin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Sélectionner un magasin</option>
                    {magasins.map((magasin) => (
                      <option key={magasin.id} value={magasin.id}>
                        {magasin.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantite === 0 ? '' : formData.quantite}
                    onChange={handleQuantiteChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingStock ? 'Modifier' : 'Ajouter'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};