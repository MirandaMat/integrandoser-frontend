// src/components/NotificationProvider.tsx

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import io, { Socket } from 'socket.io-client';
import NotificationToast from './NotificationToast';
import { useSocket } from './SocketProvider';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  related_url: string;
  created_at: string;
  type: 'new_message' | 'new_invoice' | 'payment_received' | 'new_appointment' | 'appointment_rescheduled' | 'profile_update'; // Adicionado
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markOneAsRead: (notificationId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const socket = useSocket();

  const fetchNotifications = useCallback(async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const fetchedNotifications: Notification[] = await response.json();
        setNotifications(fetchedNotifications);

        // Se houver notificações e a mais recente não foi lida, mostre um toast.
        if (fetchedNotifications.length > 0 && !fetchedNotifications[0].is_read) {
          setToast({ id: fetchedNotifications[0].id, message: fetchedNotifications[0].message });
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetchNotifications(token);

    // Se o socket ainda não estiver pronto, não faça nada.
    if (!socket) return;

    socket.on('newNotification', (newNotification: Notification) => {
      console.log("NotificationProvider: 'newNotification' recebida!", newNotification);
      setNotifications(prev => [newNotification, ...prev]);
      setToast({ id: newNotification.id, message: newNotification.message });
    });

    // A limpeza do listener é importante para evitar duplicações
    return () => {
      socket.off('newNotification');
    };
    // Adicionamos 'socket' como dependência
  }, [fetchNotifications, socket]);

  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('http://localhost:3001/api/notifications/mark-all-as-read', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, []);

  // Nova função para marcar UMA notificação como lida
  const markOneAsRead = useCallback(async (notificationId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Atualiza o estado local imediatamente para uma resposta visual rápida
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
    );

    // Envia a requisição para o backend em segundo plano
    try {
      await fetch(`http://localhost:3001/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
      // Opcional: Reverter o estado se a API falhar
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: false } : n))
      );
    }
  }, []);
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  // Memoizar o valor do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    markAllAsRead,
    markOneAsRead
  }), [notifications, unreadCount, markAllAsRead, markOneAsRead]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {toast && <NotificationToast key={toast.id} message={toast.message} onClose={() => setToast(null)} />}
    </NotificationContext.Provider>
  );
};