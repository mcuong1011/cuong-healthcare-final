from django.urls import path
from .views import *

urlpatterns = [
    path('claims/', ListClaimView.as_view()),
    path('claims/create/', CreateClaimView.as_view()),
    path('claims/<int:pk>/update/', UpdateClaimStatusView.as_view()),
]
