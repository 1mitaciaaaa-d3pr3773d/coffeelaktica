// Rebuild the browser data after editing the curated photo catalog.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const menus = vm.runInNewContext('(' + app.match(/const menus=(\{[^\n]+\});/)[1] + ')');
const desserts = vm.runInNewContext('(' + app.match(/const desserts=(\[[^\n]+\]);/)[1] + ')');
const names = [...Object.values(menus).flat(), ...desserts].map(item => item[0]);
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/menu/catalog.json'), 'utf8'));
const sources = ['coffee', 'other'].flatMap(group => JSON.parse(fs.readFileSync(path.join(root, `assets/menu/${group}-sources.json`), 'utf8')));
const files = new Set(sources.map(source => source.path));
for (const name of names) {
  if (!catalog[name]?.length) throw Error('Missing photos: ' + name);
  if (new Set(catalog[name]).size !== catalog[name].length) throw Error('Repeated photo in gallery: ' + name);
  for (const file of catalog[name]) {
    if (!files.has(file) || !fs.existsSync(path.join(root, file))) throw Error('Missing file/source: ' + file);
  }
}
fs.writeFileSync(path.join(root, 'menu-photos.js'), '// Curated illustrative stock photos; provenance in assets/menu/*-sources.json.\nwindow.coffeeMenuPhotos = ' + JSON.stringify(catalog, null, 2) + ';\n');
console.log(`${names.length} menu items, ${files.size} sourced photographs.`);
