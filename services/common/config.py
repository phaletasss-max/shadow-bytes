from os import getenv

JWT_SECRET = getenv("JWT_SECRET", "replace-this-demo-secret-before-deploying")
JWT_ALGORITHM = "HS256"
INTERNAL_API_KEY = getenv("INTERNAL_API_KEY", "replace-this-internal-demo-key")
RABBITMQ_URL = getenv(
    "RABBITMQ_URL", "amqp://shadowbytes:shadowbytes@rabbitmq:5672/"
)

PRODUCT_SERVICE_URL = getenv("PRODUCT_SERVICE_URL", "http://product-service:8000")
INVENTORY_SERVICE_URL = getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8000")
PAYMENT_SERVICE_URL = getenv("PAYMENT_SERVICE_URL", "http://payment-service:8000")

