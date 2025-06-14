from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Prescription, MedicationItem, Inventory
from .serializers import *
from .permissions import IsPharmacist

class PrescriptionCreateView(APIView):
    def post(self, request):
        serializer = PrescriptionSerializer(data=request.data)
        if serializer.is_valid():
            prescription = serializer.save()
            create_insurance_claim(
                patient_id=prescription.patient_id,
                prescription_id=prescription.id,
                token=request.headers.get('Authorization').split(' ')[1]
            )
            return Response(PrescriptionSerializer(prescription).data, status=201)
        return Response(serializer.errors, status=400)

class PrescriptionListView(APIView):
    permission_classes = [IsAuthenticated, IsPharmacist]

    def get(self, request):
        prescriptions = Prescription.objects.all()
        return Response(PrescriptionSerializer(prescriptions, many=True).data)

class DispensePrescriptionView(APIView):
    def post(self, request, pk):
        try:
            prescription = Prescription.objects.get(id=pk)
        except Prescription.DoesNotExist:
            return Response({'error': 'Không tìm thấy đơn thuốc'}, status=404)

        # Giả định đã kiểm tra tồn kho – thực tế cần logic kiểm kho chi tiết
        prescription.status = 'DISPENSED'
        prescription.save()
        return Response({'message': 'Đã phát thuốc'})

class InventoryListCreateView(APIView):
    def get(self, request):
        return Response(InventorySerializer(Inventory.objects.all(), many=True).data)

    def post(self, request):
        serializer = InventorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

def create_insurance_claim(patient_id, prescription_id, token):
    import requests
    url = 'http://localhost:8006/api/insurance/claims/create/'
    data = {
        "patient_id": patient_id,
        "prescription_id": prescription_id
    }
    headers = {"Authorization": f"Bearer {token}"}
    requests.post(url, json=data, headers=headers)
