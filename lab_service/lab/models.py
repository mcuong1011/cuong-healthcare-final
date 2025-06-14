from django.db import models

class LabTest(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class LabOrder(models.Model):
    record_id = models.IntegerField()
    test = models.ForeignKey(LabTest, on_delete=models.CASCADE)
    doctor_id = models.IntegerField()
    status = models.CharField(max_length=20, choices=[('PENDING', 'Pending'), ('COMPLETED', 'Completed')], default='PENDING')
    ordered_at = models.DateTimeField(auto_now_add=True)

class LabResult(models.Model):
    order = models.OneToOneField(LabOrder, on_delete=models.CASCADE)
    result_text = models.TextField()
    result_file = models.FileField(upload_to='lab_results/', blank=True, null=True)
    result_date = models.DateTimeField(auto_now_add=True)
