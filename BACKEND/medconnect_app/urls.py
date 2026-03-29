from django.urls import path
from . import views, api_views

app_name = 'medconnect_app'

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('register/patient/', views.patient_register, name='patient_register'),
    path('register/researcher/', views.researcher_register, name='researcher_register'),
    path('dashboard/', views.dashboard, name='dashboard'),

    # API endpoints
    path('api/login/', api_views.api_login, name='api_login'),
    path('api/register/patient/', api_views.api_register_patient, name='api_register_patient'),
    path('api/register/researcher/', api_views.api_register_researcher, name='api_register_researcher'),
    path('api/logout/', api_views.api_logout, name='api_logout'),
    path('api/user/', api_views.api_user_info, name='api_user_info'),
    path('api/debug/users/', api_views.api_debug_users, name='api_debug_users'),
    
    # Search API endpoints
    path('api/search/patients/', api_views.api_search_patients, name='api_search_patients'),
    path('api/search/researchers/', api_views.api_search_researchers, name='api_search_researchers'),
    
    # Profile API endpoints
    path('api/profile/', api_views.api_profile, name='api_profile'),
    path('api/profile/update/', api_views.api_update_profile, name='api_update_profile'),
    path('api/profile/upload-picture/', api_views.api_upload_profile_picture, name='api_upload_profile_picture'),
    
    # EHR API endpoints
    path('api/medical-records/', api_views.api_medical_records, name='api_medical_records'),
    path('api/medical-records/create/', api_views.api_create_medical_record, name='api_create_medical_record'),
    path('api/medical-records/<int:record_id>/delete/', api_views.api_delete_medical_record, name='api_delete_medical_record'),
    path('api/vital-signs/', api_views.api_vital_signs, name='api_vital_signs'),
    path('api/vital-signs/create/', api_views.api_create_vital_signs, name='api_create_vital_signs'),
    path('api/medications/', api_views.api_medications, name='api_medications'),
    path('api/medications/create/', api_views.api_create_medication, name='api_create_medication'),
    path('api/immunizations/', api_views.api_immunizations, name='api_immunizations'),
    path('api/allergies/', api_views.api_allergies, name='api_allergies'),
    
    # Appointment API endpoints
    path('api/appointments/', api_views.api_appointments, name='api_appointments'),
    path('api/appointments/create/', api_views.api_create_appointment, name='api_create_appointment'),
    path('api/appointments/<int:appointment_id>/update/', api_views.api_update_appointment, name='api_update_appointment'),
    path('api/appointments/<int:appointment_id>/delete/', api_views.api_delete_appointment, name='api_delete_appointment'),
    
    # Research Study API endpoints
    path('api/studies/', api_views.api_studies, name='api_studies'),
    path('api/studies/<int:study_id>/', api_views.api_study_detail, name='api_study_detail'),
    path('api/studies/create/', api_views.api_create_study, name='api_create_study'),
    path('api/studies/<int:study_id>/apply/', api_views.api_apply_study, name='api_apply_study'),
    path('api/studies/<int:study_id>/applicants/', api_views.api_study_applicants, name='api_study_applicants'),
    path('api/participations/<int:participation_id>/status/', api_views.api_update_applicant_status, name='api_update_applicant_status'),
    path('api/user/studies/', api_views.api_user_studies, name='api_user_studies'),
    
    # Community API endpoints
    path('api/communities/', api_views.api_communities, name='api_communities'),
    path('api/communities/create/', api_views.api_create_community, name='api_create_community'),
    path('api/communities/<int:community_id>/', api_views.api_community_detail, name='api_community_detail'),
    path('api/communities/<int:community_id>/join/', api_views.api_join_community, name='api_join_community'),
    path('api/communities/<int:community_id>/leave/', api_views.api_leave_community, name='api_leave_community'),
    path('api/communities/<int:community_id>/posts/', api_views.api_community_posts, name='api_community_posts'),
    path('api/communities/<int:community_id>/posts/create/', api_views.api_create_post, name='api_create_post'),
    path('api/user/communities/', api_views.api_user_communities, name='api_user_communities'),

    # Study documents
    path('api/studies/<int:study_id>/documents/', api_views.api_study_documents, name='api_study_documents'),
    path('api/documents/<int:document_id>/delete/', api_views.api_delete_study_document, name='api_delete_study_document'),

    # Study appointments (researcher)
    path('api/studies/<int:study_id>/appointments/', api_views.api_study_appointments, name='api_study_appointments'),
    path('api/studies/<int:study_id>/appointments/create/', api_views.api_create_study_appointment, name='api_create_study_appointment'),
    
    # Post interaction API endpoints
    path('api/posts/<int:post_id>/update/', api_views.api_update_post, name='api_update_post'),
    path('api/posts/<int:post_id>/delete/', api_views.api_delete_post, name='api_delete_post'),
    path('api/posts/<int:post_id>/like/', api_views.api_like_post, name='api_like_post'),
    path('api/posts/<int:post_id>/unlike/', api_views.api_unlike_post, name='api_unlike_post'),
    path('api/posts/<int:post_id>/comments/', api_views.api_add_comment, name='api_add_comment'),
    
    # Contact Request API endpoints
    path('api/contact-request/<int:patient_id>/', api_views.api_send_contact_request, name='api_send_contact_request'),
    path('api/contact-requests/', api_views.api_contact_requests, name='api_contact_requests'),
    path('api/contact-request/<int:request_id>/respond/', api_views.api_respond_contact_request, name='api_respond_contact_request'),
] 