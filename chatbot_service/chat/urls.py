from django.urls import path
from .views import (
    ChatbotAPIView, 
    ChatbotHealthView, 
    ChatbotSystemInfoView,
    ConversationHistoryView,
    ClearConversationView,
    AppointmentStateView,
    CancelAppointmentBookingView,
    AppointmentBookingStatusView
)

urlpatterns = [
    path('respond/', ChatbotAPIView.as_view(), name='chatbot-respond'),
    path('health/', ChatbotHealthView.as_view(), name='chatbot-health'),
    path('info/', ChatbotSystemInfoView.as_view(), name='chatbot-info'),
    path('history/<str:session_id>/', ConversationHistoryView.as_view(), name='conversation-history'),
    path('clear/<str:session_id>/', ClearConversationView.as_view(), name='clear-conversation'),
    path('appointment/state/<str:session_id>/', AppointmentStateView.as_view(), name='appointment-state'),
    path('appointment/cancel/<str:session_id>/', CancelAppointmentBookingView.as_view(), name='cancel-appointment'),
    path('appointment/status/<str:session_id>/', AppointmentBookingStatusView.as_view(), name='appointment-status'),
]
