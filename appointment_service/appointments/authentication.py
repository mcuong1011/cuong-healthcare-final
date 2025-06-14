import jwt
import requests
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import AnonymousUser

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
            
            # Option 1: Create user from token payload (faster)
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
            
            # Option 2: Verify with user service (more secure but slower)
            # Uncomment this if you want to verify user exists in user service
            # user = self.verify_user_with_service(user_id, token)
            
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')
        except Exception as e:
            raise AuthenticationFailed(f'Authentication error: {str(e)}')
    
    def verify_user_with_service(self, user_id, token):
        """
        Optional: Verify user exists in user service
        """
        try:
            response = requests.get(
                f"{settings.USER_SERVICE}/api/users/me/",
                headers={'Authorization': f'Bearer {token}'},
                timeout=5
            )
            
            if response.status_code == 200:
                user_data = response.json()
                return MicroserviceUser(user_data)
            else:
                raise AuthenticationFailed('User not found in user service')
                
        except requests.exceptions.RequestException as e:
            # Fallback to token data if user service is unavailable
            print(f"Warning: Could not verify user with user service: {e}")
            raise AuthenticationFailed('Could not verify user')