FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN addgroup --system shadowbytes && adduser --system --ingroup shadowbytes shadowbytes

COPY --chown=shadowbytes:shadowbytes . .

USER shadowbytes
