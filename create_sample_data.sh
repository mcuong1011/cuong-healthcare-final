#!/bin/bash

# Healthcare Microservices - Sample Data Creation Script
# Tạo dữ liệu mẫu cho hệ thống y tế microservices

set -e  # Exit on any error

echo "🏥 === HEALTHCARE MICROSERVICES SAMPLE DATA SETUP ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if service is running
check_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Checking if $service_name is running on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:$port/health/ > /dev/null 2>&1 || \
           curl -s -f http://localhost:$port/ > /dev/null 2>&1 || \
           nc -z localhost $port > /dev/null 2>&1; then
            print_success "$service_name is running on port $port"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_warning "$service_name not responding on port $port, continuing anyway..."
    return 1
}

# Function to run Django command with error handling
run_django_command() {
    local service_dir=$1
    local command=$2
    local description=$3
    
    print_status "$description"
    
    cd "$service_dir"
    
    if python manage.py $command; then
        print_success "✅ $description completed"
    else
        print_error "❌ Failed: $description"
        return 1
    fi
    
    cd - > /dev/null
}

# Main execution
main() {
    print_status "Starting sample data creation process..."
    
    # Get the script directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$SCRIPT_DIR"
    
    print_status "Project root: $PROJECT_ROOT"
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_error "docker-compose.yml not found. Please run this script from the project root."
        exit 1
    fi
    
    # Start services if not running
    print_status "Checking Docker services..."
    if ! docker-compose ps | grep -q "Up"; then
        print_status "Starting Docker services..."
        docker-compose up -d
        sleep 30  # Wait for services to start
    else
        print_success "Docker services are already running"
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    check_service "User Service" 8001
    check_service "Appointment Service" 8002
    
    # 1. Create users (doctors, patients, etc.)
    print_status "🧑‍⚕️ Creating sample users..."
    run_django_command "$PROJECT_ROOT/user_service" \
        "create_sample_users --doctors=15 --patients=100 --clear" \
        "Creating doctors, patients, nurses, and pharmacists"
    
    # Wait a bit for user service to be fully ready
    sleep 5
    
    # 2. Create appointments and schedules
    print_status "📅 Creating sample appointments..."
    run_django_command "$PROJECT_ROOT/appointment_service" \
        "create_sample_appointments --days=60 --appointments=200 --clear" \
        "Creating doctor schedules and sample appointments"
    
    # 3. Create clinical records (if clinical service has management command)
    if [ -d "$PROJECT_ROOT/clinical_service/records/management" ]; then
        print_status "🏥 Creating sample clinical records..."
        run_django_command "$PROJECT_ROOT/clinical_service" \
            "create_sample_records --records=150" \
            "Creating sample medical records"
    fi
    
    # 4. Create pharmacy data (if pharmacy service has management command)
    if [ -d "$PROJECT_ROOT/pharmacy_service/pharmacy/management" ]; then
        print_status "💊 Creating sample pharmacy data..."
        run_django_command "$PROJECT_ROOT/pharmacy_service" \
            "create_sample_prescriptions --prescriptions=100" \
            "Creating sample prescriptions and medications"
    fi
    
    # 5. Create lab data (if lab service has management command)
    if [ -d "$PROJECT_ROOT/lab_service/lab/management" ]; then
        print_status "🧪 Creating sample lab data..."
        run_django_command "$PROJECT_ROOT/lab_service" \
            "create_sample_lab_tests --tests=80" \
            "Creating sample lab tests and results"
    fi
    
    # 6. Create insurance data (if insurance service has management command)
    if [ -d "$PROJECT_ROOT/insurance_service/insurance/management" ]; then
        print_status "🛡️ Creating sample insurance data..."
        run_django_command "$PROJECT_ROOT/insurance_service" \
            "create_sample_insurance_claims --claims=50" \
            "Creating sample insurance claims"
    fi
    
    print_success "🎉 Sample data creation completed successfully!"
    echo ""
    echo "📊 Summary of created data:"
    echo "  👨‍⚕️ Doctors: 15"
    echo "  👥 Patients: 100" 
    echo "  👩‍⚕️ Nurses: 5"
    echo "  💊 Pharmacists: 3"
    echo "  📅 Appointments: ~200"
    echo "  🏥 Medical Records: ~150"
    echo "  💊 Prescriptions: ~100"
    echo "  🧪 Lab Tests: ~80"
    echo "  🛡️ Insurance Claims: ~50"
    echo ""
    echo "🔐 Default login credentials:"
    echo "  Admin: admin / admin123"
    echo "  Doctors: doctor01-doctor15 / doctor123"
    echo "  Patients: patient001-patient100 / patient123"
    echo "  Nurses: nurse01-nurse05 / nurse123"
    echo "  Pharmacists: pharmacist01-pharmacist03 / pharmacist123"
    echo ""
    echo "🌐 Access the application:"
    echo "  Frontend: http://localhost:3000"
    echo "  API Gateway: http://localhost:8000"
    echo ""
    print_success "Ready to test the healthcare system! 🏥✨"
}

# Handle script interruption
trap 'print_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
