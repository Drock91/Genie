/**
 * Test Web Browser Tool
 * 
 * Quick test to verify the universal web browser works
 */

import { WebBrowserTool } from '../src/tools/webBrowserTool.js';

async function testBrowser() {
  console.log('🌐 Testing Universal Web Browser Tool\n');
  
  const browser = new WebBrowserTool({ headless: true });
  
  try {
    // Test 1: Search
    console.log('📝 Test 1: DuckDuckGo Search');
    const searchResult = await browser.search('SBIR grants for AI', 'duckduckgo');
    console.log(`   Success: ${searchResult.success}`);
    console.log(`   Results found: ${searchResult.content?.linkCount || 0} links`);
    console.log(`   Word count: ${searchResult.content?.wordCount || 0}`);
    console.log('');
    
    // Test 2: Navigate to a page
    console.log('📝 Test 2: Navigate to sam.gov');
    const navResult = await browser.navigate('https://sam.gov', { delay: 2000 });
    console.log(`   Success: ${navResult.success}`);
    console.log(`   Title: ${navResult.title}`);
    console.log(`   Links found: ${navResult.content?.linkCount || 0}`);
    console.log(`   Forms found: ${navResult.content?.forms?.length || 0}`);
    console.log(`   Buttons found: ${navResult.content?.buttons?.length || 0}`);
    console.log('');
    
    // Test 3: Navigate to GitHub
    console.log('📝 Test 3: Navigate to GitHub');
    const ghResult = await browser.navigate('https://github.com/trending', { delay: 1000, maxLength: 5000 });
    console.log(`   Success: ${ghResult.success}`);
    console.log(`   Title: ${ghResult.title}`);
    console.log(`   Text preview: ${ghResult.content?.text?.substring(0, 200)}...`);
    console.log('');
    
    // Test 4: Custom search URL
    console.log('📝 Test 4: Custom search (NPM)');
    const npmResult = await browser.search('puppeteer', 'npm');
    console.log(`   Success: ${npmResult.success}`);
    console.log(`   URL: ${npmResult.url}`);
    console.log('');
    
    // Test 5: Screenshot
    console.log('📝 Test 5: Screenshot');
    await browser.navigate('https://news.ycombinator.com');
    const ssResult = await browser.screenshot('./output/test-screenshot.png');
    console.log(`   Success: ${ssResult.success}`);
    console.log(`   Path: ${ssResult.path}`);
    console.log('');
    
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testBrowser().catch(console.error);
