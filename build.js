const fs = require("fs");

// @TODO: rehacer para que bundlee como es debido todos los componentes:

const template = fs.readFileSync(__dirname + "/lsw-filesystem-explorer.html").toString();
const component = fs.readFileSync(__dirname + "/lsw-filesystem-explorer.js").toString();
const compiledComponent = component.replace("$template", template);

fs.writeFileSync(__dirname + "/lsw-filesystem-explorer.compiled.js", compiledComponent, "utf8");
