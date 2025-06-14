from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import MedicalRecord, VitalSign
from .serializers import MedicalRecordSerializer, VitalSignSerializer
from rest_framework.permissions import IsAuthenticated
import requests

class CreateMedicalRecordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data.copy()
        data['doctor_id'] = request.user.id
        serializer = MedicalRecordSerializer(data=data)
        if serializer.is_valid():
            record = serializer.save()
            # Tự động tạo đơn thuốc sau khi ghi hồ sơ
            notify_pharmacy_create_prescription(
                record_id=record.id,
                doctor_id=request.user.id,
                patient_id=record.patient_id,
                token=request.headers.get('Authorization').split(' ')[1]
            )

            create_lab_order(
                record_id=record.id,
                doctor_id=request.user.id,
                test_id=1,
                token=request.headers.get('Authorization').split(' ')[1]
            )

            create_insurance_claim(
                patient_id=record.patient_id,
                record_id=record.id,
                token=request.headers.get('Authorization').split(' ')[1]
            )
            
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class ListMedicalRecordsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'PATIENT':
            records = MedicalRecord.objects.filter(patient_id=request.user.id)
        elif request.user.role == 'DOCTOR':
            records = MedicalRecord.objects.filter(doctor_id=request.user.id)
        else:
            return Response({'error': 'Không có quyền'}, status=403)

        serializer = MedicalRecordSerializer(records, many=True)
        return Response(serializer.data)

class AddVitalSignView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VitalSignSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
def notify_pharmacy_create_prescription(record_id, doctor_id, patient_id, token):
    url = 'http://localhost:8004/api/pharmacy/prescriptions/create/'
    data = {
        'record_id': record_id,
        'doctor_id': doctor_id,
        'patient_id': patient_id,
        'status': 'PENDING'
    }
    headers = {'Authorization': f'Bearer {token}'}
    requests.post(url, json=data, headers=headers)

def create_lab_order(record_id, doctor_id, test_id, token):
    url = "http://localhost:8005/api/lab/orders/create/"
    data = {
        "record_id": record_id,
        "doctor_id": doctor_id,
        "test": test_id
    }
    headers = {"Authorization": f"Bearer {token}"}
    requests.post(url, json=data, headers=headers)

def create_insurance_claim(patient_id, record_id, token):
    import requests
    url = 'http://localhost:8006/api/insurance/claims/create/'
    data = {
        "patient_id": patient_id,
        "record_id": record_id
    }
    headers = {"Authorization": f"Bearer {token}"}
    requests.post(url, json=data, headers=headers)