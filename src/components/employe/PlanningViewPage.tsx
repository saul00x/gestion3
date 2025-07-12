import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Planning {
  id: string;
  user_id: string;
  date: Date;
  heure_debut: string;
  heure_fin: string;
  tache: string;
  notes?: string;
}

export const PlanningViewPage: React.FC = () => {
  const { user } = useAuth();
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart(new Date()));

  function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchPlannings();
  }, [selectedWeek]);

  const fetchPlannings = async () => {
    try {
      // Simuler des données de planning pour l'employé connecté
      const mockPlannings: Planning[] = [
        {
          id: '1',
          user_id: user?.id || '1',
          date: new Date(selectedWeek),
          heure_debut: '09:00',
          heure_fin: '17:00',
          tache: 'Gestion du stock',
          notes: 'Inventaire des produits électroniques'
        },
        {
          id: '2',
          user_id: user?.id || '1',
          date: new Date(new Date(selectedWeek).getTime() + 24 * 60 * 60 * 1000), // Mardi
          heure_debut: '10:00',
          heure_fin: '18:00',
          tache: 'Accueil client',
          notes: 'Formation sur les nouveaux produits'
        },
        {
          id: '3',
          user_id: user?.id || '1',
          date: new Date(new Date(selectedWeek).getTime() + 2 * 24 * 60 * 60 * 1000), // Mercredi
          heure_debut: '08:00',
          heure_fin: '16:00',
          tache: 'Réception marchandises',
          notes: 'Livraison importante prévue'
        }
      ];
      
      // Filtrer les plannings pour l'utilisateur connecté
      const userPlannings = mockPlannings.filter(p => p.user_id === user?.id);
      setPlannings(userPlannings);
    } catch (error) {
      console.error('Erreur lors du chargement du planning:', error);
    } finally {
      setLoading(false);
    }
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

  const getWeekRange = () => {
    const start = new Date(selectedWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })} - ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
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
          <h1 className="text-3xl font-bold text-gray-900">Mon Planning</h1>
          <p className="text-gray-600 mt-1">Consultez votre planning de la semaine</p>
        </div>
      </div>

      {/* Week Selector */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Semaine du {getWeekRange()}</h3>
            <p className="text-sm text-gray-500 mt-1">Sélectionnez une semaine pour voir votre planning</p>
          </div>
          <input
            type="date"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Planning Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-0">
          {getWeekDays().map((day, index) => {
            const dayPlannings = getPlanningForDay(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`border-b border-gray-200 ${index < 6 ? 'md:border-r' : ''}`}>
                {/* Day Header */}
                <div className={`p-4 text-center ${isToday ? 'bg-blue-50 border-b-2 border-blue-500' : 'bg-gray-50'}`}>
                  <div className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                    {day.toLocaleDateString('fr-FR', { weekday: 'long' })}
                  </div>
                  <div className={`text-sm ${isToday ? 'text-blue-700' : 'text-gray-500'}`}>
                    {day.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </div>
                  {isToday && (
                    <div className="text-xs text-blue-600 font-medium mt-1">Aujourd'hui</div>
                  )}
                </div>

                {/* Day Content */}
                <div className="p-4 min-h-[200px]">
                  {dayPlannings.length > 0 ? (
                    dayPlannings.map((planning) => (
                      <div
                        key={planning.id}
                        className={`rounded-lg p-3 mb-3 ${
                          isToday ? 'bg-blue-100 border border-blue-200' : 'bg-green-100 border border-green-200'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <Clock className={`h-4 w-4 mr-2 ${isToday ? 'text-blue-600' : 'text-green-600'}`} />
                          <span className={`font-medium text-sm ${isToday ? 'text-blue-800' : 'text-green-800'}`}>
                            {planning.heure_debut} - {planning.heure_fin}
                          </span>
                        </div>
                        <div className={`font-medium mb-1 ${isToday ? 'text-blue-900' : 'text-green-900'}`}>
                          {planning.tache}
                        </div>
                        {planning.notes && (
                          <div className={`text-sm ${isToday ? 'text-blue-700' : 'text-green-700'}`}>
                            {planning.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucune tâche</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé de la semaine</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Jours travaillés</p>
                <p className="text-2xl font-bold text-blue-900">
                  {new Set(plannings.map(p => p.date.toDateString())).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total tâches</p>
                <p className="text-2xl font-bold text-green-900">
                  {plannings.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Heures prévues</p>
                <p className="text-2xl font-bold text-purple-900">
                  {plannings.reduce((total, p) => {
                    const debut = new Date(`2000-01-01T${p.heure_debut}`);
                    const fin = new Date(`2000-01-01T${p.heure_fin}`);
                    return total + (fin.getTime() - debut.getTime()) / (1000 * 60 * 60);
                  }, 0).toFixed(0)}h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {plannings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun planning trouvé</h3>
          <p className="text-gray-600">
            Aucun planning n'a été défini pour cette semaine.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-blue-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-blue-800">Information</h3>
            <p className="text-blue-600 mt-1">
              Votre planning est défini par votre manager. Pour toute modification ou question, contactez-le directement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};