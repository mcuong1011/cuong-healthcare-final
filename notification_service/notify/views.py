from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer

class SendNotificationView(APIView):
    def post(self, request):
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            notification = serializer.save()

            # Giả lập gửi (có thể tích hợp Twilio, SendGrid sau)
            print(f"📤 Gửi thông báo tới {notification.recipient_id}: {notification.message}")
            notification.status = 'SENT'
            notification.save()

            return Response(NotificationSerializer(notification).data, status=201)
        return Response(serializer.errors, status=400)

class ListNotificationsView(APIView):
    def get(self, request):
        notifications = Notification.objects.filter(recipient_id=request.user.id)
        return Response(NotificationSerializer(notifications, many=True).data)
