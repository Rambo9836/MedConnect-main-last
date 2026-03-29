export interface User {
  id: string;
  email: string;
  userType: 'patient' | 'researcher';
  firstName: string;
  lastName: string;
  profilePicture?: string;
  profileComplete: boolean;
  createdAt: string;
  lastLogin: string;
  privacySettings: PrivacySettings;
  patientProfile?: PatientProfile;
  researcherProfile?: ResearcherProfile;
}

export interface PatientProfile {
  dateOfBirth?: string;
  gender?: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
  emergencyContact?: EmergencyContact;
  medicalHistory?: MedicalRecord[];
}

export interface ResearcherProfile {
  title: string;
  institution: string;
  specialization: string;
  licenseNumber?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  researchAreas?: string[];
  publications?: Publication[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface MedicalRecord {
  id: string;
  type: 'lab_result' | 'imaging' | 'prescription' | 'visit_note';
  title: string;
  date: string;
  provider: string;
  fileUrl?: string;
  notes?: string;
}

export interface Publication {
  title: string;
  journal: string;
  year: number;
  doi?: string;
}

export interface PrivacySettings {
  shareWithResearchers: boolean;
  allowCommunityMessages: boolean;
  showInSearch: boolean;
  dataRetentionPeriod: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  userType: 'patient' | 'researcher';
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  userType: 'patient' | 'researcher';
  // Patient-specific fields
  dateOfBirth?: string;
  gender?: string;
  cancerType?: string;
  // Researcher-specific fields
  title?: string;
  company?: string;
  specialization?: string;
  licenseNumber?: string;
  phone: string;
}