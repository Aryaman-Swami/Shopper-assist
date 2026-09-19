"""Generates the demo store graph and product catalog.

Run once to produce data/store_graph.json and data/catalog.json.
Layout: 8 parallel aisles between a front corridor (near entrance/checkout)
and a back corridor, each aisle holding 10 shelf slots that products sit on.
"""
import json
import random
from pathlib import Path

random.seed(42)

OUT_DIR = Path(__file__).parent

AISLES = [
    {"id": 1, "category": "Produce"},
    {"id": 2, "category": "Dairy & Eggs"},
    {"id": 3, "category": "Bakery"},
    {"id": 4, "category": "Meat & Seafood"},
    {"id": 5, "category": "Frozen"},
    {"id": 6, "category": "Pantry & Dry Goods"},
    {"id": 7, "category": "Beverages"},
    {"id": 8, "category": "Household & Personal Care"},
]

SHELVES_PER_AISLE = 10
AISLE_LENGTH = 10.0  # y-span of each aisle
FRONT_Y = 0.0
BACK_Y = AISLE_LENGTH

PRODUCTS_BY_CATEGORY = {
    "Produce": [
        "Bananas", "Red Apples", "Green Apples", "Navel Oranges", "Seedless Grapes",
        "Strawberries", "Blueberries", "Avocados", "Roma Tomatoes", "Cherry Tomatoes",
        "Cucumbers", "Iceberg Lettuce", "Romaine Lettuce", "Baby Spinach", "Carrots",
        "Red Onions", "Yellow Onions", "Russet Potatoes", "Sweet Potatoes", "Broccoli",
        "Cauliflower", "Bell Peppers", "Garlic", "Ginger Root", "Lemons",
    ],
    "Dairy & Eggs": [
        "Whole Milk 1L", "2% Milk 1L", "Skim Milk 1L", "Almond Milk 1L", "Oat Milk 1L",
        "Large Eggs (Dozen)", "Salted Butter", "Unsalted Butter", "Cheddar Cheese Block",
        "Mozzarella Shredded", "Parmesan Grated", "Greek Yogurt", "Vanilla Yogurt",
        "Plain Yogurt Tub", "Sour Cream", "Cream Cheese", "Heavy Cream", "Half & Half",
        "Cottage Cheese", "American Cheese Slices", "Feta Cheese", "String Cheese Pack",
        "Coffee Creamer", "Margarine", "Buttermilk",
    ],
    "Bakery": [
        "White Sandwich Bread", "Whole Wheat Bread", "Multigrain Bread", "Sourdough Loaf",
        "Bagels (6-pack)", "English Muffins", "Croissants (4-pack)", "Dinner Rolls",
        "Hamburger Buns", "Hot Dog Buns", "Tortillas (10-pack)", "Pita Bread",
        "Chocolate Chip Cookies", "Blueberry Muffins", "Cinnamon Rolls", "Birthday Cake",
        "Baguette", "Rye Bread", "Naan Bread", "Donuts (6-pack)", "Brownies",
        "Pound Cake", "Pancake Mix", "Waffles Frozen-Ready", "Pie Crust",
    ],
    "Meat & Seafood": [
        "Boneless Chicken Breast", "Chicken Thighs", "Ground Beef 80/20", "Ground Turkey",
        "Pork Chops", "Bacon", "Italian Sausage", "Beef Steak Ribeye", "Salmon Fillet",
        "Shrimp (peeled)", "Tilapia Fillet", "Turkey Deli Slices", "Ham Deli Slices",
        "Hot Dogs", "Beef Brisket", "Chicken Wings", "Ground Pork", "Cod Fillet",
        "Rotisserie Chicken", "Pepperoni", "Salami", "Bratwurst", "Lamb Chops",
        "Crab Legs", "Tuna Steaks",
    ],
    "Frozen": [
        "Frozen Peas", "Frozen Corn", "Frozen Mixed Vegetables", "Frozen French Fries",
        "Frozen Pizza", "Vanilla Ice Cream", "Chocolate Ice Cream", "Frozen Waffles",
        "Frozen Berries Mix", "Frozen Chicken Nuggets", "Frozen Burritos",
        "Frozen Lasagna", "Frozen Shrimp", "Popsicles", "Frozen Broccoli",
        "Ice Cream Sandwiches", "Frozen Dumplings", "Frozen Meatballs",
        "Frozen Spinach", "Frozen Fruit Bars", "Frozen Garlic Bread",
        "Frozen Fish Sticks", "Frozen Edamame", "Frozen Pie", "Frozen Hash Browns",
    ],
    "Pantry & Dry Goods": [
        "Spaghetti Pasta", "Penne Pasta", "White Rice 2kg", "Brown Rice 2kg",
        "Rolled Oats", "Corn Flakes Cereal", "Granola Cereal", "Peanut Butter",
        "Strawberry Jam", "Honey", "Olive Oil", "Vegetable Oil", "All-Purpose Flour",
        "Granulated Sugar", "Brown Sugar", "Table Salt", "Black Pepper", "Ketchup",
        "Mayonnaise", "Mustard", "Soy Sauce", "Canned Black Beans", "Canned Chickpeas",
        "Canned Tomatoes", "Canned Tuna", "Canned Corn", "Chicken Broth",
        "Tomato Sauce Jar", "Instant Noodles", "Popcorn Kernels",
    ],
    "Beverages": [
        "Coca-Cola 500ml", "Diet Coke 500ml", "Sprite 500ml", "Pepsi 500ml",
        "Orange Juice 1L", "Apple Juice 1L", "Sparkling Water (6-pack)", "Bottled Water (12-pack)",
        "Ground Coffee", "Coffee Pods (12ct)", "Green Tea Bags", "Black Tea Bags",
        "Energy Drink", "Sports Drink", "Lemonade 1L", "Cranberry Juice 1L",
        "Iced Tea 1L", "Tonic Water", "Club Soda", "Hot Chocolate Mix",
        "Beer (6-pack)", "Red Wine Bottle", "White Wine Bottle", "Almond Milk Coffee Creamer",
    ],
    "Household & Personal Care": [
        "Paper Towels", "Toilet Paper (12-pack)", "Facial Tissues", "Dish Soap",
        "Laundry Detergent", "Fabric Softener", "All-Purpose Cleaner", "Glass Cleaner",
        "Trash Bags", "Aluminum Foil", "Plastic Wrap", "Sandwich Bags", "Shampoo",
        "Conditioner", "Body Wash", "Bar Soap", "Toothpaste", "Toothbrush",
        "Deodorant", "Hand Sanitizer", "Sunscreen", "Razors", "Shaving Cream",
        "Cotton Swabs", "Band-Aids",
    ],
}


def build_store_graph():
    nodes = []
    edges = []

    nodes.append({"id": "entrance", "type": "entrance", "x": -1.0, "y": FRONT_Y})
    nodes.append({"id": "checkout", "type": "checkout", "x": len(AISLES) + 1.0, "y": FRONT_Y})

    for aisle in AISLES:
        i = aisle["id"]
        x = float(i)
        top_id = f"top_{i}"
        bottom_id = f"bottom_{i}"
        nodes.append({"id": top_id, "type": "junction", "x": x, "y": FRONT_Y})
        nodes.append({"id": bottom_id, "type": "junction", "x": x, "y": BACK_Y})

        prev = top_id
        prev_y = FRONT_Y
        step = AISLE_LENGTH / (SHELVES_PER_AISLE + 1)
        for s in range(1, SHELVES_PER_AISLE + 1):
            y = FRONT_Y + step * s
            shelf_id = f"shelf_{i}_{s}"
            nodes.append({"id": shelf_id, "type": "shelf", "x": x, "y": y, "aisle_id": i})
            edges.append({"a": prev, "b": shelf_id, "dist": round(y - prev_y, 2)})
            prev = shelf_id
            prev_y = y
        edges.append({"a": prev, "b": bottom_id, "dist": round(BACK_Y - prev_y, 2)})

    # front and back corridors connect adjacent aisle junctions
    for i in range(1, len(AISLES)):
        edges.append({"a": f"top_{i}", "b": f"top_{i + 1}", "dist": 1.0})
        edges.append({"a": f"bottom_{i}", "b": f"bottom_{i + 1}", "dist": 1.0})

    edges.append({"a": "entrance", "b": "top_1", "dist": 1.0})
    edges.append({"a": "checkout", "b": f"top_{len(AISLES)}", "dist": 1.0})

    return {"nodes": nodes, "edges": edges}


def build_catalog():
    products = []
    sku_counter = 1000
    for aisle in AISLES:
        i = aisle["id"]
        category = aisle["category"]
        names = PRODUCTS_BY_CATEGORY[category]
        for idx, name in enumerate(names):
            shelf_num = (idx % SHELVES_PER_AISLE) + 1
            sku_counter += 1
            products.append({
                "sku": f"SKU{sku_counter}",
                "name": name,
                "category": category,
                "aisle_id": i,
                "shelf_id": f"shelf_{i}_{shelf_num}",
                "stock_qty": random.choice([0, 3, 5, 8, 12, 20, 40]),
            })
    return products


if __name__ == "__main__":
    graph = build_store_graph()
    catalog = build_catalog()

    (OUT_DIR / "store_graph.json").write_text(json.dumps(graph, indent=2))
    (OUT_DIR / "catalog.json").write_text(json.dumps(catalog, indent=2))

    print(f"Wrote {len(graph['nodes'])} nodes, {len(graph['edges'])} edges to store_graph.json")
    print(f"Wrote {len(catalog)} products to catalog.json")
