import React, { useState, useEffect } from 'react';
import { Package, Search, AlertTriangle } from 'lucide-react';
import { stockService, productsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Stock, Produit } from '../../types';
import toast from 'react-hot-toast';

export const StockPage: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');


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
      
      // Normalisation des IDs et filtrage par magasin
      const normalizedStocks = stocksData.map((item: any) => ({
        ...item,
        id: Number(item.id),
        produit_id: Number(item.produit_id || item.product || item.produit),
        magasin_id: Number(item.magasin_id || item.magasin || item.store),
        quantite: Number(item.quantite || item.quantity),
        updatedAt: new Date(item.updated_at)
      })).filter((stock: any) => 
        !isNaN(stock.produit_id) && 
        !isNaN(stock.magasin_id) && 
        stock.produit_id > 0 && 
        stock.magasin_id > 0
      ) as Stock[];

      // Récupérer tous les produits
      const produitsData = await productsService.getProducts();
      const produits = produitsData.map((item: any) => ({
        ...item,
        id: Number(item.id), // Conversion critique
        createdAt: new Date(item.created_at)
      })) as Produit[];
      setProduits(produits);

      // Filtrage pour le magasin de l'utilisateur
      const filteredUserStocks = normalizedStocks.filter(stock => {
        return Number(stock.magasin_id) === Number(user.magasin_id);
      });

      setStocks(filteredUserStocks);
      
      if (filteredUserStocks.length === 0) {
        setError('Aucun stock trouvé pour ce magasin');
      }

    } catch (error: unknown) {
      setError('Erreur lors du chargement du stock: ' + (error instanceof Error ? error.message : String(error)));
      toast.error('Erreur lors du chargement du stock');
    } finally {
      setLoading(false);
    }
  };

  const getStockWithProduct = () => {
    const result = stocks.map(stock => {
      const produit = produits.find(p => Number(p.id) === Number(stock.produit_id));

      if (!produit) {
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
    </div>
  );
};
