from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from users.models import User, PatientProfile, DoctorProfile, NurseProfile, PharmacistProfile, AdminProfile
import random
from datetime import date


class Command(BaseCommand):
    help = 'Tạo dữ liệu mẫu cho bác sĩ và bệnh nhân'

    def add_arguments(self, parser):
        parser.add_argument(
            '--doctors',
            type=int,
            default=10,
            help='Số lượng bác sĩ cần tạo'
        )
        parser.add_argument(
            '--patients', 
            type=int,
            default=50,
            help='Số lượng bệnh nhân cần tạo'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Xóa tất cả dữ liệu cũ trước khi tạo mới'
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('🗑️  Xóa dữ liệu cũ...')
            User.objects.all().delete()
            
        # Tạo superuser admin
        self.create_admin()
        
        # Tạo bác sĩ
        self.create_doctors(options['doctors'])
        
        # Tạo bệnh nhân
        self.create_patients(options['patients'])
        
        # Tạo một số role khác
        self.create_nurses()
        self.create_pharmacists()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Tạo thành công {options["doctors"]} bác sĩ và {options["patients"]} bệnh nhân'
            )
        )

    def create_admin(self):
        """Tạo tài khoản admin"""
        admin = User.objects.create(
            username='admin',
            email='admin@healthcare.com',
            first_name='System',
            last_name='Administrator',
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            is_verified=True,
            password=make_password('admin123')
        )
        
        AdminProfile.objects.create(
            user=admin,
            admin_code='ADM001',
            department='Quản trị hệ thống',
            full_control=True
        )
        
        self.stdout.write('👨‍💼 Tạo admin: admin/admin123')

    def create_doctors(self, count):
        """Tạo bác sĩ"""
        specialties = [
            'Tim mạch', 'Thần kinh', 'Nhi khoa', 'Phụ sản', 'Ung bướu',
            'Nội tiết', 'Tiêu hóa', 'Hô hấp', 'Cơ xương khớp', 'Da liễu',
            'Tai mũi họng', 'Mắt', 'Tâm thần', 'Gây mê hồi sức', 'Ngoại khoa'
        ]
        
        doctor_names = [
            ('Nguyễn', 'Văn An'), ('Trần', 'Thị Bình'), ('Lê', 'Minh Cường'),
            ('Phạm', 'Thu Dung'), ('Hoàng', 'Văn Em'), ('Vũ', 'Thị Phương'),
            ('Đặng', 'Minh Giang'), ('Bùi', 'Thị Hoa'), ('Dương', 'Văn Inh'),
            ('Ngô', 'Thị Khánh'), ('Lý', 'Văn Lâm'), ('Võ', 'Thị Mai'),
            ('Đỗ', 'Văn Nam'), ('Tô', 'Thị Oanh'), ('Hồ', 'Văn Phúc')
        ]
        
        for i in range(count):
            name = doctor_names[i % len(doctor_names)]
            specialty = specialties[i % len(specialties)]
            
            doctor = User.objects.create(
                username=f'doctor{i+1:02d}',
                email=f'doctor{i+1:02d}@healthcare.com',
                first_name=name[1],
                last_name=name[0],
                role='DOCTOR',
                gender=random.choice(['M', 'F']),
                phone_number=f'+8490{random.randint(1000000, 9999999)}',
                is_verified=True,
                password=make_password('doctor123')
            )
            
            DoctorProfile.objects.create(
                user=doctor,
                specialty=specialty,
                bio=f'Bác sĩ chuyên khoa {specialty} với nhiều năm kinh nghiệm.',
                years_experience=random.randint(5, 25),
                practice_certificate=f'BS{random.randint(100000, 999999)}',
                clinic_address=f'Phòng {random.randint(101, 599)}, Bệnh viện Đa khoa Trung ương'
            )
            
        self.stdout.write(f'👨‍⚕️ Tạo {count} bác sĩ (username: doctor01-doctor{count:02d}, password: doctor123)')

    def create_patients(self, count):
        """Tạo bệnh nhân"""
        patient_names = [
            ('Nguyễn', 'Văn Anh'), ('Trần', 'Thị Bảo'), ('Lê', 'Văn Cường'),
            ('Phạm', 'Thị Dung'), ('Hoàng', 'Văn Em'), ('Vũ', 'Thị Phương'),
            ('Đặng', 'Văn Giang'), ('Bùi', 'Thị Hòa'), ('Dương', 'Văn Inh'),
            ('Ngô', 'Thị Kim'), ('Lý', 'Văn Long'), ('Võ', 'Thị Mai'),
            ('Đỗ', 'Văn Nam'), ('Tô', 'Thị Oanh'), ('Hồ', 'Văn Phúc'),
            ('Đinh', 'Thị Quỳnh'), ('Lại', 'Văn Rơ'), ('Phan', 'Thị Sen'),
            ('Chu', 'Văn Tú'), ('Mạc', 'Thị Uyên')
        ]
        
        blood_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        insurance_providers = ['BHXH', 'Bảo Việt', 'Prudential', 'AIA', 'PVI']
        
        cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']
        
        common_allergies = [
            'Không có', 'Thuốc kháng sinh', 'Hải sản', 'Đậu phộng', 
            'Sữa', 'Trứng', 'Phấn hoa', 'Bụi nhà'
        ]
        
        for i in range(count):
            name = patient_names[i % len(patient_names)]
            
            patient = User.objects.create(
                username=f'patient{i+1:03d}',
                email=f'patient{i+1:03d}@gmail.com',
                first_name=name[1],
                last_name=name[0],
                role='PATIENT',
                gender=random.choice(['M', 'F']),
                phone_number=f'+8490{random.randint(1000000, 9999999)}',
                is_verified=True,
                password=make_password('patient123')
            )
            
            # Tạo ngày sinh (20-80 tuổi)
            birth_year = random.randint(1944, 2004)
            birth_date = date(birth_year, random.randint(1, 12), random.randint(1, 28))
            
            PatientProfile.objects.create(
                user=patient,
                date_of_birth=birth_date,
                address=f'{random.randint(1, 999)} Đường ABC, Quận {random.randint(1, 12)}, {random.choice(cities)}',
                blood_type=random.choice(blood_types),
                emergency_contact=f'+8490{random.randint(1000000, 9999999)}',
                insurance_provider=random.choice(insurance_providers),
                insurance_code=f'BH{random.randint(100000, 999999)}',
                insurance_number=f'{random.randint(1000000000, 9999999999)}',
                allergies=random.choice(common_allergies),
                medical_conditions=random.choice([
                    'Không có',
                    'Cao huyết áp',
                    'Tiểu đường type 2', 
                    'Bệnh tim',
                    'Hen suyễn',
                    'Viêm khớp'
                ])
            )
            
        self.stdout.write(f'👥 Tạo {count} bệnh nhân (username: patient001-patient{count:03d}, password: patient123)')

    def create_nurses(self):
        """Tạo y tá"""
        nurse_names = [
            ('Nguyễn', 'Thị Lan'), ('Trần', 'Thị Hương'), ('Lê', 'Thị Linh'),
            ('Phạm', 'Thị Nga'), ('Hoàng', 'Thị Oanh')
        ]
        
        departments = ['Nội khoa', 'Ngoại khoa', 'Nhi khoa', 'Phụ sản', 'Cấp cứu']
        shifts = ['Ca ngày', 'Ca đêm', 'Ca xoay']
        
        for i, (last_name, first_name) in enumerate(nurse_names):
            nurse = User.objects.create(
                username=f'nurse{i+1:02d}',
                email=f'nurse{i+1:02d}@healthcare.com',
                first_name=first_name,
                last_name=last_name,
                role='NURSE',
                gender='F',
                phone_number=f'+8490{random.randint(1000000, 9999999)}',
                is_verified=True,
                password=make_password('nurse123')
            )
            
            NurseProfile.objects.create(
                user=nurse,
                department=departments[i % len(departments)],
                shift=random.choice(shifts)
            )
            
        self.stdout.write('👩‍⚕️ Tạo 5 y tá (username: nurse01-nurse05, password: nurse123)')

    def create_pharmacists(self):
        """Tạo dược sĩ"""
        pharmacist_names = [
            ('Nguyễn', 'Văn Dược'), ('Trần', 'Thị Thuốc'), ('Lê', 'Văn Bào')
        ]
        
        pharmacies = ['Nhà thuốc Trung tâm', 'Nhà thuốc An Khang', 'Nhà thuốc Sức khỏe']
        
        for i, (last_name, first_name) in enumerate(pharmacist_names):
            pharmacist = User.objects.create(
                username=f'pharmacist{i+1:02d}',
                email=f'pharmacist{i+1:02d}@healthcare.com',
                first_name=first_name,
                last_name=last_name,
                role='PHARMACIST',
                gender=random.choice(['M', 'F']),
                phone_number=f'+8490{random.randint(1000000, 9999999)}',
                is_verified=True,
                password=make_password('pharmacist123')
            )
            
            PharmacistProfile.objects.create(
                user=pharmacist,
                pharmacy_name=pharmacies[i],
                license_number=f'DS{random.randint(100000, 999999)}',
                working_hours='Thứ 2-7: 8:00-17:00, Chủ nhật: 8:00-12:00'
            )
            
        self.stdout.write('💊 Tạo 3 dược sĩ (username: pharmacist01-pharmacist03, password: pharmacist123)')
