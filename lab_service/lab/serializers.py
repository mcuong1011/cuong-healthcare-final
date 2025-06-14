from rest_framework import serializers
from .models import LabTest, LabOrder, LabResult

class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = '__all__'

class LabOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabOrder
        fields = '__all__'

class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'
