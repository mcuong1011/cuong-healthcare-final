from django.urls import path
from .views import *

urlpatterns = [
    path('', ListMedicalRecordsView.as_view()),
    path('create/', CreateMedicalRecordView.as_view()),
    path('vitals/', AddVitalSignView.as_view()),
]
