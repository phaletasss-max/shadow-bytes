from decimal import Decimal

from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

app = FastAPI(title="ShadowBytes Product Service", version="0.1.0")


class Product(BaseModel):
    id: str
    name: str
    description: str
    price: Decimal
    category: str


PRODUCTS = {
    "product-laptop": Product(
        id="product-laptop",
        name="Laptop Shadow 14\"",
        description="Equipo de demostración para pedidos de mayor valor.",
        price=Decimal("2499.00"),
        category="Computación",
    ),
    "product-keyboard": Product(
        id="product-keyboard",
        name="Teclado Byte Mini",
        description="Teclado mecánico compacto para la tienda demo.",
        price=Decimal("189.00"),
        category="Periféricos",
    ),
    "product-mouse": Product(
        id="product-mouse",
        name="Mouse Vector",
        description="Mouse inalámbrico para simular compras rápidas.",
        price=Decimal("99.00"),
        category="Periféricos",
    ),
}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"service": "product-service", "status": "UP"}


@app.get("/products", response_model=list[Product])
async def list_products() -> list[Product]:
    return list(PRODUCTS.values())


@app.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str) -> Product:
    product = PRODUCTS.get(product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product

