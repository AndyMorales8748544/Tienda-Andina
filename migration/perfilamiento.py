import csv
import json
import re
from pathlib import Path
from collections import Counter
from datetime import datetime
from decimal import Decimal, InvalidOperation

BASE = Path(__file__).resolve().parent
ORIGEN = BASE / "origen"
SALIDA = BASE / "salida"

SALIDA.mkdir(exist_ok=True)


def leer_csv(nombre):
    with open(
        ORIGEN / nombre,
        encoding="utf-8-sig",
        newline=""
    ) as archivo:
        return list(csv.DictReader(archivo))


def duplicados(registros, campo):
    valores = [
        fila[campo].strip().lower()
        for fila in registros
        if fila[campo].strip()
    ]

    return {
        valor: cantidad
        for valor, cantidad in Counter(valores).items()
        if cantidad > 1
    }


def email_valido(email):
    return bool(re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+",
        email.strip()
    ))


def fecha_valida(fecha):
    try:
        datetime.strptime(fecha.strip(), "%m/%d/%Y")
        return True
    except ValueError:
        return False


def clasificar_precio(valor):
    if not valor.strip():
        return "vacio"

    try:
        precio = Decimal(valor.strip())

        if not precio.is_finite():
            return "invalido"

        if precio < 0:
            return "negativo"

        return "valido"

    except InvalidOperation:
        return "invalido"


def clasificar_stock(valor):
    if not valor.strip():
        return "vacio"

    try:
        stock = int(valor.strip())

        if stock < 0:
            return "negativo"

        return "valido"

    except ValueError:
        return "invalido"


def perfilar_productos(registros):
    precios = Counter(
        clasificar_precio(fila["precio"])
        for fila in registros
    )

    stocks = Counter(
        clasificar_stock(fila["stock"])
        for fila in registros
    )

    return {
        "total_registros": len(registros),
        "sku_vacios": sum(
            not f["sku"].strip() for f in registros
        ),
        "sku_duplicados": len(
            duplicados(registros, "sku")
        ),
        "nombres_vacios": sum(
            not f["nombre"].strip() for f in registros
        ),
        "categorias_vacias": sum(
            not f["categoria"].strip() for f in registros
        ),
        "precios_vacios": precios["vacio"],
        "precios_negativos": precios["negativo"],
        "precios_invalidos": precios["invalido"],
        "stock_vacio": stocks["vacio"],
        "stock_negativo": stocks["negativo"],
        "stock_invalido": stocks["invalido"],
        "proveedores_vacios": sum(
            not f["proveedor"].strip() for f in registros
        )
    }


def perfilar_clientes(registros):
    return {
        "total_registros": len(registros),
        "id_vacios": sum(
            not f["id_cliente"].strip() for f in registros
        ),
        "id_duplicados": len(
            duplicados(registros, "id_cliente")
        ),
        "nombres_vacios": sum(
            not f["nombre"].strip() for f in registros
        ),
        "apellidos_vacios": sum(
            not f["apellido"].strip() for f in registros
        ),
        "emails_vacios": sum(
            not f["email"].strip() for f in registros
        ),
        "emails_invalidos": sum(
            bool(f["email"].strip())
            and not email_valido(f["email"])
            for f in registros
        ),
        "grupos_emails_duplicados": len(
            duplicados(registros, "email")
        ),
        "telefonos_vacios": sum(
            not f["telefono"].strip() for f in registros
        ),
        "telefonos_invalidos": sum(
            bool(f["telefono"].strip())
            and not re.fullmatch(
                r"9\d{8}", f["telefono"].strip()
            )
            for f in registros
        ),
        "distritos_vacios": sum(
            not f["distrito"].strip() for f in registros
        ),
        "fechas_invalidas": sum(
            not fecha_valida(f["fecha_registro"])
            for f in registros
        )
    }


def imprimir_resultados(titulo, resultados):
    print("\n" + "=" * 55)
    print(titulo)
    print("=" * 55)

    for campo, valor in resultados.items():
        print(f"{campo.replace('_', ' '):35}: {valor}")


productos = leer_csv("productos(in).csv")
clientes = leer_csv("clientes(in).csv")

reporte = {
    "fecha_perfilamiento": datetime.now().isoformat(),
    "productos": perfilar_productos(productos),
    "clientes": perfilar_clientes(clientes),
    "total_origen": len(productos) + len(clientes)
}

print("TIENDA ANDINA - PERFILAMIENTO DE DATOS")

imprimir_resultados(
    "ARCHIVO: productos(in).csv",
    reporte["productos"]
)

imprimir_resultados(
    "ARCHIVO: clientes(in).csv",
    reporte["clientes"]
)

print("\n" + "=" * 55)
print("TOTAL REGISTROS DE ORIGEN:", reporte["total_origen"])

ruta_reporte = SALIDA / "reporte_perfilamiento.json"

with open(ruta_reporte, "w", encoding="utf-8") as archivo:
    json.dump(
        reporte,
        archivo,
        ensure_ascii=False,
        indent=2
    )

print("Reporte generado:", ruta_reporte)
print("PERFILAMIENTO FINALIZADO")
