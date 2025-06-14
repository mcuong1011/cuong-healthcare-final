from rest_framework import serializers
from .models import Prescription, MedicationItem, Inventory

class MedicationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicationItem
        fields = '__all__'

class PrescriptionSerializer(serializers.ModelSerializer):
    medications = MedicationItemSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = '__all__'
