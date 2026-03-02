FROM python:3.12-alpine AS builder

WORKDIR /install

COPY requirements.txt .
RUN pip install --upgrade pip 
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt


FROM python:3.12-alpine

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 

COPY --from=builder /install /usr/local
COPY . .

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "backend.asgi:application"]