/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Challenger 2 M3 Stress Test 1: Web Tabs Theme Switching & Color Scheme Support', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  assert.ok(fs.existsSync(webTabsPath), 'src/components/app-tabs.web.tsx must exist');

  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Verify theme detection hook usage
  assert.ok(content.includes('useColorScheme()'), 'Must use useColorScheme hook');
  assert.ok(content.includes("scheme === 'dark'"), 'Must handle dark color scheme condition');

  // Verify color palette definitions for active/inactive tabs
  assert.ok(content.includes('#818CF8'), 'Dark mode active color (#818CF8) must be defined');
  assert.ok(content.includes('#4F46E5'), 'Light mode active color (#4F46E5) must be defined');
  assert.ok(content.includes('#A1A1AA'), 'Dark mode inactive color (#A1A1AA) must be defined');
  assert.ok(content.includes('#71717A'), 'Light mode inactive color (#71717A) must be defined');

  // Verify container dark/light theme background and border styles
  assert.ok(content.includes('innerContainerLight'), 'Must contain innerContainerLight style definition');
  assert.ok(content.includes('innerContainerDark'), 'Must contain innerContainerDark style definition');
  assert.ok(content.includes('rgba(255, 255, 255, 0.85)'), 'Light container background must be translucent white');
  assert.ok(content.includes('rgba(24, 24, 27, 0.85)'), 'Dark container background must be translucent dark zinc');

  // Verify eco badge theme styles
  assert.ok(content.includes('ecoBadgeTextLight'), 'Must contain ecoBadgeTextLight');
  assert.ok(content.includes('ecoBadgeTextDark'), 'Must contain ecoBadgeTextDark');
  assert.ok(content.includes('#047857'), 'Light eco badge text must be emerald 700 (#047857)');
  assert.ok(content.includes('#34D399'), 'Dark eco badge text must be emerald 400 (#34D399)');
});

test('Challenger 2 M3 Stress Test 2: Web TabButton Prop Variations & Edge Condition Resilience', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Verify TabButton interface structure
  assert.ok(content.includes('export interface TabButtonProps extends TabTriggerSlotProps'), 'TabButtonProps must extend TabTriggerSlotProps');
  assert.ok(content.includes('icon?: LucideIcon'), 'icon prop must be optional LucideIcon');
  assert.ok(content.includes('label?: string'), 'label prop must be optional string');

  // Verify fallback when label is missing: {label || children}
  assert.ok(content.includes('{label || children}'), 'Text label must fallback to children when label is undefined');

  // Verify conditional rendering of Icon
  assert.ok(content.includes('{Icon && ('), 'Icon must be conditionally rendered to prevent crash when undefined');

  // Verify pressed state micro-animation and active tab pill indicator
  assert.ok(content.includes('pressed && styles.pressed'), 'Pressed state must trigger scale/opacity transform');
  assert.ok(content.includes('activeIndicator'), 'Focused tab must render activeIndicator pill');
});

test('Challenger 2 M3 Stress Test 3: Responsive Viewport & Glassmorphic Layout Structure', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Max width constraint for wide desktop viewports
  assert.ok(content.includes('maxWidth: MaxContentWidth'), 'Inner container must constrain width to MaxContentWidth (1200px)');

  // Absolute positioning for fixed top navigation bar
  assert.ok(content.includes("position: 'absolute'"), 'tabListContainer must use absolute positioning');
  assert.ok(content.includes('top: 0'), 'tabListContainer must anchor to top 0');
  assert.ok(content.includes('zIndex: 50'), 'tabListContainer must have high zIndex (50) for layer hierarchy');

  // Flexbox responsive alignment
  assert.ok(content.includes("flexDirection: 'row'"), 'Must arrange items in flex row');
  assert.ok(content.includes("alignItems: 'center'"), 'Must align items centered');
  assert.ok(content.includes("marginRight: 'auto'"), 'Brand group must push tab triggers to center/right');

  // Web CSS Glassmorphism properties
  assert.ok(content.includes("backdropFilter: 'blur(16px)'"), 'Must set backdropFilter blur');
  assert.ok(content.includes("WebkitBackdropFilter: 'blur(16px)'"), 'Must set WebkitBackdropFilter for Safari compatibility');
  assert.ok(content.includes('boxShadow'), 'Must set box shadow for depth effect');
});

test('Challenger 2 M3 Stress Test 4: Native Tabs Color Scheme Fallback & Route Parity', () => {
  const nativeTabsPath = path.join(rootDir, 'src/components/app-tabs.tsx');
  assert.ok(fs.existsSync(nativeTabsPath), 'src/components/app-tabs.tsx must exist');

  const content = fs.readFileSync(nativeTabsPath, 'utf8');

  // Check scheme fallback for 'unspecified' color scheme
  assert.ok(content.includes("scheme === 'unspecified' ? 'light' : scheme"), 'Native tabs must fallback to light when color scheme is unspecified');

  // Verify all 5 super-app tab triggers are present in native tabs
  const requiredTriggers = ['index', 'stylist', 'shop', 'swap', 'profile'];
  for (const name of requiredTriggers) {
    assert.ok(content.includes(`name="${name}"`), `Native tabs must contain trigger for '${name}'`);
  }

  // Verify asset image icons are used
  assert.ok(content.includes('home.png'), 'Must require home.png tab icon');
  assert.ok(content.includes('stylist.png'), 'Must require stylist.png tab icon');
  assert.ok(content.includes('shop.png'), 'Must require shop.png tab icon');
  assert.ok(content.includes('explore.png'), 'Must require explore.png tab icon');
  assert.ok(content.includes('profile.png'), 'Must require profile.png tab icon');
});

test('Challenger 2 M3 Stress Test 5: Lucide Zero-Dependency SVG Icon Exports & Fallbacks', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Verify exported SVG icons
  const icons = ['Shirt', 'Sparkles', 'ShoppingBag', 'Repeat', 'User'];
  for (const icon of icons) {
    assert.ok(content.includes(`export const ${icon}: LucideIcon`), `Must export icon component: ${icon}`);
  }

  // Verify platform check for SVG vs Native Text emoji fallback
  assert.ok(content.includes("Platform.OS === 'web'"), 'Icons must check Platform.OS === web');
  assert.ok(content.includes('React.createElement(') && content.includes("'svg'"), 'Must render SVG element on web platform');
  assert.ok(content.includes('size = 16'), 'Default icon size must be 16');
  assert.ok(content.includes("color = 'currentColor'"), 'Default icon color must be currentColor');
});

test('Challenger 2 M3 Stress Test 6: Zero-Any Type Audit on Navigation Components', () => {
  const targetFiles = [
    'src/components/app-tabs.web.tsx',
    'src/components/app-tabs.tsx',
  ];

  const anyPatterns = [/: *any\b/, /as  *any\b/, /< *any *>/, /\bany *\[ *\]/];

  for (const relPath of targetFiles) {
    const fullPath = path.join(rootDir, relPath);
    assert.ok(fs.existsSync(fullPath), `File path must exist: ${relPath}`);

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const pattern of anyPatterns) {
      assert.ok(!pattern.test(content), `File ${relPath} contains forbidden 'any' pattern`);
    }
  }
});
