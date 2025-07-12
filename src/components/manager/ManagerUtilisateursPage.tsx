import React, { useState, useEffect } from 'react';
import { Users, User, AlertTriangle } from 'lucide-react';
import { authService } from '../../services/api';
import { normalizeApiResponse } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { User as UserType } from '../../types';

export const ManagerUtilisateursPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attendre que l'utilisateur soit chargé avant de faire la requête
    if (user?.magasin_id) {
      fetchUsers();
    }
  }, [user]); // Ajout de user comme dépendance

  const fetchUsers = async () => {
    // Vérification supplémentaire
    if (!user?.magasin_id) {
      console.log('❌ Magasin ID manquant:', user);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Recherche employés pour magasin:', user.magasin_id);
      
      const data = await authService.getUsers();
      const normalizedData = normalizeApiResponse(data);
      
      console.log('📊 Tous les utilisateurs:', normalizedData);
      
      // Filtrer les employés du magasin du manager (même logique que le dashboard)
      const employesDuMagasin = normalizedData
        .filter((u: any) => {
          const isEmployee = u.role === 'employe';
          const sameStore = u.magasin_id === user.magasin_id;
          
          console.log(`👤 Utilisateur ${u.prenom} ${u.nom}: role=${u.role}, magasin_id=${u.magasin_id}, isEmployee=${isEmployee}, sameStore=${sameStore}`);
          
          return isEmployee && sameStore;
        })
        .map((item: any) => ({
          ...item,
          createdAt: new Date(item.date_joined || item.created_at)
        }));
      
      console.log('✅ Employés du magasin trouvés:', employesDuMagasin);
      setUsers(employesDuMagasin);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Employés</h1>
          <p className="text-gray-600 mt-1">Consultez la liste de vos employés (lecture seule)</p>
        </div>
      </div>


      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'embauche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {employee.image_url ? (
                          <img
                            src={`http://localhost:8000${employee.image_url}`}
                            alt={`${employee.prenom} ${employee.nom}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.prenom} {employee.nom}
                        </div>
                        <div className="text-sm text-gray-500">Employé</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.createdAt.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé trouvé</h3>
          <p className="text-gray-600">
            Aucun employé n'est assigné à votre magasin pour le moment.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">Information</h3>
            <p className="text-blue-600 mt-1">
              Cette page est en lecture seule. Pour modifier les informations des employés ou en ajouter de nouveaux, contactez votre administrateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};