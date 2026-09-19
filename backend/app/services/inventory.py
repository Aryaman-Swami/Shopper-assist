from app.db import get_conn


def filter_available(skus: list[str]) -> dict:
    if not skus:
        return {"available": [], "out_of_stock": []}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT p.sku, p.name, p.aisle_id, p.shelf_id, i.stock_qty
        FROM products p
        JOIN inventory i ON i.sku = p.sku
        WHERE p.sku = ANY(%s)
        """,
        (skus,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    by_sku = {r["sku"]: r for r in rows}
    available, out_of_stock = [], []
    for sku in skus:
        row = by_sku.get(sku)
        if row is None:
            out_of_stock.append({"sku": sku, "reason": "not_found"})
        elif row["stock_qty"] <= 0:
            out_of_stock.append({"sku": sku, "name": row["name"], "reason": "out_of_stock"})
        else:
            available.append(dict(row))
    return {"available": available, "out_of_stock": out_of_stock}
