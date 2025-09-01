
FROM python:3.12-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Run your Gunicorn command
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app", "--timeout", "120"]