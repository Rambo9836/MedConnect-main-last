import React, { useState, useEffect } from 'react';
import { 
  User, 
  Camera, 
  Edit, 
  Save, 
  X, 
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { 
    profile, 
    updateProfile,
    uploadProfilePicture,
    loading 
  } = useData();
  
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    bio: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    // Patient specific
    phone_number: '',
    blood_type: '',
    height: '',
    weight: '',
    insurance_provider: '',
    insurance_number: '',
    // Researcher specific
    license_number: '',
    years_of_experience: '',
    education: '',
    certifications: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        bio: profile.bio || '',
        address: profile.address || '',
        emergency_contact_name: profile.emergency_contact?.name || '',
        emergency_contact_phone: profile.emergency_contact?.phone || '',
        emergency_contact_relationship: profile.emergency_contact?.relationship || '',
        phone_number: profile.patient_profile?.phone_number || '',
        blood_type: profile.patient_profile?.blood_type || '',
        height: profile.patient_profile?.height?.toString() || '',
        weight: profile.patient_profile?.weight?.toString() || '',
        insurance_provider: profile.patient_profile?.insurance_provider || '',
        insurance_number: profile.patient_profile?.insurance_number || '',
        license_number: profile.researcher_profile?.license_number || '',
        years_of_experience: profile.researcher_profile?.years_of_experience?.toString() || '',
        education: profile.researcher_profile?.education || '',
        certifications: profile.researcher_profile?.certifications || ''
      });
    } else if (user) {
      // Fallback: fetch profile directly if not available from DataContext
      fetchProfileDirectly();
    }
  }, [profile, user]);

  const fetchProfileDirectly = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/profile/', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const profileData = data.profile;
          // Update the form data directly with proper mapping
          setFormData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || '',
            bio: profileData.bio || '',
            address: profileData.address || '',
            emergency_contact_name: profileData.emergency_contact?.name || '',
            emergency_contact_phone: profileData.emergency_contact?.phone || '',
            emergency_contact_relationship: profileData.emergency_contact?.relationship || '',
            phone_number: profileData.patient_profile?.phone_number || '',
            blood_type: profileData.patient_profile?.blood_type || '',
            height: profileData.patient_profile?.height?.toString() || '',
            weight: profileData.patient_profile?.weight?.toString() || '',

            insurance_provider: profileData.patient_profile?.insurance_provider || '',
            insurance_number: profileData.patient_profile?.insurance_number || '',
            license_number: profileData.researcher_profile?.license_number || '',
            years_of_experience: profileData.researcher_profile?.years_of_experience?.toString() || '',
            education: profileData.researcher_profile?.education || '',
            certifications: profileData.researcher_profile?.certifications || ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile directly:', error);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPicture(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch('http://127.0.0.1:8000/api/profile/upload-picture/', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Profile picture uploaded successfully!');
          // Refresh the page to show the new picture
          window.location.reload();
        } else {
          alert(data.message || 'Failed to upload profile picture');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    // Basic validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert('First name and last name are required.');
      return;
    }

    setSavingProfile(true);
    try {
      // Format the data according to backend expectations
      const profileData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        bio: formData.bio.trim(),
        address: formData.address.trim(),
        emergency_contact_name: formData.emergency_contact_name.trim(),
        emergency_contact_phone: formData.emergency_contact_phone.trim(),
        emergency_contact_relationship: formData.emergency_contact_relationship.trim(),
        // Patient-specific fields
        phone_number: formData.phone_number.trim(),
        blood_type: formData.blood_type.trim(),
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        insurance_provider: formData.insurance_provider.trim(),
        insurance_number: formData.insurance_number.trim(),
        // Researcher-specific fields
        license_number: formData.license_number.trim(),
        years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
        education: formData.education.trim(),
        certifications: formData.certifications.trim()
      };

      const success = await updateProfile(profileData);

      if (success) {
        setEditing(false);
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Clear message after 3 seconds
        setTimeout(() => setSaveMessage(null), 3000);
        // Refresh the profile data
        window.location.reload();
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        setTimeout(() => setSaveMessage(null), 5000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile & EHR</h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and health records
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {profile?.profile_picture ? (
                  <img 
                    src={/^https?:\/\//.test(profile.profile_picture) ? profile.profile_picture : `${window.location.protocol}//${window.location.hostname}:8000${profile.profile_picture}`}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-full h-full text-gray-400 p-4" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full cursor-pointer hover:bg-emerald-700 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploadingPicture}
                />
              </label>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <p className="text-gray-600 capitalize">{profile?.role}</p>
              {profile?.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              {editing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>

        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'profile' && (
          <div className="p-6">
            {/* Save Message */}
            {saveMessage && (
              <div className={`mb-6 p-4 rounded-md ${
                saveMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  {saveMessage.type === 'success' ? (
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className="font-medium">{saveMessage.text}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Enter your first name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Enter your last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editing}
                      rows={2}
                      placeholder="Enter your full address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Emergency contact's full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="Emergency contact's phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      disabled={!editing}
                      placeholder="e.g., Spouse, Parent, Sibling"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Role-specific Information */}
              {user?.userType === 'patient' && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                      <input
                        type="text"
                        name="blood_type"
                        value={formData.blood_type}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="e.g., A+, B-, O+, AB+"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number || ''}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Your contact phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="e.g., 175"
                        min="50"
                        max="250"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="e.g., 70"
                        min="20"
                        max="300"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        name="insurance_provider"
                        value={formData.insurance_provider}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="e.g., Blue Cross Blue Shield, Aetna"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Number</label>
                      <input
                        type="text"
                        name="insurance_number"
                        value={formData.insurance_number}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Your insurance policy number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>

                  </div>
                </div>
              )}

              {user?.userType === 'researcher' && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                      <input
                        type="text"
                        name="license_number"
                        value={formData.license_number}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Your medical license number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                      <input
                        type="number"
                        name="years_of_experience"
                        value={formData.years_of_experience}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="e.g., 5"
                        min="0"
                        max="50"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                      <textarea
                        name="education"
                        value={formData.education}
                        onChange={handleInputChange}
                        disabled={!editing}
                        rows={3}
                        placeholder="List your educational background (e.g., MD from Harvard Medical School, PhD in Oncology)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                      <textarea
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleInputChange}
                        disabled={!editing}
                        rows={3}
                        placeholder="List any relevant certifications or licenses (e.g., Board Certified in Oncology, FDA Clinical Investigator)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {editing && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {savingProfile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}










      </div>
    </div>
  );
};

export default ProfilePage;