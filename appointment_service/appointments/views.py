# appointments/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .authentication import MicroserviceJWTAuthentication
from .models import Appointment, AppointmentSlot, DoctorSchedule
from .serializers import AppointmentSerializer, AppointmentSlotSerializer, DoctorScheduleSerializer, DailyAvailabilitySerializer
import jwt
from django.conf import settings
from django.db.models import Count, Q, Sum, F, FloatField
from django.db.models.functions import Cast
import datetime
import requests
from collections import defaultdict



def send_notification(user_id, message):
    import requests
    url = "http://notificationservice:8007/api/notify/send/"
    data = {
        "recipient_id": user_id,
        "message": message,
        "notification_type": "SYSTEM"
    }
    try:
        # không còn cần JWT
        requests.post(url, json=data)
    except Exception as e:
        print(f"⚠️ Không thể gửi notify: {e}")


class AppointmentCreateView(APIView):
    """
    POST /api/appointments/create/
    """
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            from django.utils import timezone as django_timezone
            from datetime import datetime
            import dateutil.parser  # Add this import for better datetime parsing
            
            print(f"🔍 AppointmentCreateView - Request data: {request.data}")
            print(f"🔍 AppointmentCreateView - User: {request.user}")
            print(f"🔍 AppointmentCreateView - User ID: {getattr(request.user, 'id', 'N/A')}")
            
            data = request.data.copy()
            
            # Debug timezone info
            print(f"🔍 Original scheduled_time: {data.get('scheduled_time')}")
            print(f"🔍 Current timezone: {django_timezone.get_current_timezone()}")
            print(f"🔍 Current time: {django_timezone.now()}")
            
            # Validate required fields
            required_fields = ['doctor_id', 'scheduled_time', 'reason']
            for field in required_fields:
                if field not in data:
                    return Response({
                        "error": f"Missing required field: {field}"
                    }, status=400)
            
            # Ensure patient_id is present (should come from gateway)
            if 'patient_id' not in data:
                return Response({"error": "Thiếu patient_id"}, status=400)

            # Process scheduled_time to ensure it's timezone-aware
            scheduled_time_str = data['scheduled_time']
            try:
                if isinstance(scheduled_time_str, str):
                    # Method 1: Using dateutil.parser (most robust)
                    try:
                        import dateutil.parser
                        scheduled_time = dateutil.parser.parse(scheduled_time_str)
                    except ImportError:
                        # Method 2: Manual parsing for common ISO formats
                        scheduled_time = self.parse_iso_datetime(scheduled_time_str)
                    
                    # Make timezone-aware if naive
                    if scheduled_time.tzinfo is None:
                        scheduled_time = django_timezone.make_aware(scheduled_time, django_timezone.get_current_timezone())
                    
                    data['scheduled_time'] = scheduled_time
                    print(f"🔍 Processed scheduled_time: {scheduled_time}")
            except (ValueError, TypeError) as e:
                return Response({"error": f"Invalid datetime format: {e}"}, status=400)

            serializer = AppointmentSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                appointment = serializer.save()
                
                print(f"✅ Appointment created successfully: {appointment.id}")
                
                # Gửi notify
                send_notification(
                    user_id=appointment.patient_id,
                    message=(
                        f"Lịch hẹn với bác sĩ {appointment.doctor_name or appointment.doctor_id} "
                        f"đã được đặt lúc {appointment.scheduled_time.strftime('%d/%m/%Y %H:%M')}"
                    )
                )
                
                return Response(AppointmentSerializer(appointment).data, status=201)
            else:
                print(f"❌ Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=400)
                
        except Exception as e:
            print(f"❌ Error in AppointmentCreateView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "error": f"Internal server error: {str(e)}"
            }, status=500)
    
    def parse_iso_datetime(self, datetime_str):
        """
        Parse ISO datetime string manually for Python < 3.7 compatibility
        """
        from datetime import datetime
        
        # Remove 'Z' and replace with '+00:00' for UTC
        if datetime_str.endswith('Z'):
            datetime_str = datetime_str[:-1] + '+00:00'
        
        # Handle different ISO formats
        formats = [
            '%Y-%m-%dT%H:%M:%S.%f%z',  # 2025-06-02T14:30:00.000000+00:00
            '%Y-%m-%dT%H:%M:%S%z',     # 2025-06-02T14:30:00+00:00
            '%Y-%m-%dT%H:%M:%S.%f',    # 2025-06-02T14:30:00.000000
            '%Y-%m-%dT%H:%M:%S',       # 2025-06-02T14:30:00
            '%Y-%m-%d %H:%M:%S',       # 2025-06-02 14:30:00
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(datetime_str, fmt)
            except ValueError:
                continue
        
        # If none of the formats work, try a more flexible approach
        try:
            # Handle timezone offset manually if present
            if '+' in datetime_str or datetime_str.count('-') > 2:
                # Split datetime and timezone parts
                if '+' in datetime_str:
                    dt_part, tz_part = datetime_str.rsplit('+', 1)
                    tz_part = '+' + tz_part
                else:
                    # Handle negative timezone
                    parts = datetime_str.split('-')
                    if len(parts) >= 4:  # YYYY-MM-DD has 3 parts, so 4+ means timezone
                        dt_part = '-'.join(parts[:-1])
                        tz_part = '-' + parts[-1]
                    else:
                        dt_part = datetime_str
                        tz_part = None
            else:
                dt_part = datetime_str
                tz_part = None
            
            # Parse the datetime part
            dt = datetime.strptime(dt_part, '%Y-%m-%dT%H:%M:%S')
            
            # Apply timezone if present
            if tz_part:
                from datetime import timezone, timedelta
                # Parse timezone offset like +07:00 or -05:00
                sign = 1 if tz_part.startswith('+') else -1
                tz_part = tz_part[1:]  # Remove sign
                hours, minutes = map(int, tz_part.split(':'))
                offset = timedelta(hours=hours, minutes=minutes) * sign
                dt = dt.replace(tzinfo=timezone(offset))
            
            return dt
            
        except Exception as e:
            raise ValueError(f"Unable to parse datetime: {datetime_str}") from e


class AppointmentListView(APIView):
    """
    GET /api/appointments/?role=PATIENT
    hoặc
    GET /api/appointments/?role=DOCTOR
    
    Header: Authorization: Bearer <your_token>
    """
    authentication_classes = [MicroserviceJWTAuthentication]  # Sử dụng custom auth
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_id = user.id
            
            print(f"🔍 Debug - Authenticated user_id: {user_id}")
            print(f"🔍 Debug - User role: {getattr(user, 'role', 'N/A')}")
            print(f"🔍 Debug - User email: {getattr(user, 'email', 'N/A')}")
            print(f"🔍 Debug - Request params: {request.query_params}")
            print(f"🔍 Debug - Auth header: {request.headers.get('Authorization', 'No auth header')}")
            
            # Lấy role từ query params hoặc từ user object
            role = request.query_params.get('role')
            if not role:
                # Fallback to user role from token
                role = getattr(user, 'role', 'PATIENT')
            
            print(f"🔍 Debug - Using role: {role}")
            
            # Lọc theo trạng thái nếu có
            status_filter = request.query_params.get('status')
            date_filter = request.query_params.get('date')
            
            # Base queryset
            qs = Appointment.objects.all()
            print(f"🔍 Debug - Total appointments in DB: {qs.count()}")
            
            # Lọc lịch hẹn dựa trên role và user_id từ token
            if role.upper() == 'PATIENT':
                qs = qs.filter(patient_id=user_id)
                print(f"🔍 Debug - Filtering by patient_id={user_id}")
            elif role.upper() == 'DOCTOR':
                qs = qs.filter(doctor_id=user_id)
                print(f"🔍 Debug - Filtering by doctor_id={user_id}")
            else:
                return Response(
                    {"error": "Role phải là PATIENT hoặc DOCTOR"},
                    status=400
                )
            
            print(f"🔍 Debug - After role filtering: {qs.count()}")
            
            # Lọc theo status nếu có
            if status_filter:
                qs = qs.filter(status=status_filter.upper())
                print(f"🔍 Debug - After status filtering: {qs.count()}")
            
            # Lọc theo ngày nếu có
            if date_filter:
                try:
                    date_obj = datetime.datetime.strptime(date_filter, '%Y-%m-%d').date()
                    qs = qs.filter(scheduled_time__date=date_obj)
                    print(f"🔍 Debug - After date filtering: {qs.count()}")
                except ValueError:
                    return Response({"error": "Định dạng ngày không hợp lệ (YYYY-MM-DD)"}, status=400)
            
            # Sắp xếp theo thời gian
            qs = qs.order_by('scheduled_time')
            
            print(f"🔍 Debug - Final queryset count: {qs.count()}")
            
            # Debug: In ra vài appointment đầu tiên
            for apt in qs[:3]:
                print(f"🔍 Debug - Appointment {apt.id}: patient_id={apt.patient_id}, doctor_id={apt.doctor_id}")
            
            serializer = AppointmentSerializer(qs, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error in AppointmentListView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Lỗi xử lý: {str(e)}"}, status=500)


class AppointmentDetailView(APIView):
    """
    GET    /api/appointments/<pk>/
    PUT    /api/appointments/<pk>/      (body có các field cần cập nhật)
    DELETE /api/appointments/<pk>/
    """
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk)
            return Response(AppointmentSerializer(appt).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Không tìm thấy lịch'}, status=404)

    def put(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Không tìm thấy lịch'}, status=404)

        # Nếu thay đổi slot thì giải phóng slot cũ
        old_slot = appt.appointment_slot
        
        serializer = AppointmentSerializer(appt, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            # Nếu đổi scheduled_time thì cần cập nhật slot
            if 'scheduled_time' in request.data and old_slot:
                # Giảm đếm slot cũ
                old_slot.booked_count = max(0, old_slot.booked_count - 1)
                old_slot.save()
            
            updated_appt = serializer.save()
            
            # Thông báo thay đổi lịch nếu cần
            if 'scheduled_time' in request.data or 'status' in request.data:
                message = f"Lịch hẹn của bạn đã được cập nhật: {updated_appt.status} vào {updated_appt.scheduled_time}"
                send_notification(user_id=updated_appt.patient_id, message=message)
                
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'error': 'Không tìm thấy lịch'}, status=404)

        # Lưu thông tin trước khi xóa để gửi thông báo
        patient_id = appt.patient_id
        scheduled_time = appt.scheduled_time
        
        appt.delete()
        
        # Thông báo hủy lịch
        message = f"Lịch hẹn của bạn vào lúc {scheduled_time.strftime('%d/%m/%Y %H:%M')} đã bị hủy"
        send_notification(user_id=patient_id, message=message)
        
        return Response({'message': 'Đã xóa lịch'}, status=204)
    

class DoctorScheduleView(APIView):
    """
    API quản lý lịch làm việc của bác sĩ
    
    GET /api/appointments/schedules/?doctor_id=123
    POST /api/appointments/schedules/
    """
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({"error": "Thiếu doctor_id"}, status=400)
        
        schedules = DoctorSchedule.objects.filter(doctor_id=doctor_id, is_active=True)
        serializer = DoctorScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = DoctorScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AvailableSlotsView(APIView):
    """
    API lấy các slot còn trống cho bác sĩ
    
    GET /api/appointments/available-slots/?doctor_id=123&date=2025-05-01
    """
    authentication_classes = [MicroserviceJWTAuthentication]  # Thêm dòng này
    permission_classes = [IsAuthenticated]  # Thêm dòng này
    
    def get(self, request):
        try:
            from django.utils import timezone as django_timezone
            from datetime import timedelta
            
            print(f"🔍 AvailableSlotsView - Request params: {dict(request.query_params)}")
            print(f"🔍 AvailableSlotsView - User: {request.user}")
            
            doctor_id = request.query_params.get('doctor_id')
            date_str = request.query_params.get('date')
            
            if not doctor_id:
                return Response({"error": "Thiếu doctor_id"}, status=400)
                
            if not date_str:
                date_obj = django_timezone.now().date()
            else:
                try:
                    date_obj = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    return Response({"error": "Định dạng ngày không hợp lệ (YYYY-MM-DD)"}, status=400)
            
            print(f"🔍 Looking for schedules for doctor_id: {doctor_id}, date: {date_obj}")
            
            # Lấy lịch làm việc của bác sĩ vào ngày đó
            weekday = date_obj.weekday()
            schedules = DoctorSchedule.objects.filter(
                doctor_id=doctor_id,
                weekday=weekday,
                is_active=True
            ).order_by('start_time')
            
            print(f"🔍 Found {schedules.count()} schedules for weekday {weekday}")
            
            if not schedules.exists():
                return Response({
                    "doctor_id": doctor_id,
                    "date": date_str or date_obj.strftime('%Y-%m-%d'),
                    "message": f"Bác sĩ không có lịch làm việc vào ngày {date_str}",
                    "slots": []
                })
            
            # Tạo các slot từ lịch làm việc
            all_slots = []
            current_tz = django_timezone.get_current_timezone()
            
            for schedule in schedules:
                print(f"🔍 Processing schedule: {schedule.start_time} - {schedule.end_time}")
                
                # Create timezone-aware datetime objects
                start_datetime = datetime.datetime.combine(date_obj, schedule.start_time)
                end_datetime = datetime.datetime.combine(date_obj, schedule.end_time)
                
                # Make timezone-aware
                start_datetime = django_timezone.make_aware(start_datetime, current_tz)
                end_datetime = django_timezone.make_aware(end_datetime, current_tz)
                
                duration = schedule.appointment_duration  # phút
                
                current = start_datetime
                while current + timedelta(minutes=duration) <= end_datetime:
                    slot_end = current + timedelta(minutes=duration)
                    
                    # Kiểm tra slot này có đặt được không
                    slot, created = AppointmentSlot.objects.get_or_create(
                        doctor_id=doctor_id,
                        date=date_obj,
                        start_time=current.time(),
                        defaults={
                            'end_time': slot_end.time(),
                            'max_appointments': max(1, schedule.max_patients_per_hour // (60 // duration))
                        }
                    )
                    
                    if created:
                        print(f"🔍 Created new slot: {current.time()} - {slot_end.time()}")
                    
                    all_slots.append({
                        'start_time': current.isoformat(),  # ISO format with timezone
                        'end_time': slot_end.isoformat(),   # ISO format with timezone
                        'is_available': slot.is_available,
                        'availability_status': slot.availability_status,
                        'booked_count': slot.booked_count,
                        'max_appointments': slot.max_appointments
                    })
                    
                    current += timedelta(minutes=duration)
            
            print(f"🔍 Generated {len(all_slots)} slots")
            
            return Response({
                "doctor_id": doctor_id,
                "date": date_str or date_obj.strftime('%Y-%m-%d'),
                "slots": all_slots
            })
            
        except Exception as e:
            print(f"❌ Error in AvailableSlotsView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "error": f"Internal server error: {str(e)}"
            }, status=500)


class DailyAvailabilityView(APIView):
    """
    API lấy thông tin trạng thái đặt lịch theo ngày (vắng, trung bình, đông)
    
    GET /api/appointments/daily-availability/?doctor_id=123&start_date=2025-05-01&end_date=2025-05-31
    """
    def get(self, request):
        doctor_id = request.query_params.get('doctor_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        # Mặc định là hiện tại + 30 ngày
        today = datetime.date.today()
        start_date = today
        end_date = today + datetime.timedelta(days=30)
        
        if start_date_str:
            try:
                start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Định dạng start_date không hợp lệ (YYYY-MM-DD)"}, status=400)
        
        if end_date_str:
            try:
                end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Định dạng end_date không hợp lệ (YYYY-MM-DD)"}, status=400)
        
        if (end_date - start_date).days > 60:
            return Response({"error": "Khoảng thời gian không được vượt quá 60 ngày"}, status=400)
        
        # Chuẩn bị query các lịch làm việc của bác sĩ
        doctor_schedules = {}
        for schedule in DoctorSchedule.objects.filter(doctor_id=doctor_id, is_active=True):
            if schedule.weekday not in doctor_schedules:
                doctor_schedules[schedule.weekday] = []
            doctor_schedules[schedule.weekday].append(schedule)
        
        # Lấy các slot đã đặt trong khoảng thời gian
        booked_slots = AppointmentSlot.objects.filter(
            doctor_id=doctor_id,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Tổ chức dữ liệu theo ngày
        slot_by_date = defaultdict(list)
        for slot in booked_slots:
            slot_by_date[slot.date].append(slot)
        
        # Tạo dữ liệu cho từng ngày
        result = []
        current = start_date
        while current <= end_date:
            weekday = current.weekday()
            
            # Kiểm tra xem bác sĩ có lịch làm việc không
            if weekday in doctor_schedules:
                schedules = doctor_schedules[weekday]
                
                # Tính toán tổng slot và slot còn trống
                total_slots = 0
                max_slots = 0
                morning_booked = 0
                morning_total = 0
                afternoon_booked = 0
                afternoon_total = 0
                
                for schedule in schedules:
                    start_time = datetime.datetime.combine(current, schedule.start_time)
                    end_time = datetime.datetime.combine(current, schedule.end_time)
                    duration = schedule.appointment_duration  # phút
                    slots_per_period = (end_time - start_time).seconds // 60 // duration
                    max_per_slot = schedule.max_patients_per_hour // (60 // duration)
                    
                    max_slots += slots_per_period * max_per_slot
                    
                    # Phân loại sáng/chiều
                    is_morning = schedule.start_time.hour < 12
                    if is_morning:
                        morning_total += slots_per_period * max_per_slot
                    else:
                        afternoon_total += slots_per_period * max_per_slot
                
                # Đếm slot đã đặt trong ngày
                booked_count = 0
                for slot in slot_by_date.get(current, []):
                    booked_count += slot.booked_count
                    
                    # Phân loại sáng/chiều
                    is_morning = slot.start_time.hour < 12
                    if is_morning:
                        morning_booked += slot.booked_count
                    else:
                        afternoon_booked += slot.booked_count
                
                # Tính trạng thái
                status = 'VACANT'
                percent = 0
                if max_slots > 0:
                    percent = booked_count / max_slots * 100
                    if percent >= 70:
                        status = 'BUSY'
                    elif percent >= 30:
                        status = 'MODERATE'
                
                # Trạng thái buổi sáng
                morning_status = 'VACANT'
                if morning_total > 0:
                    morning_percent = morning_booked / morning_total * 100
                    if morning_percent >= 70:
                        morning_status = 'BUSY'
                    elif morning_percent >= 30:
                        morning_status = 'MODERATE'
                
                # Trạng thái buổi chiều
                afternoon_status = 'VACANT'
                if afternoon_total > 0:
                    afternoon_percent = afternoon_booked / afternoon_total * 100
                    if afternoon_percent >= 70:
                        afternoon_status = 'BUSY'
                    elif afternoon_percent >= 30:
                        afternoon_status = 'MODERATE'
                
                result.append({
                    'date': current,
                    'status': status,
                    'total_slots': max_slots,
                    'available_slots': max_slots - booked_count,
                    'morning_status': morning_status,
                    'afternoon_status': afternoon_status,
                    'percent_booked': round(percent, 1)
                })
            
            current += datetime.timedelta(days=1)
        
        return Response({
            'doctor_id': doctor_id,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'availability': result
        })


class PatientAppointmentCalendarView(APIView):
    """
    API lấy lịch hẹn của patient theo tháng
    GET /api/appointments/patient-calendar/?year=2025&month=5
    """
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get_doctor_names(self, doctor_ids):
        """
        Gọi user service để lấy tên bác sĩ
        """
        doctor_names = {}
        
        if not doctor_ids:
            return doctor_names
            
        try:
            import requests
            
            # Gọi user service để lấy thông tin nhiều bác sĩ cùng lúc
            try:
                # Thử gọi endpoint để lấy nhiều users cùng lúc
                params = {'ids': ','.join(map(str, doctor_ids)), 'role': 'DOCTOR'}
                response = requests.get(
                    'http://user_service:8000/api/users/',
                    params=params,
                    timeout=10
                )
                
                if response.status_code == 200:
                    users_data = response.json()
                    
                    # Nếu response là dict với key 'results'
                    if isinstance(users_data, dict) and 'results' in users_data:
                        users_list = users_data['results']
                    elif isinstance(users_data, list):
                        users_list = users_data
                    else:
                        users_list = []
                    
                    for user_data in users_list:
                        user_id = user_data.get('id')
                        first_name = user_data.get('first_name', '')
                        last_name = user_data.get('last_name', '')
                        
                        if first_name or last_name:
                            full_name = f"{first_name} {last_name}".strip()
                            doctor_names[user_id] = full_name
                        else:
                            doctor_names[user_id] = user_data.get('username', f"Bác sĩ {user_id}")
                    
                    print(f"✅ Successfully fetched {len(doctor_names)} doctor names")
                    
                else:
                    print(f"⚠️ Failed to get doctors info: {response.status_code}")
                    raise Exception("Batch request failed")
                    
            except Exception as batch_error:
                print(f"⚠️ Batch request failed: {batch_error}, trying individual requests...")
                
                # Fallback: gọi từng bác sĩ riêng lẻ
                for doctor_id in doctor_ids:
                    try:
                        response = requests.get(
                            f'http://user_service:8000/api/users/{doctor_id}/',
                            timeout=5
                        )
                        
                        if response.status_code == 200:
                            user_data = response.json()
                            first_name = user_data.get('first_name', '')
                            last_name = user_data.get('last_name', '')
                            
                            if first_name or last_name:
                                full_name = f"{first_name} {last_name}".strip()
                                doctor_names[doctor_id] = full_name
                            else:
                                doctor_names[doctor_id] = user_data.get('username', f"Bác sĩ {doctor_id}")
                        else:
                            print(f"⚠️ Failed to get doctor {doctor_id} info: {response.status_code}")
                            doctor_names[doctor_id] = f"Bác sĩ {doctor_id}"
                            
                    except requests.exceptions.RequestException as e:
                        print(f"⚠️ Error calling user service for doctor {doctor_id}: {e}")
                        doctor_names[doctor_id] = f"Bác sĩ {doctor_id}"
                        
        except Exception as e:
            print(f"⚠️ Error in get_doctor_names: {e}")
            # Fallback: use doctor IDs
            for doctor_id in doctor_ids:
                doctor_names[doctor_id] = f"Bác sĩ {doctor_id}"
        
        # Đảm bảo tất cả doctor_ids đều có tên
        for doctor_id in doctor_ids:
            if doctor_id not in doctor_names:
                doctor_names[doctor_id] = f"Bác sĩ {doctor_id}"
        
        return doctor_names
    
    def get(self, request):
        try:
            from django.utils import timezone as django_timezone
            from datetime import datetime, timedelta
            from calendar import monthrange
            
            # Get parameters
            year = int(request.query_params.get('year', django_timezone.now().year))
            month = int(request.query_params.get('month', django_timezone.now().month))
            patient_id = request.user.id
            
            print(f"🔍 PatientAppointmentCalendarView - patient_id: {patient_id}, year: {year}, month: {month}")
            
            # Get start and end of month
            first_day = datetime(year, month, 1)
            last_day_of_month = monthrange(year, month)[1]
            last_day = datetime(year, month, last_day_of_month)
            
            # Make timezone-aware
            first_day = django_timezone.make_aware(first_day, django_timezone.get_current_timezone())
            last_day = django_timezone.make_aware(last_day, django_timezone.get_current_timezone())
            last_day = last_day.replace(hour=23, minute=59, second=59)
            
            # Get appointments for the month
            appointments = Appointment.objects.filter(
                patient_id=patient_id,
                scheduled_time__gte=first_day,
                scheduled_time__lte=last_day
            ).order_by('scheduled_time')
            
            print(f"🔍 Found {appointments.count()} appointments for patient {patient_id}")
            
            # Group appointments by date
            calendar_data = {}
            
            # Get unique doctor IDs to fetch their names
            doctor_ids = list(set([appt.doctor_id for appt in appointments]))
            doctor_names = self.get_doctor_names(doctor_ids)
            
            for appointment in appointments:
                date_str = appointment.scheduled_time.strftime('%Y-%m-%d')
                
                if date_str not in calendar_data:
                    calendar_data[date_str] = {
                        'date': date_str,
                        'appointments': [],
                        'count': 0
                    }
                
                # Get doctor name from user service
                doctor_name = doctor_names.get(appointment.doctor_id, f"Doctor {appointment.doctor_id}")
                
                calendar_data[date_str]['appointments'].append({
                    'id': appointment.id,
                    'time': appointment.scheduled_time.strftime('%H:%M'),
                    'doctor_id': appointment.doctor_id,
                    'doctor_name': doctor_name,
                    'reason': appointment.reason,
                    'status': appointment.status,
                    'priority': appointment.priority
                })
                calendar_data[date_str]['count'] += 1
            
            # Convert to list format
            calendar_list = list(calendar_data.values())
            
            return Response({
                'year': year,
                'month': month,
                'patient_id': patient_id,
                'calendar_data': calendar_list,
                'total_appointments': appointments.count()
            })
            
        except Exception as e:
            print(f"❌ Error in PatientAppointmentCalendarView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                "error": f"Internal server error: {str(e)}"
            }, status=500)


class DoctorStatsView(APIView):
    """Get statistics for doctor dashboard"""
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, doctor_id):
        try:
            from datetime import date, datetime, timedelta
            from django.utils import timezone
            
            today = date.today()
            
            # Get today's appointments
            todays_appointments = Appointment.objects.filter(
                doctor_id=doctor_id,
                scheduled_time__date=today
            ).count()
            
            # Get total unique patients
            total_patients = Appointment.objects.filter(
                doctor_id=doctor_id
            ).values('patient_id').distinct().count()
            
            # Get completed vs total appointments for success rate
            completed_appointments = Appointment.objects.filter(
                doctor_id=doctor_id,
                status='COMPLETED'
            ).count()
            
            total_appointments = Appointment.objects.filter(
                doctor_id=doctor_id
            ).count()
            
            success_rate = (completed_appointments / total_appointments * 100) if total_appointments > 0 else 0
            
            # Get pending appointments (could be considered as "pending reports")
            pending_reports = Appointment.objects.filter(
                doctor_id=doctor_id,
                status__in=['PENDING', 'CONFIRMED']
            ).count()
            
            return Response({
                'total_patients': total_patients,
                'todays_appointments': todays_appointments,
                'pending_reports': pending_reports,
                'success_rate': round(success_rate, 1),
                'completed_appointments': completed_appointments,
                'total_appointments': total_appointments
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)


class PatientStatsView(APIView):
    """Get statistics for patient dashboard"""
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, patient_id):
        try:
            from datetime import date, datetime, timedelta
            from django.utils import timezone
            
            now = timezone.now()
            
            # Get upcoming appointments
            upcoming_appointments = Appointment.objects.filter(
                patient_id=patient_id,
                scheduled_time__gte=now,
                status__in=['PENDING', 'CONFIRMED']
            ).count()
            
            # Get completed appointments
            completed_appointments = Appointment.objects.filter(
                patient_id=patient_id,
                status='COMPLETED'
            ).count()
            
            return Response({
                'upcoming_appointments': upcoming_appointments,
                'completed_appointments': completed_appointments,
                'total_appointments': upcoming_appointments + completed_appointments
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)


class RecentAppointmentsView(APIView):
    """Get recent appointments for dashboard"""
    authentication_classes = [MicroserviceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_type, user_id):
        try:
            limit = int(request.GET.get('limit', 5))
            
            if user_type == 'doctor':
                appointments = Appointment.objects.filter(
                    doctor_id=user_id
                ).order_by('-created_at')[:limit]
            elif user_type == 'patient':
                appointments = Appointment.objects.filter(
                    patient_id=user_id
                ).order_by('-created_at')[:limit]
            else:
                return Response({'error': 'Invalid user type'}, status=400)
            
            serializer = AppointmentSerializer(appointments, many=True)
            return Response({
                'appointments': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=500)