/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Challenger 1 Empirical Verification: Web & Native Tab Route Consistency', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const nativeTabsPath = path.join(rootDir, 'src/components/app-tabs.tsx');

  assert.ok(fs.existsSync(webTabsPath), 'app-tabs.web.tsx must exist');
  assert.ok(fs.existsSync(nativeTabsPath), 'app-tabs.tsx must exist');

  const webContent = fs.readFileSync(webTabsPath, 'utf8');
  const nativeContent = fs.readFileSync(nativeTabsPath, 'utf8');

  // Verify all 5 routes exist in both components
  const requiredRoutes = ['index', 'stylist', 'shop', 'swap', 'profile'];
  for (const route of requiredRoutes) {
    assert.ok(
      webContent.includes(`name="${route}"`),
      `Web tabs must contain trigger for route '${route}'`,
    );
    assert.ok(
      nativeContent.includes(`name="${route}"`),
      `Native tabs must contain trigger for route '${route}'`,
    );
  }

  // Verify Hrefs in web tabs
  const hrefs = ['/', '/stylist', '/shop', '/swap', '/profile'];
  for (const href of hrefs) {
    assert.ok(
      webContent.includes(`href="${href}"`),
      `Web tabs must route to href '${href}'`,
    );
  }
});

test('Challenger 1 Empirical Verification: SVG Lucide Icon Export & Specifications', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Check exported SVG icon components
  const icons = ['Shirt', 'Sparkles', 'ShoppingBag', 'Repeat', 'User'];
  for (const icon of icons) {
    assert.ok(
      content.includes(`export const ${icon}: LucideIcon`),
      `app-tabs.web.tsx must export ${icon} typed with LucideIcon`,
    );
  }

  // Check SVG attributes present in component implementation
  assert.ok(
    content.includes("viewBox: '0 0 24 24'"),
    'SVG viewBox must be 0 0 24 24',
  );
  assert.ok(content.includes('strokeWidth: 2'), 'SVG strokeWidth must be 2');
  assert.ok(
    content.includes("strokeLinecap: 'round'"),
    'SVG strokeLinecap must be round',
  );
  assert.ok(
    content.includes("strokeLinejoin: 'round'"),
    'SVG strokeLinejoin must be round',
  );
});

test('Challenger 1 Empirical Verification: Glassmorphism & Micro-animations', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Glassmorphic background blur & border
  assert.ok(
    content.includes("backdropFilter: 'blur(16px)'"),
    'Must use 16px blur backdrop filter',
  );
  assert.ok(
    content.includes("WebkitBackdropFilter: 'blur(16px)'"),
    'Must support Webkit backdrop filter',
  );
  assert.ok(
    content.includes('borderRadius: 24'),
    'Must have rounded container corners',
  );

  // Light/Dark glassmorphic themes
  assert.ok(
    content.includes('rgba(255, 255, 255, 0.85)'),
    'Must have translucent light theme background',
  );
  assert.ok(
    content.includes('rgba(24, 24, 27, 0.85)'),
    'Must have translucent dark theme background',
  );

  // Active state colors
  assert.ok(
    content.includes('#4F46E5'),
    'Must use indigo primary accent for light active state',
  );
  assert.ok(
    content.includes('#818CF8'),
    'Must use indigo soft accent for dark active state',
  );

  // Active pill indicator
  assert.ok(
    content.includes('styles.activeIndicator'),
    'Active indicator view must be rendered when focused',
  );
  assert.ok(
    content.includes("position: 'absolute'"),
    'Active indicator must be absolute positioned',
  );

  // Tactile press micro-animation
  assert.ok(
    content.includes('pressed && styles.pressed'),
    'Pressable must apply press style state',
  );
  assert.ok(
    content.includes('opacity: 0.7'),
    'Pressed state must scale down and adjust opacity',
  );
});

test('Challenger 1 Empirical Verification: Zero Any Compliance Audit', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const nativeTabsPath = path.join(rootDir, 'src/components/app-tabs.tsx');

  const webContent = fs.readFileSync(webTabsPath, 'utf8');
  const nativeContent = fs.readFileSync(nativeTabsPath, 'utf8');

  // Check no explicit ': any' or 'as any' in either file
  assert.strictEqual(
    /: \s*any\b/.test(webContent),
    false,
    'app-tabs.web.tsx must contain no : any types',
  );
  assert.strictEqual(
    /\bas \s*any\b/.test(webContent),
    false,
    'app-tabs.web.tsx must contain no as any assertions',
  );

  assert.strictEqual(
    /: \s*any\b/.test(nativeContent),
    false,
    'app-tabs.tsx must contain no : any types',
  );
  assert.strictEqual(
    /\bas \s*any\b/.test(nativeContent),
    false,
    'app-tabs.tsx must contain no as any assertions',
  );
});
