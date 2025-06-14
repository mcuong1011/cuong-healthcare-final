from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.utils import timezone


class User(AbstractUser):
    # Extend base AbstractUser with additional fields
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    ROLE_CHOICES = [
        ('PATIENT', 'Patient'),
        ('DOCTOR', 'Doctor'),
        ('NURSE', 'Nurse'),
        ('PHARMACIST', 'Pharmacist'),
        ('ADMIN', 'Admin'),
    ]

    # Core fields
    email = models.EmailField(_('email address'), unique=True)
    phone_validator = RegexValidator(
        r'^\+?1?\d{9,15}$',
        _('Enter a valid international phone number.')
    )
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=17,
        blank=True,
        help_text=_('Phone number in E.164 format, e.g. +14155552671')
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)

    # Avatar image
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text=_('Profile avatar image')
    )

    # Role and verification
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_verified = models.BooleanField(default=False)

    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        """Return the full name as a property combining first_name and last_name"""
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.username} ({self.role})"


# Abstract base for profile details
class BaseProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PatientProfile(BaseProfile):
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    blood_type = models.CharField(
        max_length=3,
        blank=True,
        help_text="e.g. A+, O-, etc."
    )
    emergency_contact = models.CharField(max_length=100, blank=True)
    insurance_provider = models.CharField(max_length=100, blank=True)
    insurance_code = models.CharField(max_length=30, blank=True)
    insurance_number = models.CharField(max_length=50, blank=True, help_text="Insurance policy number")
    
    # Additional medical fields
    allergies = models.TextField(blank=True, help_text="Known allergies")
    medical_conditions = models.TextField(blank=True, help_text="Current medical conditions")

    def __str__(self):
        return f"PatientProfile: {self.user.username}"


class DoctorProfile(BaseProfile):
    specialty = models.CharField(max_length=100)
    bio = models.TextField(
        blank=True,
        help_text="Short biography or qualifications"
    )
    years_experience = models.PositiveIntegerField(default=0)
    practice_certificate = models.CharField(max_length=50, blank=True)
    clinic_address = models.TextField(blank=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} ({self.specialty})"


class NurseProfile(BaseProfile):
    department = models.CharField(max_length=100)
    shift = models.CharField(
        max_length=20,
        help_text="e.g. Day, Night, Rotational"
    )

    def __str__(self):
        return f"Nurse {self.user.get_full_name()} ({self.department})"


class PharmacistProfile(BaseProfile):
    pharmacy_name = models.CharField(max_length=200)
    license_number = models.CharField(max_length=50)
    working_hours = models.CharField(
        max_length=100,
        help_text="e.g. Mon-Fri 9am-5pm"
    )

    def __str__(self):
        return f"Pharmacist {self.user.get_full_name()} at {self.pharmacy_name}"


class AdminProfile(BaseProfile):
    admin_code = models.CharField(max_length=30)
    department = models.CharField(max_length=100, blank=True)
    full_control = models.BooleanField(default=False)

    def __str__(self):
        return f"Admin {self.user.get_full_name()}"
