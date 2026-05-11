import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Search, Shield, CheckCircle, Award, Heart } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-8">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Connecting Patients with
              <span className="block text-emerald-200 mt-2">Life-Saving Research</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-emerald-100 max-w-3xl mx-auto leading-relaxed">
              MedConnect bridges the gap between cancer patients and groundbreaking clinical trials, 
              creating opportunities for hope and healing through secure community connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center group"
              >
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-300 backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How MedConnect Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform makes it easy for patients and researchers to find each other safely and securely.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">For Patients</h3>
                  <p className="text-gray-600">
                    Create a secure profile, join disease-specific communities, and get matched with 
                    relevant clinical trials that could benefit your treatment journey.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">For Researchers</h3>
                  <p className="text-gray-600">
                    Find qualified participants for your studies, access anonymized medical data, 
                    and accelerate your research with our advanced matching algorithms.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy First</h3>
                  <p className="text-gray-600">
                    Your medical data is encrypted and protected. You control who sees your information 
                    and can withdraw consent at any time.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-10 w-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Join Our Community</h3>
                <p className="text-gray-600 mt-2">
                  Thousands of patients and researchers trust MedConnect
                </p>
              </div>
              <div className="space-y-4">
                {[
                  'HIPAA Compliant',
                  'End-to-End Encryption',
                  '24/7 Support',
                  'Free to Use'
                ].map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '10,000+', label: 'Patients Connected', color: 'text-emerald-600' },
              { number: '500+', label: 'Research Partners', color: 'text-green-600' },
              { number: '1,200+', label: 'Active Studies', color: 'text-teal-600' },
              { number: '95%', label: 'Satisfaction Rate', color: 'text-lime-600' }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 border border-emerald-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Sarah M.</h4>
                  <p className="text-sm text-gray-600">Cancer Patient</p>
                </div>
              </div>
              <p className="text-gray-700">
                "MedConnect helped me find a clinical trial that wasn't available in my area. 
                The community support has been invaluable during my treatment journey."
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-green-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Dr. James R.</h4>
                  <p className="text-sm text-gray-600">Oncology Researcher</p>
                </div>
              </div>
              <p className="text-gray-700">
                "The quality of participants we've found through MedConnect has been exceptional. 
                It's streamlined our recruitment process significantly."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-emerald-600 to-green-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M20%2020c0-5.5-4.5-10-10-10s-10%204.5-10%2010%204.5%2010%2010%2010%2010-4.5%2010-10zm10%200c0-5.5-4.5-10-10-10s-10%204.5-10%2010%204.5%2010%2010%2010%2010-4.5%2010-10z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 text-emerald-100">
            Join thousands of patients and researchers who are advancing cancer treatment together.
          </p>
          <Link
            to="/register"
            className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center group"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;