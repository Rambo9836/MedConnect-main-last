from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('researcher', 'Researcher'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    bio = models.TextField(blank=True)
    address = models.TextField(blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class PatientProfile(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20)
    cancer_type = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    blood_type = models.CharField(max_length=10, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in cm
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # in kg
    allergies = models.TextField(blank=True)
    medical_conditions = models.TextField(blank=True)
    family_history = models.TextField(blank=True)
    insurance_provider = models.CharField(max_length=100, blank=True)
    insurance_number = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Patient: {self.profile.user.get_full_name()}"

    @property
    def bmi(self):
        if self.height and self.weight:
            height_m = self.height / 100
            return round(self.weight / (height_m ** 2), 2)
        return None

class ResearcherProfile(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE)
    title = models.CharField(max_length=50)
    institution = models.CharField(max_length=255)
    specialization = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    license_number = models.CharField(max_length=50, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    education = models.TextField(blank=True)
    certifications = models.TextField(blank=True)

    def __str__(self):
        return f"Researcher: {self.profile.user.get_full_name()}"

# EHR Models
class MedicalRecord(models.Model):
    RECORD_TYPE_CHOICES = [
        ('lab_result', 'Lab Result'),
        ('imaging', 'Imaging'),
        ('prescription', 'Prescription'),
        ('consultation', 'Consultation'),
        ('procedure', 'Procedure'),
        ('vaccination', 'Vaccination'),
        ('other', 'Other'),
    ]
    
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='medical_records')
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateField()
    provider = models.CharField(max_length=200)
    file = models.FileField(upload_to='medical_records/', null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.title}"

    class Meta:
        ordering = ['-date']

class VitalSigns(models.Model):
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='vital_signs')
    date = models.DateTimeField()
    blood_pressure_systolic = models.PositiveIntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.PositiveIntegerField(null=True, blank=True)
    heart_rate = models.PositiveIntegerField(null=True, blank=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    respiratory_rate = models.PositiveIntegerField(null=True, blank=True)
    oxygen_saturation = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    recorded_by = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.date.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-date']

class Medication(models.Model):
    MEDICATION_STATUS_CHOICES = [
        ('active', 'Active'),
        ('discontinued', 'Discontinued'),
        ('completed', 'Completed'),
    ]
    
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='medications')
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    prescribed_by = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=MEDICATION_STATUS_CHOICES, default='active')
    side_effects = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.name}"

    class Meta:
        ordering = ['-start_date']

class Immunization(models.Model):
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='immunizations')
    vaccine_name = models.CharField(max_length=200)
    date_administered = models.DateField()
    next_due_date = models.DateField(null=True, blank=True)
    administered_by = models.CharField(max_length=200)
    lot_number = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.vaccine_name}"

    class Meta:
        ordering = ['-date_administered']

class Allergy(models.Model):
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
        ('life_threatening', 'Life-threatening'),
    ]
    
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='allergies')
    allergen = models.CharField(max_length=200)
    reaction = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    onset_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.allergen}"

    class Meta:
        ordering = ['-created_at']

class ResearchStudy(models.Model):
    STATUS_CHOICES = [
        ('recruiting', 'Recruiting Participants'),
        ('in_progress', 'Study in Progress'),
        ('completed', 'Study Completed'),
        ('cancelled', 'Study Cancelled'),
    ]
    
    PHASE_CHOICES = [
        ('Phase I', 'Phase I'),
        ('Phase II', 'Phase II'),
        ('Phase III', 'Phase III'),
        ('Phase IV', 'Phase IV'),
        ('Pre-clinical', 'Pre-clinical'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES, default='Phase I')
    sponsor = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    eligibility_criteria = models.TextField()
    primary_endpoint = models.TextField()
    estimated_enrollment = models.PositiveIntegerField()
    current_enrollment = models.PositiveIntegerField(default=0)
    start_date = models.DateField()
    estimated_completion_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='recruiting')
    compensation = models.CharField(max_length=100, blank=True)
    contact_name = models.CharField(max_length=100)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    created_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='created_studies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']

class StudyParticipation(models.Model):
    STATUS_CHOICES = [
        ('interested', 'Interested'),
        ('applied', 'Applied'),
        ('screening', 'Screening'),
        ('enrolled', 'Enrolled'),
        ('completed', 'Completed'),
        ('withdrawn', 'Withdrawn'),
        ('rejected', 'Rejected'),
    ]
    
    study = models.ForeignKey(ResearchStudy, on_delete=models.CASCADE, related_name='participants')
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='study_participations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='interested')
    applied_date = models.DateTimeField(auto_now_add=True)
    enrolled_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['study', 'patient']
        ordering = ['-applied_date']

    def __str__(self):
        return f"{self.patient.user.username} - {self.study.title}"

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rescheduled', 'Rescheduled'),
    ]
    
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='appointments')
    # Optional link to a study when appointments are scheduled in the context of a research study
    study = models.ForeignKey('ResearchStudy', on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    doctor_name = models.CharField(max_length=255)
    doctor_specialization = models.CharField(max_length=100, blank=True)
    appointment_date = models.DateTimeField()
    address = models.TextField()
    reason = models.TextField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment with {self.doctor_name} on {self.appointment_date.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        ordering = ['-appointment_date']


class StudyDocument(models.Model):
    """Documents associated with a research study (e.g., consent forms, protocols)."""
    DOC_TYPE_CHOICES = [
        ('consent', 'Consent Form'),
        ('protocol', 'Study Protocol'),
        ('guideline', 'Guideline'),
        ('other', 'Other'),
    ]

    study = models.ForeignKey(ResearchStudy, on_delete=models.CASCADE, related_name='documents')
    uploaded_by = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_study_documents')
    file = models.FileField(upload_to='study_documents/')
    name = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPE_CHOICES, default='other')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.study.title} - {self.name}"

    class Meta:
        ordering = ['-uploaded_at']

class Community(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    is_private = models.BooleanField(default=False)
    tags = models.JSONField(default=list)  # Store tags as JSON array
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='created_communities')
    moderators = models.ManyToManyField(Profile, related_name='moderated_communities', blank=True)

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.members.count()

    @property
    def last_activity(self):
        latest_post = self.posts.order_by('-created_at').first()
        return latest_post.created_at if latest_post else self.created_at

class CommunityMembership(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='members')
    member = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='joined_communities')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_moderator = models.BooleanField(default=False)

    class Meta:
        unique_together = ['community', 'member']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.member.user.username} in {self.community.name}"

class CommunityPost(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='community_posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.user.username} in {self.community.name}"

    @property
    def like_count(self):
        return self.likes.count()

    @property
    def comment_count(self):
        return self.comments.count()

class PostAttachment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='community_attachments/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment: {self.filename}"

class PostLike(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='post_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['post', 'user']

    def __str__(self):
        return f"{self.user.user.username} likes {self.post}"

class PostComment(models.Model):
    post = models.ForeignKey(CommunityPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='post_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.user.username} on {self.post}"

class ContactRequest(models.Model):
    """Model for contact requests between researchers and patients"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    
    researcher = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='sent_contact_requests')
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='received_contact_requests')
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['researcher', 'patient']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Contact request from {self.researcher.user.username} to {self.patient.user.username}"
