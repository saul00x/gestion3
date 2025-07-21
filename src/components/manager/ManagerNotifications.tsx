import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, List, Spin, Typography, Tag, message, Modal } from 'antd';
import { CheckOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Mouvement {
  id: number;
  produit: number;
  produit_id: string;
  magasin: number;
  magasin_id: string;
  user: number;
  user_id: string;
  type: string;
  quantite: number;
  date: string;
  motif: string;
  justificatif_url: string;
  statut: string;
}

interface Notification {
  id: number;
  destinataire: number;
  mouvement: Mouvement;
  type: string;
  message: string;
  date: string;
  lu: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const statusColor = (statut: string) => {
  switch (statut) {
    case 'valide': return 'green';
    case 'accepte': return 'blue';
    case 'rejete': return 'red';
    case 'attente': return 'orange';
    default: return 'default';
  }
};

const ManagerNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{visible: boolean, justificatif?: string}>({visible: false});

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/stock/notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      message.error('Erreur lors du chargement des notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAction = async (notif: Notification, action: 'accepte' | 'rejete') => {
    Modal.confirm({
      title: action === 'accepte' ? 'Valider ce mouvement ?' : 'Rejeter ce mouvement ?',
      content: `Produit : ${notif.mouvement.produit_id}\nQuantité : ${notif.mouvement.quantite}\nMotif : ${notif.mouvement.motif}`,
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(
            `${API_BASE}/stock/mouvements/${notif.mouvement.id}/valider/`,
            { action },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          message.success(`Mouvement ${action === 'accepte' ? 'validé' : 'rejeté'} !`);
          fetchNotifications();
        } catch (err) {
          message.error('Erreur lors du traitement.');
        }
      },
    });
  };

  const markAsRead = async (notifId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE}/stock/notifications/`, { notification_id: notifId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <Card title={<Title level={3}>Notifications mouvements de stock</Title>}>
      <Spin spinning={loading}>
        <List
          dataSource={notifications.filter(notif => {
            // Only show if it's a stock alert (message or type contains 'alerte' or 'stock bas')
            const msg = notif.message?.toLowerCase() || '';
            const typ = notif.type?.toLowerCase() || '';
            return (
              (msg.includes('alerte') || msg.includes('stock bas') || typ.includes('alerte') || typ.includes('stock bas'))
            );
          })}
          renderItem={notif => (
            <List.Item
              actions={[
                notif.mouvement.statut === 'attente' && (
                  <>
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => handleAction(notif, 'accepte')}
                    >Valider</Button>
                    <Button
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleAction(notif, 'rejete')}
                      style={{ marginLeft: 8 }}
                    >Rejeter</Button>
                  </>
                ),
                <Button
                  icon={<FileTextOutlined />}
                  onClick={() => setModal({visible: true, justificatif: notif.mouvement.justificatif_url})}
                  disabled={!notif.mouvement.justificatif_url}
                >Justificatif</Button>,
                !notif.lu && (
                  <Button onClick={() => markAsRead(notif.id)} type="default">Marquer comme lue</Button>
                )
              ].filter(Boolean)}
              style={{ background: notif.lu ? '#fff' : '#e6f7ff', marginBottom: 16 }}
            >
              <List.Item.Meta
                title={<>
                  <Tag color={statusColor(notif.mouvement.statut)}>{notif.mouvement.statut.toUpperCase()}</Tag>
                  <Text strong>{notif.message}</Text>
                </>}
                description={
                  <>
                    <div>Produit : <b>{notif.mouvement.produit_id}</b></div>
                    <div>Quantité : <b>{notif.mouvement.quantite}</b> | Motif : <b>{notif.mouvement.motif}</b></div>
                    <div>Employé : <b>{notif.mouvement.user_id}</b></div>
                    <div>Date : {new Date(notif.mouvement.date).toLocaleString()}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Spin>
      <Modal
        open={modal.visible}
        onCancel={() => setModal({visible: false})}
        footer={null}
        title="Pièce justificative"
        width={800}
      >
        {modal.justificatif && (
          <iframe
            src={modal.justificatif}
            style={{ width: '100%', height: 600, border: 'none' }}
            title="Justificatif"
          />
        )}
      </Modal>
    </Card>
  );
};

export default ManagerNotifications;
