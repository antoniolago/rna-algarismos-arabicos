# Use the official PyTorch image as the base image
FROM pytorch/pytorch:1.13.1-cuda11.6-cudnn8-runtime

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app


# Install required Python packages
RUN pip install --no-cache-dir numpy pillow glob2 torchvision flask

# Run the application
CMD ["python", "./main.py"]