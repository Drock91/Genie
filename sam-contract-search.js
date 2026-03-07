#!/usr/bin/env node
/**
 * SAM.gov Contract Search for DKP Gaming LLC
 * SDVOSB | Node.js, AI/ML, Blockchain, Gaming Skills
 */

import 'dotenv/config';
import { WebBrowserTool } from './src/tools/webBrowserTool.js';
import fs from 'fs';

const browser = new WebBrowserTool({ headless: true });

async function searchSamGov() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       GENIE SAM.GOV CONTRACT SEARCH FOR DKP GAMING LLC       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  Status: 100% Service-Disabled Veteran (SDVOSB)              ║');
  console.log('║  Skills: Node.js, AI/ML, Blockchain, C#, Web Development     ║');
  console.log('║  NAICS: 541511, 541512, 541519                               ║');
  console.log('║  Target: Entry-level contracts under $250K                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const opportunities = [];

  try {
    // Search 1: SDVOSB Software/IT Set-Asides
    console.log('🔍 Search 1: SDVOSB Software Development Set-Asides...');
    const sdvosbUrl = 'https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&pageSize=25&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=software&sfm%5BsetAside%5D%5B0%5D=SDVOSBC';
    const r1 = await browser.navigate(sdvosbUrl, { delay: 8000, maxLength: 60000 });
    console.log('   Status:', r1.success ? 'SUCCESS' : 'FAILED');
    if (r1.content?.text) {
      console.log('   Content length:', r1.content.text.length, 'chars');
      opportunities.push({ search: 'SDVOSB Software', data: r1.content.text });
    }

    // Search 2: Sources Sought - IT/Software (lower barrier to entry)
    console.log('\n🔍 Search 2: Sources Sought - IT/Software...');
    const sourcesUrl = 'https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&pageSize=25&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=software&sfm%5Bnotice%5D%5B0%5D=SRCSGT';
    const r2 = await browser.navigate(sourcesUrl, { delay: 8000, maxLength: 60000 });
    console.log('   Status:', r2.success ? 'SUCCESS' : 'FAILED');
    if (r2.content?.text) {
      console.log('   Content length:', r2.content.text.length, 'chars');
      opportunities.push({ search: 'Sources Sought IT', data: r2.content.text });
    }

    // Search 3: AI/Machine Learning opportunities
    console.log('\n🔍 Search 3: AI/Machine Learning Opportunities...');
    const aiUrl = 'https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&pageSize=25&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=artificial%20intelligence';
    const r3 = await browser.navigate(aiUrl, { delay: 8000, maxLength: 60000 });
    console.log('   Status:', r3.success ? 'SUCCESS' : 'FAILED');
    if (r3.content?.text) {
      console.log('   Content length:', r3.content.text.length, 'chars');
      opportunities.push({ search: 'AI/ML', data: r3.content.text });
    }

    // Search 4: Web Development
    console.log('\n🔍 Search 4: Web Application Development...');
    const webUrl = 'https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&pageSize=25&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=web%20development&sfm%5BsetAside%5D%5B0%5D=SBA';
    const r4 = await browser.navigate(webUrl, { delay: 8000, maxLength: 60000 });
    console.log('   Status:', r4.success ? 'SUCCESS' : 'FAILED');
    if (r4.content?.text) {
      console.log('   Content length:', r4.content.text.length, 'chars');
      opportunities.push({ search: 'Web Development SB', data: r4.content.text });
    }

    // Search 5: Blockchain/DLT (Derek's specialty)
    console.log('\n🔍 Search 5: Blockchain/Distributed Ledger Technology...');
    const blockchainUrl = 'https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&pageSize=25&sfm%5Bstatus%5D%5Bis_active%5D=true&sfm%5BsimpleSearch%5D%5BkeywordTags%5D%5B0%5D%5Bkey%5D=blockchain';
    const r5 = await browser.navigate(blockchainUrl, { delay: 8000, maxLength: 60000 });
    console.log('   Status:', r5.success ? 'SUCCESS' : 'FAILED');
    if (r5.content?.text) {
      console.log('   Content length:', r5.content.text.length, 'chars');
      opportunities.push({ search: 'Blockchain/DLT', data: r5.content.text });
    }

    // Save raw results
    const outputDir = './output';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const outputFile = `${outputDir}/sam-search-${timestamp}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(opportunities, null, 2));
    console.log(`\n✅ Raw results saved to: ${outputFile}`);

    // Parse and display opportunities
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                    SEARCH RESULTS SUMMARY                      ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const opp of opportunities) {
      console.log(`\n📋 ${opp.search.toUpperCase()} OPPORTUNITIES:`);
      console.log('─'.repeat(50));
      // Extract key info from the text
      const text = opp.data;
      console.log(text.substring(0, 8000));
      console.log('\n');
    }

  } catch (error) {
    console.error('Error during search:', error.message);
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed. Search complete.');
  }
}

searchSamGov();
