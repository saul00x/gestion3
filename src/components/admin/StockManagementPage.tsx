import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, AlertTriangle, Eye } from 'lucide-react';
import { stockService, productsService, storesService } from '../../services/api';
import { Stock, Produit, Magasin } from '../../types';
import { safeNumber, formatNumber } from '../../utils/numbers';

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
      setLoading(true);
      
      // Récupérer les données en parallèle
      const [stocksData, produitsData, magasinsData] = await Promise.all([
        stockService.getStocks(),
        productsService.getProducts(),
        storesService.getStores()
      ]);
      
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
      
    } catch (error) {
      console.error('❌ Erreur fetchData:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [updateCache]);

  const getStockWithDetails = useCallback(() => {
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
          <h1 className="text-3xl font-bold text-gray-900">Consultation des Stocks</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des stocks de tous vos magasins (lecture seule)</p>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Eye className="h-5 w-5" />
          <span className="text-sm font-medium">Mode lecture seule</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {searchTerm || selectedMagasin ? 'Aucun stock ne correspond aux filtres sélectionnés.' : 'Aucun stock disponible.'}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <Eye className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">Mode consultation</h3>
            <p className="text-blue-600 mt-1">
              Vous consultez les stocks en mode lecture seule. La gestion des stocks est déléguée aux managers de chaque magasin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};