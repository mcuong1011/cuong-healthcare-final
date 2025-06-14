from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .bot import (
    get_bot_response, 
    is_chatbot_healthy, 
    get_conversation_history, 
    clear_conversation, 
    get_system_info,
    get_appointment_state,
    get_appointment_data,
    cancel_appointment_booking
)
import uuid

# Simple session storage - would use Redis or a database in production
chat_sessions = {}

class ChatbotAPIView(APIView):
    """
    POST /api/chatbot/respond/
    Body: {"message": "...", "session_id": "..."}
    Headers: {"Authorization": "Bearer <user_token>"} (optional)
    """
    def post(self, request):
        msg = request.data.get('message')
        if not msg:
            return Response({'error':'Missing message'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create session ID
        session_id = request.data.get('session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Get user token from headers (if user is logged in)
        user_token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            user_token = auth_header.split(' ')[1]
            
        # Pass user token to chatbot
        reply = get_bot_response(msg, session_id, user_token=user_token)
        return Response({
            'reply': reply,
            'session_id': session_id
        }, status=status.HTTP_200_OK)

class ChatbotHealthView(APIView):
    """
    GET /api/chatbot/health/
    Check chatbot system health
    """
    def get(self, request):
        health_status = is_chatbot_healthy()
        status_code = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_status, status=status_code)

class ChatbotSystemInfoView(APIView):
    """
    GET /api/chatbot/info/
    Get system information
    """
    def get(self, request):
        system_info = get_system_info()
        return Response(system_info, status=status.HTTP_200_OK)

class ConversationHistoryView(APIView):
    """
    GET /api/chatbot/history/{session_id}/
    Get conversation history for a session
    """
    def get(self, request, session_id):
        history = get_conversation_history(session_id)
        return Response({
            'session_id': session_id,
            'history': history
        }, status=status.HTTP_200_OK)

class ClearConversationView(APIView):
    """
    POST /api/chatbot/clear/{session_id}/
    Clear conversation history for a session
    """
    def post(self, request, session_id):
        cleared = clear_conversation(session_id)
        if cleared:
            return Response({
                'message': 'Conversation cleared successfully',
                'session_id': session_id
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Session not found',
                'session_id': session_id
            }, status=status.HTTP_404_NOT_FOUND)

class AppointmentBookingView(APIView):
    """
    POST /api/appointments/book/
    Body: {"session_id": "...", "appointment_data": {...}}
    """
    def post(self, request):
        session_id = request.data.get('session_id')
        appointment_data = request.data.get('appointment_data')
        
        if not session_id or not appointment_data:
            return Response({'error': 'Missing session_id or appointment_data'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Here you would add logic to book the appointment using the appointment_data
        # For now, let's just return the data back as a response
        return Response({
            'session_id': session_id,
            'appointment_data': appointment_data,
            'status': 'Appointment booked successfully'
        }, status=status.HTTP_201_CREATED)

class AppointmentStateView(APIView):
    """
    GET /api/appointments/state/{session_id}/
    Get the current state of the appointment for a session
    """
    def get(self, request, session_id):
        state = get_appointment_state(session_id)
        return Response({
            'session_id': session_id,
            'appointment_state': state
        }, status=status.HTTP_200_OK)

class AppointmentDataView(APIView):
    """
    GET /api/appointments/data/{session_id}/
    Get appointment data for a session
    """
    def get(self, request, session_id):
        data = get_appointment_data(session_id)
        return Response({
            'session_id': session_id,
            'appointment_data': data
        }, status=status.HTTP_200_OK)

class CancelAppointmentView(APIView):
    """
    POST /api/appointments/cancel/{session_id}/
    Cancel an existing appointment for a session
    """
    def post(self, request, session_id):
        cancelled = cancel_appointment_booking(session_id)
        if cancelled:
            return Response({
                'message': 'Appointment cancelled successfully',
                'session_id': session_id
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'No appointment found for the given session_id',
                'session_id': session_id
            }, status=status.HTTP_404_NOT_FOUND)

class AppointmentStateView(APIView):
    """
    GET /api/chatbot/appointment/state/{session_id}/
    Get current appointment booking state for a session
    """
    def get(self, request, session_id):
        appointment_state = get_appointment_state(session_id)
        appointment_data = get_appointment_data(session_id)
        
        return Response({
            'session_id': session_id,
            'appointment_state': appointment_state,
            'appointment_data': appointment_data,
            'is_booking_in_progress': appointment_state is not None
        }, status=status.HTTP_200_OK)

class CancelAppointmentBookingView(APIView):
    """
    POST /api/chatbot/appointment/cancel/{session_id}/
    Cancel current appointment booking process
    """
    def post(self, request, session_id):
        cancelled = cancel_appointment_booking(session_id)
        
        if cancelled:
            return Response({
                'message': 'Appointment booking cancelled successfully',
                'session_id': session_id
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'No active appointment booking found for this session',
                'session_id': session_id
            }, status=status.HTTP_404_NOT_FOUND)

class AppointmentBookingStatusView(APIView):
    """
    GET /api/chatbot/appointment/status/{session_id}/
    Get comprehensive appointment booking status and available actions
    """
    def get(self, request, session_id):
        appointment_state = get_appointment_state(session_id)
        appointment_data = get_appointment_data(session_id)
        
        # Define what actions are available based on current state
        available_actions = []
        next_step = None
        
        if appointment_state is None:
            available_actions = ['start_booking']
            next_step = 'Send "đặt lịch hẹn" to start appointment booking'
        elif appointment_state == 'SELECTING_DOCTOR':
            available_actions = ['select_doctor', 'cancel_booking']
            next_step = 'Select a doctor by sending the doctor number (e.g., "1", "2", "3")'
        elif appointment_state == 'SELECTING_DATE':
            available_actions = ['select_date', 'cancel_booking']
            next_step = 'Select a date by sending the date number (e.g., "1", "2", "3")'
        elif appointment_state == 'SELECTING_TIME':
            available_actions = ['select_time', 'cancel_booking']
            next_step = 'Select a time slot by sending the time number (e.g., "1", "2", "3")'
        elif appointment_state == 'ENTERING_REASON':
            available_actions = ['enter_reason', 'cancel_booking']
            next_step = 'Enter your reason for the visit'
        elif appointment_state == 'CONFIRMING':
            available_actions = ['confirm', 'cancel_booking']
            next_step = 'Confirm your appointment by sending "có" or cancel by sending "không"'
        elif appointment_state == 'COMPLETED':
            available_actions = ['start_new_booking']
            next_step = 'Appointment completed. You can start a new booking if needed.'
        
        return Response({
            'session_id': session_id,
            'appointment_state': appointment_state,
            'appointment_data': appointment_data,
            'is_booking_in_progress': appointment_state is not None and appointment_state != 'COMPLETED',
            'available_actions': available_actions,
            'next_step': next_step,
            'workflow_progress': {
                'current_step': appointment_state,
                'steps_completed': len([k for k, v in appointment_data.items() if v]) if appointment_data else 0,
                'total_steps': 7
            }
        }, status=status.HTTP_200_OK)