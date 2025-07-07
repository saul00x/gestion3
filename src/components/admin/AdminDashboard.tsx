import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Store, Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { productsService, storesService, authService, stockService } from '../../services/api';
import { normalizeApiResponse } from '../../config/api';
import { Produit, Stock, Magasin, User } from '../../types';
import { safeNumber } from '../../utils/numbers';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalProduits: 0,
    totalMagasins: 0,
    totalUtilisateurs: 0,
    alertesStock: 0,
    valeurTotaleStock: 0
  });
  const [stockData, setStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Chargement des données du dashboard...');
      
      // Récupérer toutes les données en parallèle
      const [produitsResponse, magasinsResponse, utilisateursResponse, stocksResponse] = await Promise.all([
        productsService.getProducts(),
        storesService.getStores(),
        authService.getUsers(),
        stockService.getStocks()
      ]);

      console.log('Données reçues:', {
        produits: produitsResponse,
        magasins: magasinsResponse,
        utilisateurs: utilisateursResponse,
        stocks: stocksResponse
      });

      // Normaliser toutes les réponses
      const produits = normalizeApiResponse(produitsResponse).map((item: any) => ({
        ...item,
        prix_unitaire: safeNumber(item.prix_unitaire, 0),
        seuil_alerte: safeNumber(item.seuil_alerte, 0),
        createdAt: new Date(item.created_at)
      })) as Produit[];

      const magasins = normalizeApiResponse(magasinsResponse).map((item: any) => ({
        ...item,
        createdAt: new Date(item.created_at)
      })) as Magasin[];

      const utilisateurs = normalizeApiResponse(utilisateursResponse).map((item: any) => ({
        ...item,
        createdAt: new Date(item.date_joined || item.created_at)
      })) as User[];

      const stocks = normalizeApiResponse(stocksResponse).map((item: any) => ({
        ...item,
        quantite: safeNumber(item.quantite, 0),
        // 🔧 FIX: Convertir les IDs en numbers pour la comparaison
        produit_id: parseInt(item.produit_id) || item.produit,
        magasin_id: parseInt(item.magasin_id) || item.magasin,
        updatedAt: new Date(item.updated_at)
      })) as Stock[];

      console.log('Données normalisées:', { produits, magasins, utilisateurs, stocks });

      // Calculer les alertes de stock et la valeur totale
      let alertesCount = 0;
      let valeurTotale = 0;
      const stockDataMap = new Map();

      stocks.forEach(stock => {
        console.log('Traitement du stock:', stock); // Debug
        
        // 🔧 FIX: Conversion des IDs pour la comparaison
        const produitId = parseInt(stock.produit_id?.toString() || '0');
        const magasinId = parseInt(stock.magasin_id?.toString() || '0');
        
        const produit = produits.find(p => parseInt(p.id?.toString() || '0') === produitId);
        const magasin = magasins.find(m => parseInt(m.id?.toString() || '0') === magasinId);
        
        console.log('Produit trouvé:', produit, 'Magasin trouvé:', magasin); // Debug
        
        if (produit && magasin) {
          const quantite = safeNumber(stock.quantite, 0);
          const prixUnitaire = safeNumber(produit.prix_unitaire, 0);
          const seuilAlerte = safeNumber(produit.seuil_alerte, 0);
          
          console.log('Calculs:', { quantite, prixUnitaire, seuilAlerte }); // Debug
          
          if (quantite <= seuilAlerte) {
            alertesCount++;
          }
          
          const valeurStock = quantite * prixUnitaire;
          valeurTotale += valeurStock;
          
          console.log('Valeur ajoutée:', valeurStock, 'Total:', valeurTotale); // Debug

          const key = magasin.nom;
          if (stockDataMap.has(key)) {
            stockDataMap.set(key, stockDataMap.get(key) + quantite);
          } else {
            stockDataMap.set(key, quantite);
          }
        } else {
          console.log('Produit ou magasin non trouvé pour le stock:', stock); // Debug
        }
      });

      const stockChartData = Array.from(stockDataMap.entries()).map(([nom, quantite]) => ({
        magasin: nom,
        quantite: safeNumber(quantite, 0)
      }));

      console.log('Statistiques calculées:', {
        totalProduits: produits.length,
        totalMagasins: magasins.length,
        totalUtilisateurs: utilisateurs.length,
        alertesStock: alertesCount,
        valeurTotaleStock: valeurTotale,
        stockChartData
      });

      setStats({
        totalProduits: produits.length,
        totalMagasins: magasins.length,
        totalUtilisateurs: utilisateurs.length,
        alertesStock: alertesCount,
        valeurTotaleStock: safeNumber(valeurTotale, 0)
      });

      setStockData(stockChartData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Produits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProduits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Magasins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMagasins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUtilisateurs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alertes Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alertesStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Valeur Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.valeurTotaleStock.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock par Magasin</h3>
          {stockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="magasin" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantite" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée de stock disponible</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition des Stocks</h3>
          {stockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ magasin, percent }) => `${magasin} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantite"
                >
                  {stockData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée de stock disponible</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertes */}
      {stats.alertesStock > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Attention: {stats.alertesStock} produit(s) en rupture de stock
              </h3>
              <p className="text-red-600 mt-1">
                Certains produits ont atteint leur seuil d'alerte. Vérifiez la section Produits pour plus de détails.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section de debug - à supprimer en production */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Debug Info (à supprimer en production)</h4>
        <pre className="text-xs text-gray-600 overflow-auto max-h-32">
          {JSON.stringify({
            statsCalculated: stats,
            stockDataLength: stockData.length,
            stockDataSample: stockData.slice(0, 3)
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};