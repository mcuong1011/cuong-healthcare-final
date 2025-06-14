from django.urls import path
from .views import *

urlpatterns = [
    path('send/', SendNotificationView.as_view()),
    path('', ListNotificationsView.as_view()),
]
