"""Loads store_graph.json and catalog.json into Postgres."""
import json
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent
DATABASE_URL = os.environ["DATABASE_URL"]


def main():
    graph = json.loads((DATA_DIR / "store_graph.json").read_text())
    catalog = json.loads((DATA_DIR / "catalog.json").read_text())

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("TRUNCATE inventory, products, store_edges, store_nodes CASCADE")

    for node in graph["nodes"]:
        cur.execute(
            "INSERT INTO store_nodes (id, type, x, y, aisle_id) VALUES (%s, %s, %s, %s, %s)",
            (node["id"], node["type"], node["x"], node["y"], node.get("aisle_id")),
        )

    for edge in graph["edges"]:
        cur.execute(
            "INSERT INTO store_edges (node_a, node_b, distance) VALUES (%s, %s, %s)",
            (edge["a"], edge["b"], edge["dist"]),
        )

    for product in catalog:
        cur.execute(
            "INSERT INTO products (sku, name, category, aisle_id, shelf_id) VALUES (%s, %s, %s, %s, %s)",
            (product["sku"], product["name"], product["category"], product["aisle_id"], product["shelf_id"]),
        )
        cur.execute(
            "INSERT INTO inventory (sku, stock_qty) VALUES (%s, %s)",
            (product["sku"], product["stock_qty"]),
        )

    conn.commit()
    cur.close()
    conn.close()

    print(f"Seeded {len(graph['nodes'])} nodes, {len(graph['edges'])} edges, {len(catalog)} products.")


if __name__ == "__main__":
    main()
