export interface User {
  id: string;
  username: string;
  email: string;
  userType: 'patient' | 'researcher';
  isAuthenticated: boolean;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'patient' | 'researcher';
  profile_picture?: string;
  bio?: string;
  address?: string;
  profile_completion?: number;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  patient_profile?: PatientProfile;
  researcher_profile?: ResearcherProfile;
}

export interface PatientProfile {
  date_of_birth: string;
  gender: string;
  cancer_type: string;
  phone_number: string;
  blood_type?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  allergies?: string;
  medical_conditions?: string;
  family_history?: string;
  insurance_provider?: string;
  insurance_number?: string;
}

export interface ResearcherProfile {
  title: string;
  institution: string;
  specialization: string;
  phone_number: string;
  license_number?: string;
  years_of_experience?: number;
  education?: string;
  certifications?: string;
}

export interface MedicalRecord {
  id: string;
  record_type: 'lab_result' | 'imaging' | 'prescription' | 'consultation' | 'procedure' | 'vaccination' | 'other';
  title: string;
  description: string;
  date: string;
  provider: string;
  file_url?: string;
  notes?: string;
  created_at: string;
}

export interface VitalSigns {
  id: string;
  date: string;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  notes?: string;
  recorded_by?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  prescribed_by: string;
  status: 'active' | 'discontinued' | 'completed';
  side_effects?: string;
  notes?: string;
  created_at: string;
}

export interface Immunization {
  id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string;
  administered_by: string;
  lot_number?: string;
  notes?: string;
  created_at: string;
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onset_date?: string;
  notes?: string;
  created_at: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  tags: string[];
  memberCount: number;
  lastActivity: string;
  moderators: string[];
}

export interface ClinicalTrial {
  id: string;
  title: string;
  description: string;
  phase: string;
  status: string;
  sponsor: string;
  location: string;
  eligibilityCriteria: string[] | string;
  primaryEndpoint?: string;
  estimatedEnrollment: number;
  currentEnrollment: number;
  startDate?: string;
  estimatedCompletionDate?: string;
  contactInfo?: ContactInfo;
  compensation?: string;
  createdBy?: any;
  participationStatus?: string;
}

export interface StudyApplicant {
  id: string;
  patientId: string;
  patientName: string;
  status: 'interested' | 'applied' | 'screening' | 'enrolled' | 'completed' | 'withdrawn' | 'rejected';
  appliedDate: string;
  enrolledDate?: string | null;
  notes?: string;
}

export interface StudyDocument {
  id: string;
  name: string;
  docType: 'consent' | 'protocol' | 'guideline' | 'other' | string;
  url: string;
  uploadedAt: string;
}

export interface StudyAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctor_name: string;
  doctor_specialization: string;
  appointment_date: string;
  address: string;
  reason: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

export interface ContactRequest {
  id: string;
  type: 'sent' | 'received';
  researcherId?: string;
  researcherName?: string;
  patientId?: string;
  patientName?: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
}

export interface PatientMatch {
  id: string;
  patientId: string;
  age: number;
  gender: string;
  condition: string;
  stage?: string;
  location: string;
  matchScore: number;
  eligibleStudies: string[];
  lastActive: string;
}

export interface ResearcherMatch {
  id: string;
  researcherId: string;
  name: string;
  institution: string;
  specialization: string;
  activeStudies: number;
  location: string;
  matchScore: number;
  verificationStatus: string;
}

export interface SearchFilters {
  condition?: string;
  location?: string;
  ageRange?: [number, number];
  gender?: string;
  studyPhase?: string;
}

export interface UserDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
}

export interface ContactRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserType: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  studyTitle?: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorType: string;
  content: string;
  attachments: any[];
  likes: number;
  comments: any[];
  createdAt: string;
  isLiked: boolean;
}