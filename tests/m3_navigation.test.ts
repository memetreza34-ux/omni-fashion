/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('M3 Navigation: Web Tab Navigation (app-tabs.web.tsx) contains all 5 routes and UI polish elements', () => {
  const webTabsPath = path.join(rootDir, 'src/components/app-tabs.web.tsx');
  assert.ok(
    fs.existsSync(webTabsPath),
    'src/components/app-tabs.web.tsx must exist',
  );

  const content = fs.readFileSync(webTabsPath, 'utf8');

  // Verify active screen route names and hrefs
  assert.ok(
    content.includes('name="index"') && content.includes('href="/"'),
    'Must include index route',
  );
  assert.ok(
    content.includes('name="stylist"') && content.includes('href="/stylist"'),
    'Must include stylist route',
  );
  assert.ok(
    content.includes('name="shop"') && content.includes('href="/shop"'),
    'Must include shop route',
  );
  assert.ok(
    content.includes('name="swap"') && content.includes('href="/swap"'),
    'Must include swap route',
  );
  assert.ok(
    content.includes('name="profile"') && content.includes('href="/profile"'),
    'Must include profile route',
  );

  // Verify labels
  assert.ok(content.includes('label="Schrank"'), 'Must include Schrank label');
  assert.ok(content.includes('label="Stylist"'), 'Must include Stylist label');
  assert.ok(content.includes('label="Shop"'), 'Must include Shop label');
  assert.ok(
    content.includes('label="OmniSwap"'),
    'Must include OmniSwap label',
  );
  assert.ok(content.includes('label="Profil"'), 'Must include Profil label');

  // Verify Lucide icons
  assert.ok(content.includes('icon={Shirt}'), 'Must include Shirt icon');
  assert.ok(content.includes('icon={Sparkles}'), 'Must include Sparkles icon');
  assert.ok(
    content.includes('icon={ShoppingBag}'),
    'Must include ShoppingBag icon',
  );
  assert.ok(content.includes('icon={Repeat}'), 'Must include Repeat icon');
  assert.ok(content.includes('icon={User}'), 'Must include User icon');

  // Verify glassmorphism, brand title, and eco badge
  assert.ok(
    content.includes('backdropFilter') || content.includes('blur('),
    'Must include glassmorphism backdrop filter',
  );
  assert.ok(
    content.includes('Omni-Fashion'),
    'Must include brand title Omni-Fashion',
  );
  assert.ok(
    content.includes('Circular Hub'),
    'Must include eco badge Circular Hub',
  );
  assert.ok(
    content.includes('activeIndicator'),
    'Must include active tab indicator styling',
  );
});

test('M3 Navigation: Native Tab Navigation (app-tabs.tsx) contains swap trigger', () => {
  const nativeTabsPath = path.join(rootDir, 'src/components/app-tabs.tsx');
  assert.ok(
    fs.existsSync(nativeTabsPath),
    'src/components/app-tabs.tsx must exist',
  );

  const content = fs.readFileSync(nativeTabsPath, 'utf8');

  assert.ok(
    content.includes('name="swap"'),
    'Must include NativeTabs.Trigger for swap',
  );
  assert.ok(
    content.includes('OmniSwap'),
    'Must include OmniSwap label for native tabs',
  );
});
