from django.urls import path
from .views import *

urlpatterns = [
    path('', AppointmentListView.as_view()),
    path('create/', AppointmentCreateView.as_view()),
    path('<int:pk>/', AppointmentDetailView.as_view()),
    path('schedules/', DoctorScheduleView.as_view()),
    path('available-slots/', AvailableSlotsView.as_view()),
    path('daily-availability/', DailyAvailabilityView.as_view()),
    path('patient-calendar/', PatientAppointmentCalendarView.as_view()),
    # Dashboard statistics endpoints
    path('stats/doctor/<int:doctor_id>/', DoctorStatsView.as_view(), name='doctor-stats'),
    path('stats/patient/<int:patient_id>/', PatientStatsView.as_view(), name='patient-stats'),
    path('recent/<str:user_type>/<int:user_id>/', RecentAppointmentsView.as_view(), name='recent-appointments'),
]
