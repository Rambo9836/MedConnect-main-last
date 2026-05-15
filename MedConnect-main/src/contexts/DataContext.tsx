import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  ClinicalTrial, 
  Community, 
  PatientMatch, 
  ResearcherMatch, 
  SearchFilters,
  Profile,
  MedicalRecord,
  VitalSigns,
  Medication,
  Immunization,
  Allergy,
  StudyApplicant,
  StudyDocument,
  StudyAppointment,
  ContactRequest,
} from '../types/data';

interface DataContextType {
  // Clinical Trials
  clinicalTrials: ClinicalTrial[];
  userStudies: ClinicalTrial[];
  fetchStudies: () => Promise<void>;
  fetchUserStudies: () => Promise<void>;
  applyToStudy: (studyId: string) => Promise<boolean>;
  createClinicalTrial: (studyData: any) => Promise<boolean>;
  fetchStudyApplicants: (studyId: string) => Promise<StudyApplicant[]>;
  updateApplicantStatus: (participationId: string, action: 'approve' | 'reject' | 'enroll' | 'withdraw', notes?: string) => Promise<boolean>;
  fetchStudyDocuments: (studyId: string) => Promise<StudyDocument[]>;
  uploadStudyDocument: (studyId: string, file: File, name?: string, docType?: string) => Promise<boolean>;
  deleteStudyDocument: (documentId: string) => Promise<boolean>;
  fetchStudyAppointments: (studyId: string) => Promise<StudyAppointment[]>;
  createStudyAppointment: (studyId: string, payload: { patient_id: string; appointment_date: string; doctor_name?: string; doctor_specialization?: string; address?: string; reason?: string; notes?: string; }) => Promise<boolean>;
  
  // Communities
  communities: Community[];
  userCommunities: Community[];
  fetchCommunities: () => Promise<void>;
  fetchUserCommunities: () => Promise<void>;
  joinCommunity: (communityId: string) => Promise<boolean>;
  leaveCommunity: (communityId: string) => Promise<boolean>;
  createCommunity: (communityData: any) => Promise<boolean>;
  // Added for posts and membership checks
  communityPosts: any[];
  fetchCommunityPosts: (communityId: string) => Promise<void>;
  isUserMemberOf: (communityId: string) => boolean;
  createPost: (communityId: string, content: string, attachments?: File[]) => Promise<boolean>;
  updatePost: (postId: string, content: string) => Promise<boolean>;
  deletePost: (postId: string) => Promise<boolean>;
  likePost: (postId: string) => Promise<boolean>;
  unlikePost: (postId: string) => Promise<boolean>;
  addComment: (postId: string, content: string) => Promise<boolean>;
  
  // Search & Matching
  patientMatches: PatientMatch[];
  researcherMatches: ResearcherMatch[];
  searchPatients: (filters: SearchFilters) => Promise<void>;
  searchResearchers: (filters: SearchFilters) => Promise<void>;
  
  // Profile & EHR
  profile: Profile | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<boolean>;
  uploadProfilePicture: (file: File) => Promise<boolean>;
  
  // Medical Records
  medicalRecords: MedicalRecord[];
  fetchMedicalRecords: () => Promise<void>;
  createMedicalRecord: (recordData: any) => Promise<boolean>;
  deleteMedicalRecord: (recordId: string) => Promise<boolean>;
  
  // Vital Signs
  vitalSigns: VitalSigns[];
  fetchVitalSigns: () => Promise<void>;
  createVitalSigns: (vitalData: any) => Promise<boolean>;
  
  // Medications
  medications: Medication[];
  fetchMedications: () => Promise<void>;
  createMedication: (medicationData: any) => Promise<boolean>;
  
  // Immunizations
  immunizations: Immunization[];
  fetchImmunizations: () => Promise<void>;
  
  // Allergies
  allergies: Allergy[];
  fetchAllergies: () => Promise<void>;
  
  // Contact Requests & Notifications
  contactRequests: ContactRequest[];
  fetchContactRequests: () => Promise<void>;
  sendContactRequest: (patientId: string, message: string) => Promise<boolean>;
  respondToContactRequest: (requestId: string, response: 'accept' | 'decline') => Promise<boolean>;
  
  // Loading states
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Move hook outside component for better Fast Refresh compatibility
function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: ReactNode;
}

// Use React.memo for better Fast Refresh compatibility
const DataProvider = React.memo(({ children }: DataProviderProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const API_BASE = (
    import.meta.env.VITE_API_BASE_URL
      || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:8000` : '')
  ).replace(/\/+$/, '');
  
  // Clinical Trials
  const [clinicalTrials, setClinicalTrials] = useState<ClinicalTrial[]>([]);
  const [userStudies, setUserStudies] = useState<ClinicalTrial[]>([]);
  
  // Communities
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  // Added: posts state
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  
  // Search & Matching
  const [patientMatches, setPatientMatches] = useState<PatientMatch[]>([]);
  const [researcherMatches, setResearcherMatches] = useState<ResearcherMatch[]>([]);
  
  // Profile & EHR
  const [profile, setProfile] = useState<Profile | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  
  // Contact Requests & Notifications
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);

  // Clinical Trials Functions
  const fetchStudies = async () => {
    if (!user) {
      console.log('No user authenticated, skipping fetchStudies');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/studies/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClinicalTrials(data.studies);
        }
      }
    } catch (error) {
      console.error('Failed to fetch studies:', error);
    }
  };

  const fetchUserStudies = async () => {
    if (!user) {
      console.log('No user authenticated, skipping fetchUserStudies');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/user/studies/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserStudies(data.studies);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user studies:', error);
    }
  };

  const applyToStudy = async (studyId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/studies/${studyId}/apply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchUserStudies(); // Refresh user studies
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to apply to study:', error);
      return false;
    }
  };

  const createClinicalTrial = async (studyData: any): Promise<boolean> => {
    if (!user || user.userType !== 'researcher') return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/studies/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(studyData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchStudies(); // Refresh studies
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to create clinical trial:', error);
      return false;
    }
  };

  const fetchStudyApplicants = async (studyId: string): Promise<StudyApplicant[]> => {
    try {
      const resp = await fetch(`${API_BASE}/api/studies/${studyId}/applicants/`, { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        return (data.applicants || []).map((a: any) => ({
          id: a.id?.toString(),
          patientId: a.patientId?.toString(),
          patientName: a.patientName,
          status: a.status,
          appliedDate: a.appliedDate,
          enrolledDate: a.enrolledDate,
          notes: a.notes,
        }));
      }
    } catch (e) {
      console.error('Failed to fetch study applicants:', e);
    }
    return [];
  };

  const updateApplicantStatus = async (participationId: string, action: 'approve' | 'reject' | 'enroll' | 'withdraw', notes?: string): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE}/api/participations/${participationId}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, notes }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
    } catch (e) {
      console.error('Failed to update applicant status:', e);
    }
    return false;
  };

  const fetchStudyDocuments = async (studyId: string): Promise<StudyDocument[]> => {
    try {
      const resp = await fetch(`${API_BASE}/api/studies/${studyId}/documents/`, { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        return (data.documents || []) as StudyDocument[];
      }
    } catch (e) {
      console.error('Failed to fetch study documents:', e);
    }
    return [];
  };

  const uploadStudyDocument = async (studyId: string, file: File, name?: string, docType?: string): Promise<boolean> => {
    try {
      const form = new FormData();
      form.append('file', file);
      if (name) form.append('name', name);
      if (docType) form.append('doc_type', docType);
      const resp = await fetch(`${API_BASE}/api/studies/${studyId}/documents/`, { method: 'POST', credentials: 'include', body: form });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
    } catch (e) {
      console.error('Failed to upload study document:', e);
    }
    return false;
  };

  const deleteStudyDocument = async (documentId: string): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE}/api/documents/${documentId}/delete/`, { method: 'DELETE', credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
    } catch (e) {
      console.error('Failed to delete study document:', e);
    }
    return false;
  };

  const fetchStudyAppointments = async (studyId: string): Promise<StudyAppointment[]> => {
    try {
      const resp = await fetch(`${API_BASE}/api/studies/${studyId}/appointments/`, { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        return (data.appointments || []) as StudyAppointment[];
      }
    } catch (e) {
      console.error('Failed to fetch study appointments:', e);
    }
    return [];
  };

  const createStudyAppointment = async (
    studyId: string,
    payload: { patient_id: string; appointment_date: string; doctor_name?: string; doctor_specialization?: string; address?: string; reason?: string; notes?: string; }
  ): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE}/api/studies/${studyId}/appointments/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
    } catch (e) {
      console.error('Failed to create study appointment:', e);
    }
    return false;
  };

  // Communities Functions
  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/communities/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCommunities(data.communities);
        }
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    }
  };

  const fetchUserCommunities = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/user/communities/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserCommunities(data.communities);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user communities:', error);
    }
  };

  // Added: fetch posts for a community
  const fetchCommunityPosts = useCallback(async (communityId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/communities/${communityId}/posts/`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const normalized = (data.posts || []).map((p: any) => ({
            id: p.id?.toString(),
            authorName: p.author_name,
            authorType: p.author_type,
            content: p.content,
            attachments: (p.attachments || []).map((a: any) => ({
              id: a.id?.toString(),
              name: a.name,
              type: a.type,
              url: a.url
            })),
            likes: Array.from({ length: Number(p.likes || 0) }, (_, i) => `like-${i}`),
            comments: (p.comments || []).map((c: any) => ({
              id: c.id?.toString(),
              authorName: c.author_name,
              authorType: c.author_type,
              content: c.content,
              createdAt: c.created_at
            })),
            createdAt: p.created_at,
            communityId: communityId.toString(),
            is_liked: !!p.is_liked
          }));
          setCommunityPosts(normalized);
        }
      }
    } catch (error) {
      console.error('Failed to fetch community posts:', error);
    }
  }, [API_BASE]);

  // Added: membership check helper
  const isUserMemberOf = (communityId: string): boolean => {
    return userCommunities.some((c: any) => c.id?.toString() === communityId.toString());
  };

  // Added: create a post (text-only; attachments optional with FormData)
  const createPost = async (communityId: string, content: string, attachments?: File[]): Promise<boolean> => {
    if (!user) return false;
    try {
      // Use JSON when no files, FormData when attachments present
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        formData.append('content', content);
        attachments.forEach((file) => formData.append('attachments', file));
        const resp = await fetch(`${API_BASE}/api/communities/${communityId}/posts/create/`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            await fetchCommunityPosts(communityId);
            return true;
          }
        }
        return false;
      } else {
        const resp = await fetch(`${API_BASE}/api/communities/${communityId}/posts/create/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success) {
            await fetchCommunityPosts(communityId);
            return true;
          }
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      return false;
    }
  };

  // Added: like a post
  const likePost = async (postId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/posts/${postId}/like/`, {
        method: 'POST',
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
      return false;
    } catch (error) {
      console.error('Failed to like post:', error);
      return false;
    }
  };

  // Added: unlike a post
  const unlikePost = async (postId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/posts/${postId}/unlike/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
      return false;
    } catch (error) {
      console.error('Failed to unlike post:', error);
      return false;
    }
  };

  // Added: update a post
  const updatePost = async (postId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/posts/${postId}/update/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
      return false;
    } catch (error) {
      console.error('Failed to update post:', error);
      return false;
    }
  };

  // Added: delete a post
  const deletePost = async (postId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/posts/${postId}/delete/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete post:', error);
      return false;
    }
  };

  // Added: add a comment
  const addComment = async (postId: string, content: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch(`${API_BASE}/api/posts/${postId}/comments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      if (resp.ok) {
        const data = await resp.json();
        return !!data.success;
      }
      return false;
    } catch (error) {
      console.error('Failed to add comment:', error);
      return false;
    }
  };

  const joinCommunity = async (communityId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/communities/${communityId}/join/`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchUserCommunities(); // Refresh user communities
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to join community:', error);
      return false;
    }
  };

  const leaveCommunity = async (communityId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/communities/${communityId}/leave/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchUserCommunities(); // Refresh user communities
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to leave community:', error);
      return false;
    }
  };

  const createCommunity = async (communityData: any): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/communities/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(communityData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchCommunities(); // Refresh communities
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to create community:', error);
      return false;
    }
  };

  // Search & Matching Functions
  const searchPatients = async (filters: SearchFilters) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.condition) queryParams.append('condition', filters.condition);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.ageRange) queryParams.append('ageRange', `${filters.ageRange[0]}-${filters.ageRange[1]}`);
      if (filters.gender) queryParams.append('gender', filters.gender);
      
      const response = await fetch(`${API_BASE}/api/search/patients/?${queryParams}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPatientMatches(data.patients);
        }
      }
    } catch (error) {
      console.error('Failed to search patients:', error);
    }
  };

  const searchResearchers = async (filters: SearchFilters) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.condition) queryParams.append('condition', filters.condition);
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.studyPhase) queryParams.append('studyPhase', filters.studyPhase);
      
      const response = await fetch(`${API_BASE}/api/search/researchers/?${queryParams}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResearcherMatches(data.researchers);
        }
      }
    } catch (error) {
      console.error('Failed to search researchers:', error);
    }
  };

  // Profile & EHR Functions
  const fetchProfile = async () => {
    console.log('fetchProfile called - user:', user);
    if (!user) {
      console.log('No user, returning early');
      return;
    }
    
    try {
      console.log('Fetching profile from API...');
      const response = await fetch(`${API_BASE}/api/profile/`, {
        credentials: 'include'
      });
      
      console.log('Profile API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile API response data:', data);
        if (data.success) {
          setProfile(data.profile);
          console.log('Profile set successfully:', data.profile);
        }
      } else if (response.status === 401) {
        console.log('Profile API returned 401 - user not authenticated');
        // Clear user data and redirect to login
        localStorage.removeItem('medconnect_user');
        window.location.href = '/login';
      } else {
        console.log('Profile API failed with status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const updateProfile = async (profileData: any): Promise<boolean> => {
    console.log('updateProfile called with data:', profileData);
    try {
      const response = await fetch(`${API_BASE}/api/profile/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      
      console.log('Update profile response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Update profile response data:', data);
        if (data.success) {
          await fetchProfile(); // Refresh profile
          return true;
        }
      } else {
        const errorData = await response.json();
        console.log('Update profile error:', errorData);
      }
      return false;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  };

  const uploadProfilePicture = async (file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch(`${API_BASE}/api/profile/upload-picture/`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchProfile(); // Refresh profile
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      return false;
    }
  };

  // Medical Records Functions
  const fetchMedicalRecords = async () => {
    if (!user || user.userType !== 'patient') return;
    
    try {
      const response = await fetch(`${API_BASE}/api/medical-records/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMedicalRecords(data.medical_records);
        }
      }
    } catch (error) {
      console.error('Failed to fetch medical records:', error);
    }
  };

  const createMedicalRecord = async (recordData: any): Promise<boolean> => {
    if (!user || user.userType !== 'patient') return false;
    
    try {
      const hasFile = !!recordData?.file;
      let response: Response;
      if (hasFile) {
        const formData = new FormData();
        formData.append('record_type', recordData.record_type);
        formData.append('title', recordData.title);
        formData.append('description', recordData.description || '');
        formData.append('date', recordData.date); 
        formData.append('provider', recordData.provider || '');
        if (recordData.notes) formData.append('notes', recordData.notes);
        formData.append('file', recordData.file);
        response = await fetch(`${API_BASE}/api/medical-records/create/`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      } else {
        response = await fetch(`${API_BASE}/api/medical-records/create/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(recordData)
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchMedicalRecords(); // Refresh medical records
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to create medical record:', error);
      return false;
    }
  };

  const deleteMedicalRecord = async (recordId: string): Promise<boolean> => {
    if (!user || user.userType !== 'patient') return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/medical-records/${recordId}/delete/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchMedicalRecords(); // Refresh medical records
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to delete medical record:', error);
      return false;
    }
  };

  // Vital Signs Functions
  const fetchVitalSigns = async () => {
    if (!user || user.userType !== 'patient') return;
    
    try {
      const response = await fetch(`${API_BASE}/api/vital-signs/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVitalSigns(data.vital_signs);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vital signs:', error);
    }
  };

  const createVitalSigns = async (vitalData: any): Promise<boolean> => {
    if (!user || user.userType !== 'patient') return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/vital-signs/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vitalData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchVitalSigns(); // Refresh vital signs
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to create vital signs:', error);
      return false;
    }
  };

  // Medications Functions
  const fetchMedications = async () => {
    if (!user || user.userType !== 'patient') return;
    
    try {
      const response = await fetch(`${API_BASE}/api/medications/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMedications(data.medications);
        }
      }
    } catch (error) {
      console.error('Failed to fetch medications:', error);
    }
  };

  const createMedication = async (medicationData: any): Promise<boolean> => {
    if (!user || user.userType !== 'patient') return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/medications/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(medicationData)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchMedications(); // Refresh medications
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to create medication:', error);
      return false;
    }
  };

  // Immunizations Functions
  const fetchImmunizations = async () => {
    if (!user || user.userType !== 'patient') return;
    
    try {
      const response = await fetch(`${API_BASE}/api/immunizations/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setImmunizations(data.immunizations);
        }
      }
    } catch (error) {
      console.error('Failed to fetch immunizations:', error);
    }
  };

  // Allergies Functions
  const fetchAllergies = async () => {
    if (!user || user.userType !== 'patient') return;
    
    try {
      const response = await fetch(`${API_BASE}/api/allergies/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllergies(data.allergies);
        }
      }
    } catch (error) {
      console.error('Failed to fetch allergies:', error);
    }
  };

  // Contact Requests & Notifications Functions
  const fetchContactRequests = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/contact-requests/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContactRequests(data.contact_requests);
        }
      }
    } catch (error) {
      console.error('Failed to fetch contact requests:', error);
    }
  };

  const sendContactRequest = async (patientId: string, message: string): Promise<boolean> => {
    if (!user || user.userType !== 'researcher') return false;
    
    try {
      const response = await fetch(`${API_BASE}/api/contact-request/${patientId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchContactRequests(); // Refresh contact requests
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to send contact request:', error);
      return false;
    }
  };

  const respondToContactRequest = async (requestId: string, response: 'accept' | 'decline'): Promise<boolean> => {
    if (!user || user.userType !== 'patient') return false;
    
    try {
      const apiResponse = await fetch(`${API_BASE}/api/contact-request/${requestId}/respond/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ response })
      });
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        if (data.success) {
          await fetchContactRequests(); // Refresh contact requests
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to respond to contact request:', error);
      return false;
    }
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      // Add a delay to ensure session cookie is properly set before making API calls
      const loadData = async () => {
        console.log('DataContext: Waiting for session to be ready...');
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // First verify the session is still valid by checking profile
        try {
          const testResponse = await fetch(`${API_BASE}/api/profile/`, {
            credentials: 'include'
          });
          
          if (testResponse.ok) {
            console.log('DataContext: Session verified, loading user data...');
            fetchStudies();
            fetchUserStudies();
            fetchCommunities();
            fetchUserCommunities();
            fetchProfile();
            fetchMedicalRecords();
            fetchVitalSigns();
            fetchMedications();
            fetchImmunizations();
            fetchAllergies();
            fetchContactRequests();
          } else if (testResponse.status === 401) {
            console.log('DataContext: Session expired, clearing user data');
            // Clear user data and redirect to login
            localStorage.removeItem('medconnect_user');
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('DataContext: Failed to verify session:', error);
        }
      };
      
      loadData();
    }
  }, [user]);

  const value = {
    // Clinical Trials
    clinicalTrials,
    userStudies,
    fetchStudies,
    fetchUserStudies,
    applyToStudy,
    createClinicalTrial,
    fetchStudyApplicants,
    updateApplicantStatus,
    fetchStudyDocuments,
    uploadStudyDocument,
    deleteStudyDocument,
    fetchStudyAppointments,
    createStudyAppointment,
    
    // Communities
    communities,
    userCommunities,
    fetchCommunities,
    fetchUserCommunities,
    joinCommunity,
    leaveCommunity,
    createCommunity,
    // Added
    communityPosts,
    fetchCommunityPosts,
    isUserMemberOf,
    createPost,
    updatePost,
    deletePost,
    likePost,
    unlikePost,
    addComment,
    
    // Search & Matching
    patientMatches,
    researcherMatches,
    searchPatients,
    searchResearchers,
    
    // Profile & EHR
    profile,
    fetchProfile,
    updateProfile,
    uploadProfilePicture,
    
    // Medical Records
    medicalRecords,
    fetchMedicalRecords,
    createMedicalRecord,
    deleteMedicalRecord,
    
    // Vital Signs
    vitalSigns,
    fetchVitalSigns,
    createVitalSigns,
    
    // Medications
    medications,
    fetchMedications,
    createMedication,
    
    // Immunizations
    immunizations,
    fetchImmunizations,
    
    // Allergies
    allergies,
    fetchAllergies,
    
    // Contact Requests & Notifications
    contactRequests,
    fetchContactRequests,
    sendContactRequest,
    respondToContactRequest,
    
    // Loading states
    loading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
});

DataProvider.displayName = 'DataProvider';

// Export both named and default exports for maximum compatibility
export { useData, DataProvider };
export default DataProvider;