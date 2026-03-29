import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import StudyDetailModal from '../components/studies/StudyDetailModal';
import ContactRequestModal from '../components/notifications/ContactRequestModal';
import { ClinicalTrial, SearchFilters } from '../types/data';

const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    communities, 
    clinicalTrials, 
    patientMatches, 
    researcherMatches,
    searchPatients, 
    searchResearchers,
    applyToStudy,
    sendContactRequest
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(user?.userType === 'patient' ? 'trials' : 'patients');
  const [selectedStudy, setSelectedStudy] = useState<ClinicalTrial | null>(null);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [showContactRequest, setShowContactRequest] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; condition?: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load initial data when component mounts
  useEffect(() => {
    if (user?.userType === 'researcher') {
      if (patientMatches.length === 0) {
        // Load initial patient data for researchers
        searchPatients({});
      }
      if (researcherMatches.length === 0) {
        // Load initial researcher data for researchers
        searchResearchers({});
      }
    }
  }, [user?.userType]);

  useEffect(() => {
    filterResults();
  }, [searchQuery, activeTab, clinicalTrials, patientMatches, researcherMatches]);

  // Update page title when active tab changes
  useEffect(() => {
    if (user?.userType === 'researcher' && activeTab === 'researchers') {
      document.title = 'Find Researchers - MedConnect';
    } else if (user?.userType === 'researcher' && activeTab === 'patients') {
      document.title = 'Find Patients - MedConnect';
    } else if (user?.userType === 'patient') {
      document.title = 'Find Clinical Trials - MedConnect';
    }
  }, [activeTab, user?.userType]);

  const filterResults = () => {
    let results: any[] = [];
    
    if (!searchQuery.trim()) {
      switch (activeTab) {
        case 'trials':
          results = clinicalTrials;
          break;
        case 'patients':
          results = patientMatches;
          break;
        case 'researchers':
          results = researcherMatches;
          break;
        default:
          results = [];
      }
    } else {
      const query = searchQuery.toLowerCase();
      switch (activeTab) {
        case 'trials':
          results = clinicalTrials.filter(trial => 
            trial.title.toLowerCase().includes(query) ||
            trial.description.toLowerCase().includes(query) ||
            (trial.location && trial.location.toLowerCase().includes(query))
          );
          break;
        case 'patients':
          results = patientMatches.filter(patient => 
            (patient.condition && patient.condition.toLowerCase().includes(query)) ||
            (patient.location && patient.location.toLowerCase().includes(query)) ||
            (patient.gender && patient.gender.toLowerCase().includes(query))
          );
          break;
        case 'researchers':
          results = researcherMatches.filter(researcher => 
            (researcher.name && researcher.name.toLowerCase().includes(query)) ||
            (researcher.specialization && researcher.specialization.toLowerCase().includes(query)) ||
            (researcher.institution && researcher.institution.toLowerCase().includes(query))
          );
          break;
        default:
          results = [];
      }
    }
    
    setFilteredResults(results);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If no search query, just filter local results
      filterResults();
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      if (activeTab === 'patients') {
        // Search for patients using the API
        const filters: SearchFilters = {
          condition: searchQuery.trim(),
          location: '', // Could be enhanced with location search
        };
        await searchPatients(filters);
      } else if (activeTab === 'researchers') {
        // Search for researchers using the API
        const filters: SearchFilters = {
          condition: searchQuery.trim(),
          location: '', // Could be enhanced with location search
        };
        await searchResearchers(filters);
      } else if (activeTab === 'trials') {
        // For trials, we'll just filter locally since we have all trials
        filterResults();
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStudyClick = (study: ClinicalTrial) => {
    setSelectedStudy(study);
    setShowStudyModal(true);
  };

  const handleApplyToStudy = async (studyId: string) => {
    await applyToStudy(studyId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {user?.userType === 'patient' ? 'Find Clinical Trials' : 
           activeTab === 'researchers' ? 'Find Researchers' : 'Find Patients'}
        </h1>
        
        {/* Search Bar */}
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={`Search for ${
                activeTab === 'patients' ? 'conditions, locations, or keywords' : 
                activeTab === 'researchers' ? 'names, specializations, or institutions' :
                'trial titles, descriptions, or locations'
              }...`}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
          {searchQuery.trim() && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchError(null);
                filterResults();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Search Error Display */}
        {searchError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{searchError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Tips */}
        {activeTab === 'patients' && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-emerald-800">Search Tips</h4>
                <ul className="mt-1 text-sm text-emerald-700 space-y-1">
                  <li>• Search by medical condition (e.g., "cancer", "diabetes")</li>
                  <li>• Search by location (e.g., "New York", "California")</li>
                  <li>• Search by gender or age-related terms</li>
                  <li>• Use specific medical terms for better results</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'researchers' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">Search Tips</h4>
                <ul className="mt-1 text-sm text-green-700 space-y-1">
                  <li>• Search by researcher name</li>
                  <li>• Search by specialization (e.g., "oncology", "cardiology")</li>
                  <li>• Search by institution or location</li>
                  <li>• Search by research area or expertise</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {user?.userType === 'patient' && (
            <button
              onClick={() => setActiveTab('trials')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trials'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Clinical Trials
            </button>
          )}
          {user?.userType === 'researcher' && (
            <>
              <button
                onClick={() => setActiveTab('patients')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'patients'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Patients
              </button>
              <button
                onClick={() => setActiveTab('researchers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'researchers'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Researchers
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Results */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {activeTab === 'patients' ? 'Patient Matches' : 
             activeTab === 'researchers' ? 'Researcher Matches' : 'Clinical Trials'}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery.trim() ? 'No results found' : 'No data available'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery.trim() 
                ? 'Try adjusting your search terms or filters.'
                : activeTab === 'patients' 
                  ? 'No patients available at the moment.'
                  : activeTab === 'researchers'
                    ? 'No researchers available at the moment.'
                    : 'No clinical trials available at the moment.'
              }
            </p>
          </div>
        ) : (
          filteredResults.map((item: any) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              {activeTab === 'trials' && (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {item.phase}
                        </span>
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {item.currentEnrollment}/{item.estimatedEnrollment} enrolled
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.status === 'recruiting'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sponsored by {item.sponsor}</span>
                    <button 
                      className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                      onClick={() => handleStudyClick(item)}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'patients' && (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Patient {item.patientId || item.id}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {item.age && <span>{item.age} years old</span>}
                        {item.gender && <span>{item.gender}</span>}
                        {item.location && item.location !== 'Unknown' && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {item.location}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-2">
                        {item.condition || 'Condition not specified'} 
                        {item.stage && item.stage !== 'Unknown' && ` - ${item.stage}`}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                      {item.matchScore || 85}% Match
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {item.lastActive ? (
                        `Last active: ${new Date(item.lastActive).toLocaleDateString()}`
                      ) : (
                        'Recently active'
                      )}
                    </span>
                    <button 
                      className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                      onClick={() => {
                        setSelectedPatient({ 
                          id: item.patientId || item.id, 
                          name: `Patient ${item.patientId || item.id}`, 
                          condition: item.condition 
                        });
                        setShowContactRequest(true);
                      }}
                    >
                      Request Contact
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'researchers' && (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-medium">{item.title}</span>
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.institution}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">
                        {item.specialization}
                      </p>
                      {item.activeStudies > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {item.activeStudies} active studies
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {item.matchScore || 90}% Match
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {item.lastActive ? (
                        `Last active: ${new Date(item.lastActive).toLocaleDateString()}`
                      ) : (
                        'Recently active'
                      )}
                    </span>
                    <button 
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      onClick={() => {
                        // Could add researcher contact functionality here
                        console.log('Contact researcher:', item.name);
                      }}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Study Detail Modal */}
      <StudyDetailModal
        isOpen={showStudyModal}
        onClose={() => {
          setShowStudyModal(false);
          setSelectedStudy(null);
        }}
        study={selectedStudy}
        onApply={handleApplyToStudy}
        userType={user?.userType as 'patient' | 'researcher'}
        participationStatus={selectedStudy?.participationStatus}
      />

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

export default SearchPage;