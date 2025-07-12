import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Bell, User as UserIcon } from 'lucide-react';
import { messagingService, authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Message, User } from '../types';
import toast from 'react-hot-toast';

export const MessagingInterface: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchUsers();
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const usersData = await authService.getUsers();
      let filteredUsers: User[] = [];

      if (user?.role === 'manager') {
        // Manager peut parler avec ses employés et les admins
        filteredUsers = usersData
          .filter((u: any) => 
            (u.role === 'employe' && u.magasin_id === user.magasin_id) ||
            u.role === 'admin'
          )
          .filter((u: any) => u.id !== user.id)
          .map((item: any) => ({
            ...item,
            createdAt: new Date(item.date_joined)
          }));
      } else if (user?.role === 'employe') {
        // Employé peut parler avec les admins et son manager
        filteredUsers = usersData
          .filter((u: any) => 
            u.role === 'admin' ||
            (u.role === 'manager' && u.magasin_id === user.magasin_id)
          )
          .filter((u: any) => u.id !== user.id)
          .map((item: any) => ({
            ...item,
            createdAt: new Date(item.date_joined)
          }));
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const messagesData = await messagingService.getMessages();
      const formattedMessages = messagesData.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })) as Message[];

      setMessages(formattedMessages);

      const unread = formattedMessages.filter(msg => 
        msg.receiver_id === user?.id && !msg.read
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !user) return;

    try {
      await messagingService.createMessage({
        receiver: selectedUser.id,
        content: newMessage.trim()
      });

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await messagingService.updateMessage(messageId, { read: true });
      fetchMessages();
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationMessages = () => {
    if (!selectedUser || !user) return [];
    
    return messages.filter(msg => 
      (msg.sender_id === user.id && msg.receiver_id === selectedUser.id) ||
      (msg.sender_id === selectedUser.id && msg.receiver_id === user.id)
    );
  };

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    
    const conversationMessages = messages.filter(msg => 
      msg.sender_id === selectedUser.id && msg.receiver_id === user?.id && !msg.read
    );
    
    conversationMessages.forEach(msg => {
      markAsRead(msg.id);
    });
  };

  const getUserUnreadCount = (userId: string) => {
    return messages.filter(msg => 
      msg.sender_id === userId && msg.receiver_id === user?.id && !msg.read
    ).length;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Manager';
      case 'employe': return 'Employé';
      default: return role;
    }
  };

  if (!user || user.role === 'admin') return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Users List */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {user.role === 'manager' ? 'Employés & Admins' : 'Managers & Admins'}
              </span>
            </div>
            {users.map((u) => {
              const userUnreadCount = getUserUnreadCount(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => handleUserSelect(u)}
                  className={`w-full text-left p-3 rounded-lg hover:bg-white transition-colors duration-200 relative mb-2 ${
                    selectedUser?.id === u.id ? 'bg-white border-l-4 border-blue-500 shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {u.prenom?.charAt(0)?.toUpperCase() || u.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate text-sm">
                        {u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getRoleLabel(u.role)}
                      </div>
                    </div>
                    {userUnreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {userUnreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {selectedUser.prenom?.charAt(0)?.toUpperCase() || selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-sm">
                      {selectedUser.prenom && selectedUser.nom ? `${selectedUser.prenom} ${selectedUser.nom}` : selectedUser.email}
                    </h2>
                    <p className="text-xs text-gray-500">{getRoleLabel(selectedUser.role)}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {getConversationMessages().length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aucun message</p>
                    <p className="text-xs">Commencez la conversation !</p>
                  </div>
                ) : (
                  getConversationMessages().map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === user.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          message.sender_id === user.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3" />
                <p className="text-sm">Sélectionnez un utilisateur</p>
                <p className="text-xs">pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};