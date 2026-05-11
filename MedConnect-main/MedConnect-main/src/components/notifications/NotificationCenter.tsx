import React, { useState, useEffect } from 'react';
import { Bell, X, Check, XIcon, User, MessageCircle, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ContactRequest } from '../../types/data';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { contactRequests, respondToContactRequest, sendContactRequest } = useData();
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const pendingRequests = contactRequests.filter(req => req.status === 'pending');
  const acceptedRequests = contactRequests.filter(req => req.status === 'accepted');
  const declinedRequests = contactRequests.filter(req => req.status === 'declined');

  const handleRespond = async (requestId: string, response: 'accept' | 'decline') => {
    setIsResponding(true);
    try {
      const success = await respondToContactRequest(requestId, response);
      if (success) {
        setShowResponseModal(false);
        setSelectedRequest(null);
        setResponseMessage('');
        alert(response === 'accept' 
          ? 'Contact request accepted! The researcher can now view your profile.'
          : 'Contact request declined.'
        );
      } else {
        alert('Failed to respond to contact request. Please try again.');
      }
    } catch (error) {
      console.error('Error responding to contact request:', error);
      alert('Failed to respond to contact request. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Notifications</h3>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {pendingRequests.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
          {user?.userType === 'patient' ? (
            // Patient View
            <div className="p-6 space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    Pending Contact Requests ({pendingRequests.length})
                  </h4>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-yellow-600" />
                              <span className="font-medium text-gray-900">
                                {request.researcherName}
                              </span>
                              <span className="text-sm text-gray-500">
                                wants to contact you
                              </span>
                            </div>
                            <p className="text-gray-700 mb-3">{request.message}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <button
                            onClick={() => handleRespond(request.id, 'accept')}
                            disabled={isResponding}
                            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRespond(request.id, 'decline')}
                            disabled={isResponding}
                            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XIcon className="h-4 w-4" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Requests */}
              {acceptedRequests.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    Accepted Requests ({acceptedRequests.length})
                  </h4>
                  <div className="space-y-3">
                    {acceptedRequests.map((request) => (
                      <div key={request.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-gray-900">
                            {request.researcherName}
                          </span>
                          <span className="text-sm text-gray-500">
                            can now view your profile
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Accepted {formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declined Requests */}
              {declinedRequests.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <XIcon className="h-5 w-5 text-red-600 mr-2" />
                    Declined Requests ({declinedRequests.length})
                  </h4>
                  <div className="space-y-3">
                    {declinedRequests.map((request) => (
                      <div key={request.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-gray-900">
                            {request.researcherName}
                          </span>
                          <span className="text-sm text-gray-500">
                            contact request declined
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>Declined {formatDate(request.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contactRequests.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You'll see contact requests from researchers here.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Researcher View
            <div className="p-6 space-y-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                Contact Requests ({contactRequests.length})
              </h4>
              
              {contactRequests.length > 0 ? (
                <div className="space-y-4">
                  {contactRequests.map((request) => (
                    <div key={request.id} className={`border rounded-lg p-4 ${
                      request.status === 'pending' ? 'bg-blue-50 border-blue-200' :
                      request.status === 'accepted' ? 'bg-green-50 border-green-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-gray-900">
                          {request.patientName}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{request.message}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Sent {formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contact requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact requests you send to patients will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
