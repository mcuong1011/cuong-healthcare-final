from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('me/', ProfileView.as_view()),
    path('me/upload-avatar/', AvatarUploadView.as_view()),
    path('dashboard-stats/', DashboardStatsView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    path('all/', UserListView.as_view()),  # chỉ Admin dùng
    path('delete/', DeleteAccountView.as_view()),
    path('doctors/create/', DoctorCreateView.as_view(), name='doctor-create'),
    path('doctors/', DoctorListView.as_view(), name='doctor-list'),
    # API endpoints for microservices
    path('doctors/list/', DoctorListAPIView.as_view(), name='doctors-api'),
    path('patients/list/', PatientListAPIView.as_view(), name='patients-api'),
]
