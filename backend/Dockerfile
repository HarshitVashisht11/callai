FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Avoid generating .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system deps (git is sometimes needed for private deps)
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code
COPY backend/ /app/

EXPOSE 8000

# Use uvicorn for production; override CMD in docker-compose if needed
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]