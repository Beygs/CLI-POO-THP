import Item from "../models/Item.js";
import ItemsView from "../views/ItemsView.js";

class ItemsController {
  constructor() {
    this._itemsView = new ItemsView(this);
    this.admin = false;
  }

  async index() {
    const item = await this._itemsView.index(Item.all());
    await this.show(item);
  }

  async show(id) {
    const item = Item.findOne(id);
    const next = await this._itemsView.show(item);
    return next();
  }

  async create() {
    const data = await this._itemsView.itemForm();
    const item = new Item(data);
    item.save();
  }

  async update(id) {
    const item = Item.findOne(id);
    const data = await this._itemsView.itemForm(item);
    item.update(data);
    item.save();
  }

  destroy(id) {
    const item = Item.findOne(id);
    item.destroy();
  }

  async buy(id, quantity) {
    const item = Item.findOne(id);
    item.update({ ...item, quantity: item.quantity - quantity });
    item.save();
    const next = await this._itemsView.showBuyConfirm(item, quantity);
    return next();
  }
}

export default ItemsController;
