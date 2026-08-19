const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const action = process.argv[2] ?? 'preflight';
const projectId = process.env.OMNI_FIREBASE_PROJECT_ID?.trim() ?? '';
const environment = process.env.OMNI_FIREBASE_ENV?.trim() ?? '';
const productionConfirmation =
  process.env.OMNI_CONFIRM_PRODUCTION_PROJECT?.trim() ?? '';

const DEPLOY_TARGETS = {
  firestore: 'firestore',
  storage: 'storage',
  functions: 'functions',
  all: 'firestore,storage,functions',
};

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function requireRepositoryFile(relativePath) {
  if (!fs.existsSync(path.join(ROOT, relativePath))) {
    fail(`${relativePath} fehlt; Deployment wird abgebrochen.`);
  }
}

function validateProjectContext() {
  if (!/^[a-z0-9][a-z0-9-]{4,39}$/i.test(projectId)) {
    fail(
      'OMNI_FIREBASE_PROJECT_ID fehlt oder ist ungültig. Setze die exakte Firebase Project ID explizit.',
    );
  }

  if (environment !== 'development' && environment !== 'production') {
    fail('OMNI_FIREBASE_ENV muss explizit development oder production sein.');
  }

  if (environment === 'production' && productionConfirmation !== projectId) {
    fail(
      'Production-Deploy blockiert. Setze OMNI_CONFIRM_PRODUCTION_PROJECT exakt auf dieselbe Production Project ID.',
    );
  }
}

function runFirebase(args) {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(npx, ['--yes', 'firebase-tools', ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    fail(`Firebase CLI konnte nicht gestartet werden: ${result.error.message}`);
  }

  process.exit(result.status ?? 1);
}

function preflight() {
  [
    'firebase.json',
    'firestore.rules',
    'firestore.indexes.json',
    'storage.rules',
    'functions/package.json',
    'functions/package-lock.json',
  ].forEach(requireRepositoryFile);

  validateProjectContext();

  console.log('✅ Firebase Deployment Preflight bestanden.');
  console.log(`   Environment: ${environment}`);
  console.log(`   Project ID: ${projectId}`);
  if (environment === 'production') {
    console.log('   Production-Doppelbestätigung: vorhanden');
  }
}

if (action === 'emulators') {
  runFirebase([
    'emulators:start',
    '--project',
    'demo-omni-fashion-local',
    '--only',
    'auth,firestore,storage,functions',
  ]);
}

if (action === 'preflight') {
  preflight();
  process.exit(0);
}

const target = DEPLOY_TARGETS[action];
if (!target) {
  fail(
    `Unbekannte Aktion ${action}. Erlaubt: preflight, emulators, firestore, storage, functions, all.`,
  );
}

preflight();
runFirebase(['deploy', '--project', projectId, '--only', target]);
