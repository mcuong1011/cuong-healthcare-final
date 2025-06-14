from rest_framework import serializers
from .models import MedicalRecord, VitalSign

class VitalSignSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalSign
        fields = '__all__'

class MedicalRecordSerializer(serializers.ModelSerializer):
    vitals = VitalSignSerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = '__all__'
