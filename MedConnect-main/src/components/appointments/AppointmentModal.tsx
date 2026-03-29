import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, FileText, Save, Edit, Trash2 } from 'lucide-react';

interface Appointment {
  id?: number;
  doctor_name: string;
  doctor_specialization: string;
  appointment_date: string;
  address: string;
  reason: string;
  notes: string;
  status?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  onSave: (appointment: Appointment) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  mode: 'create' | 'edit';
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave,
  onDelete,
  mode
}) => {
  const [formData, setFormData] = useState<Appointment>({
    doctor_name: '',
    doctor_specialization: '',
    appointment_date: '',
    address: '',
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointment && mode === 'edit') {
      setFormData({
        doctor_name: appointment.doctor_name,
        doctor_specialization: appointment.doctor_specialization,
        appointment_date: appointment.appointment_date,
        address: appointment.address,
        reason: appointment.reason,
        notes: appointment.notes
      });
    } else {
      setFormData({
        doctor_name: '',
        doctor_specialization: '',
        appointment_date: '',
        address: '',
        reason: '',
        notes: ''
      });
    }
    setError('');
  }, [appointment, mode, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.doctor_name.trim()) {
        throw new Error('Doctor name is required');
      }
      if (!formData.appointment_date) {
        throw new Error('Appointment date is required');
      }
      if (!formData.address.trim()) {
        throw new Error('Address is required');
      }
      if (!formData.reason.trim()) {
        throw new Error('Reason for appointment is required');
      }

      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      setLoading(true);
      try {
        await onDelete(appointment.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete appointment');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Schedule New Appointment' : 'Edit Appointment'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Doctor Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              Doctor Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Name *
                </label>
                <input
                  type="text"
                  name="doctor_name"
                  value={formData.doctor_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr. John Smith"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  name="doctor_specialization"
                  value={formData.doctor_specialization}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Oncology, Cardiology, etc."
                />
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-2" />
              Appointment Details
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the full address of the appointment location"
                required
              />
            </div>
          </div>

          {/* Reason and Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Appointment Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Appointment *
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the reason for your appointment"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information or special instructions"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  {mode === 'create' ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  <span>{mode === 'create' ? 'Schedule Appointment' : 'Update Appointment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal; 