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
    fail(
      `${relativePath} ist kein gültiges JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
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

function requireConfigAsset(label, assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.startsWith('./')) {
    fail(`${label} muss ein lokaler ./-Assetpfad sein.`);
    return;
  }

  const relativePath = assetPath.slice(2);
  if (!fs.existsSync(path.join(ROOT, relativePath))) {
    fail(`${label} verweist auf fehlendes Asset ${assetPath}.`);
    return;
  }

  pass(`${label} Asset vorhanden (${assetPath}).`);
}

function getPluginConfig(plugins, pluginName) {
  if (!Array.isArray(plugins)) {
    return null;
  }

  for (const entry of plugins) {
    if (Array.isArray(entry) && entry[0] === pluginName) {
      return entry[1] && typeof entry[1] === 'object' ? entry[1] : {};
    }
  }

  return null;
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

function isExpoSdk57Version(value) {
  return typeof value === 'string' && /^~?57\.0\.\d+$/.test(value);
}

function main() {
  console.log('🔎 Omni Fashion Production Foundation Preflight');

  const requiredFiles = [
    'app.json',
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

  const appConfig = readJson('app.json');
  if (appConfig) {
    const expo = appConfig.expo;

    if (!expo || typeof expo !== 'object') {
      fail('app.json muss ein expo-Konfigurationsobjekt enthalten.');
    } else {
      if (expo.name !== 'Omni Fashion') {
        fail('Der sichtbare App-Name muss "Omni Fashion" sein.');
      } else {
        pass('Omni Fashion App-Name bestätigt.');
      }

      if (expo.slug !== 'omni-fashion') {
        fail('Expo Slug muss omni-fashion bleiben.');
      } else {
        pass('Expo Slug omni-fashion bestätigt.');
      }

      if (expo.scheme !== 'omnifashion') {
        fail('Deep-Link Scheme muss omnifashion bleiben.');
      } else {
        pass('Deep-Link Scheme omnifashion bestätigt.');
      }

      requireConfigAsset('App Icon', expo.icon);
      requireConfigAsset(
        'Android Adaptive Foreground',
        expo.android?.adaptiveIcon?.foregroundImage,
      );
      requireConfigAsset(
        'Android Adaptive Background',
        expo.android?.adaptiveIcon?.backgroundImage,
      );
      requireConfigAsset(
        'Android Adaptive Monochrome',
        expo.android?.adaptiveIcon?.monochromeImage,
      );
      requireConfigAsset('Web Favicon', expo.web?.favicon);

      const splashConfig = getPluginConfig(
        expo.plugins,
        'expo-splash-screen',
      );
      if (!splashConfig) {
        fail('expo-splash-screen Config Plugin fehlt.');
      } else {
        if (splashConfig.image !== expo.icon) {
          fail('Native Splash und App Icon müssen dasselbe Omni-Fashion-Asset nutzen.');
        } else {
          pass('Native Splash nutzt das Omni-Fashion-App-Icon.');
        }

        requireConfigAsset('Native Splash', splashConfig.image);

        if (splashConfig.backgroundColor !== '#0A0A0A') {
          fail('Native Splash Background muss #0A0A0A verwenden.');
        } else {
          pass('Native Splash Background bestätigt.');
        }

        if (
          splashConfig.dark?.image !== expo.icon ||
          splashConfig.dark?.backgroundColor !== '#0A0A0A'
        ) {
          fail('Dark Splash muss Omni-Fashion-Icon und #0A0A0A verwenden.');
        } else {
          pass('Dark Splash Branding bestätigt.');
        }
      }

      const serializedConfig = JSON.stringify(expo).toLowerCase();
      const forbiddenBrandingMarkers = [
        'expo-logo',
        'expo-badge',
        'react-logo',
        'splash-icon',
        'expo.icon',
      ];
      const leakedMarker = forbiddenBrandingMarkers.find((marker) =>
        serializedConfig.includes(marker),
      );
      if (leakedMarker) {
        fail(`app.json enthält veraltetes Starter-Branding: ${leakedMarker}.`);
      } else {
        pass('Kein Expo-/React-Starter-Branding in app.json.');
      }
    }
  }

  const firebase = readJson('firebase.json');
  if (firebase) {
    if (firebase.firestore?.rules !== 'firestore.rules') {
      fail(
        'firebase.json muss firestore.rules als Firestore Rules Source verwenden.',
      );
    } else {
      pass('Firestore Rules Source korrekt.');
    }

    if (firebase.firestore?.indexes !== 'firestore.indexes.json') {
      fail(
        'firebase.json muss firestore.indexes.json als Index Source verwenden.',
      );
    } else {
      pass('Firestore Index Source korrekt.');
    }

    if (firebase.storage?.rules !== 'storage.rules') {
      fail(
        'firebase.json muss storage.rules als Storage Rules Source verwenden.',
      );
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

    if (!isExpoSdk57Version(expoVersion)) {
      fail(
        `Unerwartete Expo-Version ${String(expoVersion)}; erwartet Expo SDK 57.x.`,
      );
    } else {
      pass(`Expo SDK 57 Familie bestätigt (${expoVersion}).`);
    }

    if (reactNativeVersion !== '0.86.2') {
      fail(
        `Unerwartete React-Native-Version ${String(reactNativeVersion)}; erwartet 0.86.2.`,
      );
    } else {
      pass('React Native 0.86.2 bestätigt.');
    }

    if (reactVersion !== '19.2.3') {
      fail(
        `Unerwartete React-Version ${String(reactVersion)}; erwartet 19.2.3.`,
      );
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

  const obsoleteStarterAssets = [
    'assets/expo.icon',
    'assets/images/expo-badge-white.png',
    'assets/images/expo-badge.png',
    'assets/images/expo-logo.png',
    'assets/images/logo-glow.png',
    'assets/images/react-logo.png',
    'assets/images/react-logo@2x.png',
    'assets/images/react-logo@3x.png',
    'assets/images/splash-icon.png',
  ];
  const remainingStarterAsset = obsoleteStarterAssets.find((relativePath) =>
    fs.existsSync(path.join(ROOT, relativePath)),
  );
  if (remainingStarterAsset) {
    fail(`Veraltetes Expo-/React-Starterasset vorhanden: ${remainingStarterAsset}.`);
  } else {
    pass('Veraltete Expo-/React-Starterassets entfernt.');
  }

  if (process.exitCode) {
    console.error('\n❌ Production Foundation Preflight fehlgeschlagen.');
    return;
  }

  console.log('\n✅ Production Foundation Preflight bestanden.');
}

main();
