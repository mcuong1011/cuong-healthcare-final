from django.db import models

class MedicalRecord(models.Model):
    patient_id = models.IntegerField()
    doctor_id = models.IntegerField()
    appointment_id = models.IntegerField(null=True, blank=True)
    symptoms = models.TextField()
    diagnosis = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Record for Patient {self.patient_id} - Dr.{self.doctor_id}"

class VitalSign(models.Model):
    record = models.ForeignKey(MedicalRecord, on_delete=models.CASCADE, related_name='vitals')
    temperature = models.FloatField()
    blood_pressure = models.CharField(max_length=20)
    pulse = models.IntegerField()
    recorded_at = models.DateTimeField(auto_now_add=True)
