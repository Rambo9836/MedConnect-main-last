import React, { useState } from 'react';
import { FileText, Users, Search, TrendingUp, Plus, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import ContactRequestModal from '../notifications/ContactRequestModal';

const ResearcherDashboard: React.FC = () => {
  const { 
    userStudies, 
    patientMatches, 
    createClinicalTrial,
    fetchStudyApplicants,
    updateApplicantStatus,
    uploadStudyDocument,
    createStudyAppointment,
    sendContactRequest
  } = useData();
  const navigate = useNavigate();
  const [showCreateStudy, setShowCreateStudy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showContactRequest, setShowContactRequest] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; condition?: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phase: 'Phase I',
    sponsor: '',
    location: '',
    eligibilityCriteria: '',
    primaryEndpoint: '',
    estimatedEnrollment: '',
    startDate: '',
    estimatedCompletionDate: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });
  const [createError, setCreateError] = useState<string>('');

  const myStudies = userStudies.map(trial => ({
    ...trial,
    participants: trial.currentEnrollment,
    targetParticipants: trial.estimatedEnrollment
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    // Validate estimatedEnrollment is a positive integer
    const enrollment = parseInt(formData.estimatedEnrollment, 10);
    if (isNaN(enrollment) || enrollment <= 0) {
      setCreateError('Estimated Enrollment must be a positive number.');
      setCreating(false);
      return;
    }
    try {
      await createClinicalTrial({ ...formData, estimatedEnrollment: enrollment });
      setShowCreateStudy(false);
      setFormData({
        title: '',
        description: '',
        phase: 'Phase I',
        sponsor: '',
        location: '',
        eligibilityCriteria: '',
        primaryEndpoint: '',
        estimatedEnrollment: '',
        startDate: '',
        estimatedCompletionDate: '',
        contactName: '',
        contactEmail: '',
        contactPhone: ''
      });
      alert('Clinical trial created successfully!');
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create clinical trial. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleViewApplicants = async (studyId: string) => {
    try {
      const applicants = await fetchStudyApplicants(studyId);
      if (applicants.length === 0) {
        alert('No applicants yet for this study');
        return;
      }
      
      // Show applicants with action options
      let message = `${applicants.length} applicants/participants:\n\n`;
      applicants.forEach((a, index) => {
        message += `${index + 1}. ${a.patientName} (ID: ${a.patientId}) - Status: ${a.status}\n`;
      });
      message += '\nEnter the number of the applicant you want to manage:';
      
      const choice = prompt(message);
      if (!choice) return;
      
      const applicantIndex = parseInt(choice) - 1;
      if (applicantIndex < 0 || applicantIndex >= applicants.length) {
        alert('Invalid selection');
        return;
      }
      
      const applicant = applicants[applicantIndex];
      const action = prompt(`Applicant: ${applicant.patientName}\nCurrent Status: ${applicant.status}\n\nEnter action:\n1. approve (for screening)\n2. enroll\n3. reject\n\nEnter 1, 2, or 3:`);
      
      if (action === '1') {
        const success = await updateApplicantStatus(applicant.id, 'approve');
        alert(success ? 'Applicant approved for screening! Patient will be notified.' : 'Failed to approve applicant');
      } else if (action === '2') {
        const success = await updateApplicantStatus(applicant.id, 'enroll');
        alert(success ? 'Applicant enrolled! Patient will be notified.' : 'Failed to enroll applicant');
      } else if (action === '3') {
        const success = await updateApplicantStatus(applicant.id, 'reject');
        alert(success ? 'Applicant rejected' : 'Failed to reject applicant');
      } else {
        alert('Invalid action');
      }
    } catch (e) {
      console.error('Failed to fetch applicants', e);
      alert('Failed to load applicants');
    }
  };

  const handleUploadDocClick = (studyId: string) => {
    const input = document.getElementById(`doc-upload-${studyId}`) as HTMLInputElement | null;
    input?.click();
  };

  const handleUploadDocChange = async (studyId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await uploadStudyDocument(studyId, file, file.name, 'other');
    alert(ok ? 'Document uploaded' : 'Upload failed');
    e.target.value = '';
  };

  const handleScheduleAppointment = async (studyId: string) => {
    // First, get the list of applicants to help the researcher choose
    try {
      const applicants = await fetchStudyApplicants(studyId);
      if (applicants.length === 0) {
        alert('No applicants found for this study. Please ensure patients have applied first.');
        return;
      }
      
      // Show applicants list for reference
      const applicantsList = applicants
        .map(a => `ID: ${a.patientId} - ${a.patientName} (${a.status})`)
        .join('\n');
      
      const patientId = prompt(`Available applicants:\n\n${applicantsList}\n\nEnter patient ID to schedule appointment:`);
      if (!patientId) return;
      
      // Validate patient ID is in the applicants list
      const validPatient = applicants.find(a => a.patientId === patientId);
      if (!validPatient) {
        alert('Invalid patient ID. Please select from the list above.');
        return;
      }
      
      // Get appointment details
      const when = prompt('Enter appointment date and time (e.g., 2025-12-01T14:30:00Z):');
      if (!when) return;
      
      // Validate date format
      try {
        new Date(when);
      } catch (e) {
        alert('Invalid date format. Please use format: 2025-12-01T14:30:00Z');
        return;
      }
      
      const doctorName = prompt('Enter doctor name (optional):') || '';
      const doctorSpecialization = prompt('Enter doctor specialization (optional):') || '';
      const address = prompt('Enter appointment address (optional):') || '';
      const reason = prompt('Enter appointment reason (optional):') || '';
      const notes = prompt('Enter additional notes (optional):') || '';
      
      const ok = await createStudyAppointment(studyId, { 
        patient_id: patientId, 
        appointment_date: when,
        doctor_name: doctorName,
        doctor_specialization: doctorSpecialization,
        address: address,
        reason: reason,
        notes: notes
      });
      
      if (ok) {
        alert('Appointment created successfully! The patient will be notified.');
      } else {
        alert('Failed to create appointment. Please check the patient ID and try again.');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert('Error scheduling appointment. Please try again.');
    }
  };

  const handleRequestContact = async (patientId: string, patientName: string, condition?: string) => {
    setSelectedPatient({ id: patientId, name: patientName, condition });
    setShowContactRequest(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Research Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your studies and connect with potential participants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <p className="text-sm text-gray-600">Manage Profile</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Participants</h3>
              <p className="text-sm text-gray-600">
                {myStudies.reduce((sum, study) => sum + study.participants, 0)} Total
              </p>
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
              <h3 className="text-lg font-semibold text-gray-900">Find Patients</h3>
              <p className="text-sm text-gray-600">{patientMatches.length} Potential</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Recruitment</h3>
              <p className="text-sm text-gray-600">
                {myStudies.reduce((sum, study) => sum + study.targetParticipants, 0) > 0 
                  ? Math.round(
                      (myStudies.reduce((sum, study) => sum + study.participants, 0) /
                        myStudies.reduce((sum, study) => sum + study.targetParticipants, 0)) * 100
                    ) : 0}% Complete
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Your Studies */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Studies</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your ongoing clinical trials
            </p>
          </div>
          <div className="p-6">
            {myStudies.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No studies created yet</p>
                <button
                  onClick={() => setShowCreateStudy(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Study
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myStudies.map((study) => (
                  <div key={study.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-medium text-gray-900">{study.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        study.status === 'recruiting'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {study.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{study.sponsor}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {study.participants}/{study.targetParticipants} participants
                      </span>
                      <span className="text-gray-600">{study.phase}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleViewApplicants(study.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Applicants
                      </button>
                      <button
                        onClick={() => handleUploadDocClick(study.id)}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Upload Document
                      </button>
                      <input
                        id={`doc-upload-${study.id}`}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleUploadDocChange(study.id, e)}
                      />
                      <button
                        onClick={() => handleScheduleAppointment(study.id)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Schedule Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Potential Patient Matches */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Potential Patient Matches</h2>
            <p className="text-sm text-gray-600 mt-1">
              Patients who may be eligible for your studies
            </p>
          </div>
          <div className="p-6">
            {patientMatches.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No potential matches found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patientMatches.slice(0, 3).map((patient) => (
                  <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Patient {patient.patientId}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {patient.age} years old, {patient.location}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {patient.matchScore}% Match
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">
                          {patient.condition} - {patient.stage}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRequestContact(patient.id, patient.name, patient.condition)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Request Contact
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button 
                onClick={() => setShowCreateStudy(true)}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Plus className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Create New Study</h3>
                    <p className="text-sm text-gray-600">Start a new clinical trial</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/search')}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Search className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Find Patients</h3>
                    <p className="text-sm text-gray-600">Search for potential participants</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/community')}
                className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Join Communities</h3>
                    <p className="text-sm text-gray-600">Connect with other researchers</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                <span>Study "Novel Immunotherapy" received 3 new applications</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <span>Patient P001 accepted your contact request</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                <span>Study "Targeted Therapy" enrollment is 80% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Study Modal */}
      {showCreateStudy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Create New Clinical Trial</h3>
                <button
                  onClick={() => setShowCreateStudy(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateStudy} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Study Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                  <select
                    name="phase"
                    value={formData.phase}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Phase I">Phase I</option>
                    <option value="Phase II">Phase II</option>
                    <option value="Phase III">Phase III</option>
                    <option value="Phase IV">Phase IV</option>
                    <option value="Pre-clinical">Pre-clinical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
                  <input
                    type="text"
                    name="sponsor"
                    value={formData.sponsor}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility Criteria</label>
                <textarea
                  name="eligibilityCriteria"
                  value={formData.eligibilityCriteria}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Endpoint</label>
                <input
                  type="text"
                  name="primaryEndpoint"
                  value={formData.primaryEndpoint}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Enrollment</label>
                  <input
                    type="number"
                    name="estimatedEnrollment"
                    value={formData.estimatedEnrollment}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    name="estimatedCompletionDate"
                    value={formData.estimatedCompletionDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {createError && (
                <div className="text-red-600 text-sm">{createError}</div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateStudy(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Request Modal */}
      {selectedPatient && (
        <ContactRequestModal
          isOpen={showContactRequest}
          onClose={() => {
            setShowContactRequest(false);
            setSelectedPatient(null);
          }}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          patientCondition={selectedPatient.condition}
        />
      )}
    </div>
  );
};

export default ResearcherDashboard;