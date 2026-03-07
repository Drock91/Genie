#!/usr/bin/env node
/**
 * Get detailed info on top SAM.gov opportunities for DKP Gaming LLC
 */

import 'dotenv/config';
import { WebBrowserTool } from './src/tools/webBrowserTool.js';
import fs from 'fs';

const browser = new WebBrowserTool({ headless: true });

const opportunities = [
  {
    name: 'Human Machine Integrated Formations (HMIF) Integration Enabling Technologies',
    id: 'W15QKN26T1B5E',
    agency: 'US Army',
    deadline: 'March 9, 2026',
    type: 'RFI (Request for Information)',
    match: 'AI/ML, Automation, Software Integration',
    url: 'https://sam.gov/opp/W15QKN26T1B5E/view'
  },
  {
    name: 'Data Fusion Correlator',
    id: 'N0016426SNB38',
    agency: 'US Navy - NSWC Crane',
    deadline: 'March 20, 2026',
    type: 'Special Notice',
    match: 'Data Processing, Software Systems',
    url: 'https://sam.gov/opp/N0016426SNB38/view'
  },
  {
    name: 'Unmanned Common Controller (UCC)',
    id: '243-26-012',
    agency: 'US Marine Corps - NAVAIR',
    deadline: 'March 23, 2026',
    type: 'Sources Sought',
    match: 'Software Development, Control Systems',
    url: 'https://sam.gov/opp/243-26-012/view'
  }
];

async function getOpportunityDetails() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          TOP OPPORTUNITIES FOR DKP GAMING LLC                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const details = [];

  for (const opp of opportunities) {
    console.log(`\n📋 ${opp.name}`);
    console.log('─'.repeat(60));
    console.log(`   ID: ${opp.id}`);
    console.log(`   Agency: ${opp.agency}`);
    console.log(`   Deadline: ${opp.deadline}`);
    console.log(`   Type: ${opp.type}`);
    console.log(`   Skill Match: ${opp.match}`);
    console.log(`   Fetching details...`);

    try {
      const result = await browser.navigate(opp.url, { delay: 12000, maxLength: 80000 });
      if (result.success && result.content?.text) {
        console.log(`   ✅ Retrieved ${result.content.text.length} chars`);
        details.push({
          ...opp,
          content: result.content.text
        });
        
        // Print key sections
        console.log('\n   DETAILS:');
        console.log(result.content.text.substring(0, 10000));
      } else {
        console.log('   ❌ Could not retrieve details');
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e.message}`);
    }
  }

  // Save detailed results
  const outputFile = './output/opportunity-details.json';
  fs.writeFileSync(outputFile, JSON.stringify(details, null, 2));
  console.log(`\n✅ Details saved to: ${outputFile}`);

  await browser.close();
}

getOpportunityDetails().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
