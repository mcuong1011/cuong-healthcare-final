from rest_framework.permissions import BasePermission

class IsAuthenticatedOrService(BasePermission):
    """
    Custom permission to allow both authenticated users and service users
    """
    def has_permission(self, request, view):
        # Check if user is authenticated (regular Django user)
        if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
            return True
        
        # Check if it's a service user (MicroserviceUser)
        if hasattr(request.user, 'role') and request.user.role == 'SERVICE':
            return True
            
        # Check if it's any MicroserviceUser with is_authenticated = True
        if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
            return True
            
        return False
