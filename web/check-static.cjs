// Static check for a single-file HTML game. Usage: node check-static.cjs game.html
// Exit 1 on any FAIL. Needs acorn + acorn-walk (auto-located; else: npm i acorn acorn-walk).
const fs = require('fs');
const path = require('path');
function need(name) {
  const tries = [name, '/opt/npm-tools/node_modules/' + name, path.join(process.cwd(), 'node_modules', name)];
  for (const t of tries) { try { return require(t); } catch (e) {} }
  console.error('Missing ' + name + '. Run: npm i acorn acorn-walk'); process.exit(2);
}
const acorn = need('acorn');
const walk = need('acorn-walk');

const LIMIT = { fnLines: 60, depth: 4, commentedCode: 5 };
const file = process.argv[2];
if (!file) { console.error('usage: node check-static.cjs game.html'); process.exit(2); }
const src = fs.readFileSync(file, 'utf8');
const fails = [], warns = [], info = [];
const lineOf = (i) => src.slice(0, i).split('\n').length;

// ---- blocks ----
const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const scripts = [];
for (const m of src.matchAll(scriptRe)) {
  const attrs = m[1];
  if (/\bsrc\s*=/.test(attrs)) { info.push('external script: ' + (attrs.match(/src\s*=\s*["']([^"']+)/) || [])[1]); continue; }
  if (/type\s*=\s*["'](?!module|text\/javascript)/i.test(attrs)) continue; // json, importmap, shaders
  scripts.push({ code: m[2], module: /type\s*=\s*["']module/i.test(attrs), start: m.index + m[0].indexOf('>') + 1 });
}
const styles = [...src.matchAll(/<style\b[^>]*>/gi)];
if (scripts.length > 1) fails.push(`inline <script> blocks: ${scripts.length} (max 1)`);
if (styles.length > 1) fails.push(`<style> blocks: ${styles.length} (max 1)`);

// ---- inline attributes (HTML outside script/style, and HTML inside JS strings) ----
const STYLE_ATTR = /<[a-z][^>]*\sstyle\s*=/gi, ON_ATTR = /<[a-z][^>]*\son[a-z]+\s*=/gi;
const htmlOnly = src.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, ' '));
for (const m of htmlOnly.matchAll(STYLE_ATTR)) fails.push(`inline style attribute at line ${lineOf(m.index)}`);
for (const m of htmlOnly.matchAll(ON_ATTR)) fails.push(`inline on* handler at line ${lineOf(m.index)}`);
function scanMarkupString(text, line) { // HTML built inside JS strings
  if (text.includes('<') && new RegExp(STYLE_ATTR.source, 'i').test(text)) fails.push(`inline style attribute in JS string at line ${line}`);
  if (text.includes('<') && new RegExp(ON_ATTR.source, 'i').test(text)) fails.push(`inline on* handler in JS string at line ${line}`);
}

// ---- JS analysis ----
const BROWSER_GLOBALS = new Set(('requestAnimationFrame cancelAnimationFrame addEventListener removeEventListener alert confirm prompt ' +
  'getComputedStyle matchMedia fetch Image Audio AudioContext OfflineAudioContext webkitAudioContext OffscreenCanvas Path2D DOMMatrix ' +
  'ImageData ResizeObserver IntersectionObserver MutationObserver PointerEvent KeyboardEvent CustomEvent Event Blob File FileReader ' +
  'URL URLSearchParams Worker XMLHttpRequest FontFace DOMParser TextEncoder TextDecoder Response Request Headers AbortController ' +
  'scrollTo open close print focus blur postMessage createImageBitmap getSelection Option HTMLCanvasElement').split(' '));
const banners = ['MAP', 'CONFIG', 'STATE', 'INPUT', 'RENDER', 'LOOP', 'BOOT'];
for (const s of scripts) {
  const base = lineOf(s.start) - 1;
  let ast;
  try {
    ast = acorn.parse(s.code, { ecmaVersion: 'latest', sourceType: s.module ? 'module' : 'script', locations: true });
  } catch (e) {
    fails.push(`syntax error at line ${base + (e.loc ? e.loc.line : 0)}: ${e.message}`); continue;
  }
  const L = (n) => base + n.loc.start.line;
  const strict = s.module || /^\s*(\(\s*(function|\(\s*\)\s*=>)[\s\S]{0,80})?['"]use strict['"]/.test(s.code);
  if (!strict) warns.push("no 'use strict' (or type=module)");
  for (const b of banners) if (!new RegExp('=====\\s*' + b + '\\b').test(s.code)) warns.push(`missing section banner: ${b}`);

  // calls to functions that are never defined (renamed or deleted during a patch)
  const declared = new Set();
  const addPat = (p) => { if (!p) return; if (p.type === 'Identifier') declared.add(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => addPat(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(addPat); else if (p.type === 'AssignmentPattern') addPat(p.left); else if (p.type === 'RestElement') addPat(p.argument); };
  walk.full(ast, (n) => {
    if ((n.type === 'FunctionDeclaration' || n.type === 'ClassDeclaration' || n.type === 'FunctionExpression' || n.type === 'ClassExpression') && n.id) declared.add(n.id.name);
    if (/Function/.test(n.type)) n.params.forEach(addPat);
    if (n.type === 'VariableDeclarator') addPat(n.id);
    if (n.type === 'CatchClause') addPat(n.param);
    if (n.type === 'ImportSpecifier' || n.type === 'ImportDefaultSpecifier' || n.type === 'ImportNamespaceSpecifier') declared.add(n.local.name);
  });
  walk.simple(ast, {
    CallExpression(c) {
      const nm = c.callee.type === 'Identifier' && c.callee.name;
      if (nm && !declared.has(nm) && !(nm in globalThis) && !BROWSER_GLOBALS.has(nm)) fails.push(`calls undefined function ${nm}() at line ${L(c)}`);
    },
    NewExpression(c) {
      const nm = c.callee.type === 'Identifier' && c.callee.name;
      if (nm && !declared.has(nm) && !(nm in globalThis) && !BROWSER_GLOBALS.has(nm)) warns.push(`new ${nm}() not defined in the file (check it is a browser API) at line ${L(c)}`);
    },
  });

  // duplicate function declarations per scope
  const scopes = [ast];
  walk.full(ast, (n) => { if (/Function/.test(n.type) && n.body.type === 'BlockStatement') scopes.push(n.body); });
  for (const sc of scopes) {
    const seen = {};
    for (const st of sc.body) {
      let names = [];
      if (st.type === 'FunctionDeclaration') names = [st.id.name];
      if (st.type === 'VariableDeclaration' && st.kind === 'var') names = st.declarations.filter(d => d.id.type === 'Identifier').map(d => d.id.name);
      for (const nm of names) { if (seen[nm]) fails.push(`duplicate declaration "${nm}" at lines ${seen[nm]} and ${L(st)}`); else seen[nm] = L(st); }
    }
  }
  // duplicate keys in object literals
  walk.full(ast, (n) => {
    if (n.type !== 'ObjectExpression') return;
    const seen = {};
    for (const p of n.properties) {
      if (p.type !== 'Property' || p.computed || p.kind !== 'init') continue;
      const k = p.key.name ?? p.key.value;
      if (seen[k]) fails.push(`duplicate object key "${k}" at lines ${seen[k]} and ${L(p)}`); else seen[k] = L(p);
    }
  });
  // function length and nesting depth
  const fnName = (n, parent) => (n.id && n.id.name) || (parent && parent.type === 'VariableDeclarator' && parent.id.name) || (parent && parent.type === 'Property' && (parent.key.name || parent.key.value)) || (parent && parent.type === 'MethodDefinition' && parent.key.name) || '(anonymous)';
  walk.ancestor(ast, {
    Function(n, _s, anc) {
      if (n.body.type !== 'BlockStatement') return;
      const parent = anc[anc.length - 2];
      const name = fnName(n, parent);
      const len = n.loc.end.line - n.loc.start.line + 1;
      const top = anc.slice(0, -1).filter(a => /Function/.test(a.type)).length === 0;
      const isWrapper = top && parent && parent.type === 'CallExpression' && parent.callee === n; // the IIFE that wraps the file
      if (!isWrapper && len > LIMIT.fnLines) fails.push(`function ${name} is ${len} lines (max ${LIMIT.fnLines}) at line ${L(n)}`);
      let max = 0;
      (function depth(node, d, elseIf) {
        if (!node || typeof node !== 'object') return;
        if (node !== n && /Function/.test(node.type)) return; // own function counts separately
        const nests = /^(If|For|ForIn|ForOf|While|DoWhile|Switch|Try)Statement$/.test(node.type) && !elseIf;
        const nd = nests ? d + 1 : d;
        if (nd > max) max = nd;
        for (const k in node) {
          if (k === 'loc') continue;
          const v = node[k];
          const chain = node.type === 'IfStatement' && k === 'alternate' && v && v.type === 'IfStatement'; // else-if stays on one level
          if (Array.isArray(v)) v.forEach(c => depth(c, nd, false)); else if (v && typeof v.type === 'string') depth(v, nd, chain);
        }
      })(n.body, 0, false);
      if (!isWrapper && max > LIMIT.depth) fails.push(`function ${name} nests ${max} levels (max ${LIMIT.depth}) at line ${L(n)}`);
      // per-frame hazards
      if (/^(update|tick|step|loop|frame|draw|render)/i.test(name)) {
        walk.simple(n.body, {
          CallExpression(c) {
            const p = c.callee.property && c.callee.property.name;
            if (p === 'addEventListener') warns.push(`addEventListener inside per-frame function ${name} at line ${L(c)}`);
            if (p === 'filter' || p === 'map' || p === 'concat') warns.push(`.${p}() allocates every frame in ${name} at line ${L(c)} (compact in place)`);
          }
        });
      }
    }
  });
  // splice inside a forward loop
  walk.ancestor(ast, {
    CallExpression(c, _s, anc) {
      const p = c.callee.property && c.callee.property.name;
      if (p === 'splice' && anc.some(a => (a.type === 'ForStatement' && a.update && /\+\+|\+=/.test(s.code.slice(a.update.start, a.update.end))) || (a.type === 'CallExpression' && a.callee.property && a.callee.property.name === 'forEach')))
        warns.push(`splice inside a forward loop at line ${L(c)}`);
      if (c.callee.name === 'setInterval') warns.push(`setInterval at line ${L(c)} (drive timing from the frame loop dt)`);
    }
  });
  // markup in strings, and style writes from JS (canvas sizing is allowed)
  walk.simple(ast, {
    Literal(n) { if (typeof n.value === 'string') scanMarkupString(n.value, L(n)); },
    TemplateLiteral(n) { scanMarkupString(n.quasis.map(q => q.value.cooked).join('${}'), L(n)); },
    AssignmentExpression(a) {
      const t = a.left;
      if (t.type === 'MemberExpression' && t.object.type === 'MemberExpression' && t.object.property && t.object.property.name === 'style' && !/^(width|height)$/.test(t.property.name))
        warns.push(`JS writes style.${t.property.name} at line ${L(a)} (toggle a class)`);
    }
  });
  const commented = s.code.split('\n').filter(l => /^\s*\/\/.*[;{}]\s*$/.test(l)).length;
  if (commented > LIMIT.commentedCode) warns.push(`${commented} lines look like commented-out code`);
}

const lines = src.split('\n').length;
console.log(`FILE ${file}  lines=${lines}  scripts=${scripts.length}  styles=${styles.length}`);
const uniq = (a) => [...new Set(a)];
uniq(info).forEach(x => console.log('INFO  ' + x));
uniq(warns).forEach(x => console.log('WARN  ' + x));
uniq(fails).forEach(x => console.log('FAIL  ' + x));
console.log(`RESULT ${fails.length ? 'FAIL' : 'PASS'}  fails=${uniq(fails).length} warns=${uniq(warns).length}`);
process.exit(fails.length ? 1 : 0);
