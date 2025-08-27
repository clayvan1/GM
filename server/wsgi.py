from app import app

# Expose the app for Gunicorn
if __name__ == "__main__":
    app.run()
