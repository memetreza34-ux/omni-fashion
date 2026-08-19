const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const target = process.argv[2] ?? '.';
const cwd = path.resolve(root, target);

const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  cwd,
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

const raw = result.stdout?.trim();
if (!raw) {
  console.error(`Dependency audit produced no JSON for ${target}.`);
  if (result.stderr) {
    console.error(result.stderr.trim());
  }
  process.exit(1);
}

let audit;
try {
  audit = JSON.parse(raw);
} catch (error) {
  console.error(`Dependency audit JSON could not be parsed for ${target}.`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const vulnerabilities = audit.vulnerabilities ?? {};
const entries = Object.values(vulnerabilities).filter(
  (entry) => entry && typeof entry === 'object',
);

const severityOrder = ['critical', 'high', 'moderate', 'low', 'info'];
const counts = Object.fromEntries(severityOrder.map((severity) => [severity, 0]));
const direct = [];

for (const entry of entries) {
  const severity =
    typeof entry.severity === 'string' ? entry.severity.toLowerCase() : 'unknown';
  if (severity in counts) {
    counts[severity] += 1;
  }

  if (entry.isDirect === true) {
    direct.push({
      name: typeof entry.name === 'string' ? entry.name : 'unknown',
      severity,
      range: typeof entry.range === 'string' ? entry.range : 'unknown',
      fixAvailable: entry.fixAvailable ?? false,
    });
  }
}

console.log(`\nRuntime dependency audit: ${target}`);
console.log(
  `critical=${counts.critical} high=${counts.high} moderate=${counts.moderate} low=${counts.low} info=${counts.info}`,
);
console.log(`directRuntimeVulnerabilities=${direct.length}`);

for (const item of direct.sort((a, b) => a.name.localeCompare(b.name))) {
  console.log(
    `- ${item.name}: ${item.severity}, range=${item.range}, fixAvailable=${JSON.stringify(item.fixAvailable)}`,
  );
}

const metadata = audit.metadata?.vulnerabilities;
if (metadata && typeof metadata === 'object') {
  console.log(`npmMetadata=${JSON.stringify(metadata)}`);
}

console.log(
  `AUDIT_SUMMARY=${JSON.stringify({ target, counts, directRuntimeVulnerabilities: direct })}`,
);

// npm audit exits non-zero when vulnerabilities are found. This classifier is
// intentionally informational: dependency findings are reviewed package-by-package
// against Expo SDK 57 and Functions compatibility before becoming a blocking gate.
process.exit(0);
