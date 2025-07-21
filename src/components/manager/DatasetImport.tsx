import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Package, Truck, Database } from 'lucide-react';
import { productsService, suppliersService, stockService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface DatasetRow {
  fournisseur_nom: string;
  fournisseur_adresse: string;
  fournisseur_contact: string;
  produit_nom: string;
  produit_reference: string;
  produit_categorie: string;
  produit_prix_unitaire: number;
  produit_seuil_alerte: number;
  stock_quantite: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    fournisseurs_crees: number;
    produits_crees: number;
    stocks_crees: number;
    erreurs: string[];
  };
}

interface DatasetImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DatasetImport: React.FC<DatasetImportProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<DatasetRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const downloadTemplate = () => {
    const headers = [
      'fournisseur_nom',
      'fournisseur_adresse', 
      'fournisseur_contact',
      'produit_nom',
      'produit_reference',
      'produit_categorie',
      'produit_prix_unitaire',
      'produit_seuil_alerte',
      'stock_quantite'
    ];

    const exampleData = [
      [
        'Fournisseur ABC',
        '123 Rue de la Paix, Casablanca',
        '0522-123456',
        'Ordinateur Portable HP',
        'HP-LAP-001',
        'Informatique',
        '8500',
        '5',
        '10'
      ],
      [
        'Fournisseur XYZ',
        '456 Avenue Mohammed V, Rabat',
        '0537-789012',
        'Souris Optique',
        'SOU-OPT-001',
        'Accessoires',
        '150',
        '20',
        '50'
      ]
    ];

    const csvContent = [headers, ...exampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_dataset_produits.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Template téléchargé avec succès');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Vérifier le type de fichier
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.type.includes('csv')) {
      toast.error('Seuls les fichiers CSV sont supportés');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Le fichier doit contenir au moins une ligne d\'en-tête et une ligne de données');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const expectedHeaders = [
        'fournisseur_nom',
        'fournisseur_adresse',
        'fournisseur_contact',
        'produit_nom',
        'produit_reference',
        'produit_categorie',
        'produit_prix_unitaire',
        'produit_seuil_alerte',
        'stock_quantite'
      ];

      // Vérifier les en-têtes
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast.error(`En-têtes manquants: ${missingHeaders.join(', ')}`);
        return;
      }

      const data: DatasetRow[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length !== headers.length) {
          console.warn(`Ligne ${i + 1} ignorée: nombre de colonnes incorrect`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Validation et conversion des types
        try {
          const dataRow: DatasetRow = {
            fournisseur_nom: row.fournisseur_nom || '',
            fournisseur_adresse: row.fournisseur_adresse || '',
            fournisseur_contact: row.fournisseur_contact || '',
            produit_nom: row.produit_nom || '',
            produit_reference: row.produit_reference || '',
            produit_categorie: row.produit_categorie || '',
            produit_prix_unitaire: parseFloat(row.produit_prix_unitaire) || 0,
            produit_seuil_alerte: parseInt(row.produit_seuil_alerte) || 0,
            stock_quantite: parseInt(row.stock_quantite) || 0
          };

          // Validation des champs requis
          if (!dataRow.fournisseur_nom || !dataRow.produit_nom || !dataRow.produit_reference) {
            console.warn(`Ligne ${i + 1} ignorée: champs requis manquants`);
            continue;
          }

          data.push(dataRow);
        } catch (error) {
          console.warn(`Erreur ligne ${i + 1}:`, error);
        }
      }

      setPreview(data);
      setShowPreview(true);
      toast.success(`${data.length} lignes valides trouvées`);
      
    } catch (error) {
      toast.error('Erreur lors de la lecture du fichier');
      console.error('Erreur parsing:', error);
    } finally {
      setLoading(false);
    }
  };

  const processImport = async (): Promise<ImportResult> => {
    if (!user?.magasin_id) {
      throw new Error('Magasin non défini pour ce manager');
    }

    const result: ImportResult = {
      success: true,
      message: '',
      details: {
        fournisseurs_crees: 0,
        produits_crees: 0,
        stocks_crees: 0,
        erreurs: []
      }
    };

    // Map pour éviter les doublons de fournisseurs
    const fournisseursMap = new Map<string, string>();

    for (const row of preview) {
      try {
        // 1. Créer ou récupérer le fournisseur
        let fournisseurId = fournisseursMap.get(row.fournisseur_nom);
        
        if (!fournisseurId) {
          try {
            const fournisseurData = {
              nom: row.fournisseur_nom,
              adresse: row.fournisseur_adresse,
              contact: row.fournisseur_contact,
              magasin: user.magasin_id
            };

            const fournisseur = await suppliersService.createSupplier(fournisseurData);
            fournisseurId = fournisseur.id;
            fournisseursMap.set(row.fournisseur_nom, fournisseurId);
            result.details!.fournisseurs_crees++;
          } catch (error: any) {
            // Si le fournisseur existe déjà, on continue
            if (error.message?.includes('existe déjà') || error.message?.includes('unique')) {
              console.warn(`Fournisseur ${row.fournisseur_nom} existe déjà`);
            } else {
              result.details!.erreurs.push(`Erreur fournisseur ${row.fournisseur_nom}: ${error.message}`);
              continue;
            }
          }
        }

        // 2. Créer le produit
        try {
          const produitData = {
            nom: row.produit_nom,
            reference: row.produit_reference,
            categorie: row.produit_categorie,
            prix_unitaire: row.produit_prix_unitaire,
            seuil_alerte: row.produit_seuil_alerte,
            fournisseur: fournisseurId,
            magasin: user.magasin_id
          };

          const produit = await productsService.createProduct(produitData);
          result.details!.produits_crees++;

          // 3. Créer le stock
          if (row.stock_quantite > 0) {
            try {
              const stockData = {
                produit: produit.id,
                magasin: user.magasin_id,
                quantite: row.stock_quantite
              };

              await stockService.createStock(stockData);
              result.details!.stocks_crees++;
            } catch (error: any) {
              result.details!.erreurs.push(`Erreur stock pour ${row.produit_nom}: ${error.message}`);
            }
          }

        } catch (error: any) {
          if (error.message?.includes('existe déjà') || error.message?.includes('unique')) {
            result.details!.erreurs.push(`Produit ${row.produit_reference} existe déjà`);
          } else {
            result.details!.erreurs.push(`Erreur produit ${row.produit_nom}: ${error.message}`);
          }
        }

      } catch (error: any) {
        result.details!.erreurs.push(`Erreur ligne ${row.produit_nom}: ${error.message}`);
      }
    }

    // Construire le message de résultat
    const { fournisseurs_crees, produits_crees, stocks_crees, erreurs } = result.details!;
    
    result.message = `Import terminé: ${fournisseurs_crees} fournisseurs, ${produits_crees} produits, ${stocks_crees} stocks créés`;
    
    if (erreurs.length > 0) {
      result.message += `. ${erreurs.length} erreurs rencontrées.`;
      result.success = erreurs.length < preview.length; // Succès partiel si pas toutes les lignes en erreur
    }

    return result;
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('Aucune donnée à importer');
      return;
    }

    setLoading(true);
    try {
      const result = await processImport();
      
      if (result.success) {
        toast.success(result.message);
        onSuccess();
        handleClose();
      } else {
        toast.error(result.message);
      }

      // Afficher les erreurs détaillées si nécessaire
      if (result.details?.erreurs && result.details.erreurs.length > 0) {
        console.warn('Erreurs d\'import:', result.details.erreurs);
      }

    } catch (error: any) {
      toast.error(`Erreur lors de l'import: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setShowPreview(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import de Dataset</h2>
              <p className="text-gray-600 mt-1">Importez vos fournisseurs, produits et stocks en une seule fois</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {!showPreview ? (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div>
                    <h3 className="text-lg font-medium text-blue-800 mb-2">Instructions d'import</h3>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• Téléchargez le template CSV pour voir le format requis</li>
                      <li>• Remplissez toutes les colonnes obligatoires</li>
                      <li>• Les fournisseurs seront créés automatiquement s'ils n'existent pas</li>
                      <li>• Les produits seront associés à votre magasin uniquement</li>
                      <li>• Les stocks seront créés avec les quantités spécifiées</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="mb-6">
                <button
                  onClick={downloadTemplate}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>Télécharger le Template CSV</span>
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez votre fichier CSV
                </h3>
                <p className="text-gray-600 mb-4">
                  Format supporté: CSV uniquement
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="dataset-upload"
                />
                <label
                  htmlFor="dataset-upload"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  Choisir un fichier CSV
                </label>
                
                {file && (
                  <div className="mt-4 text-sm text-gray-600">
                    Fichier sélectionné: <span className="font-medium">{file.name}</span>
                  </div>
                )}
              </div>

              {loading && (
                <div className="mt-6 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Analyse du fichier en cours...</span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Preview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Aperçu des données ({preview.length} lignes)
                  </h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4" />
                          Importer les données
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fournisseur</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seuil</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.slice(0, 10).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium text-gray-900">{row.fournisseur_nom}</div>
                                <div className="text-gray-500 text-xs">{row.fournisseur_contact}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.produit_nom}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{row.produit_reference}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{row.produit_categorie}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{row.produit_prix_unitaire} MAD</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{row.produit_seuil_alerte}</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">{row.stock_quantite}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.length > 10 && (
                    <div className="bg-gray-50 px-4 py-3 text-sm text-gray-500 text-center">
                      ... et {preview.length - 10} autres lignes
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Truck className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">Fournisseurs uniques</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {new Set(preview.map(p => p.fournisseur_nom)).size}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Produits</p>
                      <p className="text-2xl font-bold text-blue-900">{preview.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Stocks à créer</p>
                      <p className="text-2xl font-bold text-green-900">
                        {preview.filter(p => p.stock_quantite > 0).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};