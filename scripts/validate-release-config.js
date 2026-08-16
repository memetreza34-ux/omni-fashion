const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appJson = JSON.parse(
  fs.readFileSync(path.join(root, 'app.json'), 'utf8'),
);
const easJson = JSON.parse(
  fs.readFileSync(path.join(root, 'eas.json'), 'utf8'),
);

const errors = [];
const warnings = [];

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${label} fehlt.`);
    return null;
  }
  return value.trim();
}

function isReverseDnsIdentifier(value) {
  return /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9_-]*){1,}$/.test(value);
}

const expo = appJson.expo ?? {};
const androidPackage = requireString(expo.android?.package, 'expo.android.package');
const iosBundleIdentifier = requireString(
  expo.ios?.bundleIdentifier,
  'expo.ios.bundleIdentifier',
);

if (androidPackage && !isReverseDnsIdentifier(androidPackage)) {
  errors.push('expo.android.package ist kein plausibler permanenter Reverse-DNS-Identifier.');
}
if (iosBundleIdentifier && !isReverseDnsIdentifier(iosBundleIdentifier)) {
  errors.push('expo.ios.bundleIdentifier ist kein plausibler permanenter Reverse-DNS-Identifier.');
}

const easProjectId = expo.extra?.eas?.projectId;
if (typeof easProjectId !== 'string' || !easProjectId.trim()) {
  errors.push('expo.extra.eas.projectId fehlt. Führe zuerst EAS init/linking mit dem echten Projekt aus.');
}

if (easJson.build?.preview?.environment !== 'preview') {
  errors.push('eas.json build.preview.environment muss explizit "preview" sein.');
}
if (easJson.build?.production?.environment !== 'production') {
  errors.push('eas.json build.production.environment muss explizit "production" sein.');
}

const requiredPublicEnvironment = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

for (const name of requiredPublicEnvironment) {
  const value = process.env[name];
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${name} fehlt in der geladenen Release-Umgebung.`);
  }
}

if (process.env.EXPO_PUBLIC_APP_ENV !== 'production') {
  errors.push('EXPO_PUBLIC_APP_ENV muss für diesen Release-Validator exakt "production" sein.');
}

const firebaseProjectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
if (firebaseProjectId && /(^|[-_.])(dev|test|preview|staging|ci)([-_.]|$)/i.test(firebaseProjectId)) {
  warnings.push(
    `EXPO_PUBLIC_FIREBASE_PROJECT_ID (${firebaseProjectId}) wirkt wie ein Nicht-Production-Projekt. Manuell prüfen.`,
  );
}

const publicValues = Object.entries(process.env).filter(([key]) =>
  key.startsWith('EXPO_PUBLIC_'),
);
const suspiciousSecretName = /(secret|private|admin|service_account|serviceaccount|token|password|gemini_api_key)/i;
for (const [key] of publicValues) {
  if (suspiciousSecretName.test(key)) {
    errors.push(`${key} sieht nach einem Secret aus und darf nicht als EXPO_PUBLIC_* in den Client gelangen.`);
  }
}

if (warnings.length > 0) {
  console.warn('\nRelease-Konfigurationswarnungen:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length > 0) {
  console.error('\nRelease-Konfiguration ist NICHT bereit:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error('\nEs wurde kein Release freigegeben.');
  process.exit(1);
}

console.log('Release-Konfiguration ist vollständig genug für den nächsten Production-Build-Schritt.');
console.log(`Android package: ${androidPackage}`);
console.log(`iOS bundle id: ${iosBundleIdentifier}`);
console.log(`EAS project id: ${easProjectId}`);
console.log(`Firebase project id: ${firebaseProjectId}`);
