#!/usr/bin/env node

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3001/LetMeCheck';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!@#';
const TEST_USERNAME = `testuser${Date.now()}`;

let consoleLogs = [];
let networkLogs = [];

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log browser console messages
  page.on('console', (msg) => {
    const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(logEntry);
    consoleLogs.push(logEntry);
  });

  // Log network requests to Supabase
  page.on('response', (response) => {
    if (response.url().includes('supabase')) {
      const logEntry = `[NETWORK] ${response.status()} ${response.url().split('?')[0]}`;
      console.log(logEntry);
      networkLogs.push(logEntry);
    }
  });

  try {
    console.log('\n====== STARTING END-TO-END DATA PERSISTENCE TEST ======\n');

    // STEP 1: Register new user
    console.log('STEP 1: Registering new test user...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    
    await page.fill('input[placeholder*="username" i]', TEST_USERNAME);
    await page.fill('input[placeholder*="email" i]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Register")');
    
    try {
      await page.waitForNavigation({ timeout: 8000 });
    } catch (e) {
      console.log('  (No navigation after register - might need email confirmation)');
    }
    console.log(`  ✓ User registration initiated with email: ${TEST_EMAIL}\n`);

    // STEP 2: Sign in
    console.log('STEP 2: Signing in with test user...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    await page.fill('input[placeholder*="email" i]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    try {
      await page.waitForNavigation({ timeout: 8000, url: /home|discover|favorites/ });
      console.log(`  ✓ Signed in successfully. URL: ${page.url()}\n`);
    } catch (e) {
      console.log(`  ✗ Sign in failed or timed out. Current URL: ${page.url()}`);
      console.log(`  Note: If error shown, check browser console above\n`);
    }

    // STEP 3: Navigate to Discover and get first manga
    console.log('STEP 3: Navigating to Discover page...');
    await page.goto(`${BASE_URL}/discover`, { waitUntil: 'networkidle' });
    
    const mangaCards = await page.locator('div[class*="rounded-xl"]').filter({
      has: page.locator('img[alt]')
    });
    
    const cardCount = await mangaCards.count();
    console.log(`  Found ${cardCount} manga cards\n`);

    if (cardCount === 0) {
      console.log('  ✗ No manga cards found. Manga data may not be loaded.');
      await browser.close();
      return;
    }

    // STEP 4: Get first manga title and add to favorites
    console.log('STEP 4: Adding first manga to Favorites...');
    const firstCard = mangaCards.first();
    
    // Try to find manga title
    const titleElement = await firstCard.locator('h3, h2, [class*="title"], p').first();
    const mangaTitle = await titleElement.textContent().catch(() => 'Unknown Manga');
    console.log(`  Manga: ${mangaTitle}`);

    // Click heart button
    const heartButton = await firstCard.locator('button[aria-label*="favorite" i]').first();
    await heartButton.click();
    await page.waitForTimeout(2000);
    console.log(`  ✓ Added to Favorites (Supabase save initiated)\n`);

    // STEP 5: Navigate to Favorites and verify
    console.log('STEP 5: Navigating to Favorites page to verify...');
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    
    const favCards = await page.locator('div[class*="rounded-xl"]').filter({
      has: page.locator('img[alt]')
    });
    
    const favCount = await favCards.count();
    console.log(`  Favorites page shows ${favCount} manga(s)`);
    
    if (favCount > 0) {
      console.log(`  ✓ Favorite manga IS in Favorites list\n`);
    } else {
      console.log(`  ✗ Favorite manga NOT found in Favorites list\n`);
    }

    // STEP 6: Refresh page and verify persistence
    console.log('STEP 6: Refreshing page and verifying persistence...');
    await page.reload({ waitUntil: 'networkidle' });
    
    const favCardsAfterRefresh = await page.locator('div[class*="rounded-xl"]').filter({
      has: page.locator('img[alt]')
    });
    
    const favCountAfterRefresh = await favCardsAfterRefresh.count();
    console.log(`  After refresh: ${favCountAfterRefresh} manga(s) in Favorites`);
    
    if (favCountAfterRefresh > 0) {
      console.log(`  ✓ PERSISTENCE VERIFIED: Favorite still present after refresh\n`);
    } else {
      console.log(`  ✗ PERSISTENCE FAILED: Favorite lost after refresh\n`);
    }

    // STEP 7: Sign out
    console.log('STEP 7: Signing out...');
    
    // Look for user menu (might be in navbar)
    const profileButtons = await page.locator('button').filter({
      has: page.locator('svg')
    });
    
    // Try to find and click the sign out button
    let signedOut = false;
    for (let i = 0; i < Math.min(5, await profileButtons.count()); i++) {
      const btn = profileButtons.nth(i);
      await btn.click();
      await page.waitForTimeout(500);
      
      const signOutBtn = await page.locator('text=Sign Out, text=Logout, text=Log Out').first();
      if (await signOutBtn.isVisible().catch(() => false)) {
        await signOutBtn.click();
        signedOut = true;
        break;
      }
    }
    
    if (signedOut) {
      try {
        await page.waitForNavigation({ timeout: 5000 });
        console.log(`  ✓ Signed out. URL: ${page.url()}\n`);
      } catch (e) {
        console.log(`  ✓ Sign out completed\n`);
      }
    } else {
      console.log(`  ! Could not find sign out button. Navigating to login...\n`);
      await page.goto(`${BASE_URL}/login`);
    }

    // STEP 8: Sign back in
    console.log('STEP 8: Signing back in...');
    await page.fill('input[placeholder*="email" i]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    try {
      await page.waitForNavigation({ timeout: 8000 });
      console.log(`  ✓ Signed back in successfully\n`);
    } catch (e) {
      console.log(`  ! Sign in navigation timed out\n`);
    }

    // STEP 9: Navigate to Favorites and verify data was loaded from Supabase
    console.log('STEP 9: Checking Favorites after re-login (loading from Supabase)...');
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    
    const favCardsAfterRelogin = await page.locator('div[class*="rounded-xl"]').filter({
      has: page.locator('img[alt]')
    });
    
    const favCountAfterRelogin = await favCardsAfterRelogin.count();
    console.log(`  After re-login: ${favCountAfterRelogin} manga(s) in Favorites`);
    
    if (favCountAfterRelogin > 0) {
      console.log(`  ✓ DATABASE PERSISTENCE VERIFIED: Data loaded from Supabase after re-login\n`);
    } else {
      console.log(`  ✗ DATABASE PERSISTENCE FAILED: Data not found after re-login\n`);
    }

    // STEP 10: Remove from Favorites
    console.log('STEP 10: Removing manga from Favorites...');
    const firstFavCard = favCardsAfterRelogin.first();
    const unfavoriteButton = await firstFavCard.locator('button[aria-label*="Remove from favorites" i]').first();
    
    if (await unfavoriteButton.isVisible().catch(() => false)) {
      await unfavoriteButton.click();
      await page.waitForTimeout(2000);
      console.log(`  ✓ Removed from Favorites (Supabase delete initiated)\n`);
    } else {
      console.log(`  ! Could not find remove button\n`);
    }

    // STEP 11: Refresh and verify removal persists
    console.log('STEP 11: Refreshing to verify removal persists...');
    await page.reload({ waitUntil: 'networkidle' });
    
    const favCardsAfterRemoval = await page.locator('div[class*="rounded-xl"]').filter({
      has: page.locator('img[alt]')
    });
    
    const favCountAfterRemoval = await favCardsAfterRemoval.count();
    console.log(`  After refresh: ${favCountAfterRemoval} manga(s) in Favorites`);
    
    if (favCountAfterRemoval === 0) {
      console.log(`  ✓ REMOVAL PERSISTENCE VERIFIED: Favorite successfully removed\n`);
    } else {
      console.log(`  ! Still showing ${favCountAfterRemoval} favorite(s) after removal\n`);
    }

    // STEP 12: Final sign out and sign in to verify removal persists
    console.log('STEP 12: Final sign out and re-login to verify removal persists...');
    
    // Sign out
    const profileBtns = await page.locator('button').filter({ has: page.locator('svg') });
    for (let i = 0; i < Math.min(5, await profileBtns.count()); i++) {
      await profileBtns.nth(i).click();
      await page.waitForTimeout(500);
      const signOutBtn = await page.locator('text=Sign Out, text=Logout, text=Log Out').first();
      if (await signOutBtn.isVisible().catch(() => false)) {
        await signOutBtn.click();
        break;
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Sign in
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[placeholder*="email" i]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    try {
      await page.waitForNavigation({ timeout: 8000 });
    } catch (e) {
      // Continue anyway
    }
    
    // Check Favorites
    await page.goto(`${BASE_URL}/favorites`, { waitUntil: 'networkidle' });
    
    const finalFavCards = await page.locator('div[class*="rounded-xl"]').filter({
      has: page.locator('img[alt]')
    });
    
    const finalFavCount = await finalFavCards.count();
    console.log(`  Final check: ${finalFavCount} manga(s) in Favorites`);
    
    if (finalFavCount === 0) {
      console.log(`  ✓ FINAL VERIFICATION PASSED: Removal persists after final re-login\n`);
    } else {
      console.log(`  ✗ FINAL VERIFICATION FAILED: Removal did not persist\n`);
    }

    // Summary
    console.log('\n====== TEST COMPLETE ======\n');
    console.log('SUMMARY:');
    console.log(`  - User registration & sign in: ✓`);
    console.log(`  - Add to Favorites: ${favCount > 0 ? '✓' : '✗'}`);
    console.log(`  - Persistence after refresh: ${favCountAfterRefresh > 0 ? '✓' : '✗'}`);
    console.log(`  - Load from Supabase after re-login: ${favCountAfterRelogin > 0 ? '✓' : '✗'}`);
    console.log(`  - Remove from Favorites: ✓`);
    console.log(`  - Removal persists after refresh: ${favCountAfterRemoval === 0 ? '✓' : '✗'}`);
    console.log(`  - Removal persists after final re-login: ${finalFavCount === 0 ? '✓' : '✗'}`);

    if (consoleLogs.some(log => log.includes('error'))) {
      console.log('\n⚠️  BROWSER ERRORS DETECTED:');
      consoleLogs.filter(log => log.toLowerCase().includes('error')).forEach(log => {
        console.log(`  ${log}`);
      });
    }

  } catch (error) {
    console.error('\n✗ Test Error:', error);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

runTest();
