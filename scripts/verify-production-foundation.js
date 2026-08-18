const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✅ ${message}`);
}

function readJson(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`${relativePath} fehlt.`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${relativePath} ist kein gültiges JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function requireFile(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`${relativePath} fehlt.`);
    return false;
  }
  pass(`${relativePath} vorhanden.`);
  return true;
}

function functionsSources(functionsConfig) {
  if (Array.isArray(functionsConfig)) {
    return functionsConfig
      .map((entry) =>
        entry && typeof entry === 'object' && typeof entry.source === 'string'
          ? entry.source
          : null,
      )
      .filter((entry) => entry !== null);
  }

  if (
    functionsConfig &&
    typeof functionsConfig === 'object' &&
    typeof functionsConfig.source === 'string'
  ) {
    return [functionsConfig.source];
  }

  return [];
}

function main() {
  console.log('🔎 Omni Fashion Production Foundation Preflight');

  const requiredFiles = [
    'firebase.json',
    'firestore.rules',
    'firestore.indexes.json',
    'storage.rules',
    'functions/package.json',
    'functions/package-lock.json',
    'eas.json',
    '.env.example',
    'docs/00-governance/ROADMAP_STATUS.md',
    'docs/15-release/RELEASE_CHECKLIST.md',
    'docs/15-release/DEVICE_E2E_PLAN.md',
  ];

  requiredFiles.forEach(requireFile);

  const firebase = readJson('firebase.json');
  if (firebase) {
    if (firebase.firestore?.rules !== 'firestore.rules') {
      fail('firebase.json muss firestore.rules als Firestore Rules Source verwenden.');
    } else {
      pass('Firestore Rules Source korrekt.');
    }

    if (firebase.firestore?.indexes !== 'firestore.indexes.json') {
      fail('firebase.json muss firestore.indexes.json als Index Source verwenden.');
    } else {
      pass('Firestore Index Source korrekt.');
    }

    if (firebase.storage?.rules !== 'storage.rules') {
      fail('firebase.json muss storage.rules als Storage Rules Source verwenden.');
    } else {
      pass('Storage Rules Source korrekt.');
    }

    const sources = functionsSources(firebase.functions);
    if (!sources.includes('functions')) {
      fail('firebase.json muss functions/ als Functions Source verwenden.');
    } else {
      pass('Functions Source korrekt.');
    }

    if (firebase.emulators?.singleProjectMode !== true) {
      fail('Firebase Emulator Suite muss singleProjectMode=true verwenden.');
    } else {
      pass('Firebase Emulator Single-Project-Modus aktiv.');
    }

    const expectedPorts = {
      auth: 9099,
      functions: 5001,
      firestore: 8080,
      storage: 9199,
    };
    for (const [name, expectedPort] of Object.entries(expectedPorts)) {
      if (firebase.emulators?.[name]?.port !== expectedPort) {
        fail(`Firebase ${name} Emulator muss Port ${expectedPort} verwenden.`);
      } else {
        pass(`Firebase ${name} Emulator Port ${expectedPort} bestätigt.`);
      }
    }
  }

  const eas = readJson('eas.json');
  if (eas) {
    const previewEnvironment = eas.build?.preview?.environment;
    const productionEnvironment = eas.build?.production?.environment;

    if (previewEnvironment !== 'preview') {
      fail('EAS Preview Build muss environment=preview verwenden.');
    } else {
      pass('EAS Preview Environment korrekt getrennt.');
    }

    if (productionEnvironment !== 'production') {
      fail('EAS Production Build muss environment=production verwenden.');
    } else {
      pass('EAS Production Environment korrekt getrennt.');
    }
  }

  const packageJson = readJson('package.json');
  if (packageJson) {
    const expoVersion = packageJson.dependencies?.expo;
    const reactNativeVersion = packageJson.dependencies?.['react-native'];
    const reactVersion = packageJson.dependencies?.react;

    if (expoVersion !== '~57.0.11') {
      fail(`Unerwartete Expo-Version ${String(expoVersion)}; erwartet ~57.0.11.`);
    } else {
      pass('Expo SDK 57 Version entspricht der aktuellen Repo-Basis.');
    }

    if (reactNativeVersion !== '0.86.2') {
      fail(`Unerwartete React-Native-Version ${String(reactNativeVersion)}; erwartet 0.86.2.`);
    } else {
      pass('React Native 0.86.2 bestätigt.');
    }

    if (reactVersion !== '19.2.3') {
      fail(`Unerwartete React-Version ${String(reactVersion)}; erwartet 19.2.3.`);
    } else {
      pass('React 19.2.3 bestätigt.');
    }
  }

  const obsoleteMockIntegrityPath = path.join(
    ROOT,
    'scripts',
    'verify-data-integrity.js',
  );
  if (fs.existsSync(obsoleteMockIntegrityPath)) {
    fail('Veraltetes mockSwapItems-Integritätsskript ist noch vorhanden.');
  } else {
    pass('Veraltetes Mock-Daten-Integritätsskript entfernt.');
  }

  if (process.exitCode) {
    console.error('\n❌ Production Foundation Preflight fehlgeschlagen.');
    return;
  }

  console.log('\n✅ Production Foundation Preflight bestanden.');
}

main();
