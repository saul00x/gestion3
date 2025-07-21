import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Package, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react';
import { stockService, productsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Stock, Produit } from '../../types';
import { safeNumber, formatNumber } from '../../utils/numbers';
import toast from 'react-hot-toast';

export const ManagerStockPage: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Ajout état pour la modale d'ajout de stock
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockForm, setAddStockForm] = useState({ produitId: '', quantite: 0 });

  // Liste des produits sans stock dans ce magasin
  const produitsSansStock = produits.filter(p => !stocks.some(s => s.produit_id === p.id));

  // Handlers d'action pour la colonne Actions
  const handleEditStock = (stock: Stock) => {
    // TODO: ouvrir une modale d'édition ou autre logique
    toast('Fonction éditer à implémenter');
  };
  const handleDeleteStock = (stock: Stock) => {
    // TODO: ajouter confirmation et suppression réelle
    toast('Fonction supprimer à implémenter');
  };

  // Handler pour la soumission du formulaire d'ajout de stock
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.magasin_id || !addStockForm.produitId || addStockForm.quantite <= 0) return;
    try {
      setLoading(true);
      await stockService.createStock({
        produit: addStockForm.produitId,
        magasin: user.magasin_id,
        quantite: addStockForm.quantite
      });
      toast.success('Stock créé avec succès');
      setShowAddStockModal(false);
      setAddStockForm({ produitId: '', quantite: 0 });
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la création du stock');
    } finally {
      setLoading(false);
    }
  };


  const [showMouvementModal, setShowMouvementModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [mouvementData, setMouvementData] = useState({
    type: 'entrée' as 'entrée' | 'sortie',
    quantite: 0,
    motif: '',
    
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (user?.magasin_id) {
      fetchData();
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user?.magasin_id) return;

    try {
      setLoading(true);
      
      const [stocksData, produitsData] = await Promise.all([
        stockService.getStocks(),
        productsService.getProducts()
      ]);
      
      // Traiter les stocks - filtrer par magasin du manager
      const processedStocks = stocksData
        .filter((item: any) => item.magasin_id?.toString() === user.magasin_id?.toString())
        .map((item: any) => ({
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

      if (isMounted.current) {
        setStocks(processedStocks);
        setProduits(processedProduits);
      }
      
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
  }, [user?.magasin_id]);

  const handleMouvement = async (stock: Stock) => {
    setSelectedStock(stock);
    setShowMouvementModal(true);
  };

  // Dans ManagerStockPage.tsx - Remplace la fonction submitMouvement

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

    // Préparer les données en JSON (pas FormData)
    const movementPayload = {
      produit: selectedStock.produit_id,
      magasin: selectedStock.magasin_id,
      type: mouvementData.type,
      quantite: mouvementData.quantite,
      motif: mouvementData.motif
    };

    console.log('Données envoyées:', movementPayload); // Pour déboguer

    await stockService.createMovement(movementPayload);
    toast.success('Mouvement enregistré');
    setShowMouvementModal(false);
    setSelectedStock(null);
    setMouvementData({ type: 'entrée', quantite: 0, motif: '' });
    fetchData();
  } catch (error: any) {
    console.error('Erreur détaillée:', error);
    toast.error("Erreur lors de l'enregistrement du mouvement");
  }
};

  const resetMouvementForm = () => {
    setShowMouvementModal(false);
    setSelectedStock(null);
    setMouvementData({ type: 'entrée', quantite: 0, motif: '' });
  };

  const getStockWithDetails = useCallback(() => {
    return stocks.map(stock => {
      const stockProduitId = stock.produit_id.toString();
      const produit = produits.find(p => p.id.toString() === stockProduitId);
      
      return { stock, produit };
    }).filter(item => item.produit);
  }, [stocks, produits]);

  const filteredStocks = getStockWithDetails().filter(({ produit }) => {
    const matchesSearch = produit && (
      produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return matchesSearch;
  });

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
          <p className="text-gray-600 mt-1">Gérez les stocks de votre magasin</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddStockModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter un stock</span>
          </button>
        </div>
      </div>

      {/* Modal d'ajout de stock */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Ajouter un stock</h2>
                <button
                  onClick={() => { setShowAddStockModal(false); setAddStockForm({ produitId: '', quantite: 0 }); }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddStockSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produit</label>
                  <select
                    required
                    value={addStockForm.produitId}
                    onChange={e => setAddStockForm({ ...addStockForm, produitId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un produit</option>
                    {produitsSansStock.map(produit => (
                      <option key={produit.id} value={produit.id}>{produit.nom} (Réf: {produit.reference})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantité initiale</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={addStockForm.quantite > 0 ? addStockForm.quantite : ''}
                    onChange={e => setAddStockForm({ ...addStockForm, quantite: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowAddStockModal(false); setAddStockForm({ produitId: '', quantite: 0 }); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>Créer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


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

      {/* Stocks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="w-1/5 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="w-1/5 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="w-1/5 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière MAJ
                </th>
                <th className="w-1/5 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks.map(({ stock, produit }) => {
                if (!produit) return null;
                
                const isLowStock = safeNumber(stock.quantite, 0) <= safeNumber(produit.seuil_alerte, 0);
                
                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="w-2/5 px-6 py-4 whitespace-nowrap">
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
                    <td className="w-1/5 px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {formatNumber(safeNumber(stock.quantite, 0))}
                      </span>
                    </td>
                    <td className="w-1/5 px-6 py-4 whitespace-nowrap text-center">
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
                    <td className="w-1/5 px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {stock.updatedAt.toLocaleDateString('fr-FR')}
                    </td>
                    <td className="w-1/5 px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleMouvement(stock)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <span>Saisir mouvement</span>
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
            {searchTerm ? 'Aucun stock ne correspond aux filtres sélectionnés.' : 'Commencez par ajouter votre premier stock.'}
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
                  <div className="flex space-x-4 mb-2">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-semibold border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${mouvementData.type === 'entrée' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-600 hover:bg-green-50'}`}
                      onClick={() => setMouvementData({ ...mouvementData, type: 'entrée' })}
                    >
                      Entrée
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg font-semibold border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${mouvementData.type === 'sortie' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-600 hover:bg-red-50'}`}
                      onClick={() => setMouvementData({ ...mouvementData, type: 'sortie' })}
                    >
                      Sortie
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
                    value={isNaN(mouvementData.quantite) || mouvementData.quantite <= 0 ? '' : mouvementData.quantite}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMouvementData({ ...mouvementData, quantite: isNaN(val) ? 0 : val });
                    }}
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