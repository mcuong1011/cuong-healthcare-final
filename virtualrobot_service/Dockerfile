# Base Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose Django port
EXPOSE 8010

# Run server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8010"]
