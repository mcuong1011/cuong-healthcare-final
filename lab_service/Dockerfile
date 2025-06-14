FROM python:3.10-slim

WORKDIR /app
COPY . .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

EXPOSE 8004
CMD ["python", "manage.py", "runserver", "0.0.0.0:8004"]
