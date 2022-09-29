import fs from "fs";

class Item {
  constructor({
    name,
    id,
    price,
    quantity,
    brand,
    description,
    size,
    type,
    color,
    storage,
  }) {
    this.type = type;
    this.id = id || Date.now();
    this.name = this._formatName(name);
    this.price = this._formatPrice(price);
    this.quantity = quantity;
    this.brand = brand;
    this.description = description;
    this.size = this._formatSize(size);
    this.color = color;
    this.storage = this._formatStorage(storage);
  }

  /**
   * @returns {Item[]};
   */
  static all() {
    return JSON.parse(fs.readFileSync("db/items.json", "utf-8")).map(
      (d) => new Item(d)
    );
  }

  static findOne(id) {
    return Item.all().find((item) => item.id === id);
  }

  update({ name, price, quantity, brand, description, size, color, storage }) {
    this.name = this._formatName(name);
    this.price = this._formatPrice(price);
    this.quantity = quantity;
    this.brand = brand;
    this.description = description;
    this.size = this._formatSize(size);
    this.color = color;
    this.storage = this._formatStorage(storage);
  }

  save() {
    const items = Item.all();
    const itemId = items.findIndex((item) => item.id === this.id);
    const newData =
      itemId >= 0
        ? [...items.slice(0, itemId), this, ...items.slice(itemId + 1)]
        : [...items, this];
    fs.writeFileSync("db/items.json", JSON.stringify(newData));
  }

  destroy() {
    const items = Item.all();
    const itemId = items.findIndex((item) => item.id === this.id);
    fs.writeFileSync(
      "db/items.json",
      JSON.stringify([...items.slice(0, itemId), ...items.slice(itemId + 1)])
    );
  }

  _formatName(name) {
    if (this.type === "poster" && !/^Poster -/.test(name))
      return `Poster - ${name}`;
    return name;
  }

  _formatPrice(price) {
    return typeof price === "number" ? `$${price}` : price;
  }

  _formatSize(size) {
    if (this.type === "poster" && typeof size === "number") return `A${size}`;
    if (this.type === "hard drive" && typeof size === "number")
      return `${size}"`;
    return size;
  }

  _formatStorage(storage) {
    if (typeof storage === "number") return `${storage}TB`;
    return storage;
  }
}

export default Item;
