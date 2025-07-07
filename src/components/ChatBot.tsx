import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: `Bonjour ${user?.prenom || 'utilisateur'} ! Je suis votre assistant IA pour StockPro. Comment puis-je vous aider aujourd'hui ?`,
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Réponses contextuelles selon le rôle
    const isAdmin = user?.role === 'admin';
    
    if (message.includes('bonjour') || message.includes('salut') || message.includes('hello')) {
      return `Bonjour ${user?.prenom || 'utilisateur'} ! Comment puis-je vous aider avec StockPro aujourd'hui ?`;
    }

    if (message.includes('merci')) {
      return 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions sur StockPro.';
    }
    
    if (message.includes('stock') || message.includes('inventaire')) {
      if (isAdmin) {
        return 'Pour gérer votre stock, vous pouvez aller dans la section "Gestion des Stocks" où vous pourrez voir les quantités disponibles, ajouter de nouveaux produits et suivre les mouvements de stock. Vous pouvez également consulter les alertes de stock bas sur le dashboard.';
      } else {
        return 'Vous pouvez consulter le stock de votre magasin dans la section "Stock" et enregistrer des mouvements de stock (entrées/sorties) selon vos besoins.';
      }
    }
    
    if (message.includes('pointage') || message.includes('présence')) {
      if (isAdmin) {
        return 'Vous pouvez consulter toutes les présences des employés dans la section "Présences". Vous y trouverez l\'historique complet des pointages avec possibilité d\'export en CSV ou PDF.';
      } else {
        return 'Le système de pointage vous permet d\'enregistrer vos heures d\'arrivée et de départ. Assurez-vous d\'être dans un rayon de 100m de votre magasin pour pointer. Vous pouvez gérer vos pauses également.';
      }
    }
    
    if (message.includes('produit') || message.includes('article')) {
      if (isAdmin) {
        return 'Dans la section Produits, vous pouvez ajouter de nouveaux articles, modifier les informations existantes, définir des seuils d\'alerte pour le stock et gérer les images des produits.';
      } else {
        return 'Vous pouvez consulter les produits disponibles dans votre magasin via la section Stock. Les informations incluent les prix, références et quantités disponibles.';
      }
    }
    
    if (message.includes('magasin') || message.includes('boutique')) {
      if (isAdmin) {
        return 'La gestion des magasins vous permet de configurer les différents points de vente, leurs adresses et coordonnées GPS pour le système de pointage. Vous pouvez aussi ajouter des images pour chaque magasin.';
      } else {
        return 'Votre magasin assigné détermine où vous pouvez pointer et quel stock vous pouvez consulter. Contactez votre administrateur si vous avez besoin d\'être assigné à un autre magasin.';
      }
    }
    
    if (message.includes('utilisateur') || message.includes('employé')) {
      if (isAdmin) {
        return 'Les administrateurs peuvent gérer les comptes utilisateurs, assigner des rôles (admin/employé) et des magasins aux employés dans la section Utilisateurs. Vous pouvez aussi consulter leurs présences.';
      } else {
        return 'Pour toute question concernant votre compte utilisateur ou vos permissions, contactez votre administrateur.';
      }
    }

    if (message.includes('message') || message.includes('communication')) {
      if (isAdmin) {
        return 'Vous pouvez communiquer avec tous les employés via le système de messagerie intégré. Cliquez sur l\'icône de message en bas à droite pour démarrer une conversation.';
      } else {
        return 'Vous pouvez envoyer des messages aux administrateurs via le système de messagerie. Cliquez sur l\'icône de message en bas à droite de votre écran.';
      }
    }

    if (message.includes('dashboard') || message.includes('tableau de bord')) {
      if (isAdmin) {
        return 'Votre dashboard administrateur affiche les statistiques globales : nombre de produits, magasins, utilisateurs, alertes de stock et valeur totale du stock. Vous y trouvez aussi des graphiques de répartition.';
      } else {
        return 'Votre dashboard employé affiche les informations de votre magasin : produits en stock, alertes, et actions rapides pour le pointage et la consultation du stock.';
      }
    }

    if (message.includes('problème') || message.includes('erreur') || message.includes('bug')) {
      return 'Si vous rencontrez un problème technique, essayez de rafraîchir la page. Si le problème persiste, contactez votre administrateur système avec une description détaillée du problème.';
    }

    if (message.includes('aide') || message.includes('help')) {
      if (isAdmin) {
        return 'Je peux vous aider avec : la gestion du stock, les produits, les magasins, les utilisateurs, les présences, les fournisseurs, les paramètres et les fonctionnalités générales de StockPro. Que souhaitez-vous savoir ?';
      } else {
        return 'Je peux vous aider avec : le pointage, la consultation du stock de votre magasin, l\'enregistrement des mouvements de stock et les fonctionnalités générales de StockPro. Que souhaitez-vous savoir ?';
      }
    }

    if (message.includes('comment') && message.includes('utiliser')) {
      return 'Pour utiliser StockPro efficacement, commencez par explorer votre dashboard. Chaque section a des boutons d\'action clairs. N\'hésitez pas à me poser des questions spécifiques sur une fonctionnalité !';
    }
    
    return 'Je comprends votre question. Pour une assistance plus détaillée, n\'hésitez pas à contacter votre administrateur ou à me poser une question plus spécifique sur les fonctionnalités de StockPro.';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateBotResponse(inputMessage),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isBot
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                {message.isBot ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {message.isBot ? 'Assistant IA' : user?.prenom || 'Vous'}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.isBot ? 'text-gray-500' : 'text-blue-100'
              }`}>
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <span className="text-xs font-medium">Assistant IA</span>
              </div>
              <div className="flex space-x-1 mt-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Posez votre question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};