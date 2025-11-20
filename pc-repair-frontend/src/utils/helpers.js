import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    waiting_payment: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
    waiting_parts: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pending Admin Review',
    assigned: 'Assigned to Technician',
    in_progress: 'In Progress',
    waiting_payment: 'Waiting for Payment',
    resolved: 'Resolved',
    cancelled: 'Cancelled',
    approved: 'Approved',
    waiting_parts: 'Waiting for Parts',
    completed: 'Completed',
    rejected: 'Rejected',
  };
  return labels[status] || status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const handleApiError = (error) => {
  if (error.response?.data) {
    const errorData = error.response.data;
    
    // Handle validation errors
    if (typeof errorData === 'object' && !errorData.detail) {
      const errors = Object.entries(errorData)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('\n');
      return errors;
    }
    
    // Handle error with detail message
    if (errorData.detail) {
      return errorData.detail;
    }
    
    // Handle error with message
    if (errorData.message) {
      return errorData.message;
    }
  }
  
  return error.message || 'An unexpected error occurred';
};
