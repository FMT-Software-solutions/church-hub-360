const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  SMS: {
    SEND_STANDARD: `${BACKEND_URL}/sms/send`,
    SEND_TEMPLATE: `${BACKEND_URL}/sms/send-template`,
    GET_DETAILS: (id: string) => `${BACKEND_URL}/sms/details/${id}`,
    NOTIFY_SENDER_ID: `${BACKEND_URL}/sms/sender-id/notify`,
  }
};
