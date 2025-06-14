import requests
import jwt
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from urllib.parse import urlparse


def forward_request(method, url, data=None, headers=None, params=None):

    headers = headers or {}
    parsed_url = urlparse(url)
    host = parsed_url.hostname  # Chỉ lấy phần 'user_service', không có ':8001'

    # ✅ Gán lại Host chính xác để không bị lỗi DisallowedHost
    headers['Host'] = host

    try:
        response = requests.request(
            method=method,
            url=url,
            json=data,
            headers=headers,
            params=params,
            timeout=10
        )
        return Response(response.json(), status=response.status_code)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return Response({"error": str(e)}, status=500)


# ---- USER SERVICE ----

class ProxyRegister(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.USER_SERVICE}/api/users/register/", data=request.data)

class ProxyLogin(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.USER_SERVICE}/api/users/login/", data=request.data)

class ProxyUserMe(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.USER_SERVICE}/api/users/me/", headers={'Authorization': request.headers.get('Authorization')})

    def put(self, request):
        return forward_request('PUT', f"{settings.USER_SERVICE}/api/users/me/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})

    def delete(self, request):
        return forward_request('DELETE', f"{settings.USER_SERVICE}/api/users/delete/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyUserAvatar(APIView):
    def post(self, request):
        """Proxy avatar upload to user service"""
        import requests
        from django.http import FileResponse
        
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return Response({'error': 'Authorization header required'}, status=401)
            
        # Prepare the file upload
        files = {}
        if 'avatar' in request.FILES:
            avatar_file = request.FILES['avatar']
            files['avatar'] = (avatar_file.name, avatar_file.read(), avatar_file.content_type)
        
        try:
            response = requests.post(
                f"{settings.USER_SERVICE}/api/users/me/upload-avatar/",
                files=files,
                headers={'Authorization': auth_header},
                timeout=30
            )
            return Response(response.json(), status=response.status_code)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ProxyUserList(APIView):
    def get(self, request):
        return forward_request(
            'GET',
            f"{settings.USER_SERVICE}/api/users/all/",
            headers={'Authorization': request.headers.get('Authorization')}
        )

class ProxyUserDoctors(APIView):
    def get(self, request):
        return forward_request(
            'GET',
            f"{settings.USER_SERVICE}/api/users/doctors/",
            headers={'Authorization': request.headers.get('Authorization')}
        )

# ---- APPOINTMENT SERVICE ----

class ProxyAppointmentCreate(APIView):
    """
    POST /api/appointments/create/
    Body cần bao gồm field patient_id, doctor_id, scheduled_time, reason
    """
    def post(self, request):
        # 1. Lấy token
        auth = request.headers.get('Authorization','')
        if not auth.startswith('Bearer '):
            return Response({'error':'Missing Bearer token'}, status=401)
        token = auth.split(' ',1)[1]

        # 2. Decode JWT
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            patient_id = payload.get('user_id')
        except jwt.PyJWTError as e:
            return Response({'error':'Invalid token','detail':str(e)}, status=401)

        # 3. Chuẩn bị body mới
        body = request.data.copy()
        body['patient_id'] = patient_id

        # 4. Forward với Authorization header
        return forward_request(
            'POST',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/create/",
            data=body,
            headers={'Authorization': auth}  # Thêm Authorization header
        )

class ProxyAppointmentList(APIView):
    """
    GET /api/appointments/?role=PATIENT (hoặc DOCTOR)
    Headers: Authorization Bearer <token>
    """
    def get(self, request):
        auth = request.headers.get('Authorization','')
        if not auth.startswith('Bearer '):
            return Response({'error':'Missing Bearer token'}, status=401)
        token = auth.split(' ',1)[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            role = payload.get('role','PATIENT')  # nếu payload không có role
        except jwt.PyJWTError as e:
            return Response({'error':'Invalid token','detail':str(e)}, status=401)

        # Forward ALL query params from the original request, and add/override role if needed
        params = dict(request.query_params)
        if 'role' not in params:
            params['role'] = role
            
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/",
            params=params,
            headers={'Authorization': auth}  # Forward Authorization header
        )

class ProxyAppointmentDetail(APIView):
    def get(self, request, pk):
        auth_header = request.headers.get('Authorization', '')
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/{pk}/",
            headers={'Authorization': auth_header} if auth_header else {}
        )

    def put(self, request, pk):
        auth = request.headers.get('Authorization','')
        if not auth.startswith('Bearer '):
            return Response({'error':'Missing Bearer token'}, status=401)
        token = auth.split(' ',1)[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.PyJWTError as e:
            return Response({'error':'Invalid token','detail':str(e)}, status=401)

        return forward_request(
            'PUT',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/{pk}/",
            data=request.data,
            headers={'Authorization': auth}
        )

    def delete(self, request, pk):
        auth = request.headers.get('Authorization','')
        if not auth.startswith('Bearer '):
            return Response({'error':'Missing Bearer token'}, status=401)
        token = auth.split(' ',1)[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.PyJWTError as e:
            return Response({'error':'Invalid token','detail':str(e)}, status=401)

        return forward_request(
            'DELETE',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/{pk}/",
            headers={'Authorization': auth}
        )


class ProxyDoctorSchedule(APIView):
    """
    Proxy cho Doctor Schedule API
    GET /api/appointments/schedules/?doctor_id=123
    POST /api/appointments/schedules/
    """
    def get(self, request):
        auth_header = request.headers.get('Authorization', '')
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/schedules/",
            params=request.query_params,
            headers={'Authorization': auth_header} if auth_header else {}
        )
    
    def post(self, request):
        auth = request.headers.get('Authorization','')
        if not auth.startswith('Bearer '):
            return Response({'error':'Missing Bearer token'}, status=401)
        
        return forward_request(
            'POST',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/schedules/",
            data=request.data,
            headers={'Authorization': auth}
        )


class ProxyAvailableSlots(APIView):
    """
    Proxy cho Available Slots API
    GET /api/appointments/available-slots/?doctor_id=123&date=2025-05-01
    """
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({"error": "Thiếu doctor_id"}, status=400)
        
        # Forward Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/available-slots/",
            params=request.query_params,
            headers={'Authorization': auth_header} if auth_header else {}
        )


class ProxyDailyAvailability(APIView):
    """
    Proxy cho Daily Availability API
    GET /api/appointments/daily-availability/?doctor_id=123&start_date=2025-05-01&end_date=2025-05-31
    """
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({"error": "Thiếu doctor_id"}, status=400)
        
        auth_header = request.headers.get('Authorization', '')
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/daily-availability/",
            params=request.query_params,
            headers={'Authorization': auth_header} if auth_header else {}
        )


class ProxyCalendarDensity(APIView):
    """
    Proxy cho Calendar Density API
    GET /api/appointments/calendar-density/?doctor_id=123&year=2025&month=5
    """
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({"error": "Thiếu doctor_id"}, status=400)
        
        auth_header = request.headers.get('Authorization', '')
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/calendar-density/",
            params=request.query_params,
            headers={'Authorization': auth_header} if auth_header else {}
        )


class ProxyDepartmentList(APIView):
    """
    Proxy cho Department List API
    GET /api/appointments/departments/
    """
    def get(self, request):
        auth_header = request.headers.get('Authorization', '')
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/departments/",
            headers={'Authorization': auth_header} if auth_header else {}
        )


class ProxyTokenDebug(APIView):
    """
    Proxy cho Token Debug API (chỉ dùng trong development)
    GET /api/appointments/token-debug/
    """
    def get(self, request):
        auth = request.headers.get('Authorization','')
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/token-debug/",
            headers={'Authorization': auth} if auth else {}
        )


class ProxyInternalAppointmentList(APIView):
    """
    Proxy cho Internal Appointment List API (không cần xác thực)
    GET /api/appointments/internal/?user_id=123&role=PATIENT
    """
    def get(self, request):
        user_id = request.query_params.get('user_id')
        role = request.query_params.get('role')
        
        if not user_id or not role:
            return Response({"error": "Phải cung cấp user_id và role"}, status=400)
        
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/internal/",
            params=request.query_params
        )

# ---- CLINICAL SERVICE ----

class ProxyMedicalRecordCreate(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.CLINICAL_SERVICE}/api/records/create/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})

class ProxyMedicalRecordList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.CLINICAL_SERVICE}/api/records/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyVitalSignCreate(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.CLINICAL_SERVICE}/api/records/vitals/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})


# ---- PHARMACY SERVICE ----
class ProxyPharmacyPrescriptionCreate(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.PHARMACY_SERVICE}/api/pharmacy/prescriptions/create/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})

class ProxyPharmacyPrescriptionList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.PHARMACY_SERVICE}/api/pharmacy/prescriptions/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyPharmacyPrescriptionDispense(APIView):
    def post(self, request, pk):
        return forward_request('POST', f"{settings.PHARMACY_SERVICE}/api/pharmacy/prescriptions/{pk}/dispense/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyPharmacyInventoryView(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.PHARMACY_SERVICE}/api/pharmacy/inventory/", headers={'Authorization': request.headers.get('Authorization')})
    

# ---- LAB SERVICE ----
class ProxyLabTestList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.LAB_SERVICE}/api/lab/tests/")

class ProxyLabOrderList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.LAB_SERVICE}/api/lab/orders/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyLabOrderCreate(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.LAB_SERVICE}/api/lab/orders/create/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})

class ProxyLabResultList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.LAB_SERVICE}/api/lab/results/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyLabResultCreate(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.LAB_SERVICE}/api/lab/results/create/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})


# ---- INSURANCE SERVICE ----
class ProxyClaimCreate(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.INSURANCE_SERVICE}/api/insurance/claims/create/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})

class ProxyClaimList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.INSURANCE_SERVICE}/api/insurance/claims/", headers={'Authorization': request.headers.get('Authorization')})

class ProxyClaimUpdate(APIView):
    def put(self, request, pk):
        return forward_request('PUT', f"{settings.INSURANCE_SERVICE}/api/insurance/claims/{pk}/update/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})



# ---- NOTIFICATION SERVICE ----
class ProxyNotifySend(APIView):
    def post(self, request):
        return forward_request('POST', f"{settings.NOTIFICATION_SERVICE}/api/notify/send/", data=request.data, headers={'Authorization': request.headers.get('Authorization')})

class ProxyNotifyList(APIView):
    def get(self, request):
        return forward_request('GET', f"{settings.NOTIFICATION_SERVICE}/api/notify/", headers={'Authorization': request.headers.get('Authorization')})


# ---- VIRTUAL ROBOT SERVICE ----
class ProxyVRDiagnose(APIView):
    """
    Proxy POST /api/vr/diagnose/ tới VirtualRobot Service
    """
    def post(self, request):
        return forward_request(
            'POST',
            f"{settings.VIRTUALROBOT_SERVICE}/api/vr/diagnose/",
            data=request.data
        )
    


class ProxyChatbotRespond(APIView):
    def post(self, request):
        return forward_request(
            'POST',
            f"{settings.CHATBOT_SERVICE}/api/chatbot/respond/",
            data=request.data,
        )


class ProxyPatientCalendar(APIView):
    """
    Proxy cho Patient Calendar API
    GET /api/appointments/patient-calendar/?year=2025&month=5
    """
    def get(self, request):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            return Response({'error': 'Authorization required'}, status=401)
        
        return forward_request(
            'GET',
            f"{settings.APPOINTMENT_SERVICE}/api/appointments/patient-calendar/",
            params=request.query_params,
            headers={'Authorization': auth_header}
        )
