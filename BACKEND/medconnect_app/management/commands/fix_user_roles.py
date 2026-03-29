from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from medconnect_app.models import Profile, PatientProfile, ResearcherProfile

class Command(BaseCommand):
    help = 'Fix user roles based on their profile types'

    def handle(self, *args, **options):
        self.stdout.write('Fixing user roles...')
        
        # Get all users
        users = User.objects.all()
        fixed_count = 0
        
        for user in users:
            try:
                profile = user.profile
                current_role = profile.role
                
                # Check if user has a patient profile
                has_patient_profile = hasattr(profile, 'patientprofile')
                # Check if user has a researcher profile
                has_researcher_profile = hasattr(profile, 'researcherprofile')
                
                # Determine correct role
                if has_researcher_profile and not has_patient_profile:
                    correct_role = 'researcher'
                elif has_patient_profile and not has_researcher_profile:
                    correct_role = 'patient'
                elif has_patient_profile and has_researcher_profile:
                    # If user has both, prioritize researcher
                    correct_role = 'researcher'
                else:
                    # If user has neither, default to patient
                    correct_role = 'patient'
                
                # Update role if needed
                if current_role != correct_role:
                    profile.role = correct_role
                    profile.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Fixed user {user.username}: {current_role} -> {correct_role}'
                        )
                    )
                    fixed_count += 1
                else:
                    self.stdout.write(
                        f'User {user.username}: role is correct ({current_role})'
                    )
                    
            except Profile.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'User {user.username} has no profile')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Fixed {fixed_count} user roles')
        )
