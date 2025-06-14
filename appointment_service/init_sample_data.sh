#!/bin/bash

# Script to initialize sample data when containers start
# This runs inside Docker containers

echo "🚀 Healthcare Microservices - Container Data Initialization"

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
python manage.py migrate --noinput

# Check if this is user_service
if [ -f "users/models.py" ]; then
    echo "👥 Initializing user service data..."
    
    # Check if admin user exists
    if python manage.py shell -c "from users.models import User; print('exists' if User.objects.filter(username='admin').exists() else 'not_exists')" | grep -q "not_exists"; then
        echo "🏥 Creating sample users..."
        python manage.py create_sample_users --doctors=15 --patients=100
    else
        echo "✅ Sample users already exist"
    fi
fi

# Check if this is appointment_service  
if [ -f "appointments/models.py" ]; then
    echo "📅 Initializing appointment service data..."
    
    # Wait for user service to be ready
    sleep 10
    
    # Check if appointments exist
    if python manage.py shell -c "from appointments.models import Appointment; print('exists' if Appointment.objects.exists() else 'not_exists')" | grep -q "not_exists"; then
        echo "📋 Creating sample appointments..."
        python manage.py create_sample_appointments --days=60 --appointments=200
    else
        echo "✅ Sample appointments already exist"
    fi
fi

# Check if this is clinical_service
if [ -f "records/models.py" ]; then
    echo "🏥 Initializing clinical service data..."
    
    # Wait for other services
    sleep 15
    
    # Check if medical records exist
    if python manage.py shell -c "from records.models import MedicalRecord; print('exists' if MedicalRecord.objects.exists() else 'not_exists')" | grep -q "not_exists"; then
        echo "📋 Creating sample medical records..."
        python manage.py create_sample_records --records=150
    else
        echo "✅ Sample medical records already exist"
    fi
fi

echo "✅ Container data initialization completed"
