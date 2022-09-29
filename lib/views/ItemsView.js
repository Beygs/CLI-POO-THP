import inquirer from "inquirer";
import Table from "cli-table3";
import chalk from "chalk";
import convert from "color-convert";
import { tableStyle } from "../config.js";
import Utils from "../utils.js";

class ItemsView {
  constructor(controller) {
    this._controller = controller;
  }

  async _next(choices = []) {
    const prompt = await inquirer.prompt({
      name: "next",
      type: "list",
      message: "Tu veux faire quoi maintenant ?",
      choices: [
        ...choices,
        {
          name: "Afficher la liste des items",
          value: async () => await this._controller.index(),
        },
        {
          name: this._controller.admin
            ? "Retourner sur le Dashboard"
            : "Retourner à l'accueil",
          value: () => {},
        },
      ],
    });

    return prompt.next;
  }

  /**
   *
   * @param {Array} data
   */
  async index(data) {
    console.clear();

    const choices = data
      .map((d) => ({
        name: d.name,
        value: d.id,
      }))
      .sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));

    const prompt = await inquirer.prompt({
      name: "item",
      type: "list",
      message: "Quel item veux-tu voir ?",
      choices,
    });

    return prompt.item;
  }

  async show(item) {
    console.clear();

    const head = ["name", "price", "quantity", "brand", "color"];
    const colWidths = [30, 10, 10, 10, 10];
    const rows = [
      chalk.cyan(item.name),
      chalk.white(item.price),
      chalk.yellow(item.quantity),
      chalk.magenta(item.brand),
      chalk.hex(`#${this._colorToHex(item.color)}`)(item.color),
    ];

    if (item.size) {
      head.push("size");
      colWidths.push(10);
      rows.push(chalk.grey(item.size));
    }

    if (item.storage) {
      head.push("storage");
      colWidths.push(10);
      rows.push(chalk.blue(item.storage));
    }

    const table = new Table({
      head,
      colWidths,
      chars: tableStyle,
    });

    table.push([...rows]);

    console.log(table.toString() + "\n");
    console.log(chalk.red("Description :\n"));
    console.log(item.description + "\n");

    if (!this._controller.admin)
      return await this._next([
        {
          name: "Acheter",
          value: async () => await this._confirmBuy(item),
        },
      ]);

    const next = await this._next([
      {
        name: "Modifier l'item",
        value: async () => await this._controller.update(item.id),
      },
      {
        name: "Supprimer l'item",
        value: async () => await this._controller.destroy(item.id),
      },
    ]);

    return next;
  }

  _colorToHex(color) {
    try {
      const hex = convert.keyword.hex(color);
      return `#${hex}`;
    } catch(_err) {
      return "#ffffff";
    }
  }

  async _confirmBuy(item) {
    if (item.quantity <= 0) {
      console.log("Article en rupture de stock 😓");
      await Utils.sleep();
      return await this._controller.show(item.id);
    }

    const formattedName = chalk.cyan(item.name);
    const formattedPrice = chalk.white(item.price);

    const quantity = await inquirer.prompt({
      name: "quantity",
      type: "input",
      message: `Combien de ${item.name}s voulez vous acheter ?`,
      validate: (input) => {
        if (isNaN(input) || parseFloat(input) < 1) {
          return "Veuillez rentrer un nombre supérieur à 1";
        }

        if (parseFloat(input) > item.quantity) {
          return `Il ne reste que ${chalk.yellow(
            item.quantity
          )} ${formattedName}(s) en stock 😅`;
        }

        return true;
      },
      filter: (input) => parseFloat(input),
    });

    const formattedQuantity = chalk.yellow(quantity.quantity);
    const finalPrice =
      parseFloat(item.price.slice(1)) * parseFloat(quantity.quantity);
    const formattedFinalPrice = chalk.green(`$${finalPrice}`);

    console.log(
      `Vous avez choisi d'acheter ${formattedQuantity} ${formattedName}(s) au prix unitaire de ${formattedPrice}.`
    );
    console.log(
      `Celà fera un total de ${formattedPrice} x ${formattedQuantity} = ${formattedFinalPrice}`
    );

    const prompt = await inquirer.prompt({
      name: "confirmation",
      type: "confirm",
      message: "Confirmez-vous ce choix ?",
    });

    if (prompt.confirmation)
      return this._controller.buy(item.id, quantity.quantity);

    return await this._controller.show(item.id);
  }

  async showBuyConfirm(item, quantity) {
    console.log(`Vous avez acheté ${quantity} ${item.name} !`);
    await Utils.sleep();
    return await this.show(item);
  }

  async itemForm({
    name,
    price,
    quantity,
    brand,
    description,
    size,
    type,
    color,
    storage
  } = {}) {
    type ??= (
      await inquirer.prompt({
        name: "type",
        type: "list",
        message: "Quel type d'objet veux-tu créer ?",
        choices: [
          {
            name: "Chaussures",
            value: "shoe",
          },
          {
            name: "Poster",
            value: "poster",
          },
          {
            name: "Disque dur",
            value: "hard drive",
          },
          {
            name: "Autre objet",
            value: "other",
          },
        ],
      })
    ).type;

    const questions = [
      {
        name: "name",
        type: "input",
        message: "Quel est le nom de l'item ?",
        default: name,
        validate: (input) => {
          if (input.length <= 0) {
            return "Entre un nom frr";
          }
          if (input.length > 50) {
            return "Euuuh t'abuses pas un peu sur la longueur du nom là ?";
          }

          return true;
        },
        transformer: (input) => {
          if (type === "poster") return `Poster - ${input}`;
          return input;
        }
      },
      {
        name: "price",
        type: "input",
        message: "Quel est le prix de l'item ?",
        default: parseFloat(price?.slice(1)) || undefined,
        validate: (input) => {
          if (isNaN(input) || parseFloat(input) < 0) {
            return "Veuillez rentrer un prix valide svp";
          }

          return true;
        },
        filter: (input) => parseFloat(input),
        transformer: (input) => `$${input}`,
      },
      {
        name: "quantity",
        type: "input",
        message: "Quel est la quantité de l'item ?",
        default: quantity,
        validate: (input) => {
          if (isNaN(input) || parseFloat(input) < 0) {
            return "Veuillez rentrer une quantité valide svp";
          }

          return true;
        },
        filter: (input) => parseFloat(input),
      },
      {
        name: "brand",
        type: "input",
        message: "Quel est la marque de l'item ?",
        default: brand,
        validate: (input) => {
          if (input.length <= 0) {
            return "Rentre une marque frr";
          }
          if (input.length > 50) {
            return "Euuuh t'abuses pas un peu sur la longueur là ?";
          }

          return true;
        },
      },
      {
        name: "description",
        type: "input",
        message: "Description de l'item",
        default: description,
        validate: (input) => {
          if (input.length <= 0) {
            return "Rentre une description frr";
          }

          return true;
        },
      },
      {
        name: "color",
        type: "input",
        message: "Couleur de l'item",
        default: color,
        validate: (input) => {
          if (input.length <= 0) {
            return "Rentre une couleur frr";
          }

          return true;
        },
      },
    ];

    if (type === "shoe") {
      questions.push({
        name: "size",
        type: "input",
        message: "Quel est la pointure de la chaussure ?",
        default: size,
        validate: (input) => {
          if (isNaN(input) || parseFloat(input) < 0) {
            return "Veuillez rentrer une pointure valide svp";
          }

          return true;
        },
        filter: (input) => parseFloat(input),
      });
    }

    if (type === "poster") {
      questions.push({
        name: "size",
        type: "input",
        message: "Quel est la taille du poster (A0-A2) ?",
        default: parseInt(size?.slice(1)) || undefined,
        validate: (input) => {
          if (isNaN(input) || parseInt(input) < 0 || parseInt(input) > 2 || !Number.isInteger(parseFloat(input))) {
            return "Veuillez rentrer une taille valide svp";
          }

          return true;
        },
        filter: (input) => parseFloat(input),
        transformer: (input) => `A${input}`,
      });
    }

    if (type === "hard drive") {
      questions.push({
        name: "size",
        type: "input",
        message: "Quel est la taille du disque dur ?",
        default: parseFloat(size?.slice(-1)) || undefined,
        validate: (input) => {
          if (isNaN(input) || parseFloat(input) < 0) {
            return "Veuillez rentrer une taille valide svp";
          }

          return true;
        },
        filter: (input) => parseFloat(input),
        transformer: (input) => `${input}"`,
      },
      {
        name: "storage",
        type: "input",
        message: "Quel est la capacité du disque dur ?",
        default: parseInt(storage?.slice(-2)) || undefined,
        validate: (input) => {
          if (isNaN(input) || parseInt(input) < 0) {
            return "Veuillez rentrer une taille valide svp";
          }

          return true;
        },
        filter: (input) => parseFloat(input),
        transformer: (input) => `${input}TB`,
      });
    }

    const prompt = await inquirer.prompt(questions);

    return { ...prompt, type };
  }
}

export default ItemsView;
