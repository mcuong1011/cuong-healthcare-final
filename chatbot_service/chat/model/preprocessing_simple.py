import re
import os
from .utils import clean_data

# Dummy variables for compatibility - these would normally come from model training
max_encoder_seq_length = 100
num_encoder_tokens = 5000
input_features_dict = {}

def initialize_preprocessing():
    """Initialize preprocessing variables if needed"""
    global max_encoder_seq_length, num_encoder_tokens, input_features_dict
    
    # These would normally be loaded from a trained model
    max_encoder_seq_length = 100
    num_encoder_tokens = 5000
    input_features_dict = {}
    
    return max_encoder_seq_length, num_encoder_tokens, input_features_dict

# Initialize on import
initialize_preprocessing()
