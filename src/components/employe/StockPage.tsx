import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Minus, AlertTriangle, Save } from 'lucide-react';
import { stockService, productsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Stock, Produit, Mouvement } from '../../types';
import toast from 'react-hot-toast';

export const StockPage: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [mouvementData, setMouvementData] = useState({
    type: 'entrée' as 'entrée' | 'sortie',
    quantite: 0,
    motif: ''
  });

  useEffect(() => {
    console.log('User data:', user);
    console.log('Magasin ID:', user?.magasin_id);
  }, [user]);

  useEffect(() => {
    if (user?.magasin_id) {
      fetchStockData();
    } else {
      setLoading(false);
      setError('Aucun magasin assigné à cet utilisateur');
    }
  }, [user]);

  const fetchStockData = async () => {
    if (!user?.magasin_id) return;

    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les stocks du magasin
      const stocksData = await stockService.getStocks();
      
      // CORRECTION : Normalisation des IDs
      const normalizedStocks = stocksData.map((item: any) => ({
        ...item,
        id: Number(item.id),
        produit_id: Number(item.product), // Conversion ici
        magasin_id: Number(item.magasin), // Conversion ici
        quantite: Number(item.quantity),
        updatedAt: new Date(item.updated_at)
      })) as Stock[];

      // Récupérer tous les produits
      const produitsData = await productsService.getProducts();
      const produits = produitsData.map((item: any) => ({
        ...item,
        id: Number(item.id), // Conversion critique
        createdAt: new Date(item.created_at)
      })) as Produit[];
      setProduits(produits);

      // Filtrage avec comparaison numérique pour le magasin de l'utilisateur
      const filteredUserStocks = normalizedStocks.filter(stock => {
        return stock.magasin_id === user.magasin_id;
      });

      console.log('Stocks filtrés pour ce magasin:', filteredUserStocks);
      setStocks(filteredUserStocks);
      
      if (filteredUserStocks.length === 0) {
        setError('Aucun stock trouvé pour ce magasin');
      }

    } catch (error: unknown) {
      console.error('Erreur lors du chargement du stock:', error);
      setError('Erreur lors du chargement du stock: ' + (error instanceof Error ? error.message : String(error)));
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const handleMouvement = async (stock: Stock) => {
    setSelectedStock(stock);
    setShowMouvementModal(true);
  };

  const submitMouvement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock || !user) return;

    try {
      // Calculer la nouvelle quantité
      const nouvelleQuantite = mouvementData.type === 'entrée' 
        ? selectedStock.quantite + mouvementData.quantite
        : selectedStock.quantite - mouvementData.quantite;

      if (nouvelleQuantite < 0) {
        toast.error('Quantité insuffisante en stock');
        return;
      }

      // Enregistrer le mouvement
      await stockService.createMovement({
        produit: selectedStock.produit_id,
        magasin: selectedStock.magasin_id,
        type: mouvementData.type,
        quantite: mouvementData.quantite,
        motif: mouvementData.motif
      });

      toast.success('Mouvement enregistré avec succès');
      resetMouvementForm();
      fetchStockData();
    } catch (error) {
      console.error('Erreur mouvement:', error);
      toast.error('Erreur lors de l\'enregistrement du mouvement');
    }
  };

  const resetMouvementForm = () => {
    setMouvementData({
      type: 'entrée',
      quantite: 0,
      motif: ''
    });
    setSelectedStock(null);
    setShowMouvementModal(false);
  };

 const getStockWithProduct = () => {
    const result = stocks.map(stock => {
      // CORRECTION : Conversion numérique et gestion d'erreur
      const produit = produits.find(p => p.id === stock.produit_id);
      
      if (!produit) {
        console.warn(`Produit non trouvé pour stock ID: ${stock.id}, produit ID: ${stock.produit_id}`);
        return null;
      }
      
      return { stock, produit };
    }).filter(item => item !== null) as { stock: Stock; produit: Produit }[];
    
    return result;
  };

  const filteredStocks = getStockWithProduct().filter(({ produit }) =>
    produit && (
      produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user?.magasin_id) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun magasin assigné</h3>
        <p className="text-gray-600">Contactez votre administrateur pour être assigné à un magasin.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchStockData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
        <p className="text-sm text-yellow-700">Magasin ID: {user?.magasin_id}</p>
        <p className="text-sm text-yellow-700">Nombre de stocks: {stocks.length}</p>
        <p className="text-sm text-yellow-700">Nombre de produits: {produits.length}</p>
        <p className="text-sm text-yellow-700">Stocks filtrés: {filteredStocks.length}</p>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock du Magasin</h1>
        <p className="text-gray-600 mt-1">Consultez et gérez le stock de votre magasin</p>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stocks</p>
              <p className="text-2xl font-bold text-gray-900">{stocks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Alertes</p>
              <p className="text-2xl font-bold text-gray-900">
                {stocks.filter(stock => {
                  const produit = produits.find(p => p.id === stock.produit_id);
                  return produit && stock.quantite <= produit.seuil_alerte;
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">
                {stocks.filter(s => s.quantite > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStocks.map(({ stock, produit }) => {
          if (!produit) return null;
          
          const isLowStock = stock.quantite <= produit.seuil_alerte;
          
          return (
            <div key={stock.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Image */}
              <div className="h-48 bg-gray-100 relative">
                {produit.image_url ? (
                  <img
                    src={`http://localhost:8000${produit.image_url}`}
                    alt={produit.nom}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Erreur chargement image:', produit.image_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                {isLowStock && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Stock bas
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{produit.nom}</h3>
                <p className="text-sm text-gray-600 mb-3">Réf: {produit.reference}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quantité en stock:</span>
                    <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                      {stock.quantite}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Seuil d'alerte:</span>
                    <span className="text-sm font-medium text-gray-900">{produit.seuil_alerte}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prix unitaire:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {produit.prix_unitaire.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleMouvement(stock)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Saisir mouvement</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStocks.length === 0 && stocks.length > 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
          <p className="text-gray-600">
            Aucun produit ne correspond à votre recherche.
          </p>
        </div>
      )}

      {stocks.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun stock disponible</h3>
          <p className="text-gray-600">
            Aucun stock n'est disponible pour ce magasin.
          </p>
        </div>
      )}

      {/* Modal Mouvement */}
      {showMouvementModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Saisir un mouvement</h2>
                <button
                  onClick={resetMouvementForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Produit:</p>
                <p className="font-medium text-gray-900">
                  {produits.find(p => p.id === selectedStock.produit_id)?.nom}
                </p>
                <p className="text-sm text-gray-500">
                  Stock actuel: {selectedStock.quantite}
                </p>
              </div>

              <form onSubmit={submitMouvement} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de mouvement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMouvementData({ ...mouvementData, type: 'entrée' })}
                      className={`p-3 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center space-x-2 ${
                        mouvementData.type === 'entrée'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Entrée</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMouvementData({ ...mouvementData, type: 'sortie' })}
                      className={`p-3 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center space-x-2 ${
                        mouvementData.type === 'sortie'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Minus className="h-4 w-4" />
                      <span>Sortie</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={mouvementData.quantite}
                    onChange={(e) => setMouvementData({ ...mouvementData, quantite: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motif
                  </label>
                  <select
                    required
                    value={mouvementData.motif}
                    onChange={(e) => setMouvementData({ ...mouvementData, motif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un motif</option>
                    {mouvementData.type === 'entrée' ? (
                      <>
                        <option value="livraison">Livraison fournisseur</option>
                        <option value="retour">Retour client</option>
                        <option value="transfert_entrant">Transfert entrant</option>
                        <option value="correction">Correction d'inventaire</option>
                      </>
                    ) : (
                      <>
                        <option value="vente">Vente</option>
                        <option value="casse">Casse/Perte</option>
                        <option value="transfert_sortant">Transfert sortant</option>
                        <option value="retour_fournisseur">Retour fournisseur</option>
                        <option value="correction">Correction d'inventaire</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetMouvementForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>Enregistrer</span>
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
