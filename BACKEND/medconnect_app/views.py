from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import PatientRegisterForm, ResearcherRegisterForm, UserLoginForm
from .models import Profile, PatientProfile, ResearcherProfile

def home(request):
    return render(request, 'medconnect_app/home.html')

def patient_register(request):
    if request.method == 'POST':
        form = PatientRegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Profile is automatically created by signals, just update the role
            profile = user.profile
            profile.role = 'patient'
            profile.save()
            
            PatientProfile.objects.create(
                profile=profile,
                date_of_birth=form.cleaned_data['date_of_birth'],
                gender=form.cleaned_data['gender'],
                cancer_type=form.cleaned_data['cancer_type'],
                phone_number=form.cleaned_data['phone_number']
            )
            messages.success(request, 'Patient registration successful! Please log in.')
            return redirect('medconnect_app:login')
    else:
        form = PatientRegisterForm()
    return render(request, 'medconnect_app/patient_register.html', {'form': form})

def researcher_register(request):
    if request.method == 'POST':
        form = ResearcherRegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Profile is automatically created by signals, just update the role
            profile = user.profile
            profile.role = 'researcher'
            profile.save()
            
            ResearcherProfile.objects.create(
                profile=profile,
                title=form.cleaned_data['title'],
                institution=form.cleaned_data['institution'],
                specialization=form.cleaned_data['specialization'],
                phone_number=form.cleaned_data['phone_number']
            )
            messages.success(request, 'Researcher registration successful! Please log in.')
            return redirect('medconnect_app:login')
    else:
        form = ResearcherRegisterForm()
    return render(request, 'medconnect_app/researcher_register.html', {'form': form})

def user_login(request):
    if request.method == 'POST':
        form = UserLoginForm(request.POST)
        if form.is_valid():
            username_or_email = form.cleaned_data['username_or_email']
            password = form.cleaned_data['password']
            
            print(f"DEBUG: Login attempt - Username/Email: '{username_or_email}', Password: '{password}'")
            
            # Try to authenticate with username first, then email
            user = authenticate(username=username_or_email, password=password)
            print(f"DEBUG: Username authentication result: {user}")
            
            if user is None:
                # If username failed, try email
                try:
                    user_obj = User.objects.get(email=username_or_email)
                    print(f"DEBUG: Found user by email: {user_obj.username}")
                    user = authenticate(username=user_obj.username, password=password)
                    print(f"DEBUG: Email authentication result: {user}")
                except User.DoesNotExist:
                    print(f"DEBUG: No user found with email: {username_or_email}")
                    user = None
            
            if user is not None and user.is_active:
                print(f"DEBUG: Login successful for user: {user.username}")
                login(request, user)
                messages.success(request, f'Welcome back, {user.get_full_name() or user.username}!')
                return redirect('medconnect_app:dashboard')
            else:
                if user is not None and not user.is_active:
                    print(f"DEBUG: User is inactive: {user.username}")
                    messages.error(request, 'Your account is inactive. Please contact support.')
                else:
                    print(f"DEBUG: Authentication failed - user: {user}")
                    messages.error(request, 'Invalid username/email or password. Please try again.')
        else:
            print(f"DEBUG: Form validation failed: {form.errors}")
    else:
        form = UserLoginForm()
    return render(request, 'medconnect_app/login.html', {'form': form})

@login_required
def user_logout(request):
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('medconnect_app:home')

@login_required
def dashboard(request):
    user = request.user
    try:
        profile = user.profile
        context = {'profile': profile}
        if profile.role == 'patient':
            patient_profile = PatientProfile.objects.get(profile=profile)
            context['patient_profile'] = patient_profile
        elif profile.role == 'researcher':
            researcher_profile = ResearcherProfile.objects.get(profile=profile)
            context['researcher_profile'] = researcher_profile
    except Profile.DoesNotExist:
        messages.warning(request, 'Please complete your profile.')
        return redirect('medconnect_app:home')
    return render(request, 'medconnect_app/dashboard.html', context)
