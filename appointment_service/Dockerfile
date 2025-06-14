FROM python:3.10-slim

WORKDIR /app
COPY . .
# Copy initialization script
COPY ../init_sample_data.sh ./init_sample_data.sh
RUN chmod +x ./init_sample_data.sh

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 8002
CMD ["sh", "-c", "./init_sample_data.sh && python manage.py runserver 0.0.0.0:8002"]
