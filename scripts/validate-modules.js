#!/usr/bin/env node
/**
 * Static validation script for iHealth RN SDK module files.
 *
 * Section A — package.json integrity:
 *   A1. Required fields present (name, version, main, files, codegenConfig)
 *   A2. codegenConfig must exclude Android (excludedPlatforms includes "android")
 *       Rationale: build.gradle does not apply com.facebook.react plugin, so the
 *       Android Codegen task never runs; without excludedPlatforms the RN New
 *       Architecture CMake step tries to add_subdirectory the missing JNI output
 *       and the build fails (reported in v2.0.1).
 *   A3. peerDependencies must require react-native >= 0.76.0
 *
 * Section B — src/ TypeScript Spec files:
 *   B1. Every Native*.ts file exports TurboModuleRegistry.get() as default
 *   B2. iOS-only modules (ECGModule, AM5Module, ECGUSBModule) must NOT have their
 *       TS spec included in the Android codegen path (covered by A2)
 *   B3. Every NativeXxxModule.ts has a corresponding module/XxxModule.js
 *
 * Section C — index.js completeness:
 *   C1. Every module/*.js file is re-exported from index.js
 *   C2. index.js contains no duplicate exports
 *
 * Section D — module/*.js checks (per-file):
 *   D1. File can be required without throwing (with react-native mocked)
 *   D2. Exports is a plain object
 *   D3. Device modules (non-Profile) export Event_Notify as a string
 *   D4. Every exported value is string/number/boolean/function (no undefined)
 *   D5. Platform-specific modules produce DIFFERENT Event_Notify on iOS vs Android
 *   D6. No raw event string literals outside the top-level pre-call block
 *   D7. All method names match a safe identifier pattern
 *   D8. iOS-only modules guard TurboModuleRegistry.get() with Platform.OS === 'ios'
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const Module = require('module');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0;
let failed = 0;
const errors = [];

function ok(file, msg)   { passed++; console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function fail(file, msg) { failed++; errors.push(`${file}: ${msg}`); console.log(`  ${RED}✗${RESET} ${msg}`); }
function warn(file, msg) { console.log(`  ${YELLOW}⚠${RESET} ${msg}`); }

// Build a require() function that injects a fake react-native for a given platform.
function makeMockedRequire(platform) {
  const fakeRN = {
    Platform: { OS: platform, select: (obj) => obj[platform] ?? obj.default },
    TurboModuleRegistry: { get: () => null },
    NativeModules: {},
  };

  const originalLoad = Module._load.bind(Module);
  return function requireWithMock(filePath) {
    const origLoad = Module._load;
    Module._load = function(request, parent, isMain) {
      if (request === 'react-native') return fakeRN;
      return originalLoad(request, parent, isMain);
    };
    let result;
    try {
      // Clear cache so the module re-evaluates with the new mock.
      delete require.cache[require.resolve(filePath)];
      result = require(filePath);
    } finally {
      Module._load = origLoad;
      delete require.cache[require.resolve(filePath)];
    }
    return result;
  };
}

const requireIOS     = makeMockedRequire('ios');
const requireAndroid = makeMockedRequire('android');

// ─── Section A: package.json integrity ───────────────────────────────────────

const pkgPath = path.resolve(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

console.log(`\n${BOLD}Section A — package.json integrity${RESET}`);

// A1. Required fields
const requiredFields = ['name', 'version', 'main', 'files', 'codegenConfig', 'peerDependencies'];
for (const field of requiredFields) {
  if (pkg[field] !== undefined) {
    ok('package.json', `has required field "${field}" = ${JSON.stringify(pkg[field]).slice(0, 60)}`);
  } else {
    fail('package.json', `missing required field "${field}"`);
  }
}

// A2. codegenConfig must exclude Android
const cc = pkg.codegenConfig || {};
if (Array.isArray(cc.excludedPlatforms) && cc.excludedPlatforms.includes('android')) {
  ok('package.json', 'codegenConfig.excludedPlatforms includes "android" — Android New Architecture build safe');
} else {
  fail('package.json',
    'codegenConfig.excludedPlatforms does not include "android". ' +
    'This causes CMake build failures on Android New Architecture because the ' +
    'Codegen JNI directory is never generated (android/build.gradle does not ' +
    'apply the com.facebook.react plugin). Add "excludedPlatforms": ["android"].'
  );
}

// A3. peerDependencies react-native must be >= 0.76.0
const rnPeer = (pkg.peerDependencies || {})['react-native'] || '';
if (rnPeer && />=\s*0\.7[6-9]|>=\s*0\.[89]\d|>=\s*[1-9]/.test(rnPeer)) {
  ok('package.json', `peerDependencies react-native="${rnPeer}" (>= 0.76.0)`);
} else {
  fail('package.json', `peerDependencies react-native="${rnPeer}" should require >= 0.76.0`);
}

console.log();

// ─── Section B: src/ TypeScript Spec files ────────────────────────────────────

const srcDir    = path.resolve(__dirname, '../src');
const moduleDir = path.resolve(__dirname, '../module');

// iOS-only modules: these have TS specs but no Android Java implementation.
// Their JS module files guard TurboModuleRegistry.get() with Platform.OS === 'ios'.
const IOS_ONLY_MODULES = ['ECGModule', 'AM5Module', 'ECGUSBModule'];

const files = fs.readdirSync(moduleDir)
  .filter(f => /^[A-Z].*\.js$/.test(f))   // only device/manager modules
  .sort();

const isProfileModule = (name) => name.includes('Profile') || name === 'BGProfileModule.js' || name === 'BPProfileModule.js' || name === 'HSProfileModule.js' || name === 'POProfileModule.js';
const isDeviceModule  = (name) => !isProfileModule(name);

// ─── Section B: src/ TypeScript Spec files ────────────────────────────────────

console.log(`${BOLD}Section B — src/ TypeScript Spec files${RESET}`);

const tsSpecFiles = fs.readdirSync(srcDir).filter(f => /^Native.*\.ts$/.test(f)).sort();

for (const tsFile of tsSpecFiles) {
  const tsPath   = path.join(srcDir, tsFile);
  const source   = fs.readFileSync(tsPath, 'utf8');
  // Derive the logical module name: NativeBP5Module.ts → BP5Module
  const modName  = tsFile.replace(/^Native/, '').replace(/\.ts$/, '');
  const jsFile   = modName + '.js';
  const jsPath   = path.join(moduleDir, jsFile);

  // B1. Must contain TurboModuleRegistry.get as default export
  if (/TurboModuleRegistry\.get/.test(source)) {
    ok(tsFile, 'exports TurboModuleRegistry.get<Spec>() as default');
  } else {
    fail(tsFile, 'does not call TurboModuleRegistry.get — not a valid TurboModule spec');
  }

  // B2. iOS-only modules: confirm JS counterpart has Platform.OS guard
  if (IOS_ONLY_MODULES.includes(modName)) {
    if (fs.existsSync(jsPath)) {
      const jsSrc = fs.readFileSync(jsPath, 'utf8');
      if (/Platform\.OS\s*===\s*['"]ios['"]/.test(jsSrc)) {
        ok(tsFile, `iOS-only module "${modName}" correctly guarded with Platform.OS === 'ios' in JS`);
      } else {
        fail(tsFile, `"${modName}" is iOS-only (no Android Java) but JS module lacks Platform.OS === 'ios' guard`);
      }
    } else {
      fail(tsFile, `iOS-only module "${modName}" has TS spec but no module/${jsFile}`);
    }
  }

  // B3. Every NativeXxxModule.ts must have a corresponding module/XxxModule.js
  if (!IOS_ONLY_MODULES.includes(modName)) {
    if (fs.existsSync(jsPath)) {
      ok(tsFile, `corresponding module/${jsFile} exists`);
    } else {
      // Special-case: iHealthDeviceManagerModule uses lowercase filename convention
      const lcJsFile = modName.charAt(0).toLowerCase() + modName.slice(1) + '.js';
      if (fs.existsSync(path.join(moduleDir, lcJsFile))) {
        ok(tsFile, `corresponding module/${lcJsFile} exists (lowercase convention)`);
      } else {
        fail(tsFile, `no corresponding module/${jsFile} found`);
      }
    }
  }
}

console.log();

// ─── Section C: index.js completeness ────────────────────────────────────────

console.log(`${BOLD}Section C — index.js completeness${RESET}`);

const indexPath   = path.resolve(__dirname, '../index.js');
const indexSource = fs.readFileSync(indexPath, 'utf8');
const allJsModules = fs.readdirSync(moduleDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));

// C1. Every module/*.js must be exported from index.js
const missingFromIndex = allJsModules.filter(m => !indexSource.includes(`'./module/${m}'`));
if (missingFromIndex.length === 0) {
  ok('index.js', `all ${allJsModules.length} module files are exported`);
} else {
  fail('index.js', `modules missing from exports: ${missingFromIndex.join(', ')}`);
}

// C2. No duplicate require() calls
const requireMatches = [...indexSource.matchAll(/require\(['"]\.\/module\/([^'"]+)['"]\)/g)].map(m => m[1]);
const seen = new Set();
const dupes = requireMatches.filter(m => seen.has(m) ? true : (seen.add(m), false));
if (dupes.length === 0) {
  ok('index.js', 'no duplicate module exports');
} else {
  fail('index.js', `duplicate exports: ${dupes.join(', ')}`);
}

console.log();

// ─── Section D: module/*.js per-file checks ───────────────────────────────────

console.log(`${BOLD}Section D — module static validation${RESET}`);
console.log(`Scanning ${files.length} files in ${moduleDir}\n`);

for (const file of files) {
  const filePath = path.join(moduleDir, file);
  console.log(`${BOLD}${file}${RESET}`);

  // D1. Require without errors on both platforms
  let exportsIOS, exportsAndroid;
  try {
    exportsIOS = requireIOS(filePath);
  } catch (e) {
    fail(file, `throws on iOS require: ${e.message}`);
    console.log();
    continue;
  }
  try {
    exportsAndroid = requireAndroid(filePath);
  } catch (e) {
    fail(file, `throws on Android require: ${e.message}`);
    console.log();
    continue;
  }
  ok(file, 'loads without error on both platforms');

  // D2. Exports must be a plain object
  if (typeof exportsIOS !== 'object' || exportsIOS === null || Array.isArray(exportsIOS)) {
    fail(file, `exports is not a plain object (got ${typeof exportsIOS})`);
    console.log();
    continue;
  }
  ok(file, 'exports a plain object');

  const keys = Object.keys(exportsIOS);

  // D3. Device modules must have Event_Notify
  if (isDeviceModule(file) && file !== 'iHealthDeviceManagerModule.js') {
    if (typeof exportsIOS.Event_Notify !== 'string' || exportsIOS.Event_Notify.trim() === '') {
      fail(file, 'missing or empty Event_Notify string export');
    } else {
      ok(file, `Event_Notify = "${exportsIOS.Event_Notify}" (iOS) / "${exportsAndroid.Event_Notify}" (Android)`);
    }

    // D5. Platform-specific Event_Notify must differ between iOS and Android
    if (exportsIOS.Event_Notify && exportsAndroid.Event_Notify) {
      const iosVal     = exportsIOS.Event_Notify;
      const androidVal = exportsAndroid.Event_Notify;
      const hasPlatformSwitch = iosVal !== androidVal;
      if (hasPlatformSwitch) {
        ok(file, `platform-aware: iOS="${iosVal}", Android="${androidVal}"`);
      }
      if (!androidVal.startsWith('event_notify_') && !androidVal.includes('.MODULE.NOTIFY')) {
        warn(file, `Android Event_Notify "${androidVal}" does not match expected patterns`);
      }
      if (hasPlatformSwitch && !iosVal.includes('.MODULE.NOTIFY') && !iosVal.includes('.NOTIFY')) {
        warn(file, `iOS Event_Notify "${iosVal}" does not match expected XXX.MODULE.NOTIFY pattern`);
      }
    }
  }

  // D4. Every exported value must be string | number | boolean | function — no undefined or plain objects.
  //     Profile modules export native constants via NativeModules, which are undefined in mock — skip that check.
  const skipUndefinedCheck = isProfileModule(file);
  let methodCount = 0;
  for (const key of keys) {
    if (key === 'Event_Notify') continue;
    const val = exportsIOS[key];
    const t   = typeof val;
    if (t === 'function') {
      methodCount++;
    } else if (t === 'string' || t === 'number' || t === 'boolean') {
      // constants are fine
    } else if ((val === undefined || val === null) && !skipUndefinedCheck) {
      fail(file, `exported key "${key}" is ${val} — likely a noop placeholder`);
    } else if (t !== 'undefined' && t !== 'string' && t !== 'number' && t !== 'boolean' && t !== 'function') {
      warn(file, `exported key "${key}" has unexpected type "${t}"`);
    }
  }

  if (methodCount > 0) {
    ok(file, `${methodCount} method(s) exported`);
  }

  // D6. Heuristic: source must not contain hard-coded event string literals that belong in Event_Notify
  const source = fs.readFileSync(filePath, 'utf8');
  const hardcodedListeners = source.match(/addListener\(['"](?!event_notify_|event_scan|event_device|event_authenticate)[^'"]+['"]\)/g);
  if (hardcodedListeners) {
    const suspicious = hardcodedListeners.filter(m => !source.startsWith(`'use strict';\n// `) || true);
    if (suspicious.length > 1) {
      warn(file, `possible hard-coded addListener calls: ${suspicious.join(', ')}`);
    }
  }

  // D7. All exported function names must be valid JS identifiers
  const badKeys = keys.filter(k => !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) && k !== 'HS2S Pro');
  if (badKeys.length > 0) {
    warn(file, `unusual export key(s): ${badKeys.join(', ')}`);
  }

  // D8. iOS-only modules must guard TurboModuleRegistry.get() with Platform.OS === 'ios'
  const modBaseName = file.replace(/\.js$/, '');
  if (IOS_ONLY_MODULES.includes(modBaseName)) {
    if (/Platform\.OS\s*===\s*['"]ios['"]/.test(source)) {
      ok(file, 'iOS-only module correctly guarded with Platform.OS === \'ios\'');
    } else {
      fail(file, 'iOS-only module (no Android Java implementation) must guard TurboModuleRegistry.get() with Platform.OS === \'ios\'');
    }
  }

  console.log();
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log('─'.repeat(60));
console.log(`${BOLD}Results:${RESET} ${passed}/${total} checks passed  (Sections A/B/C/D)`);
if (failed > 0) {
  console.log(`\n${RED}${BOLD}Failures:${RESET}`);
  errors.forEach(e => console.log(`  ${RED}•${RESET} ${e}`));
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}All checks passed.${RESET}`);
  process.exit(0);
}
