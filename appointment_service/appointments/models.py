from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta

class AppointmentSlot(models.Model):
    """Model để quản lý các khung giờ khám bệnh"""
    doctor_id = models.IntegerField()
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    max_appointments = models.IntegerField(default=1)  # Số lượng bệnh nhân tối đa có thể khám trong khung giờ này
    booked_count = models.IntegerField(default=0)  # Số lượng đã đặt
    
    class Meta:
        unique_together = ('doctor_id', 'date', 'start_time')
    
    def __str__(self):
        return f"Dr.{self.doctor_id} on {self.date} from {self.start_time} to {self.end_time}"
    
    @property
    def is_available(self):
        return self.booked_count < self.max_appointments
    
    @property
    def availability_status(self):
        """Trạng thái đặt lịch: 'AVAILABLE', 'LIMITED', 'FULL'"""
        ratio = self.booked_count / self.max_appointments
        if ratio >= 1:
            return 'FULL'
        elif ratio >= 0.7:
            return 'LIMITED'
        else:
            return 'AVAILABLE'


class Appointment(models.Model):
    """Model đặt lịch khám bệnh"""
    STATUS_CHOICES = [
        ('PENDING', 'Chờ xác nhận'),
        ('CONFIRMED', 'Đã xác nhận'),
        ('CANCELLED', 'Đã hủy'),
        ('COMPLETED', 'Đã hoàn thành'),
        ('RESCHEDULED', 'Đổi lịch'),
    ]
    
    PRIORITY_CHOICES = [
        (1, 'Thông thường'),
        (2, 'Ưu tiên'),
        (3, 'Khẩn cấp'),
    ]

    patient_id = models.IntegerField()
    doctor_id = models.IntegerField()
    scheduled_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)  # Thời gian kết thúc dự kiến
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField(blank=True)
    diagnosis = models.TextField(blank=True, null=True)  # Chẩn đoán sơ bộ
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=1)
    notes = models.TextField(blank=True)  # Ghi chú thêm
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Thông tin bổ sung
    patient_name = models.CharField(max_length=255, blank=True)  # Lưu cache tên bệnh nhân
    doctor_name = models.CharField(max_length=255, blank=True)   # Lưu cache tên bác sĩ
    department = models.CharField(max_length=100, blank=True)    # Khoa/phòng khám
    appointment_slot = models.ForeignKey(
        AppointmentSlot, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='appointments'
    )

    def __str__(self):
        return f"Appointment {self.id} - Patient {self.patient_id} with Doctor {self.doctor_id}"
    
    def save(self, *args, **kwargs):
        # Nếu không có end_time, mặc định thời gian khám là 30 phút
        if not self.end_time and self.scheduled_time:
            self.end_time = self.scheduled_time + timedelta(minutes=30)
        
        # Nếu là đặt lịch mới và có liên kết slot
        is_new = self.pk is None
        if is_new and self.appointment_slot:
            # Tăng số lượng đặt lịch trong slot
            self.appointment_slot.booked_count += 1
            self.appointment_slot.save()
        
        # Ensure scheduled_time is timezone-aware
        if self.scheduled_time and self.scheduled_time.tzinfo is None:
            self.scheduled_time = timezone.make_aware(self.scheduled_time, timezone.get_current_timezone())
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Khi xóa lịch, giảm số lượng đặt trong slot
        if self.appointment_slot:
            self.appointment_slot.booked_count = max(0, self.appointment_slot.booked_count - 1)
            self.appointment_slot.save()
        super().delete(*args, **kwargs)


class DoctorSchedule(models.Model):
    """Lịch làm việc của bác sĩ"""
    WEEKDAYS = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    doctor_id = models.IntegerField()
    weekday = models.IntegerField(choices=WEEKDAYS)  # 0 = Monday, 6 = Sunday
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    max_patients_per_hour = models.IntegerField(default=4)  # Số bệnh nhân tối đa mỗi giờ
    appointment_duration = models.IntegerField(default=30)  # Thời gian khám mỗi bệnh nhân (phút)
    
    class Meta:
        unique_together = ('doctor_id', 'weekday', 'start_time')
    
    def __str__(self):
        return f"Dr.{self.doctor_id} schedule on {self.get_weekday_display()} ({self.start_time}-{self.end_time})"