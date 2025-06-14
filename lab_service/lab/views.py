from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import LabTest, LabOrder, LabResult
from .serializers import *
from .permissions import IsLabTechnician

class LabTestListView(APIView):
    def get(self, request):
        return Response(LabTestSerializer(LabTest.objects.all(), many=True).data)

class LabOrderCreateView(APIView):
    def post(self, request):
        serializer = LabOrderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class LabOrderListView(APIView):
    def get(self, request):
        return Response(LabOrderSerializer(LabOrder.objects.all(), many=True).data)

class LabResultCreateView(APIView):
    permission_classes = [IsAuthenticated, IsLabTechnician]

    def post(self, request):
        serializer = LabResultSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class LabResultListView(APIView):
    def get(self, request):
        return Response(LabResultSerializer(LabResult.objects.all(), many=True).data)
