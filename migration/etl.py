import csv
import json
import re
import sqlite3
import argparse

from pathlib import Path
from datetime import datetime
from decimal import Decimal, InvalidOperation

BASE = Path(__file__).resolve().parent
ORIGEN = BASE / "origen"
SALIDA = BASE / "salida"

SALIDA.mkdir(exist_ok=True)

rechazados = []
corregidos = []

resumen = {
    "productos": {
        "origen": 0,
        "aceptados": 0,
        "corregidos": 0,
        "rechazados": 0,
        "cargados": 0
    },
    "clientes": {
        "origen": 0,
        "aceptados": 0,
        "corregidos": 0,
        "rechazados": 0,
        "cargados": 0
    }
}


def leer_csv(nombre):
    with open(
        ORIGEN / nombre,
        encoding="utf-8-sig",
        newline=""
    ) as archivo:
        return list(csv.DictReader(archivo))


def limpiar(fila):
    return {
        campo: valor.strip()
        for campo, valor in fila.items()
    }


def rechazar(entidad, identificador, fila, motivos):
    rechazados.append({
        "entidad": entidad,
        "identificador": identificador,
        "motivo": "; ".join(motivos),
        "registro_original": json.dumps(
            fila, ensure_ascii=False
        )
    })

    resumen[entidad]["rechazados"] += 1


def registrar_carga(entidad, identificador, cambios):
    resumen[entidad]["cargados"] += 1

    if cambios:
        resumen[entidad]["corregidos"] += 1

        corregidos.append({
            "entidad": entidad,
            "identificador": identificador,
            "correcciones": "; ".join(cambios)
        })
    else:
        resumen[entidad]["aceptados"] += 1



def validar_campos_producto(fila, motivos):
    if not fila["sku"]:
        motivos.append("SKU vacio")

    if not fila["nombre"]:
        motivos.append("Nombre vacio")

    if not fila["categoria"]:
        motivos.append("Categoria vacia")


def validar_precio_producto(valor, motivos):
    try:
        precio = Decimal(valor)

        if not precio.is_finite():
            motivos.append("Precio invalido")
        elif precio < 0:
            motivos.append("Precio negativo")

        return precio

    except InvalidOperation:
        motivos.append("Precio vacio o invalido")
        return None


def validar_stock_producto(valor, motivos, cambios):
    if not valor:
        cambios.append("Stock vacio corregido a 0")
        return 0

    try:
        stock = int(valor)

        if stock < 0:
            motivos.append("Stock negativo")

        return stock

    except ValueError:
        motivos.append("Stock invalido")
        return None


def validar_sku_duplicado(conn, sku, motivos):
    existente = conn.execute(
        """
        SELECT id FROM productos
        WHERE sku = ? COLLATE NOCASE
        """,
        (sku,)
    ).fetchone()

    if existente:
        motivos.append("SKU duplicado en destino")


def insertar_producto(conn, fila, precio, stock):
    conn.execute(
        """
        INSERT INTO productos
        (sku, nombre, categoria, precio, stock, proveedor)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            fila["sku"],
            fila["nombre"],
            fila["categoria"],
            float(precio),
            stock,
            fila["proveedor"]
        )
    )


def migrar_productos(conn, registros):
    entidad = "productos"
    resumen[entidad]["origen"] = len(registros)

    for original in registros:
        fila = limpiar(original)
        motivos = []
        cambios = []
        sku = fila["sku"]

        if fila != original:
            cambios.append("Espacios normalizados")

        validar_campos_producto(fila, motivos)

        precio = validar_precio_producto(
            fila["precio"], motivos
        )

        stock = validar_stock_producto(
            fila["stock"], motivos, cambios
        )

        validar_sku_duplicado(conn, sku, motivos)

        if motivos:
            rechazar(entidad, sku, original, motivos)
            continue

        insertar_producto(conn, fila, precio, stock)

        registrar_carga(entidad, sku, cambios)


def email_valido(email):
    email = email.strip()

    if email.count("@") != 1:
        return False

    if any(caracter.isspace() for caracter in email):
        return False

    usuario, dominio = email.split("@")

    return bool(usuario and "." in dominio[1:-1])


def validar_campos_cliente(fila, email, motivos, cambios):
    if not fila["id_cliente"]:
        motivos.append("Identificador vacio")

    if not fila["nombre"] or not fila["apellido"]:
        motivos.append("Nombre o apellido vacio")

    if not email_valido(email):
        motivos.append("Correo invalido")

    if email != fila["email"]:
        cambios.append("Correo normalizado")


def validar_telefono_cliente(telefono, motivos, cambios):
    if telefono is None:
        cambios.append("Telefono vacio convertido a NULL")

    elif not re.fullmatch(r"9\d{8}", telefono):
        motivos.append("Telefono invalido")


def normalizar_fecha_cliente(valor, motivos, cambios):
    try:
        fecha = datetime.strptime(
            valor, "%m/%d/%Y"
        ).strftime("%Y-%m-%d")

        if fecha != valor:
            cambios.append("Fecha normalizada a ISO")

        return fecha

    except ValueError:
        motivos.append("Fecha de registro invalida")
        return None


def validar_cliente_duplicado(conn, email, id_origen, motivos):
    existente = conn.execute(
        """
        SELECT id FROM clientes
        WHERE email = ? COLLATE NOCASE
        """,
        (email,)
    ).fetchone()

    if existente:
        motivos.append("Correo duplicado")

    id_existente = conn.execute(
        """
        SELECT id FROM clientes
        WHERE id_origen = ?
        """,
        (id_origen,)
    ).fetchone()

    if id_existente:
        motivos.append("Identificador duplicado")


def insertar_cliente(conn, fila, email, telefono, distrito, fecha):
    nombre_completo = f"{fila['nombre']} {fila['apellido']}"

    conn.execute(
        """
        INSERT INTO clientes
        (
            nombre, email, password_hash,
            telefono, id_origen, distrito,
            fecha_registro, requiere_activacion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            nombre_completo,
            email,
            "!CUENTA_NO_ACTIVADA",
            telefono,
            fila["id_cliente"],
            distrito,
            fecha,
            1
        )
    )


def migrar_clientes(conn, registros):
    entidad = "clientes"
    resumen[entidad]["origen"] = len(registros)

    for original in registros:
        fila = limpiar(original)
        motivos = []
        cambios = []

        id_origen = fila["id_cliente"]
        email = fila["email"].lower()
        telefono = fila["telefono"] or None
        distrito = fila["distrito"] or None

        if fila != original:
            cambios.append("Espacios normalizados")

        validar_campos_cliente(
            fila, email, motivos, cambios
        )

        validar_telefono_cliente(
            telefono, motivos, cambios
        )

        if distrito is None:
            cambios.append("Distrito vacio convertido a NULL")

        fecha = normalizar_fecha_cliente(
            fila["fecha_registro"], motivos, cambios
        )

        validar_cliente_duplicado(
            conn, email, id_origen, motivos
        )

        if motivos:
            rechazar(entidad, id_origen, original, motivos)
            continue

        insertar_cliente(
            conn, fila, email, telefono, distrito, fecha
        )

        registrar_carga(entidad, id_origen, cambios)


def guardar_csv(nombre, registros, campos):
    with open(
        SALIDA / nombre,
        "w",
        encoding="utf-8-sig",
        newline=""
    ) as archivo:
        escritor = csv.DictWriter(
            archivo,
            fieldnames=campos
        )

        escritor.writeheader()
        escritor.writerows(registros)


def contar_registros(conn):
    return {
        tabla: conn.execute(
            f"SELECT COUNT(*) FROM {tabla}"
        ).fetchone()[0]
        for tabla in ("productos", "clientes", "pedidos")
    }


def ejecutar():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--db",
        required=True,
        help="Ruta de la base de datos destino"
    )

    args = parser.parse_args()
    ruta_db = Path(args.db).resolve()

    if not ruta_db.is_file():
        raise FileNotFoundError(
            f"No existe la base de datos: {ruta_db}"
        )

    productos = leer_csv("productos(in).csv")
    clientes = leer_csv("clientes(in).csv")

    conn = sqlite3.connect(ruta_db)

    try:
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("BEGIN IMMEDIATE")

        antes = contar_registros(conn)

        migrar_productos(conn, productos)
        migrar_clientes(conn, clientes)

        despues = contar_registros(conn)

        for entidad in ("productos", "clientes"):
            datos = resumen[entidad]

            assert datos["origen"] == (
                datos["cargados"] + datos["rechazados"]
            ), "Error de conciliacion"

            assert datos["cargados"] == (
                datos["aceptados"] + datos["corregidos"]
            ), "Error de clasificacion"

            assert despues[entidad] - antes[entidad] == (
                datos["cargados"]
            ), "Error de conteo en destino"

        assert antes["pedidos"] == despues["pedidos"]

        integridad = conn.execute(
            "PRAGMA integrity_check"
        ).fetchone()[0]

        if integridad != "ok":
            raise RuntimeError("Error de integridad SQLite")

        if conn.execute(
            "PRAGMA foreign_key_check"
        ).fetchall():
            raise RuntimeError("Error de claves foraneas")

        conn.commit()

    except Exception:
        conn.rollback()
        print("ERROR: Transaccion revertida")
        raise

    finally:
        conn.close()

    guardar_csv(
        "rechazados.csv",
        rechazados,
        [
            "entidad",
            "identificador",
            "motivo",
            "registro_original"
        ]
    )

    guardar_csv(
        "corregidos.csv",
        corregidos,
        [
            "entidad",
            "identificador",
            "correcciones"
        ]
    )

    totales = {
        campo: sum(
            resumen[entidad][campo]
            for entidad in resumen
        )
        for campo in (
            "origen",
            "aceptados",
            "corregidos",
            "rechazados",
            "cargados"
        )
    }

    reporte = {
        "fecha": datetime.now().isoformat(),
        "base_datos": str(ruta_db),
        "resultados": resumen,
        "totales": totales,
        "destino_antes": antes,
        "destino_despues": despues,
        "integridad": integridad,
        "conciliacion": "OK"
    }

    with open(
        SALIDA / "reporte_migracion.json",
        "w",
        encoding="utf-8"
    ) as archivo:
        json.dump(
            reporte,
            archivo,
            ensure_ascii=False,
            indent=2
        )

    print("\nTIENDA ANDINA - PROCESO ETL")

    for entidad, datos in resumen.items():
        print("\n" + "=" * 45)
        print(entidad.upper())
        print("=" * 45)

        for campo, valor in datos.items():
            print(f"{campo:20}: {valor}")

    print("\n" + "=" * 45)
    print("CONCILIACION GENERAL")
    print("=" * 45)

    for campo, valor in totales.items():
        print(f"{campo:20}: {valor}")

    print("\nRegistros antes:", antes)
    print("Registros despues:", despues)

    print("Integridad SQLite:", integridad)
    print("Conciliacion: OK")
    print("Archivos generados en:", SALIDA)
    print("MIGRACION FINALIZADA CORRECTAMENTE")


if __name__ == "__main__":
    ejecutar()
