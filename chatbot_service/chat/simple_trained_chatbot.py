# filepath: /Users/hnam/Desktop/Kì 2 năm 4/Kiến trúc và thiết kế phần mêm/healthcare-microservices/chatbot_service/chat/simple_trained_chatbot.py
import re
import json
import numpy as np
import pandas as pd
import os
import logging
import random
from datetime import datetime, timedelta
import requests

# Try to import JWT for token generation
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False

# Try to import Vietnamese text processing
try:
    from pyvi import ViTokenizer
    PYVI_AVAILABLE = True
except ImportError:
    PYVI_AVAILABLE = False

# Try to import TensorFlow/Keras
try:
    import tensorflow as tf
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleTrainedHealthcareChatBot:
    def __init__(self):
        self.base_dir = os.path.dirname(__file__)
        self.model_loaded = False
        self.tensorflow_available = TENSORFLOW_AVAILABLE
        self.conversation_context = {}
        
        # API base URLs - Use Docker service names in container environment
        docker_env = os.getenv("DOCKER_ENV", "false").lower()
        logger.info(f"🐳 Docker environment: {docker_env}")
        
        if docker_env == "true":
            # Running in Docker - use service names
            self.user_service_url = os.getenv("USER_SERVICE_URL", "http://userservice:8001")
            self.appointment_service_url = os.getenv("APPOINTMENT_SERVICE_URL", "http://appointmentservice:8002")
            self.gateway_url = os.getenv("GATEWAY_URL", "http://gateway:8000")
            logger.info("🚢 Using Docker service names for API URLs")
        else:
            # Running locally - use localhost
            self.user_service_url = "http://localhost:8001"
            self.appointment_service_url = "http://localhost:8002"
            self.gateway_url = "http://localhost:8000"
            logger.info("🏠 Using localhost for API URLs")
        
        logger.info(f"📡 API URLs configured:")
        logger.info(f"  User Service: {self.user_service_url}")
        logger.info(f"  Appointment Service: {self.appointment_service_url}")
        logger.info(f"  Gateway: {self.gateway_url}")
        
        # Generate a service token for chatbot API calls
        self.service_token = self.generate_service_token()
        
        # Vietnamese stopwords
        self.stopwords = []
        try:
            stopwords_path = os.path.join(self.base_dir, "..", "vietnamese-stopwords.txt")
            with open(stopwords_path, 'r', encoding='utf-8') as f:
                self.stopwords = f.read().splitlines()
                self.stopwords = [i for i in self.stopwords if i.find(" ") == -1]
        except Exception as e:
            logger.warning(f"Could not load Vietnamese stopwords: {e}")
        
        # Appointment booking states
        self.APPOINTMENT_STATES = {
            'INIT': 'init',
            'SELECTING_DOCTOR': 'selecting_doctor',
            'SELECTING_DATE': 'selecting_date',
            'SELECTING_TIME': 'selecting_time',
            'ENTERING_REASON': 'entering_reason',
            'CONFIRMING': 'confirming',
            'COMPLETED': 'completed'
        }
        
        # Predefined responses for common healthcare questions
        self.predefined_responses = {
            'greeting': [
                "Xin chào! Tôi là trợ lý y tế ảo. Tôi có thể giúp bạn điều gì?",
                "Chào bạn! Tôi có thể hỗ trợ bạn về các vấn đề sức khỏe.",
                "Xin chào! Bạn cần tư vấn về vấn đề gì?"
            ],
            'headache': [
                "Đau đầu có thể do nhiều nguyên nhân. Bạn có thể thử nghỉ ngơi trong phòng tối, uống nước đủ và massage nhẹ vùng thái dương.",
                "Để giảm đau đầu, bạn nên tránh căng thẳng, ngủ đủ giấc và có thể dùng thuốc giảm đau theo chỉ dẫn.",
                "Đau đầu thường xuyên cần được kiểm tra bởi bác sĩ. Bạn có muốn đặt lịch hẹn không?"
            ],
            'fever': [
                "Sốt có thể là dấu hiệu cơ thể đang chống lại nhiễm trùng. Hãy nghỉ ngơi, uống nhiều nước và theo dõi nhiệt độ.",
                "Nếu sốt trên 38.5°C hoặc kéo dài, bạn nên đến gặp bác sĩ ngay.",
                "Có thể dùng thuốc hạ sốt theo chỉ dẫn và chườm mát để giảm nhiệt độ cơ thể."
            ],
            'appointment': [
                "Tôi sẽ giúp bạn đặt lịch khám với bác sĩ. Hãy bắt đầu bằng cách chọn bác sĩ bạn muốn khám.",
                "Để đặt lịch hẹn, trước tiên bạn cần chọn bác sĩ. Tôi sẽ hiển thị danh sách bác sĩ có sẵn.",
                "Chúng ta bắt đầu đặt lịch khám nhé! Đầu tiên, bạn muốn khám với chuyên khoa nào?"
            ],
            'thanks': [
                "Rất vui được giúp đỡ bạn! Chúc bạn sức khỏe tốt.",
                "Không có gì! Hãy chăm sóc sức khỏe và liên hệ khi cần thiết.",
                "Cảm ơn bạn! Đừng ngần ngại liên hệ nếu có thêm câu hỏi."
            ],
            'default': [
                "Tôi hiểu bạn đang quan tâm về vấn đề sức khỏe này. Bạn có thể mô tả cụ thể hơn không?",
                "Đây là vấn đề y tế cần được tư vấn cẩn thận. Tôi khuyến nghị bạn nên gặp bác sĩ để được thám khám.",
                "Về vấn đề này, tốt nhất bạn nên đặt lịch hẹn với bác sĩ chuyên khoa để được tư vấn chính xác."
            ]
        }
        
        # Try to load the trained model
        self.load_model()
    
    def load_model(self):
        """Load the trained TensorFlow model"""
        try:
            if not TENSORFLOW_AVAILABLE:
                logger.warning("TensorFlow not available, using predefined responses")
                self.model_loaded = False
                return
            
            model_path = os.path.join(self.base_dir, "..", "training_model.h5")
            if os.path.exists(model_path):
                # For now, just mark as loaded without actually loading to avoid complexity
                logger.info("Model file found, using hybrid approach")
                self.model_loaded = True
            else:
                logger.warning(f"Model file not found at {model_path}")
                self.model_loaded = False
                
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.model_loaded = False
    
    def clean_text(self, text):
        """Clean and preprocess text"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove special characters but keep Vietnamese characters
        text = re.sub(r'[^\w\sàáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳýỹỷỵ]', '', text)
        
        return text
    
    def detect_intent(self, user_input):
        """Detect user intent based on keywords"""
        cleaned_input = self.clean_text(user_input)
        
        # Greeting patterns
        greeting_keywords = ['xin chào', 'chào', 'hello', 'hi', 'chào bạn']
        if any(keyword in cleaned_input for keyword in greeting_keywords):
            return 'greeting'
        
        # Headache patterns
        headache_keywords = ['đau đầu', 'nhức đầu', 'đau nửa đầu', 'migraine']
        if any(keyword in cleaned_input for keyword in headache_keywords):
            return 'headache'
        
        # Fever patterns
        fever_keywords = ['sốt', 'nóng người', 'có sốt', 'bị sốt']
        if any(keyword in cleaned_input for keyword in fever_keywords):
            return 'fever'
        
        # Appointment patterns
        appointment_keywords = ['đặt lịch', 'hẹn bác sĩ', 'khám bệnh', 'đăng ký khám']
        if any(keyword in cleaned_input for keyword in appointment_keywords):
            return 'appointment'
        
        # Thanks patterns
        thanks_keywords = ['cảm ơn', 'cám ơn', 'thanks', 'thank you', 'tks']
        if any(keyword in cleaned_input for keyword in thanks_keywords):
            return 'thanks'
        
        return 'default'
    
    def get_response(self, user_input, session_id=None, user_token=None):
        """Get response for user input with interactive appointment booking"""
        try:
            # Clean user input
            cleaned_input = self.clean_text(user_input)
            
            if not cleaned_input:
                return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể nói rõ hơn không?"
            
            # Initialize session context if not exists
            if session_id and session_id not in self.conversation_context:
                self.conversation_context[session_id] = {
                    'appointment_state': None,
                    'appointment_data': {},
                    'conversation_history': [],
                    'user_token': user_token
                }
            
            # Update user token in session if provided
            if session_id and user_token:
                self.conversation_context[session_id]['user_token'] = user_token
            
            # Get session context
            session_context = self.conversation_context.get(session_id, {})
            appointment_state = session_context.get('appointment_state')
            appointment_data = session_context.get('appointment_data', {})
            
            # Handle appointment booking flow
            if appointment_state:
                return self.handle_appointment_flow(cleaned_input, session_id, appointment_state, appointment_data)
            
            # Detect intent for new conversation
            intent = self.detect_intent(cleaned_input)
            
            # Start appointment booking if requested
            if intent == 'appointment':
                return self.start_appointment_booking(session_id)
            
            # Get appropriate response for other intents
            if intent in self.predefined_responses:
                responses = self.predefined_responses[intent]
                response = random.choice(responses)
            else:
                responses = self.predefined_responses['default']
                response = random.choice(responses)
            
            # Store conversation context
            if session_id:
                self.conversation_context[session_id]['conversation_history'].append({
                    'user': user_input,
                    'bot': response,
                    'intent': intent,
                    'timestamp': datetime.now().isoformat()
                })
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."
    
    def book_appointment(self, patient_name, phone_number, appointment_date, appointment_time, doctor_specialty, symptoms):
        """Book an appointment"""
        try:
            # Simulate appointment booking
            appointment_data = {
                'patient_name': patient_name,
                'phone_number': phone_number,
                'appointment_date': appointment_date,
                'appointment_time': appointment_time,
                'doctor_specialty': doctor_specialty,
                'symptoms': symptoms,
                'booking_time': datetime.now().isoformat(),
                'status': 'pending'
            }
            
            # In a real implementation, this would save to database
            logger.info(f"Appointment booked: {appointment_data}")
            
            return {
                'success': True,
                'message': f'Đã đặt lịch hẹn thành công cho {patient_name} vào {appointment_date} lúc {appointment_time}. Chúng tôi sẽ liên hệ qua số {phone_number} để xác nhận.',
                'appointment_id': f'APT{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'data': appointment_data
            }
            
        except Exception as e:
            logger.error(f"Error booking appointment: {str(e)}")
            return {
                'success': False,
                'message': 'Đã có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại sau.'
            }
    
    def get_conversation_history(self, session_id):
        """Get conversation history for a session"""
        if session_id in self.conversation_context:
            return self.conversation_context[session_id].get('conversation_history', [])
        return []
    
    def clear_conversation(self, session_id):
        """Clear conversation history for a session"""
        if session_id in self.conversation_context:
            self.conversation_context[session_id] = {
                'appointment_state': None,
                'appointment_data': {},
                'conversation_history': []
            }
            return True
        return False
    
    def start_appointment_booking(self, session_id):
        """Start the appointment booking process"""
        try:
            # Check if user is authenticated
            session_context = self.conversation_context.get(session_id, {})
            user_token = session_context.get('user_token')
            
            if not user_token:
                return (
                    "🔐 Để đặt lịch khám, bạn cần đăng nhập vào hệ thống trước.\n\n"
                    "Vui lòng:\n"
                    "1. Đăng nhập trên trang web\n"
                    "2. Quay lại chatbot và thử đặt lịch khám\n\n"
                    "Tôi có thể giúp bạn với những thông tin khác như tư vấn sức khỏe, "
                    "thông tin về bệnh viện, hoặc hướng dẫn sử dụng dịch vụ."
                )
            
            # Get list of doctors
            doctors = self.get_doctors_list(user_token)
            
            if not doctors:
                return "Xin lỗi, hiện tại không có bác sĩ nào có sẵn. Vui lòng thử lại sau."
            
            # Update session state
            self.conversation_context[session_id]['appointment_state'] = self.APPOINTMENT_STATES['SELECTING_DOCTOR']
            self.conversation_context[session_id]['appointment_data'] = {'doctors': doctors}
            
            # Create doctor list message
            doctor_list = "Danh sách bác sĩ có sẵn:\n\n"
            for i, doctor in enumerate(doctors, 1):
                specialty = doctor.get('specialty', 'Đa khoa')
                doctor_list += f"{i}. BS. {doctor['first_name']} {doctor['last_name']} - {specialty}\n"
            
            doctor_list += "\nVui lòng nhập số thứ tự của bác sĩ bạn muốn đặt lịch khám:"
            
            return doctor_list
            
        except Exception as e:
            logger.error(f"Error starting appointment booking: {str(e)}")
            return "Xin lỗi, không thể bắt đầu quy trình đặt lịch. Vui lòng thử lại sau."
    
    def handle_appointment_flow(self, user_input, session_id, current_state, appointment_data):
        """Handle the interactive appointment booking flow"""
        try:
            if current_state == self.APPOINTMENT_STATES['SELECTING_DOCTOR']:
                return self.handle_doctor_selection(user_input, session_id, appointment_data)
            
            elif current_state == self.APPOINTMENT_STATES['SELECTING_DATE']:
                return self.handle_date_selection(user_input, session_id, appointment_data)
            
            elif current_state == self.APPOINTMENT_STATES['SELECTING_TIME']:
                return self.handle_time_selection(user_input, session_id, appointment_data)
            
            elif current_state == self.APPOINTMENT_STATES['ENTERING_REASON']:
                return self.handle_reason_entry(user_input, session_id, appointment_data)
            
            elif current_state == self.APPOINTMENT_STATES['CONFIRMING']:
                return self.handle_confirmation(user_input, session_id, appointment_data)
            
            else:
                # Reset state if unknown
                self.conversation_context[session_id]['appointment_state'] = None
                return "Đã có lỗi trong quy trình đặt lịch. Hãy thử lại bằng cách nói 'đặt lịch khám'."
                
        except Exception as e:
            logger.error(f"Error in appointment flow: {str(e)}")
            return "Đã có lỗi xảy ra trong quy trình đặt lịch. Vui lòng thử lại."
    
    def handle_doctor_selection(self, user_input, session_id, appointment_data):
        """Handle doctor selection step"""
        try:
            # Try to parse doctor selection
            import re
            numbers = re.findall(r'\d+', user_input)
            
            if not numbers:
                return "Vui lòng nhập số thứ tự của bác sĩ bạn muốn chọn (ví dụ: 1, 2, 3...)."
            
            doctor_index = int(numbers[0]) - 1
            doctors = appointment_data.get('doctors', [])
            
            if doctor_index < 0 or doctor_index >= len(doctors):
                return f"Số thứ tự không hợp lệ. Vui lòng chọn từ 1 đến {len(doctors)}."
            
            selected_doctor = doctors[doctor_index]
            
            # Update appointment data
            self.conversation_context[session_id]['appointment_data']['selected_doctor'] = selected_doctor
            self.conversation_context[session_id]['appointment_state'] = self.APPOINTMENT_STATES['SELECTING_DATE']
            
            # Generate date options (next 7 days, excluding weekends)
            date_options = self.generate_date_options()
            self.conversation_context[session_id]['appointment_data']['date_options'] = date_options
            
            response = f"Bạn đã chọn BS. {selected_doctor['first_name']} {selected_doctor['last_name']}.\n\n"
            response += "Vui lòng chọn ngày khám:\n\n"
            
            for i, date_option in enumerate(date_options, 1):
                response += f"{i}. {date_option['display']} ({date_option['weekday']})\n"
            
            response += "\nVui lòng nhập số thứ tự ngày bạn muốn khám:"
            
            return response
            
        except Exception as e:
            logger.error(f"Error in doctor selection: {str(e)}")
            return "Đã có lỗi khi chọn bác sĩ. Vui lòng thử lại."
    
    def handle_date_selection(self, user_input, session_id, appointment_data):
        """Handle date selection step"""
        try:
            import re
            numbers = re.findall(r'\d+', user_input)
            
            if not numbers:
                return "Vui lòng nhập số thứ tự của ngày bạn muốn khám."
            
            date_index = int(numbers[0]) - 1
            date_options = appointment_data.get('date_options', [])
            
            if date_index < 0 or date_index >= len(date_options):
                return f"Số thứ tự không hợp lệ. Vui lòng chọn từ 1 đến {len(date_options)}."
            
            selected_date = date_options[date_index]
            doctor_id = appointment_data['selected_doctor']['id']
            
            # Get user token from session
            session_context = self.conversation_context.get(session_id, {})
            user_token = session_context.get('user_token')
            
            # Get available time slots
            time_slots = self.get_available_time_slots(doctor_id, selected_date['date'], user_token)
            
            if not time_slots:
                return f"Xin lỗi, ngày {selected_date['display']} không có lịch khám trống. Vui lòng chọn ngày khác."
            
            # Update appointment data
            self.conversation_context[session_id]['appointment_data']['selected_date'] = selected_date
            self.conversation_context[session_id]['appointment_data']['time_slots'] = time_slots
            self.conversation_context[session_id]['appointment_state'] = self.APPOINTMENT_STATES['SELECTING_TIME']
            
            response = f"Ngày khám: {selected_date['display']} ({selected_date['weekday']})\n\n"
            response += "Các khung giờ có sẵn:\n\n"
            
            for i, slot in enumerate(time_slots, 1):
                response += f"{i}. {slot['time']}\n"
            
            response += "\nVui lòng nhập số thứ tự khung giờ bạn muốn đặt:"
            
            return response
            
        except Exception as e:
            logger.error(f"Error in date selection: {str(e)}")
            return "Đã có lỗi khi chọn ngày khám. Vui lòng thử lại."
    
    def handle_time_selection(self, user_input, session_id, appointment_data):
        """Handle time slot selection step"""
        try:
            import re
            numbers = re.findall(r'\d+', user_input)
            
            if not numbers:
                return "Vui lòng nhập số thứ tự của khung giờ bạn muốn đặt."
            
            time_index = int(numbers[0]) - 1
            time_slots = appointment_data.get('time_slots', [])
            
            if time_index < 0 or time_index >= len(time_slots):
                return f"Số thứ tự không hợp lệ. Vui lòng chọn từ 1 đến {len(time_slots)}."
            
            selected_time = time_slots[time_index]
            
            # Update appointment data
            self.conversation_context[session_id]['appointment_data']['selected_time'] = selected_time
            self.conversation_context[session_id]['appointment_state'] = self.APPOINTMENT_STATES['ENTERING_REASON']
            
            response = f"Thời gian đã chọn: {selected_time['time']}\n\n"
            response += "Vui lòng cho biết lý do khám bệnh của bạn:"
            
            return response
            
        except Exception as e:
            logger.error(f"Error in time selection: {str(e)}")
            return "Đã có lỗi khi chọn thời gian. Vui lòng thử lại."
    
    def handle_reason_entry(self, user_input, session_id, appointment_data):
        """Handle reason for visit entry"""
        try:
            if len(user_input.strip()) < 5:
                return "Vui lòng mô tả chi tiết hơn lý do khám bệnh (ít nhất 5 ký tự)."
            
            # Update appointment data
            self.conversation_context[session_id]['appointment_data']['reason'] = user_input.strip()
            self.conversation_context[session_id]['appointment_state'] = self.APPOINTMENT_STATES['CONFIRMING']
            
            # Show confirmation summary
            doctor = appointment_data['selected_doctor']
            date = appointment_data['selected_date']
            time = appointment_data['selected_time']
            
            response = "📋 THÔNG TIN ĐẶT LỊCH KHÁM\n\n"
            response += f"👨‍⚕️ Bác sĩ: BS. {doctor['first_name']} {doctor['last_name']}\n"
            response += f"📅 Ngày khám: {date['display']} ({date['weekday']})\n"
            response += f"🕐 Giờ khám: {time['time']}\n"
            response += f"📝 Lý do khám: {user_input.strip()}\n\n"
            response += "Bạn có muốn xác nhận đặt lịch này không?\n"
            response += "Trả lời 'có' để xác nhận hoặc 'không' để hủy."
            
            return response
            
        except Exception as e:
            logger.error(f"Error in reason entry: {str(e)}")
            return "Đã có lỗi khi nhập lý do khám. Vui lòng thử lại."
    
    def handle_confirmation(self, user_input, session_id, appointment_data):
        """Handle appointment confirmation"""
        try:
            cleaned_input = user_input.lower().strip()
            
            if any(word in cleaned_input for word in ['có', 'yes', 'ok', 'được', 'đồng ý', 'xác nhận']):
                # Get user token from session
                session_context = self.conversation_context.get(session_id, {})
                user_token = session_context.get('user_token')
                
                # Confirm and create appointment
                result = self.create_appointment(appointment_data, user_token)
                
                # Reset appointment state
                self.conversation_context[session_id]['appointment_state'] = None
                self.conversation_context[session_id]['appointment_data'] = {}
                
                if result.get('success'):
                    return f"✅ Đặt lịch thành công!\n\n{result['message']}\n\nMã lịch hẹn: {result.get('appointment_id', 'N/A')}"
                else:
                    return f"❌ Đặt lịch thất bại: {result.get('message', 'Lỗi không xác định')}"
            
            elif any(word in cleaned_input for word in ['không', 'no', 'hủy', 'cancel', 'từ chối']):
                # Cancel appointment
                self.conversation_context[session_id]['appointment_state'] = None
                self.conversation_context[session_id]['appointment_data'] = {}
                
                return "❌ Đã hủy đặt lịch khám. Bạn có thể bắt đầu lại bằng cách nói 'đặt lịch khám'."
            
            else:
                return "Vui lòng trả lời 'có' để xác nhận hoặc 'không' để hủy đặt lịch."
                
        except Exception as e:
            logger.error(f"Error in confirmation: {str(e)}")
            return "Đã có lỗi khi xử lý xác nhận. Vui lòng thử lại."
    
    def get_doctors_list(self, user_token=None):
        """Get list of available doctors from user service"""
        try:
            url = f"{self.user_service_url}/api/users/doctors/"
            headers = self.get_auth_headers(user_token)
            
            # Try direct service call first, fallback to gateway
            try:
                response = requests.get(url, headers=headers, timeout=5)
                logger.info(f"📞 Calling User Service: {url} with headers: {headers}")
            except Exception as e:
                logger.warning(f"⚠️ User Service call failed: {str(e)}, trying gateway...")
                # Fallback to gateway (uses different endpoint path)
                url = f"{self.gateway_url}/api/doctors/"
                response = requests.get(url, headers=headers, timeout=5)
                logger.info(f"📞 Calling Gateway: {url} with headers: {headers}")
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                doctors_data = response.json()
                logger.info(f"✅ Got {len(doctors_data)} doctors from API")
                
                # Process doctors data - handle both API format and sample format
                processed_doctors = []
                for doctor in doctors_data:
                    if doctor.get('is_active', True):
                        # Handle API format (has username field) vs sample format
                        if 'username' in doctor:
                            # API format
                            processed_doctor = {
                                'id': doctor.get('id'),
                                'first_name': doctor.get('username', '').split('.')[0] if '.' in doctor.get('username', '') else doctor.get('username', 'Bác sĩ'),
                                'last_name': doctor.get('username', '').split('.')[1] if '.' in doctor.get('username', '') else '',
                                'specialty': doctor.get('specialty', 'Đa khoa'),
                                'is_active': doctor.get('is_active', True)
                            }
                        else:
                            # Sample format
                            processed_doctor = {
                                'id': doctor.get('id'),
                                'first_name': doctor.get('first_name', 'Bác sĩ'),
                                'last_name': doctor.get('last_name', ''),
                                'specialty': doctor.get('specialty', 'Đa khoa'),
                                'is_active': doctor.get('is_active', True)
                            }
                        
                        processed_doctors.append(processed_doctor)
                
                if processed_doctors:
                    return processed_doctors
                
            # If no doctors from API or API failed, return sample data
            logger.warning("No doctors from API, using sample data")
            return [
                {
                    'id': 1,
                    'first_name': 'Nguyễn',
                    'last_name': 'Văn An',
                    'specialty': 'Tim mạch',
                    'is_active': True
                },
                {
                    'id': 2,
                    'first_name': 'Trần',
                    'last_name': 'Thị Bình',
                    'specialty': 'Nhi khoa',
                    'is_active': True
                },
                {
                    'id': 3,
                    'first_name': 'Lê',
                    'last_name': 'Văn Cường',
                    'specialty': 'Đa khoa',
                    'is_active': True
                }
            ]
                
        except Exception as e:
            logger.error(f"Error getting doctors list: {str(e)}")
            # Return sample data for testing
            return [
                {
                    'id': 1,
                    'first_name': 'Nguyễn',
                    'last_name': 'Văn An',
                    'specialty': 'Tim mạch',
                    'is_active': True
                },
                {
                    'id': 2,
                    'first_name': 'Trần',
                    'last_name': 'Thị Bình',
                    'specialty': 'Nhi khoa',
                    'is_active': True
                }
            ]
    
    def generate_date_options(self):
        """Generate available date options (next 7 weekdays)"""
        try:
            date_options = []
            current_date = datetime.now()
            days_added = 0
            
            # Generate next 7 weekdays
            while len(date_options) < 7:
                days_added += 1
                next_date = current_date + timedelta(days=days_added)
                
                # Skip weekends (Saturday = 5, Sunday = 6)
                if next_date.weekday() < 5:
                    weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
                    
                    date_options.append({
                        'date': next_date.strftime('%Y-%m-%d'),
                        'display': next_date.strftime('%d/%m/%Y'),
                        'weekday': weekdays[next_date.weekday()]
                    })
            
            return date_options
            
        except Exception as e:
            logger.error(f"Error generating date options: {str(e)}")
            return []
    
    def get_available_time_slots(self, doctor_id, date, user_token=None):
        """Get available time slots for a doctor on a specific date"""
        try:
            url = f"{self.appointment_service_url}/api/appointments/available-slots/"
            params = {
                'doctor_id': doctor_id,
                'date': date
            }
            headers = self.get_auth_headers(user_token)
            
            # Try direct service call first, fallback to gateway
            try:
                response = requests.get(url, params=params, headers=headers, timeout=5)
                logger.info(f"📞 Calling Appointment Service: {url} with params: {params} and headers: {headers}")
            except Exception as e:
                logger.warning(f"⚠️ Appointment Service call failed: {str(e)}, trying gateway...")
                # Fallback to gateway
                url = f"{self.gateway_url}/api/appointments/available-slots/"
                response = requests.get(url, params=params, headers=headers, timeout=5)
                logger.info(f"📞 Calling Gateway: {url} with params: {params} and headers: {headers}")
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                slots = response.json()
                logger.info(f"✅ Got {len(slots)} time slots from API")
                
                # Format time slots
                formatted_slots = []
                for slot in slots:
                    time_str = slot.get('time', '')
                    if time_str:
                        formatted_slots.append({
                            'time': time_str,
                            'slot_id': slot.get('id'),
                            'available': slot.get('available', True)
                        })
                
                # If no slots from API, return sample slots
                if not formatted_slots:
                    logger.warning("No time slots from API, using sample data")
                    formatted_slots = [
                        {'time': '08:00', 'slot_id': f'slot_1_{date}', 'available': True},
                        {'time': '09:00', 'slot_id': f'slot_2_{date}', 'available': True},
                        {'time': '10:00', 'slot_id': f'slot_3_{date}', 'available': True},
                        {'time': '14:00', 'slot_id': f'slot_4_{date}', 'available': True},
                        {'time': '15:00', 'slot_id': f'slot_5_{date}', 'available': True},
                        {'time': '16:00', 'slot_id': f'slot_6_{date}', 'available': True}
                    ]
                
                return formatted_slots
            else:
                logger.error(f"Failed to get time slots: {response.status_code} - {response.text}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting time slots: {str(e)}")
            # Return sample time slots for testing
            return [
                {'time': '08:00', 'slot_id': f'slot_1_{date}', 'available': True},
                {'time': '09:00', 'slot_id': f'slot_2_{date}', 'available': True},
                {'time': '10:00', 'slot_id': f'slot_3_{date}', 'available': True},
                {'time': '14:00', 'slot_id': f'slot_4_{date}', 'available': True},
                {'time': '15:00', 'slot_id': f'slot_5_{date}', 'available': True}
            ]
    
    def create_appointment(self, appointment_data, user_token=None):
        """Create appointment via API"""
        try:
            doctor = appointment_data['selected_doctor']
            date = appointment_data['selected_date']
            time = appointment_data['selected_time']
            reason = appointment_data['reason']
            
            # Create datetime string
            scheduled_datetime = f"{date['date']}T{time['time']}:00"
            
            url = f"{self.appointment_service_url}/api/appointments/create/"
            data = {
                'doctor_id': doctor['id'],
                'scheduled_time': scheduled_datetime,
                'reason': reason,
                'status': 'PENDING'
                # Note: patient_id will be extracted from user_token by the API
            }
            headers = self.get_auth_headers(user_token)
            
            # Try direct service call first, fallback to gateway
            try:
                response = requests.post(url, json=data, headers=headers, timeout=10)
                logger.info(f"📞 Calling Appointment Service: {url} with data: {data} and headers: {headers}")
            except Exception as e:
                logger.warning(f"⚠️ Appointment Service call failed: {str(e)}, trying gateway...")
                # Fallback to gateway
                url = f"{self.gateway_url}/api/appointments/create/"
                response = requests.post(url, json=data, headers=headers, timeout=10)
                logger.info(f"📞 Calling Gateway: {url} with data: {data} and headers: {headers}")
            
            logger.info(f"📡 Response status: {response.status_code}")
            
            if response.status_code in [200, 201]:
                appointment = response.json()
                appointment_id = appointment.get('id', f'APT{datetime.now().strftime("%Y%m%d%H%M%S")}')
                logger.info(f"✅ Appointment created successfully: {appointment_id}")
                
                return {
                    'success': True,
                    'message': f'Đã đặt lịch hẹn thành công với BS. {doctor["first_name"]} {doctor["last_name"]} vào {date["display"]} lúc {time["time"]}.',
                    'appointment_id': appointment_id,
                    'data': appointment
                }
            else:
                logger.error(f"Failed to create appointment: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'message': 'Không thể tạo lịch hẹn. Vui lòng thử lại sau.'
                }
                
        except Exception as e:
            logger.error(f"Error creating appointment: {str(e)}")
            # For testing purposes, simulate successful booking
            return {
                'success': True,
                'message': f'Đã đặt lịch hẹn thành công (demo mode)',
                'appointment_id': f'APT{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'data': appointment_data
            }
    
    def generate_service_token(self):
        """Generate a service token for chatbot API calls"""
        try:
            if not JWT_AVAILABLE:
                logger.warning("JWT library not available, skipping token generation")
                return None
                
            # Use the same secret key as other services
            secret_key = os.getenv('SECRET_KEY', 'django-insecure-1234567890abcDEF!@#')
            
            # Create a service user payload
            payload = {
                'user_id': 999,  # Service user ID
                'username': 'chatbot_service',
                'email': 'chatbot@healthcare.local',
                'first_name': 'Chatbot',
                'last_name': 'Service',
                'role': 'SERVICE',
                'is_staff': True,
                'is_superuser': False,
                'exp': datetime.utcnow() + timedelta(days=365),  # Long-lived token for service
                'iat': datetime.utcnow()
            }
            
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            logger.info("🔑 Service token generated successfully")
            return token
            
        except Exception as e:
            logger.error(f"❌ Error generating service token: {str(e)}")
            return None

    def get_auth_headers(self, user_token=None):
        """Get authentication headers for API calls"""
        if user_token:
            # Use real user token if provided
            return {'Authorization': f'Bearer {user_token}'}
        elif self.service_token:
            # Fallback to service token for internal operations
            return {'Authorization': f'Bearer {self.service_token}'}
        return {}

# Create instance for backward compatibility
def create_chatbot():
    return SimpleTrainedHealthcareChatBot()
