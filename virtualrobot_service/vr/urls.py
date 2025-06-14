from django.urls import path
from .views import DiagnoseView

urlpatterns = [
    path('diagnose/', DiagnoseView.as_view()),
]
