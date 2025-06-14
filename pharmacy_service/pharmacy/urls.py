from django.urls import path
from .views import *

urlpatterns = [
    path('prescriptions/', PrescriptionListView.as_view()),
    path('prescriptions/create/', PrescriptionCreateView.as_view()),
    path('prescriptions/<int:pk>/dispense/', DispensePrescriptionView.as_view()),
    path('inventory/', InventoryListCreateView.as_view()),
]
