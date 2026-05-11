import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType {
  user: User | null;
  requestLoginCode: (email: string) => Promise<void>;
  requestSignupCode: (email: string) => Promise<void>;
  requestPasswordResetCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Move hook outside component for better Fast Refresh compatibility
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Use React.memo for better Fast Refresh compatibility
const AuthProvider = React.memo(({ children }: { children: React.ReactNode }) => {
  const API_BASE = (
    import.meta.env.VITE_API_BASE_URL
      || (import.meta.env.DEV ? `${window.location.protocol}//${window.location.hostname}:8000` : '')
  ).replace(/\/+$/, '');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const parseJsonSafely = async (response: Response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Unexpected response from server (status ${response.status})`);
    }
  };

  useEffect(() => {
    // Check for stored user data on app load
    const storedUser = localStorage.getItem('medconnect_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Verify session is still valid
        const verifySession = async () => {
          try {
            const response = await fetch(`${API_BASE}/api/profile/`, {
              credentials: 'include'
            });
            
            if (response.status === 401) {
              console.log('Session expired, clearing user data');
              localStorage.removeItem('medconnect_user');
              setUser(null);
            }
          } catch (error) {
            console.error('Failed to verify session:', error);
          }
        };
        
        verifySession();
      } catch (error) {
        localStorage.removeItem('medconnect_user');
      }
    }
    setLoading(false);
  }, []);

  const requestLoginCode = async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/login/request-code/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await parseJsonSafely(response);
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to send login code');
    }
  };

  const requestSignupCode = async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/register/request-code/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await parseJsonSafely(response);
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to send signup verification code');
    }
  };

  const requestPasswordResetCode = async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/password-reset/request-code/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await parseJsonSafely(response);
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to send password reset code');
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/password-reset/confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });

    const data = await parseJsonSafely(response);
    if (!response.ok || !data.success) {
      const msg = data.message || 'Password reset failed';
      const details = Array.isArray(data.errors) && data.errors.length ? `: ${data.errors.join(' ')}` : '';
      throw new Error(`${msg}${details}`);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setLoading(true);
    try {
      console.log('Attempting OTP login with:', { email: credentials.email });
      
      const response = await fetch(`${API_BASE}/api/login/verify-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          code: credentials.code
        })
      });

      console.log('Login response status:', response.status);
      
      const data = await parseJsonSafely(response);
      console.log('Login response data:', data);

      if (!response.ok) {
        // Show the specific error message from the backend
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      if (data.success) {
        const user: User = {
          id: data.user.id.toString(),
          email: data.user.email,
          userType: data.user.role,
          firstName: data.user.first_name,
          lastName: data.user.last_name,
          profileComplete: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          privacySettings: {
            shareWithResearchers: true,
            allowCommunityMessages: true,
            showInSearch: true,
            dataRetentionPeriod: 365
          },
          ...(data.user.patient_profile && {
            patientProfile: {
              dateOfBirth: data.user.patient_profile.date_of_birth,
              gender: data.user.patient_profile.gender,
              conditions: [data.user.patient_profile.cancer_type],
              medications: [],
              allergies: []
            }
          }),
          ...(data.user.researcher_profile && data.user.researcher_profile.title && data.user.researcher_profile.institution && data.user.researcher_profile.specialization && {
            researcherProfile: {
              title: data.user.researcher_profile.title,
              institution: data.user.researcher_profile.institution,
              specialization: data.user.researcher_profile.specialization,
              licenseNumber: '',
              verificationStatus: 'pending' as const
            }
          })
        };

        setUser(user);
        localStorage.setItem('medconnect_user', JSON.stringify(user));
        
        // Add a small delay to ensure session cookie is properly set
        console.log('Waiting for session cookie to be set...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify session is working by making a test API call
        console.log('Verifying session...');
        const testResponse = await fetch(`${API_BASE}/api/profile/`, {
          credentials: 'include'
        });
        console.log('Session test response status:', testResponse.status);
        
        if (testResponse.ok) {
          console.log('Session verification successful');
        } else {
          console.warn('Session verification failed, but continuing...');
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setLoading(true);
    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Generate unique username by adding timestamp
      const timestamp = Date.now();
      const baseUsername = data.email.split('@')[0];
      const uniqueUsername = `${baseUsername}${timestamp}`;

      let endpoint = '';
      let payload: any = {
        username: uniqueUsername,
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        verification_code: data.verificationCode,
      };

      if (data.userType === 'patient') {
        endpoint = `${API_BASE}/api/register/patient/`;
        payload = {
          ...payload,
          date_of_birth: data.dateOfBirth,
          gender: data.gender,
          cancer_type: data.cancerType,
          phone_number: data.phone,
        };
      } else if (data.userType === 'researcher') {
        endpoint = `${API_BASE}/api/register/researcher/`;
        payload = {
          ...payload,
          title: data.title,
          institution: data.company,
          specialization: data.specialization,
          phone_number: data.phone,
        };
      } else {
        throw new Error('Invalid user type');
      }

      console.log('Attempting registration with:', { endpoint, payload });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      console.log('Registration response status:', response.status);
      
      const result = await parseJsonSafely(response);
      console.log('Registration response data:', result);
      
      if (!response.ok) {
        // Show the specific error message from the backend
        throw new Error(result.message || `Registration failed with status ${response.status}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      // Registration successful - user is now logged in automatically
      console.log('Registration successful, user is now logged in');
      
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('medconnect_user', JSON.stringify(updatedUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/api/logout/`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Best-effort: even if network fails, clear local auth state.
    } finally {
      setUser(null);
      localStorage.removeItem('medconnect_user');
    }
  };

  const value = {
    user,
    requestLoginCode,
    requestSignupCode,
    requestPasswordResetCode,
    resetPassword,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
});

AuthProvider.displayName = 'AuthProvider';

// Export both named and default exports for maximum compatibility
export { useAuth, AuthProvider };
export default AuthProvider;