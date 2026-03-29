FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY services/parser/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY services/parser/ ./
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
