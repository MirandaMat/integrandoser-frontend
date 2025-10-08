// src/components/NotificationToast.tsx
import React, { useEffect } from 'react';
import { FiInfo, FiX } from 'react-icons/fi';
import '../styles/notificacao.css'; // Assuming this CSS file exists and is styled

interface NotificationToastProps {
  message: string;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000); // Auto-close after 6 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification-toast">
      <div className="toast-icon"><FiInfo /></div>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close-btn" onClick={onClose}>
        <FiX />
      </button>
    </div>
  );
};

export default NotificationToast;