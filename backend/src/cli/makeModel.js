/**
 * Model generator for Invoice app entities.
 *
 * Usage:
 *   npm run make:model -- <ModelName> [field:type[:modifier...] ...] [--controller]
 *
 * Examples:
 *   npm run make:model -- Product name:string:required price:number
 *   npm run make:model -- Product name:string:required:unique client:objectid:ref=Client:autopopulate status:string:enum=active|inactive
 *   npm run make:model -- Product name:string --controller
 *
 * Field syntax:  <name>:<type>[:modifier]...
 *   type      → string | number | boolean | date | objectid
 *   modifiers → required | unique | autopopulate
 *               default=<value>   (e.g. default=0, default=true)
 *               ref=<ModelName>   (only meaningful with objectid)
 *               enum=a|b|c        (allowed values, pipe-separated)
 *
 * Creating the model file is enough to expose a full REST API automatically
 * (see src/models/utils/index.js + src/routes/appRoutes/appApi.js).
 * Pass --controller to also scaffold a custom controller folder for overrides.
 */

const fs = require('fs');
const path = require('path');

const TYPE_MAP = {
  string: 'String',
  number: 'Number',
  boolean: 'Boolean',
  date: 'Date',
  objectid: 'ObjectId',
};

const MODELS_DIR = path.resolve(__dirname, '..', 'models', 'appModels');
const CONTROLLERS_DIR = path.resolve(__dirname, '..', 'controllers', 'appControllers');

function fail(message) {
  console.error(`\n ${message}\n`);
  process.exit(1);
}

function toPascalCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toCamelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Parse a single "name:type:mod1:mod2..." token into a structured field.
function parseField(token) {
  const [name, type, ...modifiers] = token.split(':');
  if (!name) fail(`Invalid field "${token}" — missing field name.`);
  if (!type || !TYPE_MAP[type.toLowerCase()]) {
    fail(
      `Invalid type for field "${name}". Got "${type}", expected one of: ${Object.keys(TYPE_MAP).join(', ')}.`
    );
  }

  const field = {
    name,
    type: TYPE_MAP[type.toLowerCase()],
    required: false,
    unique: false,
    autopopulate: false,
    default: undefined,
    ref: undefined,
    enum: undefined,
  };

  for (const mod of modifiers) {
    if (mod === 'required') field.required = true;
    else if (mod === 'unique') field.unique = true;
    else if (mod === 'autopopulate') field.autopopulate = true;
    else if (mod.startsWith('default=')) field.default = mod.slice('default='.length);
    else if (mod.startsWith('ref=')) field.ref = mod.slice('ref='.length);
    else if (mod.startsWith('enum=')) field.enum = mod.slice('enum='.length).split('|');
    else fail(`Unknown modifier "${mod}" on field "${name}".`);
  }

  return field;
}

// Render the default value exactly as it should appear in JS source.
function renderDefault(field) {
  const v = field.default;
  if (field.type === 'Number') return v;
  if (field.type === 'Boolean') return v === 'true' ? 'true' : 'false';
  if (field.type === 'Date') return v === 'now' ? 'Date.now' : `'${v}'`;
  return `'${v}'`; // String / fallback
}

function renderField(field) {
  // ObjectId reference fields use the mongoose.Schema.ObjectId shape.
  if (field.type === 'ObjectId') {
    const lines = [`    type: mongoose.Schema.ObjectId,`];
    if (field.ref) lines.push(`    ref: '${field.ref}',`);
    if (field.required) lines.push(`    required: true,`);
    if (field.autopopulate) lines.push(`    autopopulate: true,`);
    return `  ${field.name}: {\n${lines.join('\n')}\n  },`;
  }

  const lines = [`    type: ${field.type},`];
  if (field.required) lines.push(`    required: true,`);
  if (field.unique) lines.push(`    unique: true,`);
  if (field.enum) lines.push(`    enum: [${field.enum.map((e) => `'${e}'`).join(', ')}],`);
  if (field.default !== undefined) lines.push(`    default: ${renderDefault(field)},`);
  return `  ${field.name}: {\n${lines.join('\n')}\n  },`;
}

function buildModelSource(modelName, fields) {
  const useAutopopulate = fields.some((f) => f.autopopulate);
  const fieldBlocks = fields.map(renderField).join('\n');

  return `const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

${fieldBlocks}
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});
${useAutopopulate ? `\nschema.plugin(require('mongoose-autopopulate'));\n` : ''}
module.exports = mongoose.model('${modelName}', schema);
`;
}

function buildControllerSource(modelName) {
  return `const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

function modelController() {
  const Model = mongoose.model('${modelName}');
  const methods = createCRUDController('${modelName}');

  // Override or add custom methods here, e.g.:
  // methods.create = (req, res) => require('./create')(Model, req, res);

  return methods;
}

module.exports = modelController();
`;
}

function main() {
  const argv = process.argv.slice(2);
  const withController = argv.includes('--controller');
  const positional = argv.filter((a) => !a.startsWith('--'));

  const rawName = positional[0];
  if (!rawName) {
    fail(
      'Missing model name.\n   Usage: npm run make:model -- <ModelName> [field:type:modifier ...] [--controller]'
    );
  }

  const modelName = toPascalCase(rawName);
  const fields = positional.slice(1).map(parseField);

  const modelPath = path.join(MODELS_DIR, `${modelName}.js`);
  if (fs.existsSync(modelPath)) {
    fail(`Model already exists: ${path.relative(process.cwd(), modelPath)}`);
  }

  fs.writeFileSync(modelPath, buildModelSource(modelName, fields));
  console.log(`\n Model created: ${path.relative(process.cwd(), modelPath)}`);

  if (withController) {
    const controllerDir = path.join(CONTROLLERS_DIR, `${toCamelCase(modelName)}Controller`);
    if (fs.existsSync(controllerDir)) {
      console.log(
        `Controller already exists, skipped: ${path.relative(process.cwd(), controllerDir)}`
      );
    } else {
      fs.mkdirSync(controllerDir, { recursive: true });
      const controllerPath = path.join(controllerDir, 'index.js');
      fs.writeFileSync(controllerPath, buildControllerSource(modelName));
      console.log(`Controller created: ${path.relative(process.cwd(), controllerPath)}`);
    }
  }

  console.log(`\n Entity "${toCamelCase(modelName)}" is now wired automatically.`);
  console.log(`   Restart the server (npm run dev) and the REST API is live at:`);
  console.log(`   POST   /api/${toCamelCase(modelName)}/create`);
  console.log(`   GET    /api/${toCamelCase(modelName)}/read/:id`);
  console.log(`   PATCH  /api/${toCamelCase(modelName)}/update/:id`);
  console.log(`   DELETE /api/${toCamelCase(modelName)}/delete/:id`);
  console.log(`   GET    /api/${toCamelCase(modelName)}/list  (and search, listAll, filter, summary)\n`);
}

main();
