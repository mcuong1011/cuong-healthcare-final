from django.db import models

class Notification(models.Model):
    recipient_id = models.IntegerField()
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=[
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('SYSTEM', 'System'),
    ])
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ], default='PENDING')
