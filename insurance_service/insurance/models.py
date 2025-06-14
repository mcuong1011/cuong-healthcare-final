from django.db import models

class InsuranceClaim(models.Model):
    patient_id = models.IntegerField()
    appointment_id = models.IntegerField(null=True, blank=True)
    record_id = models.IntegerField(null=True, blank=True)
    prescription_id = models.IntegerField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=[
        ('INITIATED', 'Initiated'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ], default='INITIATED')

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
