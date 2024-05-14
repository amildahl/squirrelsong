import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import stripJsonComments from 'strip-json-comments';
import terminalLink from 'terminal-link';
import rgbHex from 'rgb-hex';
import cssColorNames from 'css-color-names' with { type: 'json' };

// TODO: iTerm, Terminal.app

let errorCount = 0;

const IGNORES = ['package.json', 'package-lock.json'];

const EXCEPTIONS_LIGHT = [
  // Transparent colors
  '#ffffff00',
  '#ffffffff',
]
// Extended palette (only for JetBrains)
const EXTENDED_LIGHT = [
  '#1d1d1f',
  '#272629',
  '#373538',
  '#49474a',
  '#5b595e',
  '#727075',
  '#87868a',
  '#a2a1a6',
  '#cbc9ce',
  '#d2cfd4',
  '#d9d7dc',
  '#e9e9ef',
  '#f5f5f7',
  '#ffffff',
  '#61778c',
  '#678499',
  '#6f90a6',
  '#789ab3',
  '#80a4be',
  '#8db2cc',
  '#9ec0d9',
  '#b7d3e8',
  '#c9ddec',
  '#d7e8f5',
  '#e2edf5',
  '#e9f1f7',
  '#f3f9fc',
  '#77805d',
  '#838c66',
  '#8f9970',
  '#9ba679',
  '#a7b386',
  '#b5bf8a',
  '#becc99',
  '#ced9a3',
  '#d6e6ac',
  '#e4f2d5',
  '#f2fae1',
  '#b6932c',
  '#c49f37',
  '#cba63b',
  '#d9b754',
  '#e6c565',
  '#fcdfa5',
  '#ffebbf',
  '#faebcc',
  '#fff8e9',
  '#fdfbf5',
  '#99453d',
  '#a64b42',
  '#b35047',
  '#bf564c',
  '#cc5c52',
  '#d9756c',
  '#e6938a',
  '#f2b4aa',
  '#ebbfbc',
  '#f7d5d2',
  '#f5e5e4',
  '#fcf6f5',
  '#a67642',
  '#b37f47',
  '#bf884c',
  '#cc9152',
  '#de9e59',
  '#d9ab79',
  '#edcda8',
  '#f2dec9',
  '#fcf1e6',
  '#3c665c',
  '#457367',
  '#4f8076',
  '#538c7f',
  '#5b9a8b',
  '#6ca899',
  '#81b6a9',
  '#a9d5cb',
  '#ceece5',
  '#877a99',
  '#9085a6',
  '#9d8fb3',
  '#a899bf',
  '#af9fc7',
  '#bfadd9',
  '#d1c3e7',
  '#dfd2f3',
  '#e7def5',
  '#ede7f6',
];

const EXCEPTIONS_DARK = [
  // Transparent colors
  '#ffffff00',
  '#ffffffff',
];

const CUSTOM_LINTERS = [
  {
    // Chrome extension
    condition: (file) => file.endsWith('manifest.json'),
    lintFunction: (file, validColors, exceptions) => {
      const json = readJsonFile(file);
      const theme = json?.theme?.colors;
      if (theme === undefined) {
        return;
      }

      Object.values(theme).forEach(([r, g, b]) => {
        const color = `#${rgbHex(r, g, b)}`;
        if (isValidHexColor(color, validColors, exceptions) === false) {
          achtung(`${color} (${r}, ${g}, ${b})`);
        }
      });
    },
  },
  {
    // Slack
    condition: (file) => file.endsWith('colors.json'),
    lintFunction: (file, validColors, exceptions) => {
      const theme = readJsonFile(file);

      theme.forEach((color) => {
        if (isValidHexColor(color, validColors, exceptions) === false) {
          achtung(color);
        }
      });
    },
  },
];

function achtung(value, description) {
  console.error(`🦀 Invalid color:`, value);
  errorCount++;
}

function readJsonFile(file) {
  return JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')));
}

function isCssNamedColor(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return cssColorNames[value.toLowerCase()] !== undefined;
}

function isHexColor(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return /^#[0-9a-f]{3,8}$/i.test(value);
}

function isValidHexColor(value, validColors, exceptions, extended = []) {
  const color = value.toLowerCase();

  if (exceptions.includes(color)) {
    return true;
  }
  if (extended.includes(color)) {
    return true;
  }
  if (validColors.includes(color)) {
    return true;
  }

  // Validate colors with alpha channel as regular HEX: #c0ffeeff -> #c0ffee
  if (color.length === 9) {
    return isValidHexColor(color.slice(0, 7), validColors, exceptions, extended);
  }

  return false;
}

function scanObject(obj, callback) {
  for (const value of Object.values(obj)) {
    if (typeof value === 'object') {
      scanObject(value, callback);
    } else {
      callback(value);
    }
  }
}

function lintJson(file, validColors, exceptions, extended) {
  let theme;
  try {
    theme = readJsonFile(file);
  }
  catch (err) {
    lintText(file, validColors, exceptions, extended)
    return;
  }

  const extendedPalette = file.includes('JetBrains') ? extended : [];

  // console.log('🦜', theme);
  scanObject(theme, (value) => {
    if (isCssNamedColor(value)) {
      // TODO
      // achtung(value);
      return;
    }
    if (isHexColor(value)) {
      const color = value.toLowerCase();
      if (isValidHexColor(color, validColors, exceptions, extendedPalette) === false) {
        achtung(value);
      }
    }
  });
}

function lintText(file, validColors, exceptions, extended) {
  const text = fs.readFileSync(file, 'utf8');

  const matches = text.match(/#[0-9a-f]{3,8}\b/i);

  matches.forEach((color) => {
    if (isValidHexColor(color, validColors, exceptions) === false) {
      achtung(color);
    }
  });
}

function lint(root, palette, exceptions, extended) {
  const validColors = Object.values(palette);
  const themes = glob.sync(
    `${root}/*/**/*.{json,css,lua,alfredappearance,theme,tmTheme,palette}`,
  );
  themes.forEach((file) => {
    const filename = path.basename(file);
    if (IGNORES.includes(filename) || file.includes('node_modules')) {
      return;
    }
    const extension = path.extname(file);
    console.log();
    console.log(
      '👉',
      terminalLink(file, `vscode://file//${process.cwd()}/${file}`),
    );

    for (const { condition, lintFunction } of CUSTOM_LINTERS) {
      if (condition(file)) {
        lintFunction(file, validColors, exceptions, extended);
        return;
      }
    }

    switch (extension) {
      case '.json':
      case '.theme':
      case '.alfredappearance':
        lintJson(file, validColors, exceptions, extended);
        break;
      case '.css':
      case '.lua':
      case '.tmTheme':
      case '.palette':
        lintText(file, validColors, exceptions, extended);
        break;
      default:
        console.error('Unknown file type', file);
    }
  });
}

console.log();
console.log('[LINT] Linting light themes... 🌞');
const lightPalette = readJsonFile('light/palette.json');
lint('light', lightPalette, EXCEPTIONS_LIGHT, EXTENDED_LIGHT);

console.log();
console.log('[LINT] Linting dark themes... 🌚');
const darkPalette = readJsonFile('dark/palette.json');
lint('dark', darkPalette, EXCEPTIONS_DARK, []);

console.log();
console.log(`[LINT] ${errorCount} errors found 🦜`);

process.exit(errorCount === 0 ? 0 : 1);
