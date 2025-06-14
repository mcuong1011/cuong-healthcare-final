from rest_framework import serializers
from .models import Appointment, AppointmentSlot, DoctorSchedule
from django.utils import timezone
from datetime import datetime, timedelta
import pytz

class AppointmentSlotSerializer(serializers.ModelSerializer):
    availability_status = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = AppointmentSlot
        fields = '__all__'


class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('end_time', 'created_at', 'updated_at')
    
    def validate_scheduled_time(self, value):
        """
        Validate scheduled time and ensure it's timezone-aware
        """
        # Convert to timezone-aware datetime if it's naive
        if isinstance(value, str):
            # Parse string to datetime using Django's parser
            from django.utils.dateparse import parse_datetime
            parsed_value = parse_datetime(value.replace('Z', '+00:00'))
            if parsed_value is None:
                try:
                    # Fallback parsing
                    value = datetime.strptime(value.replace('Z', ''), '%Y-%m-%dT%H:%M:%S')
                except ValueError:
                    raise serializers.ValidationError("Invalid datetime format")
            else:
                value = parsed_value
        
        # Make timezone-aware if naive
        if value.tzinfo is None:
            value = timezone.make_aware(value, timezone.get_current_timezone())
        
        # Validate that appointment is in the future (using timezone-aware now)
        if value <= timezone.now():  # Changed from datetime.now() to timezone.now()
            raise serializers.ValidationError("Scheduled time must be in the future")
        
        return value
    
    def validate(self, data):
        """
        Kiểm tra xem lịch có thể đặt được không:
        1. Kiểm tra xem bác sĩ có lịch làm việc vào thời điểm đó không
        2. Kiểm tra số lượng lịch đã đặt không vượt quá giới hạn
        """
        doctor_id = data.get('doctor_id')
        scheduled_time = data.get('scheduled_time')
        
        # Nếu đây là partial update, lấy giá trị từ instance hiện tại nếu không có trong data
        if self.instance:
            if not doctor_id:
                doctor_id = self.instance.doctor_id
            if not scheduled_time:
                scheduled_time = self.instance.scheduled_time
        
        # Chỉ validate scheduled_time nếu nó được cung cấp (cho phép partial update)
        if not scheduled_time:
            # Chỉ yêu cầu scheduled_time khi tạo mới
            if not self.instance:
                raise serializers.ValidationError("Thời gian đặt lịch là bắt buộc")
            else:
                return data
        
        # Nếu chỉ update status, không cần validate time
        if self.instance and 'scheduled_time' not in data and 'doctor_id' not in data:
            return data
        
        # Ensure scheduled_time is timezone-aware
        if scheduled_time.tzinfo is None:
            scheduled_time = timezone.make_aware(scheduled_time, timezone.get_current_timezone())
            data['scheduled_time'] = scheduled_time
        
        # Kiểm tra xem thời gian có trong tương lai không (using timezone-aware comparison)
        if scheduled_time <= timezone.now():  # Changed from datetime.now() to timezone.now()
            raise serializers.ValidationError("Không thể đặt lịch trong quá khứ")
        
        # Làm tròn thời gian đến đơn vị 30 phút (để đồng nhất các slot)
        minute = scheduled_time.minute
        if minute % 15 != 0:  # Changed to 15 minutes for more flexibility
            raise serializers.ValidationError("Thời gian đặt lịch phải là các slot 15 phút (VD: 9:00, 9:15, 9:30, 9:45)")
        
        # Kiểm tra bác sĩ có lịch làm việc không 
        weekday = scheduled_time.weekday()  # 0 = Monday, 6 = Sunday
        time_only = scheduled_time.time()
        
        try:
            schedule = DoctorSchedule.objects.get(
                doctor_id=doctor_id,
                weekday=weekday,
                start_time__lte=time_only,
                end_time__gte=time_only,
                is_active=True
            )
        except DoctorSchedule.DoesNotExist:
            raise serializers.ValidationError(f"Bác sĩ không có lịch làm việc vào thời gian này")
        
        # Kiểm tra số lượng lịch đặt trong khung giờ đó
        date_only = scheduled_time.date()
        
        slot, created = AppointmentSlot.objects.get_or_create(
            doctor_id=doctor_id,
            date=date_only,
            start_time=time_only,
            defaults={
                'end_time': (datetime.combine(date_only, time_only) + timedelta(minutes=45)).time(),  # 45 minute slots
                'max_appointments': schedule.max_patients_per_hour // 1  # Adjust based on your needs
            }
        )
        
        if not slot.is_available:
            raise serializers.ValidationError("Khung giờ này đã đầy, vui lòng chọn thời gian khác")
        
        # Lưu slot để sử dụng trong create/update
        self.context['appointment_slot'] = slot
        
        return data
    
    def create(self, validated_data):
        # Ensure scheduled_time is timezone-aware
        scheduled_time = validated_data['scheduled_time']
        if scheduled_time.tzinfo is None:
            scheduled_time = timezone.make_aware(scheduled_time, timezone.get_current_timezone())
            validated_data['scheduled_time'] = scheduled_time
        
        # Create appointment
        appointment = Appointment(**validated_data)
        
        # Get appointment slot from context if available
        appointment_slot = self.context.get('appointment_slot')
        if appointment_slot:
            appointment.appointment_slot = appointment_slot
        
        # Thêm thông tin bổ sung từ các service khác nếu có
        try:
            appointment.patient_name = self.get_user_name(appointment.patient_id) or ""
            appointment.doctor_name = self.get_user_name(appointment.doctor_id) or ""
        except Exception as e:
            # Nếu không lấy được thì bỏ qua, đây chỉ là cache
            print(f"Warning: Could not fetch user names: {e}")
            pass
        
        appointment.save()
        
        # Update slot booking count if slot exists
        if appointment_slot:
            appointment_slot.booked_count += 1
            appointment_slot.save()
        
        return appointment
    
    def update(self, instance, validated_data):
        # Ensure scheduled_time is timezone-aware if being updated
        if 'scheduled_time' in validated_data:
            scheduled_time = validated_data['scheduled_time']
            if scheduled_time.tzinfo is None:
                scheduled_time = timezone.make_aware(scheduled_time, timezone.get_current_timezone())
                validated_data['scheduled_time'] = scheduled_time
        
        return super().update(instance, validated_data)
    
    def get_user_name(self, user_id):
        """Gọi API user service để lấy tên người dùng"""
        import requests
        from django.conf import settings
        
        try:
            # Use USER_SERVICE setting if available, otherwise fallback
            user_service_url = getattr(settings, 'USER_SERVICE', 'http://localhost:8001')
            response = requests.get(f"{user_service_url}/api/users/{user_id}/", timeout=2)
            if response.status_code == 200:
                data = response.json()
                return data.get('full_name') or f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
        except Exception as e:
            print(f"Warning: Could not fetch user {user_id}: {e}")
            pass
        return None


class DailyAvailabilitySerializer(serializers.Serializer):
    """Serializer cho thông tin trạng thái đặt lịch theo ngày"""
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=['VACANT', 'MODERATE', 'BUSY'])
    total_slots = serializers.IntegerField()
    available_slots = serializers.IntegerField()
    morning_status = serializers.ChoiceField(choices=['VACANT', 'MODERATE', 'BUSY'])
    afternoon_status = serializers.ChoiceField(choices=['VACANT', 'MODERATE', 'BUSY'])
    percent_booked = serializers.FloatField()