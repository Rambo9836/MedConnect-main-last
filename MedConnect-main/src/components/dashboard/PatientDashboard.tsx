import React, { useState, useEffect, useMemo } from 'react';
import { User, FileText, Search, Calendar, AlertCircle, Upload, X, Eye, Download, Trash2, Bell, Check, XIcon, Plus, Edit, Clock, MapPin } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import AppointmentModal from '../appointments/AppointmentModal';
import NotificationCenter from '../notifications/NotificationCenter';
import { Profile } from '../../types/data';

const PatientDashboard: React.FC = () => {
  const { 
    clinicalTrials, 
    userStudies, 
    medicalRecords,
    fetchMedicalRecords,
    deleteMedicalRecord,
    profile,
    contactRequests,
    respondToContactRequest
  } = useData();
  
  const [showDocuments, setShowDocuments] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentMode, setAppointmentMode] = useState<'create' | 'edit'>('create');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const API_BASE = (
    import.meta.env.VITE_API_BASE_URL
      || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:8000` : '')
  ).replace(/\/+$/, '');

  const potentialMatches = clinicalTrials.slice(0, 2).map(trial => ({
    ...trial,
    matchScore: Math.floor(Math.random() * 30) + 70
  }));

  // Map medical records to document format
  const userDocuments = medicalRecords.map(record => ({
    id: record.id,
    name: record.title,
    type: record.record_type,
    size: 1024 * 1024, // Default size since we don't have file size in the type
    uploadDate: record.created_at,
    url: record.file_url || '#'
  }));

  const pendingRequests = contactRequests.filter(req => req.status === 'pending');

  // Calculate profile completion percentage based on filled fields
  const calculateProfileCompletion = (p: Profile | null): number => {
    if (!p) return 0;
    let filled = 0;
    let total = 0;

    const isFilled = (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      return true;
    };

    const topLevelFields: Array<keyof Profile> = ['first_name', 'last_name', 'bio', 'address', 'profile_picture'];
    topLevelFields.forEach((key) => {
      total += 1;
      if (isFilled((p as any)[key])) filled += 1;
    });

    // Emergency contact fields (count even if object missing)
    const ec = p.emergency_contact || ({} as any);
    ;['name', 'phone', 'relationship'].forEach((key) => {
      total += 1;
      if (isFilled(ec[key])) filled += 1;
    });

    // Patient profile fields
    const pp = p.patient_profile || ({} as any);
    const patientFields = [
      'date_of_birth',
      'gender',
      'cancer_type',
      'phone_number',
      'blood_type',
      'height',
      'weight',
      'bmi',
      'allergies',
      'medical_conditions',
      'family_history',
      'insurance_provider',
      'insurance_number'
    ];
    patientFields.forEach((key) => {
      total += 1;
      if (isFilled((pp as any)[key])) filled += 1;
    });

    if (total === 0) return 0;
    return Math.min(100, Math.round((filled / total) * 100));
  };

  const profileCompletion = useMemo(() => {
    if (profile && typeof (profile as any).profile_completion === 'number') {
      return Math.max(0, Math.min(100, Math.round((profile as any).profile_completion)));
    }
    return calculateProfileCompletion(profile as any);
  }, [profile]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only JPG, PNG, or PDF files');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Optional: backend will default these if missing
      // formData.append('title', file.name);
      // formData.append('record_type', 'other');

      const resp = await fetch(`${API_BASE}/api/medical-records/create/`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      await fetchMedicalRecords();
      alert('Document uploaded successfully!');
      setShowUpload(false);
    } catch (error) {
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const success = await deleteMedicalRecord(documentId);
        if (success) {
          alert('Document deleted successfully!');
        } else {
          alert('Failed to delete document. Please try again.');
        }
      } catch (error) {
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleContactResponse = async (requestId: string, response: 'accept' | 'decline') => {
    try {
      const success = await respondToContactRequest(requestId, response);
      if (success) {
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
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Appointment functions
  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const response = await fetch(`${API_BASE}/api/appointments/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAppointments(data.appointments);
        }
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleSaveAppointment = async (appointmentData: any) => {
    try {
      const url = appointmentMode === 'create' 
        ? `${API_BASE}/api/appointments/create/`
        : `${API_BASE}/api/appointments/${selectedAppointment.id}/update/`;
      
      const method = appointmentMode === 'create' ? 'POST' : 'PUT';

      const payload = {
        ...appointmentData,
        appointment_date: new Date(appointmentData.appointment_date).toISOString(),
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchAppointments(); // Refresh appointments
          alert(appointmentMode === 'create' ? 'Appointment scheduled successfully!' : 'Appointment updated successfully!');
        } else {
          throw new Error(data.message || 'Failed to save appointment');
        }
      } else {
        throw new Error('Failed to save appointment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/appointments/${appointmentId}/delete/`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchAppointments(); // Refresh appointments
          alert('Appointment deleted successfully!');
        } else {
          throw new Error(data.message || 'Failed to delete appointment');
        }
      } else {
        throw new Error('Failed to delete appointment');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete appointment');
    }
  };

  const openAppointmentModal = (mode: 'create' | 'edit', appointment?: any) => {
    setAppointmentMode(mode);
    setSelectedAppointment(appointment || null);
    setShowAppointmentModal(true);
  };

  // Load appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your profile and explore clinical trial opportunities
        </p>
      </div>

      {/* Notification Banner */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">
                You have {pendingRequests.length} new contact request{pendingRequests.length > 1 ? 's' : ''} from researchers
              </span>
            </div>
            <button
              onClick={() => setShowNotifications(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              View Requests
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <p className="text-sm text-gray-600">{profile ? `${profileCompletion}% Complete` : 'Loading...'}</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowDocuments(true)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <p className="text-sm text-gray-600">{userDocuments.length} Uploaded</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/search')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Search className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Applied Studies</h3>
              <p className="text-sm text-gray-600">{userStudies.length} Studies</p>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => openAppointmentModal('create')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
              <p className="text-sm text-gray-600">
                {loadingAppointments ? 'Loading...' : `${appointments.length} Upcoming`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Your Applied Studies */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Applied Studies</h2>
            <p className="text-sm text-gray-600 mt-1">
              Studies you have applied to participate in
            </p>
          </div>
          <div className="p-6">
            {userStudies.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You haven't applied to any studies yet</p>
                <button
                  onClick={() => navigate('/search')}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Find Studies to Apply
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userStudies.map((study) => (
                  <div
                    key={study.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{study.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        study.participationStatus === 'interested' ? 'bg-yellow-100 text-yellow-800' :
                        study.participationStatus === 'applied' ? 'bg-emerald-100 text-emerald-800' :
                        study.participationStatus === 'screening' ? 'bg-purple-100 text-purple-800' :
                        study.participationStatus === 'enrolled' ? 'bg-green-100 text-green-800' :
                        study.participationStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {study.participationStatus ? study.participationStatus.charAt(0).toUpperCase() + study.participationStatus.slice(1) : 'Applied'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{study.sponsor}</p>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {study.phase}
                      </span>
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => navigate('/search')}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button 
                onClick={() => setShowUpload(true)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Upload Medical Records</h3>
                    <p className="text-sm text-gray-600">Add your latest test results</p>
                  </div>
                </div>
              </button>

              <button 
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => navigate('/search')}
              >
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Find Clinical Trials</h3>
                    <p className="text-sm text-gray-600">Search for relevant studies</p>
                  </div>
                </div>
              </button>

              <button 
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => navigate('/community')}
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Join Communities</h3>
                    <p className="text-sm text-gray-600">Connect with others like you</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Potential Study Matches */}
      {potentialMatches.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recommended Studies</h2>
            <p className="text-sm text-gray-600 mt-1">
              Clinical trials that match your profile
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {potentialMatches.map((trial) => (
                <div
                  key={trial.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{trial.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {trial.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{trial.sponsor}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {trial.phase}
                    </span>
                    <button 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => navigate('/search')}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appointments Section */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Your Appointments</h2>
            <button
              onClick={() => openAppointmentModal('create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Appointment</span>
            </button>
          </div>
        </div>
        <div className="p-6">
          {loadingAppointments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No appointments scheduled yet</p>
              <button
                onClick={() => openAppointmentModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Schedule Your First Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{appointment.doctor_name}</h3>
                      {appointment.doctor_specialization && (
                        <p className="text-sm text-gray-600">{appointment.doctor_specialization}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {new Date(appointment.appointment_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {appointment.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-900">
                      <strong>Reason:</strong> {appointment.reason}
                    </p>
                    {appointment.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => openAppointmentModal('edit', appointment)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Your Data Security</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your medical information is encrypted and only shared with researchers when you 
              explicitly consent to participate in their studies. You maintain full control 
              over your data at all times.
            </p>
          </div>
        </div>
      </div>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upload Medical Records</h3>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Supported formats: JPG, PNG, PDF (Max 10MB)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-800 font-medium">
                    Choose file to upload
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
            
            {uploading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Uploading...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocuments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">My Documents</h3>
              <button
                onClick={() => setShowDocuments(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {userDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No documents uploaded yet</p>
                <button
                  onClick={() => {
                    setShowDocuments(false);
                    setShowUpload(true);
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Upload Your First Document
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userDocuments.map((doc) => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                        <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => window.open(doc.url, '_blank')}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.url;
                            link.download = doc.name;
                            link.click();
                          }}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                      {doc.type.includes('image') ? 'Image' : 'PDF'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        mode={appointmentMode}
      />
    </div>
  );
};

export default PatientDashboard;