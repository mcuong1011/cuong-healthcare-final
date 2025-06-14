from django.core.management.base import BaseCommand
from django.db import models
from appointments.models import DoctorSchedule, AppointmentSlot, Appointment
import requests
import json
from datetime import datetime, timedelta, time, date
import random
from django.utils import timezone


class Command(BaseCommand):
    help = 'Tạo lịch làm việc cho bác sĩ và dữ liệu mẫu lịch khám'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Số ngày tạo lịch từ hôm nay'
        )
        parser.add_argument(
            '--appointments',
            type=int,
            default=100,
            help='Số lượng lịch khám mẫu'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Xóa tất cả dữ liệu lịch cũ'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('🗑️  Xóa dữ liệu lịch cũ...')
            Appointment.objects.all().delete()
            AppointmentSlot.objects.all().delete()
            DoctorSchedule.objects.all().delete()

        # Lấy danh sách bác sĩ từ user service
        doctors = self.get_doctors_from_user_service()
        
        if not doctors:
            self.stdout.write(
                self.style.ERROR('❌ Không tìm thấy bác sĩ nào. Vui lòng chạy create_sample_users trước.')
            )
            return

        # Tạo lịch làm việc cho bác sĩ
        self.create_doctor_schedules(doctors)
        
        # Tạo appointment slots
        self.create_appointment_slots(doctors, options['days'])
        
        # Tạo lịch khám mẫu
        self.create_sample_appointments(options['appointments'])
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Tạo thành công lịch làm việc cho {len(doctors)} bác sĩ và {options["appointments"]} lịch khám mẫu'
            )
        )

    def get_doctors_from_user_service(self):
        """Lấy danh sách bác sĩ từ user service"""
        try:
            # Thử kết nối đến user service
            response = requests.get(
                'http://localhost:8001/api/users/doctors/list/',
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
            else:
                self.stdout.write('⚠️  Không thể kết nối user service, sử dụng dữ liệu mẫu...')
                # Trả về dữ liệu mẫu nếu không kết nối được
                return self.get_sample_doctors()
        except requests.exceptions.RequestException:
            self.stdout.write('⚠️  User service chưa khởi động, sử dụng dữ liệu mẫu...')
            return self.get_sample_doctors()

    def get_sample_doctors(self):
        """Tạo dữ liệu bác sĩ mẫu nếu không kết nối được user service"""
        return [
            {'id': i, 'full_name': f'Bác sĩ {i}', 'specialty': 'Nội khoa'}
            for i in range(1, 11)
        ]

    def create_doctor_schedules(self, doctors):
        """Tạo lịch làm việc cho bác sĩ"""
        schedules_data = [
            # Thứ 2-6: 8:00-12:00, 14:00-17:00
            {'weekday': 0, 'start_time': time(8, 0), 'end_time': time(12, 0)},   # Thứ 2 sáng
            {'weekday': 0, 'start_time': time(14, 0), 'end_time': time(17, 0)},  # Thứ 2 chiều
            {'weekday': 1, 'start_time': time(8, 0), 'end_time': time(12, 0)},   # Thứ 3 sáng
            {'weekday': 1, 'start_time': time(14, 0), 'end_time': time(17, 0)},  # Thứ 3 chiều
            {'weekday': 2, 'start_time': time(8, 0), 'end_time': time(12, 0)},   # Thứ 4 sáng
            {'weekday': 2, 'start_time': time(14, 0), 'end_time': time(17, 0)},  # Thứ 4 chiều
            {'weekday': 3, 'start_time': time(8, 0), 'end_time': time(12, 0)},   # Thứ 5 sáng
            {'weekday': 3, 'start_time': time(14, 0), 'end_time': time(17, 0)},  # Thứ 5 chiều
            {'weekday': 4, 'start_time': time(8, 0), 'end_time': time(12, 0)},   # Thứ 6 sáng
            {'weekday': 4, 'start_time': time(14, 0), 'end_time': time(17, 0)},  # Thứ 6 chiều
            # Thứ 7: 8:00-12:00
            {'weekday': 5, 'start_time': time(8, 0), 'end_time': time(12, 0)},   # Thứ 7 sáng
        ]

        for doctor in doctors:
            doctor_id = doctor['id']
            
            # Tạo lịch làm việc cho mỗi bác sĩ
            for schedule in schedules_data:
                # Một số bác sĩ có thể không làm việc vào một số ngày
                if random.random() < 0.9:  # 90% khả năng có lịch
                    DoctorSchedule.objects.get_or_create(
                        doctor_id=doctor_id,
                        weekday=schedule['weekday'],
                        start_time=schedule['start_time'],
                        defaults={
                            'end_time': schedule['end_time'],
                            'is_active': True,
                            'max_patients_per_hour': random.randint(3, 6),
                            'appointment_duration': 30
                        }
                    )

        self.stdout.write(f'📅 Tạo lịch làm việc cho {len(doctors)} bác sĩ')

    def create_appointment_slots(self, doctors, days):
        """Tạo các slot khám bệnh dựa trên lịch làm việc"""
        current_date = date.today()
        
        for day_offset in range(days):
            check_date = current_date + timedelta(days=day_offset)
            weekday = check_date.weekday()  # 0 = Monday
            
            # Lấy tất cả lịch làm việc của các bác sĩ trong ngày này
            schedules = DoctorSchedule.objects.filter(weekday=weekday, is_active=True)
            
            for schedule in schedules:
                # Tạo slots 30 phút cho mỗi khung giờ làm việc
                current_time = schedule.start_time
                end_time = schedule.end_time
                
                while current_time < end_time:
                    slot_end_time = (
                        datetime.combine(date.today(), current_time) + 
                        timedelta(minutes=schedule.appointment_duration)
                    ).time()
                    
                    if slot_end_time <= end_time:
                        AppointmentSlot.objects.get_or_create(
                            doctor_id=schedule.doctor_id,
                            date=check_date,
                            start_time=current_time,
                            defaults={
                                'end_time': slot_end_time,
                                'max_appointments': 1,  # 1 bệnh nhân mỗi slot
                                'booked_count': 0
                            }
                        )
                    
                    # Chuyển sang slot tiếp theo
                    current_time = slot_end_time

        self.stdout.write(f'🕐 Tạo appointment slots cho {days} ngày')

    def create_sample_appointments(self, count):
        """Tạo lịch khám mẫu"""
        # Lấy danh sách bác sĩ và patients
        doctors = self.get_doctors_from_user_service()
        patients = self.get_patients_from_user_service()
        
        if not patients:
            self.stdout.write('⚠️  Không tìm thấy bệnh nhân, tạo dữ liệu mẫu...')
            patients = [{'id': i, 'full_name': f'Bệnh nhân {i}'} for i in range(1, 51)]
        
        # Lấy các slot có sẵn
        available_slots = AppointmentSlot.objects.filter(
            date__gte=date.today(),
            booked_count__lt=models.F('max_appointments')
        )
        
        if not available_slots.exists():
            self.stdout.write('❌ Không có slot nào available')
            return

        statuses = ['PENDING', 'CONFIRMED', 'COMPLETED']
        reasons = [
            'Khám tổng quát',
            'Đau đầu thường xuyên',
            'Kiểm tra sức khỏe định kỳ',
            'Đau bụng',
            'Ho kéo dài',
            'Khám thai',
            'Tiêm chủng',
            'Tái khám',
            'Đau lưng',
            'Kiểm tra huyết áp'
        ]

        appointments_created = 0
        for i in range(count):
            if appointments_created >= count:
                break
                
            # Chọn ngẫu nhiên slot, patient, doctor
            slot = random.choice(available_slots)
            patient = random.choice(patients)
            
            # Tìm thông tin bác sĩ
            doctor = next((d for d in doctors if d['id'] == slot.doctor_id), None)
            if not doctor:
                continue
            
            # Tạo datetime từ slot
            scheduled_datetime = timezone.make_aware(
                datetime.combine(slot.date, slot.start_time)
            )
            
            # Tạo appointment
            appointment = Appointment.objects.create(
                patient_id=patient['id'],
                doctor_id=slot.doctor_id,
                scheduled_time=scheduled_datetime,
                end_time=scheduled_datetime + timedelta(minutes=30),
                status=random.choice(statuses),
                reason=random.choice(reasons),
                priority=random.randint(1, 3),
                patient_name=patient['full_name'],
                doctor_name=doctor['full_name'],
                department=doctor.get('specialty', 'Nội khoa'),
                appointment_slot=slot,
                notes=f'Lịch khám mẫu số {i+1}'
            )
            
            appointments_created += 1
            
            # Cập nhật slot
            slot.booked_count += 1
            slot.save()
            
            # Nếu slot đã full, remove khỏi available_slots
            if slot.booked_count >= slot.max_appointments:
                available_slots = available_slots.exclude(id=slot.id)
                if not available_slots.exists():
                    break

        self.stdout.write(f'📋 Tạo {appointments_created} lịch khám mẫu')

    def get_patients_from_user_service(self):
        """Lấy danh sách bệnh nhân từ user service"""
        try:
            response = requests.get(
                'http://localhost:8001/api/users/patients/list/',
                timeout=5
            )
            if response.status_code == 200:
                return response.json()
        except requests.exceptions.RequestException:
            pass
        return None
