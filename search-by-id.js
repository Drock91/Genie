#!/usr/bin/env node
/**
 * Search SAM.gov for specific opportunities by Notice ID
 */

import 'dotenv/config';
import { WebBrowserTool } from './src/tools/webBrowserTool.js';
import fs from 'fs';

const browser = new WebBrowserTool({ headless: true });

const opportunities = [
  {
    name: 'Human Machine Integrated Formations (HMIF)',
    noticeId: 'W15QKN26T1B5E',
    searchUrl: 'https://sam.gov/search/?index=opp&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=W15QKN26T1B5E'
  },
  {
    name: 'Unmanned Common Controller (UCC)',
    noticeId: '243-26-012',
    searchUrl: 'https://sam.gov/search/?index=opp&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=243-26-012'
  }
];

async function searchByNoticeId() {
  console.log('Searching for opportunities by Notice ID...\n');

  for (const opp of opportunities) {
    console.log(`\n🔍 Searching for: ${opp.name} (${opp.noticeId})`);
    console.log('─'.repeat(60));
    
    const result = await browser.navigate(opp.searchUrl, { delay: 10000, maxLength: 60000 });
    if (result.success && result.content?.text) {
      console.log(result.content.text.substring(0, 8000));
    }
  }

  await browser.close();
  console.log('\n✅ Search complete');
}

searchByNoticeId().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
