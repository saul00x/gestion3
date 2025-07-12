export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'manager' | 'employe';
  magasin_id?: string;
  image_url?: string;
  createdAt: Date;
}

export interface Magasin {
  id: string;
  nom: string;
  adresse: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  createdAt: Date;
}

export interface Produit {
  id: string;
  nom: string;
  reference: string;
  categorie: string;
  prix_unitaire: number;
  seuil_alerte: number;
  fournisseur_id?: string;
  image_url?: string;
  createdAt: Date;
}

export interface Fournisseur {
  id: string;
  nom: string;
  adresse: string;
  contact: string;
  image_url?: string;
  createdAt: Date;
}

export interface Stock {
  id: string;
  produit_id: string;
  magasin_id: string;
  quantite: number;
  updatedAt: Date;
}

export interface Mouvement {
  id: string;
  produit_id: string;
  magasin_id: string;
  user_id: string;
  type: 'entrée' | 'sortie';
  quantite: number;
  date: Date;
  motif: string;
}

export interface Commande {
  id: string;
  fournisseur_id: string;
  date: Date;
  statut: 'en_attente' | 'livree' | 'annulee';
  total?: number;
}

export interface CommandeDetail {
  id: string;
  commande_id: string;
  produit_id: string;
  quantite: number;
  prix_unitaire: number;
}

// Dans votre fichier types.ts ou types/index.ts
export interface Presence {
  id: string;
  user_id: string;
  magasin_id: string;
  magasin_nom: string;
  date_pointage: Date;
  heure_entree: Date | null;
  heure_sortie: Date | null;
  pause_entree: Date | null;
  pause_sortie: Date | null;
  duree_pause: number | null; // en minutes
  latitude: number;
  longitude: number;
  type: 'arrivee' | 'depart' | 'pause_debut' | 'pause_fin';
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: Date;
  read: boolean;
}