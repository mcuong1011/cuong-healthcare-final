from django.utils.deprecation import MiddlewareMixin
import json, requests

class NotifyOnCreateMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if request.method == "POST" and response.status_code == 201:
            user = getattr(request, "user", None)
            if user and user.is_authenticated:
                message = f"Bạn vừa tạo một bản ghi mới tại {request.path}"
                try:
                    requests.post(
                        "http://localhost:8007/api/notify/send/",
                        json={
                            "recipient_id": user.id,
                            "message": message,
                            "notification_type": "SYSTEM"
                        },
                        headers={"Authorization": f"Bearer {request.headers.get('Authorization')}"}
                    )
                except Exception as e:
                    print("⚠️ Middleware Notify error:", e)
        return response
