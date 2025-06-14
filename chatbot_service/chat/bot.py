import os
import json
import re
import random
import logging
import requests
from datetime import datetime, timedelta

# Import the new trained chatbot
from .simple_trained_chatbot import SimpleTrainedHealthcareChatBot

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the trained chatbot
trained_chatbot = None
try:
    trained_chatbot = SimpleTrainedHealthcareChatBot()
    logger.info("✅ Trained Healthcare ChatBot initialized successfully")
except Exception as e:
    logger.error(f"❌ Error initializing Trained Healthcare ChatBot: {str(e)}")
    trained_chatbot = None

# Store chat sessions for conversation context
chat_sessions = {}

class HealthcareChatBot:
    """
    Main Healthcare ChatBot class that uses the trained TensorFlow model
    """
    
    def __init__(self):
        self.session_id = None
        self.conversation_context = {}
        
    def get_bot_response(self, user_message, session_id=None, user_token=None):
        """
        Get bot response using the trained TensorFlow model
        """
        try:
            # Use session_id if provided
            if session_id:
                self.session_id = session_id
                
            # Initialize session if not exists
            if self.session_id not in chat_sessions:
                chat_sessions[self.session_id] = {
                    'context': {},
                    'last_intent': None,
                    'conversation_history': [],
                    'user_token': user_token  # Store user token in session
                }
            else:
                # Update user token if provided
                if user_token:
                    chat_sessions[self.session_id]['user_token'] = user_token
            
            # Add to conversation history
            chat_sessions[self.session_id]['conversation_history'].append({
                'user': user_message,
                'timestamp': datetime.now().isoformat()
            })
            
            # Get response from trained model
            if trained_chatbot and trained_chatbot.model_loaded:
                response = trained_chatbot.get_response(user_message, session_id, user_token=user_token)
                
                # Add bot response to history
                chat_sessions[self.session_id]['conversation_history'].append({
                    'bot': response,
                    'timestamp': datetime.now().isoformat()
                })
                
                return response
            else:
                # Fallback response if model is not loaded
                fallback_responses = [
                    "Xin lỗi, hệ thống chatbot đang gặp sự cố. Vui lòng thử lại sau.",
                    "Tôi hiện tại không thể xử lý yêu cầu của bạn. Vui lòng liên hệ bác sĩ trực tiếp.",
                    "Hệ thống đang được bảo trì. Vui lòng thử lại sau ít phút."
                ]
                return random.choice(fallback_responses)
                
        except Exception as e:
            logger.error(f"Error in get_bot_response: {str(e)}")
            return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."

    def get_conversation_history(self, session_id):
        """
        Get conversation history for a session
        """
        if trained_chatbot:
            return trained_chatbot.get_conversation_history(session_id)
        elif session_id in chat_sessions:
            return chat_sessions[session_id]['conversation_history']
        return []

    def clear_conversation(self, session_id):
        """
        Clear conversation history for a session
        """
        if trained_chatbot:
            return trained_chatbot.clear_conversation(session_id)
        elif session_id in chat_sessions:
            chat_sessions[session_id]['conversation_history'] = []
            chat_sessions[session_id]['context'] = {}
            return True
        return False

    def get_session_context(self, session_id):
        """
        Get session context
        """
        if trained_chatbot:
            # Get the full conversation context from trained chatbot
            context = trained_chatbot.conversation_context.get(session_id, {})
            return context.get('appointment_data', {})
        elif session_id in chat_sessions:
            return chat_sessions[session_id]['context']
        return {}

    def update_session_context(self, session_id, context_data):
        """
        Update session context
        """
        if trained_chatbot:
            # Update context in trained chatbot
            if session_id not in trained_chatbot.conversation_context:
                trained_chatbot.conversation_context[session_id] = {
                    'conversation_history': [],
                    'appointment_state': None,
                    'appointment_data': {}
                }
            trained_chatbot.conversation_context[session_id]['appointment_data'].update(context_data)
        else:
            # Fallback to local session management
            if session_id not in chat_sessions:
                chat_sessions[session_id] = {
                    'context': {},
                    'last_intent': None,
                    'conversation_history': []
                }
            chat_sessions[session_id]['context'].update(context_data)

    def book_appointment(self, patient_name, phone_number, appointment_date, appointment_time, doctor_specialty, symptoms):
        """
        Book an appointment using the trained model's appointment booking functionality
        This method is deprecated - use the interactive appointment booking through get_bot_response instead
        """
        try:
            if trained_chatbot:
                # For backward compatibility, create a simple appointment booking
                # However, the new system uses interactive booking through conversation
                return {
                    'success': True,
                    'message': 'Để đặt lịch hẹn, vui lòng nhắn "đặt lịch hẹn" để bắt đầu quy trình đặt lịch tương tác.',
                    'note': 'Hệ thống mới sử dụng quy trình đặt lịch tương tác thông qua cuộc trò chuyện.'
                }
            else:
                return {
                    'success': False,
                    'message': 'Hệ thống đặt lịch hiện tại không khả dụng. Vui lòng thử lại sau.'
                }
        except Exception as e:
            logger.error(f"Error in book_appointment: {str(e)}")
            return {
                'success': False,
                'message': 'Đã có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại sau.'
            }

    def is_healthy(self):
        """
        Check if the chatbot system is healthy
        """
        try:
            if trained_chatbot and trained_chatbot.model_loaded:
                return {
                    'status': 'healthy',
                    'model_loaded': True,
                    'tensorflow_available': trained_chatbot.tensorflow_available if hasattr(trained_chatbot, 'tensorflow_available') else False,
                    'message': 'Trained Healthcare ChatBot is operational'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'model_loaded': False,
                    'tensorflow_available': False,
                    'message': 'Trained model is not loaded'
                }
        except Exception as e:
            return {
                'status': 'error',
                'model_loaded': False,
                'tensorflow_available': False,
                'message': f'Error checking health: {str(e)}'
            }

    def get_appointment_state(self, session_id):
        """
        Get current appointment booking state for a session
        """
        if trained_chatbot and session_id in trained_chatbot.conversation_context:
            return trained_chatbot.conversation_context[session_id].get('appointment_state')
        return None

    def get_appointment_data(self, session_id):
        """
        Get current appointment data for a session
        """
        if trained_chatbot and session_id in trained_chatbot.conversation_context:
            return trained_chatbot.conversation_context[session_id].get('appointment_data', {})
        return {}

    def cancel_appointment_booking(self, session_id):
        """
        Cancel current appointment booking process
        """
        if trained_chatbot and session_id in trained_chatbot.conversation_context:
            trained_chatbot.conversation_context[session_id]['appointment_state'] = None
            trained_chatbot.conversation_context[session_id]['appointment_data'] = {}
            return True
        return False

# Convenience functions for backward compatibility
def get_bot_response(user_message, session_id=None, user_token=None):
    """
    Convenience function to get bot response
    """
    bot = HealthcareChatBot()
    return bot.get_bot_response(user_message, session_id, user_token)

def book_appointment(patient_name, phone_number, appointment_date, appointment_time, doctor_specialty, symptoms):
    """
    Convenience function to book appointment
    """
    bot = HealthcareChatBot()
    return bot.book_appointment(patient_name, phone_number, appointment_date, appointment_time, doctor_specialty, symptoms)

def get_conversation_history(session_id):
    """
    Convenience function to get conversation history
    """
    bot = HealthcareChatBot()
    return bot.get_conversation_history(session_id)

def clear_conversation(session_id):
    """
    Convenience function to clear conversation
    """
    bot = HealthcareChatBot()
    return bot.clear_conversation(session_id)

def is_chatbot_healthy():
    """
    Convenience function to check chatbot health
    """
    bot = HealthcareChatBot()
    return bot.is_healthy()

def get_appointment_state(session_id):
    """
    Convenience function to get appointment state
    """
    bot = HealthcareChatBot()
    return bot.get_appointment_state(session_id)

def get_appointment_data(session_id):
    """
    Convenience function to get appointment data
    """
    bot = HealthcareChatBot()
    return bot.get_appointment_data(session_id)

def cancel_appointment_booking(session_id):
    """
    Convenience function to cancel appointment booking
    """
    bot = HealthcareChatBot()
    return bot.cancel_appointment_booking(session_id)

# Initialize a default bot instance for backward compatibility
default_bot = HealthcareChatBot()

# Additional utility functions
def preprocess_user_input(user_input):
    """
    Clean and preprocess user input
    """
    if not user_input:
        return ""
    
    # Remove extra whitespace
    user_input = user_input.strip()
    
    # Remove multiple spaces
    user_input = re.sub(r'\s+', ' ', user_input)
    
    return user_input

def generate_session_id():
    """
    Generate a unique session ID
    """
    import uuid
    return str(uuid.uuid4())

def get_system_info():
    """
    Get system information
    """
    return {
        'chatbot_type': 'Enhanced Trained TensorFlow Healthcare ChatBot',
        'model_path': 'training_model.h5',
        'language': 'Vietnamese',
        'features': [
            'Seq2Seq LSTM Model',
            'Vietnamese Text Processing', 
            'Healthcare Domain Specific',
            'Interactive Appointment Booking',
            'Multi-step Appointment Workflow',
            'API Integration (User Service, Appointment Service)',
            'Session-based Conversation Context',
            'Real-time Doctor/Time Slot Fetching',
            'Appointment Confirmation System'
        ],
        'appointment_booking': {
            'enabled': True,
            'workflow_steps': 7,
            'features': ['Doctor Selection', 'Date Selection', 'Time Slot Selection', 'Reason Entry', 'Confirmation']
        },
        'status': 'Active' if trained_chatbot and trained_chatbot.model_loaded else 'Inactive'
    }

# Test function
def test_chatbot():
    """
    Test the chatbot functionality including appointment booking
    """
    test_messages = [
        "Xin chào",
        "Tôi bị đau đầu",
        "Làm thế nào để đặt lịch hẹn?",
        "đặt lịch hẹn",
        "Cảm ơn bạn"
    ]
    
    print("🧪 Testing Enhanced Trained Healthcare ChatBot...")
    session_id = generate_session_id()
    
    for message in test_messages:
        try:
            response = get_bot_response(message, session_id)
            print(f"User: {message}")
            print(f"Bot: {response}")
            
            # Check appointment state
            appointment_state = get_appointment_state(session_id)
            if appointment_state:
                print(f"Appointment State: {appointment_state}")
                appointment_data = get_appointment_data(session_id)
                if appointment_data:
                    print(f"Appointment Data: {appointment_data}")
            
            print("-" * 50)
        except Exception as e:
            print(f"Error testing message '{message}': {str(e)}")
    
    # Test health check
    health = is_chatbot_healthy()
    print(f"Health Check: {health}")
    
    # Test system info
    info = get_system_info()
    print(f"System Info: {info}")

def test_appointment_workflow():
    """
    Test the complete appointment booking workflow
    """
    print("🏥 Testing Complete Appointment Booking Workflow...")
    session_id = generate_session_id()
    
    workflow_steps = [
        "đặt lịch hẹn",           # Start booking
        "1",                      # Select doctor 1
        "1",                      # Select first available date
        "1",                      # Select first time slot
        "Tôi bị đau đầu",        # Enter reason
        "có"                      # Confirm booking
    ]
    
    for i, message in enumerate(workflow_steps):
        try:
            print(f"\n📝 Step {i+1}: {message}")
            response = get_bot_response(message, session_id)
            print(f"Bot: {response}")
            
            # Show current state
            state = get_appointment_state(session_id)
            data = get_appointment_data(session_id)
            print(f"State: {state}")
            if data:
                print(f"Data: {data}")
                
        except Exception as e:
            print(f"Error in step {i+1}: {str(e)}")
    
    print("\n✅ Appointment workflow test completed!")

if __name__ == "__main__":
    print("🚀 Starting Healthcare ChatBot Tests...")
    test_chatbot()
    print("\n" + "="*60 + "\n")
    test_appointment_workflow()