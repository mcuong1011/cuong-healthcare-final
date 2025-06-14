from django.urls import path
from .views import *
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


urlpatterns = [
    
    # User
    path('users/register/', ProxyRegister.as_view()),
    path('users/login/', ProxyLogin.as_view()),
    path('users/me/', ProxyUserMe.as_view()),
    path('users/me/upload-avatar/', ProxyUserAvatar.as_view()),
    path('users/all/', ProxyUserList.as_view()),
    path('doctors/', ProxyUserDoctors.as_view()),

    
    # Appointment
    path('appointments/create/', ProxyAppointmentCreate.as_view()),
    path('appointments/', ProxyAppointmentList.as_view()),
    path('appointments/<int:pk>/', ProxyAppointmentDetail.as_view()),
    path('appointments/schedules/', ProxyDoctorSchedule.as_view()),
    path('appointments/available-slots/', ProxyAvailableSlots.as_view()),
    path('appointments/daily-availability/', ProxyDailyAvailability.as_view()),
    path('appointments/calendar-density/', ProxyCalendarDensity.as_view()),
    path('appointments/departments/', ProxyDepartmentList.as_view()),
    path('appointments/token-debug/', ProxyTokenDebug.as_view()),
    path('appointments/internal/', ProxyInternalAppointmentList.as_view()),
    path('appointments/patient-calendar/', ProxyPatientCalendar.as_view()),  # Thêm dòng này

    # Clinical
    path('records/', ProxyMedicalRecordList.as_view()),
    path('records/create/', ProxyMedicalRecordCreate.as_view()),
    path('records/vitals/', ProxyVitalSignCreate.as_view()),

    # Pharmacy
    path('pharmacy/prescriptions/', ProxyPharmacyPrescriptionList.as_view()),
    path('pharmacy/prescriptions/create/', ProxyPharmacyPrescriptionCreate.as_view()),
    path('pharmacy/prescriptions/<int:pk>/dispense/', ProxyPharmacyPrescriptionDispense.as_view()),
    path('pharmacy/inventory/', ProxyPharmacyInventoryView.as_view()),


    # Lab
    path('lab/tests/', ProxyLabTestList.as_view()),
    path('lab/orders/', ProxyLabOrderList.as_view()),
    path('lab/orders/create/', ProxyLabOrderCreate.as_view()),
    path('lab/results/', ProxyLabResultList.as_view()),
    path('lab/results/create/', ProxyLabResultCreate.as_view()),


    # Insurance
    path('insurance/claims/', ProxyClaimList.as_view()),
    path('insurance/claims/create/', ProxyClaimCreate.as_view()),
    path('insurance/claims/<int:pk>/update/', ProxyClaimUpdate.as_view()),


    # Notification
    path('notify/send/', ProxyNotifySend.as_view()),
    path('notify/', ProxyNotifyList.as_view()),



    path('vr/diagnose/', ProxyVRDiagnose.as_view()),

    path('chatbot/respond/', ProxyChatbotRespond.as_view()),


]



