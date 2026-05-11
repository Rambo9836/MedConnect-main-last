import React, { useState } from 'react';
import { X, MapPin, Calendar, Users, Phone, Mail, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { ClinicalTrial } from '../../types/data';

interface StudyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: ClinicalTrial | null;
  onApply: (studyId: string) => Promise<void>;
  userType?: 'patient' | 'researcher';
  participationStatus?: string;
}

const StudyDetailModal: React.FC<StudyDetailModalProps> = ({
  isOpen,
  onClose,
  study,
  onApply,
  userType,
  participationStatus
}) => {
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string>('');

  if (!isOpen || !study) return null;

  const contact = study.contactInfo || { name: '', email: '', phone: '' };
  const startDateText = study.startDate ? new Date(study.startDate).toLocaleDateString() : 'Not specified';
  const completionDateText = study.estimatedCompletionDate ? new Date(study.estimatedCompletionDate).toLocaleDateString() : 'Not specified';
  const eligibilityText = Array.isArray(study.eligibilityCriteria)
    ? (study.eligibilityCriteria as string[]).join('\n')
    : (study.eligibilityCriteria || 'Not specified');
  const primaryEndpointText = study.primaryEndpoint || 'Not specified';

  const handleApply = async () => {
    setApplying(true);
    setApplyError('');
    
    try {
      await onApply(study.id);
      alert('Successfully applied to study! The researcher will contact you soon.');
      onClose();
    } catch (error: any) {
      setApplyError(error.message || 'Failed to apply to study');
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getParticipationStatusColor = (status: string) => {
    switch (status) {
      case 'interested':
        return 'bg-yellow-100 text-yellow-800';
      case 'applied':
        return 'bg-emerald-100 text-emerald-800';
      case 'screening':
        return 'bg-purple-100 text-purple-800';
      case 'enrolled':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{study.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {study.location}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {study.phase}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(study.status)}`}>
                  {study.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-4"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Study Description</h3>
            <p className="text-gray-700">{study.description}</p>
          </div>

          {/* Study Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Study Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Sponsor:</span>
                  <p className="text-gray-900">{study.sponsor}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Primary Endpoint:</span>
                  <p className="text-gray-900">{primaryEndpointText}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Compensation:</span>
                  <p className="text-gray-900">{study.compensation || 'Not specified'}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Enrollment:</span>
                    <p className="text-gray-900">{study.currentEnrollment}/{study.estimatedEnrollment}</p>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">
                      {Math.round((study.currentEnrollment / study.estimatedEnrollment) * 100)}% full
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Start Date:</span>
                  <p className="text-gray-900">{startDateText}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Estimated Completion:</span>
                  <p className="text-gray-900">{completionDateText}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line">{eligibilityText}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{contact.name || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-blue-600 mr-2" />
                  <a href={contact.email ? `mailto:${contact.email}` : '#'} className="text-sm text-blue-600 hover:text-blue-800">
                    {contact.email || 'N/A'}
                  </a>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-blue-600 mr-2" />
                  <a href={contact.phone ? `tel:${contact.phone}` : '#'} className="text-sm text-blue-600 hover:text-blue-800">
                    {contact.phone || 'N/A'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Participation Status (for patients) */}
          {userType === 'patient' && participationStatus && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Status</h3>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getParticipationStatusColor(participationStatus)}`}>
                  {participationStatus.charAt(0).toUpperCase() + participationStatus.slice(1)}
                </span>
              </div>
            </div>
          )}

          {/* Apply Button (for patients who haven't applied) */}
          {userType === 'patient' && !participationStatus && study.status === 'recruiting' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-600">
                    Interested in participating? Apply now to be considered for this study.
                  </span>
                </div>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {applying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    'Apply to Study'
                  )}
                </button>
              </div>
              {applyError && (
                <div className="mt-3 text-sm text-red-600">
                  {applyError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyDetailModal; 