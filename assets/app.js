import { registerReactControllerComponents } from "@symfony/ux-react";
import "./stimulus_bootstrap.js";
import "./styles/app.css";

/*
 * Welcome to your app's main JavaScript file!
 *
 * This file will be included onto the page via the importmap() Twig function,
 * which should already be in your base.html.twig.
 */
import "./styles/app.css";

console.log("This log comes from assets/app.js - welcome to AssetMapper! 🎉");

const reactControllers = import.meta.webpackContext("./react/controllers", {
    recursive: true,
    regExp: /\.(j|t)sx?$/,
});

registerReactControllerComponents(reactControllers);
