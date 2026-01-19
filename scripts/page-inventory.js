import fs from 'fs';
import path from 'path';

const appPath = path.join('src', 'App.jsx');
const appSrc = fs.readFileSync(appPath, 'utf8');
const routeRegex = /<Route\s+[^>]*?path="([^"]*)"[^>]*?element={<\s*([^/>\s]+)[^>]*?>/gs;
const routeMap = new Map();
let match;
while ((match = routeRegex.exec(appSrc)) !== null) {
  const route = match[1];
  const component = match[2];
  if (!routeMap.has(component)) routeMap.set(component, new Set());
  routeMap.get(component).add(route);
}

const pageDir = path.join('src', 'pages');
const files = fs.readdirSync(pageDir).filter(f => f.endsWith('.jsx'));

const parseImports = (content) => {
  const imports = [];
  const importRegex = /import\s+([\s\S]+?)\s+from\s+['"]([^'"]+)['"]/gs;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const specifier = m[1].trim().replace(/\s+/g, ' ');
    const source = m[2];
    imports.push({ specifier, source });
  }
  return imports;
};

const parseFunctions = (content) => {
  const names = new Set();
  const funcRegex = /function\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = funcRegex.exec(content)) !== null) {
    names.add(m[1]);
  }
  const arrowRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*\(?[A-Za-z0-9_,\s]*\)?\s*=>/g;
  while ((m = arrowRegex.exec(content)) !== null) {
    names.add(m[1]);
  }
  const letArrowRegex = /let\s+([A-Za-z0-9_]+)\s*=\s*\(?[A-Za-z0-9_,\s]*\)?\s*=>/g;
  while ((m = letArrowRegex.exec(content)) !== null) {
    names.add(m[1]);
  }
  return Array.from(names);
};

const parseImportedCalls = (content, imports) => {
  const calls = {};
  imports.forEach(({ specifier }) => {
    const names = specifier.replace(/[{}]/g, '').split(',').map(p => p.trim()).filter(Boolean);
    names.forEach(name => {
      const cleanName = name.split(' as ')[0].trim();
      if (!cleanName) return;
      const re = new RegExp(`${cleanName}\\.([A-Za-z0-9_]+)`, 'g');
      let m;
      while ((m = re.exec(content)) !== null) {
        const func = m[1];
        if (!calls[cleanName]) calls[cleanName] = new Set();
        calls[cleanName].add(func);
      }
    });
  });
  return Object.entries(calls).map(([module, functions]) => ({
    module,
    functions: Array.from(functions)
  }));
};

const summaries = [];
files.sort();
files.forEach(file => {
  const filePath = path.join(pageDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const componentName = file.replace(/\.jsx$/, '');
  const imports = parseImports(content);
  const functions = parseFunctions(content);
  const eventHandlers = functions.filter(name => /^(handle|on)[A-Z]/.test(name));
  const importedCalls = parseImportedCalls(content, imports);
  const routes = routeMap.has(componentName) ? Array.from(routeMap.get(componentName)) : [];
  summaries.push({
    componentName,
    file: filePath,
    routes,
    imports,
    functions,
    eventHandlers,
    importedCalls,
  });
});
const formatList = (label, items, formatter) => {
  if (items.length === 0) return `${label}: (none)`;
  const formatted = items.map(formatter).join('\n');
  return `${label}:\n${formatted}`;
};

const reportLines = summaries.map(page => {
  const routeDesc = page.routes.length ? page.routes.join(', ') : 'Not routed via App';
  const modulesUsed = formatList(
    'Modules Used',
    page.imports,
    imp => `- ${imp.specifier} (from ${imp.source})`
  );
  const functionsDefined = formatList(
    'Functions',
    page.functions,
    fn => `- ${fn}() — defined in page`
  );
  const eventHandlers = formatList(
    'Event Handlers',
    page.eventHandlers,
    fn => `- ${fn}()`
  );
  const importedCalls = formatList(
    'Calls To Imported Modules',
    page.importedCalls,
    call => `- ${call.module}.${call.functions.join(', ')}`
  );

  return [
    `Page: ${page.componentName}`,
    `File: ${page.file}`,
    `Route(s): ${routeDesc}`,
    modulesUsed,
    functionsDefined,
    eventHandlers,
    importedCalls,
  ].join('\n');
});

const report = reportLines.join('\n\n---\n\n');
fs.writeFileSync('page-inventory-report.txt', report);
console.log('Report written to page-inventory-report.txt');
