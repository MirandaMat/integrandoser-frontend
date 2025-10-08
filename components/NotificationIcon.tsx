import React from 'react';
import { FiDollarSign, FiUserCheck } from 'react-icons/fi';
import { IoCalendarOutline } from 'react-icons/io5';
import { TiMessages } from 'react-icons/ti';

interface NotificationIconProps {
  type: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ type }) => {
  const iconStyle = { fontSize: '1.2rem', color: 'var(--primary)', marginRight: '15px' };

  switch (type) {
    case 'new_message':
      return <TiMessages style={iconStyle} />;
    case 'new_invoice':
    case 'payment_received':
      return <FiDollarSign style={iconStyle} />;
    case 'new_appointment':
    case 'appointment_rescheduled':
      return <IoCalendarOutline style={iconStyle} />;
    case 'profile_update':
      return <FiUserCheck style={iconStyle} />;
    default:
      return null;
  }
};

export default NotificationIcon;