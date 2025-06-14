import jwt
import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model

User = get_user_model()

class MicroserviceUser:
    """
    Simple user class for microservices that don't have direct access to User model
    """
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.username = user_data.get('username', '')
        self.email = user_data.get('email', '')
        self.first_name = user_data.get('first_name', '')
        self.last_name = user_data.get('last_name', '')
        self.role = user_data.get('role', 'PATIENT')
        self.is_authenticated = True
        self.is_active = True
        self.is_anonymous = False
        self.is_staff = user_data.get('is_staff', False)
        self.is_superuser = user_data.get('is_superuser', False)
    
    def __str__(self):
        return f"User {self.id} ({self.username})"

class MicroserviceJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication for microservices
    Supports both service tokens and regular user tokens
    """
    
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ', 1)[1]
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            if not user_id:
                raise AuthenticationFailed('Invalid token: no user_id')
            
            # For service tokens (like chatbot service), create MicroserviceUser from payload
            if payload.get('username') == 'chatbot_service' and payload.get('role') == 'SERVICE':
                user_data = {
                    'id': user_id,
                    'username': payload.get('username', ''),
                    'email': payload.get('email', ''),
                    'first_name': payload.get('first_name', ''),
                    'last_name': payload.get('last_name', ''),
                    'role': payload.get('role', 'SERVICE'),
                    'is_staff': payload.get('is_staff', False),
                    'is_superuser': payload.get('is_superuser', False)
                }
                
                user = MicroserviceUser(user_data)
                return (user, token)
            
            # For regular user tokens, try to get the actual user from database
            try:
                user = User.objects.get(id=user_id)
                return (user, token)
            except User.DoesNotExist:
                # If user doesn't exist in database, fall back to MicroserviceUser
                user_data = {
                    'id': user_id,
                    'username': payload.get('username', ''),
                    'email': payload.get('email', ''),
                    'first_name': payload.get('first_name', ''),
                    'last_name': payload.get('last_name', ''),
                    'role': payload.get('role', 'PATIENT'),
                    'is_staff': payload.get('is_staff', False),
                    'is_superuser': payload.get('is_superuser', False)
                }
                
                user = MicroserviceUser(user_data)
                return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication error: {str(e)}')
