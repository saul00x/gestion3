import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock, User, Save, X } from 'lucide-react';
import { authService } from '../../services/api';
import { normalizeApiResponse } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { User as UserType } from '../../types';
import toast from 'react-hot-toast';

interface Planning {
  id: string;
  user_id: string;
  date: Date;
  heure_debut: string;
  heure_fin: string;
  tache: string;
  notes?: string;
}

export const PlanningPage: React.FC = () => {
  const { user } = useAuth();
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlanning, setEditingPlanning] = useState<Planning | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(new Date()));
  const [formData, setFormData] = useState({
    user_id: '',
    date: '',
    heure_debut: '',
    heure_fin: '',
    tache: '',
    notes: ''
  });

  function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  useEffect(() => {
    // Charger les utilisateurs et plannings au démarrage
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    };
    loadData();
  }, [user?.magasin_id]); // Dépend de l'ID du magasin

  useEffect(() => {
    // Charger les plannings quand la semaine change ou quand les utilisateurs sont chargés
    if (users.length > 0) {
      fetchPlannings();
    }
  }, [selectedWeek, users]);

  const fetchUsers = async () => {
    try {
      console.log('Chargement des utilisateurs...');
      const data = await authService.getUsers();
      const normalizedData = normalizeApiResponse(data);
      
      // Vérifier si user et magasin_id existent
      if (!user || !user.magasin_id) {
        console.warn('Utilisateur ou magasin_id manquant:', user);
        setUsers([]);
        return;
      }
      
      // Filtrer les employés du magasin du manager
      const employesDuMagasin = normalizedData
        .filter((u: any) => {
          console.log('Vérification utilisateur:', u.role, u.magasin_id, 'vs', user.magasin_id);
          return u.role === 'employe' && u.magasin_id === user.magasin_id;
        })
        .map((item: any) => ({
          ...item,
          createdAt: new Date(item.date_joined || item.created_at)
        }));
      
      console.log('Employés trouvés:', employesDuMagasin);
      setUsers(employesDuMagasin);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
      setUsers([]);
    }
  };

  const fetchPlannings = async () => {
    try {
      console.log('Chargement des plannings pour la semaine:', selectedWeek);
      
      // Créer des plannings de démonstration basés sur les vrais utilisateurs
      const mockPlannings: Planning[] = users.length > 0 ? [
        {
          id: '1',
          user_id: users[0].id,
          date: new Date(selectedWeek),
          heure_debut: '09:00',
          heure_fin: '17:00',
          tache: 'Gestion du stock',
          notes: 'Inventaire des produits'
        },
        // Ajouter plus de plannings si il y a plus d'utilisateurs
        ...(users.length > 1 ? [{
          id: '2',
          user_id: users[1].id,
          date: new Date(new Date(selectedWeek).getTime() + 24 * 60 * 60 * 1000), // Jour suivant
          heure_debut: '08:00',
          heure_fin: '16:00',
          tache: 'Accueil client',
          notes: 'Service client'
        }] : [])
      ] : [];
      
      console.log('Plannings créés:', mockPlannings);
      setPlannings(mockPlannings);
    } catch (error) {
      console.error('Erreur lors du chargement des plannings:', error);
      toast.error('Erreur lors du chargement des plannings');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const planningData: Planning = {
        id: editingPlanning?.id || Date.now().toString(),
        user_id: formData.user_id,
        date: new Date(formData.date),
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        tache: formData.tache,
        notes: formData.notes
      };

      if (editingPlanning) {
        // Mise à jour
        setPlannings(prev => prev.map(p => p.id === editingPlanning.id ? planningData : p));
        toast.success('Planning modifié avec succès');
      } else {
        // Création
        setPlannings(prev => [...prev, planningData]);
        toast.success('Planning ajouté avec succès');
      }

      resetForm();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (planning: Planning) => {
    setEditingPlanning(planning);
    setFormData({
      user_id: planning.user_id,
      date: planning.date.toISOString().split('T')[0],
      heure_debut: planning.heure_debut,
      heure_fin: planning.heure_fin,
      tache: planning.tache,
      notes: planning.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (planning: Planning) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce planning ?')) return;

    try {
      setPlannings(prev => prev.filter(p => p.id !== planning.id));
      toast.success('Planning supprimé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      date: '',
      heure_debut: '',
      heure_fin: '',
      tache: '',
      notes: ''
    });
    setEditingPlanning(null);
    setShowModal(false);
  };

  const getWeekDays = () => {
    const start = new Date(selectedWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPlanningForDay = (date: Date) => {
    return plannings.filter(p => 
      p.date.toDateString() === date.toDateString()
    );
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  // Afficher le loader pendant le chargement initial
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion du Planning</h1>
          <p className="text-gray-600 mt-1">Créez et gérez les plannings de vos employés</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Nouveau Planning</span>
        </button>
      </div>

      {/* Week Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Semaine sélectionnée</h3>
          <input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      

      {/* Condition d'affichage du planning */}
      {users.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8 gap-0">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 font-medium text-gray-900">
              Employé
            </div>
            {getWeekDays().map((day, index) => (
              <div key={index} className="bg-gray-50 p-4 border-b border-gray-200 text-center">
                <div className="font-medium text-gray-900">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-sm text-gray-500">
                  {day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            ))}

            {/* Rows */}
            {users.map((employee) => (
              <React.Fragment key={employee.id}>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      {employee.image_url ? (
                        <img
                          src={`http://localhost:8000${employee.image_url}`}
                          alt={`${employee.prenom} ${employee.nom}`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.prenom} {employee.nom}
                      </div>
                    </div>
                  </div>
                </div>
                {getWeekDays().map((day, dayIndex) => {
                  const dayPlannings = getPlanningForDay(day).filter(p => p.user_id === employee.id);
                  return (
                    <div key={dayIndex} className="p-2 border-b border-gray-200 min-h-[100px]">
                      {dayPlannings.map((planning) => (
                        <div
                          key={planning.id}
                          className="bg-blue-100 border border-blue-200 rounded p-2 mb-2 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-blue-800">
                              {planning.heure_debut} - {planning.heure_fin}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEdit(planning)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(planning)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="text-blue-700">{planning.tache}</div>
                          {planning.notes && (
                            <div className="text-blue-600 mt-1">{planning.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé trouvé</h3>
          <p className="text-gray-600">
            Aucun employé n'est assigné à votre magasin pour créer des plannings.
          </p>
          <button
            onClick={() => fetchUsers()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Actualiser
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPlanning ? 'Modifier le Planning' : 'Nouveau Planning'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employé *
                    </label>
                    <select
                      required
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner un employé</option>
                      {users.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.prenom} {employee.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de début *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.heure_debut}
                      onChange={(e) => setFormData({ ...formData, heure_debut: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de fin *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.heure_fin}
                      onChange={(e) => setFormData({ ...formData, heure_fin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tâche *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tache}
                    onChange={(e) => setFormData({ ...formData, tache: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Gestion du stock, Accueil client..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Notes supplémentaires..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingPlanning ? 'Modifier' : 'Ajouter'}</span>
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