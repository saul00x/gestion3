import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Eye, Search } from 'lucide-react';
import { productsService, suppliersService } from '../../services/api';
import { normalizeApiResponse } from '../../config/api';
import { Produit, Fournisseur } from '../../types';

export const ProduitsViewPage: React.FC = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProduits();
    fetchFournisseurs();
  }, []);

  const fetchProduits = async () => {
    try {
      const data = await productsService.getProducts();
      const normalizedData = normalizeApiResponse(data);
      setProduits(normalizedData.map((item: any) => ({
        ...item,
        createdAt: new Date(item.created_at)
      })));
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const data = await suppliersService.getSuppliers();
      const normalizedData = normalizeApiResponse(data);
      setFournisseurs(normalizedData.map((item: any) => ({
        ...item,
        createdAt: new Date(item.created_at)
      })));
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const filteredProduits = Array.isArray(produits) ? produits.filter(produit =>
    produit.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (loading && produits.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Consultation des Produits</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de votre catalogue de produits (lecture seule)</p>
        </div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Eye className="h-5 w-5" />
          <span className="text-sm font-medium">Mode lecture seule</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, référence ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProduits.map((produit) => {
          const fournisseur = fournisseurs.find(f => f.id === produit.fournisseur_id);
          return (
            <div key={produit.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
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
                {produit.seuil_alerte > 0 && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Seuil: {produit.seuil_alerte}
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{produit.nom}</h3>
                <p className="text-sm text-gray-600 mb-3">Réf: {produit.reference}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Catégorie:</span>
                    <span className="text-sm font-medium text-gray-900">{produit.categorie}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Prix:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {produit.prix_unitaire.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Seuil d'alerte:</span>
                    <span className="text-sm font-medium text-gray-900">{produit.seuil_alerte}</span>
                  </div>
                  
                  {fournisseur && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fournisseur:</span>
                      <span className="text-sm font-medium text-gray-900">{fournisseur.nom}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProduits.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Aucun produit ne correspond à votre recherche.' : 'Aucun produit disponible.'}
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
              Vous consultez les produits en mode lecture seule. La gestion des produits est déléguée aux managers de chaque magasin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};