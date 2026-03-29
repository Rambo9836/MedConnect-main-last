import React, { useState } from 'react';
import { X, Send, User, MessageCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface ContactRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientCondition?: string;
}

const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientCondition
}) => {
  const { user } = useAuth();
  const { sendContactRequest } = useData();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (user?.userType !== 'researcher') {
      setError('Only researchers can send contact requests');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      const success = await sendContactRequest(patientId, message.trim());
      if (success) {
        alert('Contact request sent successfully! The patient will be notified and can accept or decline your request.');
        setMessage('');
        onClose();
      } else {
        setError('Failed to send contact request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending contact request:', error);
      setError('Failed to send contact request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Send Contact Request</h3>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">{patientName}</span>
            </div>
            {patientCondition && (
              <p className="text-sm text-gray-600">Condition: {patientCondition}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              This patient will receive your contact request and can choose to accept or decline it.
            </p>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message to Patient
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Introduce yourself and explain why you'd like to contact this patient..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Be professional and explain your research interests or how you can help.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactRequestModal;
