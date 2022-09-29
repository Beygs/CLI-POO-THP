import inquirer from "inquirer";
import Utils from "../utils.js";

class AdminView {
  constructor(itemsController) {
    this._itemsController = itemsController;
    this._active = false;
  }

  async _askPassword() {
    const input = await inquirer.prompt({
      name: "connect",
      type: "password",
      message: "Entrez le mot de passe pour accéder au dashboard Admin",
    });
    return input;
  }

  async connect() {
    for (let i = 0; i < 3; i++) {
      const input = await this._askPassword();
      if (input.connect === "azerty") {
        console.log("Connection réussie !");
        await Utils.sleep(1000);
        console.clear();
        this._active = true;
        return this._run();
      };
      console.log(`Il vous reste ${2 - i} tentatives.`);
    }
    console.log("Trop de tentatives échouées, fermeture du programme");
    process.exit(0);
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
          name: "Créer un item",
          value: async () => await this._itemsController.create(),
        },
        {
          name: "Retourner à l'accueil",
          value: () => {
            this._active = false;
            this._itemsController.admin = false;
          },
        },
      ],
    });

    return this._handleChoice(answer.choice);
  }

  async _run() {
    this._itemsController.admin = true;
    while (this._active) {
      await this._askChoice();
      console.clear();
    }
  }
}

export default AdminView;
