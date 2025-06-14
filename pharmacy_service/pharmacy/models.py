from django.db import models

class Prescription(models.Model):
    record_id = models.IntegerField()  # ID từ Clinical Service
    doctor_id = models.IntegerField()
    patient_id = models.IntegerField()
    issued_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('DISPENSED', 'Dispensed'),
    ], default='PENDING')

class MedicationItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medications')
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField()

class Inventory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    quantity = models.PositiveIntegerField()
    expiry_date = models.DateField()
