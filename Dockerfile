# Stage 1: Build React frontend
FROM node:20-alpine AS frontend

WORKDIR /app

# Copy frontend package.json and install deps
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Python backend
FROM python:3.12-slim

WORKDIR /app

# Copy Python dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY server/ ./

# Copy frontend build into backend
COPY --from=frontend /app/dist ./dist

# Expose port
EXPOSE 8000

# Start Gunicorn
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:8000", "app:app", "--timeout", "120"]
