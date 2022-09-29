import inquirer from "inquirer";
import ItemsController from "./controllers/ItemsController.js";
import Utils from "./utils.js";
import figlet from "figlet";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import AdminView from "./views/AdminView.js";

class Router {
  constructor() {
    this._itemsController = new ItemsController();
    this._adminView = new AdminView(this._itemsController, this);
  }

  async _handleChoice(choice) {
    await choice();
  }

  async _askChoice() {
    const answer = await inquirer.prompt({
      name: "choice",
      type: "list",
      message: "Tu veux faire quoi frr ?\n",
      choices: [
        {
          name: "Accéder à la liste des items",
          value: async () => await this._itemsController.index(),
        },
        {
          name: "Accéder au Dashboard Admin",
          value: async () => await this._adminView.connect(),
        },
        {
          name: "Quitter",
          value: async () => {
            console.clear();
            figlet("Bisous !", "Invita", (_err, data) => {
              chalkAnimation.karaoke(data);
            })
            await Utils.sleep(2500);
            
            process.exit(0);
          },
        },
      ],
    });

    return this._handleChoice(answer.choice);
  }

  async run() {
    console.clear();
    const msg = "Bienvenue !";

    figlet(msg, "Roman", (_err, data) => {
      console.log(gradient.pastel.multiline(data));
    });

    await Utils.sleep(1000);

    while (true) {
      await this._askChoice();
      console.clear();
    }
  }
}

export const COUCOU = "Coucou";

export default Router;
