from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Profile, PatientProfile, ResearcherProfile

class PatientRegisterForm(UserCreationForm):
    date_of_birth = forms.DateField(widget=forms.DateInput(attrs={'type': 'date'}))
    gender = forms.CharField(max_length=20)
    cancer_type = forms.CharField(max_length=100)
    phone_number = forms.CharField(max_length=20)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

class ResearcherRegisterForm(UserCreationForm):
    title = forms.CharField(max_length=50)
    institution = forms.CharField(max_length=255)
    specialization = forms.CharField(max_length=100)
    phone_number = forms.CharField(max_length=20)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

class UserLoginForm(forms.Form):
    username_or_email = forms.CharField(
        max_length=150, 
        required=True,
        label='Username or Email',
        widget=forms.TextInput(attrs={'placeholder': 'Enter your username or email'})
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'placeholder': 'Enter your password'}), 
        required=True
    ) 