from django.core.management.base import BaseCommand
from records.models import MedicalRecord
import requests
import random
from datetime import datetime, timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu cho hồ sơ y tế'

    def add_arguments(self, parser):
        parser.add_argument(
            '--records',
            type=int,
            default=150,
            help='Số lượng hồ sơ y tế cần tạo'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Xóa tất cả dữ liệu cũ'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('🗑️  Xóa dữ liệu hồ sơ y tế cũ...')
            MedicalRecord.objects.all().delete()

        # Lấy danh sách patients và doctors
        patients = self.get_patients()
        doctors = self.get_doctors()
        
        if not patients or not doctors:
            self.stdout.write(
                self.style.ERROR('❌ Không thể lấy dữ liệu patients hoặc doctors')
            )
            return

        self.create_medical_records(patients, doctors, options['records'])
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Tạo thành công {options["records"]} hồ sơ y tế')
        )

    def get_patients(self):
        """Lấy danh sách patients từ user service"""
        try:
            response = requests.get('http://localhost:8001/api/users/patients/list/', timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        
        # Fallback data
        return [{'id': i, 'full_name': f'Bệnh nhân {i}'} for i in range(1, 101)]

    def get_doctors(self):
        """Lấy danh sách doctors từ user service"""
        try:
            response = requests.get('http://localhost:8001/api/users/doctors/list/', timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        
        # Fallback data
        return [{'id': i, 'full_name': f'Bác sĩ {i}', 'specialty': 'Nội khoa'} for i in range(1, 16)]

    def create_medical_records(self, patients, doctors, count):
        """Tạo hồ sơ y tế mẫu"""
        
        diagnoses = [
            'Cảm cúm thông thường',
            'Viêm họng',
            'Đau đầu migraine',
            'Cao huyết áp',
            'Tiểu đường type 2',
            'Viêm khớp',
            'Hen suyễn',
            'Viêm dạ dày',
            'Rối loạn tiêu hóa',
            'Stress và lo âu',
            'Đau lưng mãn tính',
            'Viêm xoang',
            'Dị ứng thời tiết',
            'Thiếu máu',
            'Rối loạn giấc ngủ'
        ]
        
        treatments = [
            'Nghỉ ngơi, uống nhiều nước',
            'Kê đơn thuốc kháng sinh',
            'Thuốc giảm đau và chống viêm',
            'Điều chỉnh chế độ ăn uống',
            'Tập thể dục nhẹ nhàng',
            'Theo dõi huyết áp định kỳ',
            'Sử dụng thuốc xịt mũi',
            'Tái khám sau 1 tuần',
            'Chế độ ăn kiêng đặc biệt',
            'Vật lý trị liệu',
            'Thuốc giảm đau',
            'Vitamin và khoáng chất bổ sung'
        ]
        
        symptoms = [
            'Sốt, ho, đau họng',
            'Đau đầu, chóng mặt',
            'Khó thở, đau ngực',
            'Đau bụng, buồn nôn',
            'Mệt mỏi, uể oải',
            'Đau khớp, cứng khớp',
            'Mất ngủ, lo âu',
            'Tiêu chảy, táo bón',
            'Huyết áp cao',
            'Đường huyết cao',
            'Dị ứng da',
            'Đau lưng',
            'Nghẹt mũi, chảy nước mũi'
        ]

        for i in range(count):
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            
            MedicalRecord.objects.create(
                patient_id=patient['id'],
                doctor_id=doctor['id'],
                symptoms=random.choice(symptoms),
                diagnosis=random.choice(diagnoses)
            )

        self.stdout.write(f'🏥 Tạo {count} hồ sơ y tế mẫu')
