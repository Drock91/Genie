#!/usr/bin/env node
/**
 * Income Battle Plan Generator
 * Creates a detailed, actionable PDF plan for generating income
 * Tailored for disabled veterans with physical limitations
 */

import "dotenv/config";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { llmJson } from "./src/llm/openaiClient.js";

const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

// Income opportunities database - NO PHYSICAL LABOR
const INCOME_OPPORTUNITIES = {
  immediate: {
    name: "Immediate Income (1-7 Days)",
    options: [
      {
        name: "Notary Public + Loan Signing Agent",
        startup: 300,
        timeToIncome: "2-3 weeks",
        monthlyPotential: "2000-5000",
        physicalDemand: "Minimal - sit at table",
        steps: [
          "Apply for FL Notary Commission online at notaries.dos.state.fl.us ($25 application)",
          "Complete required 3-hour notary education course ($50-75)",
          "Get $7,500 notary bond (usually $50/4 years)",
          "Once commissioned, take Loan Signing Agent course at notarylearningcenter.com ($150)",
          "Get E&O insurance - notaryinsurance.com ($100/year)",
          "Create profiles on: SnapDocs, Notarize, SigningOrder, NotaryRotary",
          "Join Facebook groups: 'Notary Signing Agents' and 'Florida Notaries'",
          "Start reaching out to title companies in Tallahassee directly"
        ],
        tallahasseeTip: "State capital = high volume of real estate transactions, refinances, legal documents"
      },
      {
        name: "Remote Customer Service Rep",
        startup: 0,
        timeToIncome: "1-2 weeks",
        monthlyPotential: "2000-3500",
        physicalDemand: "None - work from home",
        steps: [
          "Update resume highlighting customer service, communication skills",
          "Apply to Amazon Virtual (amazonforceblog.com/virtual-locations)",
          "Apply to Liveops.com (independent contractor)",
          "Apply to TTEC.com (remote positions)",
          "Apply to Concentrix (work from home)",
          "Apply to Arise.com (build your own schedule)",
          "Check FlexJobs.com for curated remote positions",
          "Veteran preference: Apply to USAA, Wounded Warrior Project jobs"
        ],
        tallahasseeTip: "FL has no state income tax - keep more of what you earn"
      },
      {
        name: "Insurance Claims Adjuster (Inside/Desk)",
        startup: 350,
        timeToIncome: "3-4 weeks",
        monthlyPotential: "4000-8000",
        physicalDemand: "None - phone/computer work",
        steps: [
          "Get FL 6-20 All Lines Adjuster License (online course ~$300)",
          "Take the state exam (prometric.com)",
          "Apply to staff adjuster positions (desk work, not field)",
          "Companies hiring: Sedgwick, Crawford, Pilot Catastrophe",
          "Register with adjusterpro.com for deployment",
          "During storm season (June-November) income can triple",
          "Veteran status is valued by insurance companies"
        ],
        tallahasseeTip: "FL is hurricane central - massive adjuster demand every season"
      },
      {
        name: "Virtual Assistant Services",
        startup: 0,
        timeToIncome: "1-2 weeks",
        monthlyPotential: "1500-4000",
        physicalDemand: "None",
        steps: [
          "Create profile on Belay Solutions (premium VA company)",
          "Sign up on Time Etc (US-based VA platform)",
          "Register on FreeUp (vetted freelancer marketplace)",
          "Create Fiverr gig for administrative services",
          "Create Upwork profile highlighting veteran status",
          "Offer: email management, calendar, research, data entry",
          "Target small business owners who need part-time help"
        ],
        tallahasseeTip: "State government contractors often need admin support"
      }
    ]
  },
  shortTerm: {
    name: "Short-Term Income (2-4 Weeks)",
    options: [
      {
        name: "Tax Preparation (Seasonal Gold Mine)",
        startup: 200,
        timeToIncome: "Tax season",
        monthlyPotential: "5000-15000 (Jan-Apr)",
        physicalDemand: "None - desk work",
        steps: [
          "Get PTIN (Preparer Tax ID Number) at irs.gov/ptin - FREE",
          "Take IRS Annual Filing Season Program course ($150)",
          "Buy tax software: Drake Tax or TaxSlayer Pro ($300-500/year)",
          "Get E&O insurance for tax preparers ($200/year)",
          "VITA certification is FREE through IRS (builds experience)",
          "Start advertising November for tax season",
          "Average return fee: $150-400, do 3-5/day during season",
          "Veterans can process other veterans' returns (built-in market)"
        ],
        tallahasseeTip: "FSU students, state workers, military families = huge client base"
      },
      {
        name: "SDVOSB Federal Contracting (Your Golden Ticket)",
        startup: 0,
        timeToIncome: "30-90 days",
        monthlyPotential: "5000-50000+",
        physicalDemand: "None - administrative",
        steps: [
          "Verify SAM.gov registration is current",
          "Confirm VetCert.SBA.gov certification active",
          "Search beta.SAM.gov for SDVOSB set-aside contracts",
          "Focus on: IT support, training, admin services, consulting",
          "Contact prime contractors for subcontracting (mentor-protégé)",
          "Attend PTAC counseling (FREE) - Florida PTAC at flptac.org",
          "Target VA contracts first (3% SDVOSB goal)",
          "Consider GSA Schedule for long-term positioning"
        ],
        tallahasseeTip: "Tallahassee has VA Regional Office, SSA, federal courts - all need SDVOSB vendors"
      },
      {
        name: "Online Course Creation",
        startup: 100,
        timeToIncome: "4-8 weeks",
        monthlyPotential: "1000-10000 (passive)",
        physicalDemand: "None",
        steps: [
          "Identify your expertise (military skills translate well)",
          "Create course outline (10-20 short video lessons)",
          "Record with smartphone + free editing software (DaVinci Resolve)",
          "Upload to Udemy, Skillshare, or Teachable",
          "Topics that sell: leadership, project management, discipline systems",
          "Veteran angle: 'Military-Grade [X] Training'",
          "Price: $49-199, Udemy takes 50% but provides students",
          "Once created, earns passively forever"
        ],
        tallahasseeTip: "FSU and FAMU students are always looking for practical skills courses"
      }
    ]
  },
  mediumTerm: {
    name: "Medium-Term Income (30-90 Days)",
    options: [
      {
        name: "IT Help Desk / Tech Support (Remote)",
        startup: 0,
        timeToIncome: "2-4 weeks",
        monthlyPotential: "3500-5500",
        physicalDemand: "None",
        steps: [
          "Get CompTIA A+ certification (study 2-3 weeks, exam $240)",
          "Free training: Professor Messer on YouTube",
          "Apply to Robert Half Technology (veteran friendly)",
          "Apply to TEKsystems (remote positions)",
          "Government IT jobs: USAJobs.gov (veteran preference)",
          "Look for 'Tier 1' or 'Help Desk' positions (entry level)",
          "Veteran preference gives you 5-10 point advantage on federal jobs"
        ],
        tallahasseeTip: "State of FL IT jobs pay well, check jobs.myflorida.com"
      },
      {
        name: "Disability Consulting/Advocacy",
        startup: 0,
        timeToIncome: "Immediate",
        monthlyPotential: "2000-8000",
        physicalDemand: "None",
        steps: [
          "Get VA Accredited Claims Agent certification (FREE through VA)",
          "Help other veterans file disability claims (you know the system)",
          "Charge consulting fees for claim strategy (not claim filing - that's free)",
          "Partner with VSOs for referrals",
          "Create content teaching veterans to maximize their ratings",
          "Build YouTube channel / TikTok with claim tips",
          "Offer 'Nexus Letter Strategy' consulting"
        ],
        tallahasseeTip: "Large veteran population in North FL, huge demand for help"
      }
    ]
  }
};

// Week-by-week battle plan
const BATTLE_PLAN = {
  week1: {
    name: "WEEK 1: Foundation & Quick Wins",
    days: [
      {
        day: "Day 1 (TODAY)",
        tasks: [
          "Apply for FL Notary Commission online - notaries.dos.state.fl.us",
          "Create/update LinkedIn profile with veteran status",
          "Apply to 3 remote customer service jobs (Amazon Virtual, Liveops, TTEC)",
          "Verify SAM.gov registration is current"
        ],
        cost: "$25-75",
        time: "2-3 hours"
      },
      {
        day: "Day 2-3",
        tasks: [
          "Complete FL Notary education course online (3 hours)",
          "Submit 5 more remote job applications",
          "Research Tallahassee title companies (make list of 10)",
          "Join notary Facebook groups for networking"
        ],
        cost: "$50-75",
        time: "4-5 hours"
      },
      {
        day: "Day 4-5",
        tasks: [
          "Start Loan Signing Agent course",
          "Follow up on job applications",
          "Create basic VA profile on Upwork/Fiverr",
          "Contact FSU/FAMU about VITA volunteer position (builds tax experience)"
        ],
        cost: "$150",
        time: "3-4 hours"
      },
      {
        day: "Day 6-7",
        tasks: [
          "Complete LSA course certification",
          "Apply for E&O insurance",
          "Create SnapDocs, Notarize, SigningOrder profiles",
          "Make first calls to title companies introducing yourself"
        ],
        cost: "$100",
        time: "4-5 hours"
      }
    ]
  },
  week2: {
    name: "WEEK 2: Activation & First Income",
    days: [
      {
        day: "Day 8-10",
        tasks: [
          "Receive Notary commission (if approved quickly) or continue remote job search",
          "Complete any pending job interviews",
          "Sign up for insurance adjuster course (6-20 license) if notary delayed",
          "Search beta.SAM.gov for SDVOSB opportunities"
        ],
        cost: "$0-300",
        time: "3-4 hours/day"
      },
      {
        day: "Day 11-14",
        tasks: [
          "Begin accepting notary/LSA assignments",
          "TARGET: Complete first signing ($75-150)",
          "Start remote job if hired",
          "Contact Florida PTAC for SDVOSB counseling appointment"
        ],
        cost: "$0",
        time: "Varies"
      }
    ]
  },
  week3_4: {
    name: "WEEKS 3-4: Scale & Diversify",
    tasks: [
      "Build notary reputation with 5-star ratings",
      "Target 1-2 signings per day ($150-400/day potential)",
      "Begin insurance adjuster licensing if demand exists",
      "Apply for PTIN (tax preparer ID) for upcoming tax season",
      "Submit first SDVOSB contract bid if opportunity found",
      "Create systems: scheduling, tracking income, expenses for taxes"
    ]
  },
  month2_3: {
    name: "MONTHS 2-3: Maximize & Stabilize",
    tasks: [
      "Notary business should be generating $2,000-4,000/month",
      "Add insurance adjusting for hurricane season ($4,000-8,000/month)",
      "Prepare for tax season (Jan-Apr can be $10,000-15,000)",
      "Pursue larger SDVOSB contracts",
      "Consider hiring to scale (keep 40-50%, sub out work)",
      "Build passive income stream (course, consulting)"
    ]
  }
};

async function getAIAnalysis(situation) {
  console.log("🤖 Getting AI analysis for your specific situation...\n");
  
  try {
    const analysis = await llmJson({
      model: "gpt-4o",
      system: `You are a veteran business advisor specializing in helping disabled veterans generate income. Be direct, practical, and actionable. Focus on opportunities that require NO PHYSICAL LABOR.`,
      user: `Situation: Disabled veteran in Tallahassee, FL with broken back. Cannot do manual labor. Currently receiving $4,500/month disability which is not enough. Has SDVOSB (Service-Disabled Veteran-Owned Small Business) certification. Florida refuses additional disability assistance. Must earn money NOW.

Provide:
1. Your top 3 recommended income paths for this specific situation
2. The single fastest path to first dollar earned
3. Specific Tallahassee advantages they should leverage
4. Warning signs or pitfalls to avoid
5. Motivational reality check - honest but encouraging

Write in direct, conversational prose. No corporate speak.`,
      schema: {
        name: "income_analysis",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["top_three_paths", "fastest_dollar", "tallahassee_advantages", "pitfalls", "reality_check"],
          properties: {
            top_three_paths: { type: "string" },
            fastest_dollar: { type: "string" },
            tallahassee_advantages: { type: "string" },
            pitfalls: { type: "string" },
            reality_check: { type: "string" }
          }
        }
      },
      temperature: 0.4
    });
    
    return analysis;
  } catch (err) {
    console.error("AI analysis failed:", err.message);
    return null;
  }
}

async function generatePDF(aiAnalysis) {
  const outputDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `INCOME-BATTLE-PLAN-${new Date().toISOString().split("T")[0]}.pdf`;
  const filepath = path.join(outputDir, filename);
  
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });
  
  const writeStream = fs.createWriteStream(filepath);
  doc.pipe(writeStream);
  
  // ===== TITLE PAGE =====
  doc.moveDown(3);
  doc.fontSize(28).font("Helvetica-Bold").fillColor("#1a1a1a")
     .text("INCOME BATTLE PLAN", { align: "center" });
  doc.fontSize(16).font("Helvetica")
     .text("Operation: Financial Freedom", { align: "center" });
  doc.moveDown();
  doc.moveTo(150, doc.y).lineTo(450, doc.y).lineWidth(3).stroke("#2d5a27");
  doc.moveDown(2);
  
  doc.fontSize(12).font("Helvetica-Bold")
     .text("MISSION:", { align: "center" });
  doc.fontSize(11).font("Helvetica")
     .text("Generate immediate income without physical labor", { align: "center" });
  doc.text("Leverage SDVOSB status and veteran advantages", { align: "center" });
  doc.text("Build sustainable, scalable income streams", { align: "center" });
  doc.moveDown(2);
  
  doc.fontSize(10).font("Helvetica-Oblique")
     .text(`Prepared: ${TODAY}`, { align: "center" });
  doc.text("Location: Tallahassee, FL", { align: "center" });
  doc.text("Status: Service-Disabled Veteran", { align: "center" });
  doc.moveDown(4);
  
  doc.fontSize(9).font("Helvetica")
     .text("\"The only easy day was yesterday.\" - Navy SEAL Motto", { align: "center" });
  doc.moveDown();
  doc.text("This is your plan. Execute it.", { align: "center" });
  
  // ===== AI STRATEGIC ANALYSIS =====
  if (aiAnalysis) {
    doc.addPage();
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a1a1a")
       .text("STRATEGIC INTELLIGENCE ASSESSMENT");
    doc.moveTo(50, doc.y + 2).lineTo(400, doc.y + 2).lineWidth(2).stroke("#2d5a27");
    doc.moveDown();
    
    doc.fontSize(12).font("Helvetica-Bold").text("TOP THREE INCOME PATHS FOR YOUR SITUATION:");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica")
       .text(aiAnalysis.top_three_paths, { align: "justify", lineGap: 2, width: 510 });
    doc.moveDown();
    
    doc.fontSize(12).font("Helvetica-Bold").text("FASTEST PATH TO FIRST DOLLAR:");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica")
       .text(aiAnalysis.fastest_dollar, { align: "justify", lineGap: 2, width: 510 });
    doc.moveDown();
    
    doc.fontSize(12).font("Helvetica-Bold").text("TALLAHASSEE ADVANTAGES:");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica")
       .text(aiAnalysis.tallahassee_advantages, { align: "justify", lineGap: 2, width: 510 });
    doc.moveDown();
    
    doc.fontSize(12).font("Helvetica-Bold").text("PITFALLS TO AVOID:");
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica")
       .text(aiAnalysis.pitfalls, { align: "justify", lineGap: 2, width: 510 });
    doc.moveDown();
    
    // Reality check in a box
    const realityY = doc.y;
    const realityHeight = doc.heightOfString(aiAnalysis.reality_check, { width: 480 }) + 30;
    doc.rect(50, realityY, 510, realityHeight).fillAndStroke("#f5f5f5", "#2d5a27");
    doc.fillColor("#1a1a1a");
    doc.fontSize(11).font("Helvetica-Bold").text("REALITY CHECK:", 60, realityY + 10);
    doc.fontSize(10).font("Helvetica")
       .text(aiAnalysis.reality_check, 60, realityY + 25, { width: 480, lineGap: 2 });
    doc.y = realityY + realityHeight + 15;
  }
  
  // ===== IMMEDIATE OPPORTUNITIES =====
  doc.addPage();
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a1a1a")
     .text("IMMEDIATE INCOME OPPORTUNITIES");
  doc.fontSize(10).font("Helvetica-Oblique")
     .text("Start generating income within 1-3 weeks");
  doc.moveTo(50, doc.y + 2).lineTo(400, doc.y + 2).lineWidth(2).stroke("#2d5a27");
  doc.moveDown();
  
  for (const opp of INCOME_OPPORTUNITIES.immediate.options) {
    if (doc.y > 600) doc.addPage();
    
    doc.fontSize(13).font("Helvetica-Bold").text(opp.name);
    doc.fontSize(9).font("Helvetica");
    doc.text(`Startup Cost: $${opp.startup} | Time to Income: ${opp.timeToIncome} | Monthly Potential: $${opp.monthlyPotential}`);
    doc.text(`Physical Demand: ${opp.physicalDemand}`);
    doc.moveDown(0.5);
    
    doc.fontSize(10).font("Helvetica-Bold").text("Steps:");
    doc.font("Helvetica");
    for (let i = 0; i < opp.steps.length; i++) {
      if (doc.y > 700) doc.addPage();
      doc.text(`${i + 1}. ${opp.steps[i]}`, { indent: 15 });
    }
    doc.moveDown(0.3);
    doc.fontSize(9).font("Helvetica-Oblique")
       .text(`Tallahassee Tip: ${opp.tallahasseeTip}`);
    doc.moveDown(1);
  }
  
  // ===== WEEK-BY-WEEK BATTLE PLAN =====
  doc.addPage();
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a1a1a")
     .text("WEEK-BY-WEEK BATTLE PLAN");
  doc.fontSize(10).font("Helvetica-Oblique")
     .text("Your exact roadmap to income");
  doc.moveTo(50, doc.y + 2).lineTo(350, doc.y + 2).lineWidth(2).stroke("#2d5a27");
  doc.moveDown();
  
  // Week 1
  doc.fontSize(14).font("Helvetica-Bold").text(BATTLE_PLAN.week1.name);
  doc.moveDown(0.5);
  
  for (const dayBlock of BATTLE_PLAN.week1.days) {
    if (doc.y > 650) doc.addPage();
    
    doc.fontSize(11).font("Helvetica-Bold").text(dayBlock.day);
    doc.fontSize(9).font("Helvetica").text(`Est. Cost: ${dayBlock.cost} | Time: ${dayBlock.time}`);
    doc.moveDown(0.3);
    
    doc.fontSize(10).font("Helvetica");
    for (const task of dayBlock.tasks) {
      doc.text(`☐ ${task}`, { indent: 15 });
    }
    doc.moveDown(0.5);
  }
  
  // Week 2
  if (doc.y > 500) doc.addPage();
  doc.moveDown();
  doc.fontSize(14).font("Helvetica-Bold").text(BATTLE_PLAN.week2.name);
  doc.moveDown(0.5);
  
  for (const dayBlock of BATTLE_PLAN.week2.days) {
    if (doc.y > 650) doc.addPage();
    
    doc.fontSize(11).font("Helvetica-Bold").text(dayBlock.day);
    doc.fontSize(9).font("Helvetica").text(`Est. Cost: ${dayBlock.cost} | Time: ${dayBlock.time}`);
    doc.moveDown(0.3);
    
    doc.fontSize(10).font("Helvetica");
    for (const task of dayBlock.tasks) {
      doc.text(`☐ ${task}`, { indent: 15 });
    }
    doc.moveDown(0.5);
  }
  
  // Weeks 3-4
  if (doc.y > 500) doc.addPage();
  doc.moveDown();
  doc.fontSize(14).font("Helvetica-Bold").text(BATTLE_PLAN.week3_4.name);
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  for (const task of BATTLE_PLAN.week3_4.tasks) {
    doc.text(`☐ ${task}`, { indent: 15 });
  }
  
  // Months 2-3
  doc.moveDown();
  doc.fontSize(14).font("Helvetica-Bold").text(BATTLE_PLAN.month2_3.name);
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  for (const task of BATTLE_PLAN.month2_3.tasks) {
    doc.text(`☐ ${task}`, { indent: 15 });
  }
  
  // ===== CRITICAL LINKS & RESOURCES =====
  doc.addPage();
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a1a1a")
     .text("CRITICAL LINKS & RESOURCES");
  doc.moveTo(50, doc.y + 2).lineTo(350, doc.y + 2).lineWidth(2).stroke("#2d5a27");
  doc.moveDown();
  
  const resources = [
    { category: "NOTARY & SIGNING", links: [
      "FL Notary Commission: notaries.dos.state.fl.us",
      "LSA Training: notarylearningcenter.com",
      "E&O Insurance: notaryinsurance.com",
      "SnapDocs: snapdocs.com",
      "Notarize: notarize.com",
      "SigningOrder: signingorder.com"
    ]},
    { category: "REMOTE JOBS", links: [
      "Amazon Virtual: amazonforceblog.com/virtual-locations",
      "Liveops: liveops.com",
      "TTEC: ttec.com",
      "FlexJobs: flexjobs.com",
      "Arise: arise.com"
    ]},
    { category: "SDVOSB / FEDERAL", links: [
      "SAM.gov Registration: sam.gov",
      "VetCert: vetcert.sba.gov",
      "Contract Search: beta.sam.gov",
      "Florida PTAC: flptac.org",
      "USAJobs: usajobs.gov"
    ]},
    { category: "INSURANCE ADJUSTER", links: [
      "FL License: myfloridacfo.com/division/agents",
      "Training: adjusterpro.com",
      "Career Builder: pilot-catastrophe.com"
    ]},
    { category: "TAX PREPARATION", links: [
      "PTIN Registration: irs.gov/ptin",
      "VITA Volunteer: irs.gov/vita",
      "Drake Tax Software: drakesoftware.com"
    ]}
  ];
  
  for (const res of resources) {
    doc.fontSize(11).font("Helvetica-Bold").text(res.category);
    doc.fontSize(9).font("Helvetica");
    for (const link of res.links) {
      doc.text(`• ${link}`, { indent: 15 });
    }
    doc.moveDown(0.5);
  }
  
  // ===== INCOME PROJECTIONS =====
  doc.addPage();
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a1a1a")
     .text("INCOME PROJECTIONS");
  doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).lineWidth(2).stroke("#2d5a27");
  doc.moveDown();
  
  doc.fontSize(12).font("Helvetica-Bold").text("Conservative Path (Low Risk, Steady Build):");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text("Month 1: $500-1,500 (learning phase, first signings)");
  doc.text("Month 2: $2,000-3,000 (building momentum)");
  doc.text("Month 3: $3,000-4,500 (consistent flow)");
  doc.text("Month 6: $4,000-6,000 (optimized)");
  doc.moveDown();
  
  doc.fontSize(12).font("Helvetica-Bold").text("Aggressive Path (Multiple Streams, Hustle Mode):");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text("Month 1: $1,000-2,500 (notary + remote job)");
  doc.text("Month 2: $3,000-5,000 (add insurance adjusting)");
  doc.text("Month 3: $4,000-8,000 (scaling, first SDVOSB contract)");
  doc.text("Month 6: $8,000-15,000 (multiple income streams active)");
  doc.moveDown();
  
  doc.fontSize(12).font("Helvetica-Bold").text("Tax Season Bonus (January - April):");
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica");
  doc.text("If you add tax prep: Additional $5,000-15,000 during tax season");
  doc.text("This is a 4-month window where you can make an entire year's income");
  doc.moveDown(2);
  
  // Combined with disability
  doc.fontSize(13).font("Helvetica-Bold").text("TOTAL MONTHLY INCOME POTENTIAL:");
  doc.moveDown(0.3);
  doc.fontSize(11).font("Helvetica");
  doc.text("Current Disability: $4,500/month");
  doc.text("Conservative Additional: $3,000-4,500/month");
  doc.text("Aggressive Additional: $6,000-12,000/month");
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica-Bold")
     .text("TARGET TOTAL: $7,500 - $16,500/month within 90 days");
  
  // ===== FINAL PAGE - COMMITMENT =====
  doc.addPage();
  doc.moveDown(4);
  doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a1a1a")
     .text("COMMITMENT PAGE", { align: "center" });
  doc.moveDown(2);
  
  doc.fontSize(11).font("Helvetica")
     .text("I commit to executing this battle plan.", { align: "center" });
  doc.text("I will not let my circumstances define my outcomes.", { align: "center" });
  doc.text("I will leverage every advantage I have.", { align: "center" });
  doc.text("I will ask for help when needed.", { align: "center" });
  doc.text("I will not quit.", { align: "center" });
  doc.moveDown(3);
  
  doc.moveTo(150, doc.y).lineTo(450, doc.y).lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.fontSize(10).text("Signature", { align: "center" });
  doc.moveDown(2);
  
  doc.moveTo(150, doc.y).lineTo(450, doc.y).lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc.text("Date", { align: "center" });
  doc.moveDown(4);
  
  doc.fontSize(9).font("Helvetica-Oblique")
     .text("\"Twenty years from now you will be more disappointed by the things you didn't do", { align: "center" });
  doc.text("than by the ones you did do.\" - Mark Twain", { align: "center" });
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => resolve(filepath));
    writeStream.on("error", reject);
  });
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║           INCOME BATTLE PLAN GENERATOR                               ║");
  console.log("║           Powered by GENIE AI                                        ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");
  
  console.log("📋 Generating your personalized income battle plan...\n");
  
  // Get AI analysis
  const aiAnalysis = await getAIAnalysis({
    location: "Tallahassee, FL",
    limitation: "broken back, no physical labor",
    currentIncome: 4500,
    status: "SDVOSB certified"
  });
  
  if (aiAnalysis) {
    console.log("✅ AI strategic analysis complete\n");
  }
  
  // Generate PDF
  console.log("📄 Creating PDF battle plan...\n");
  const filepath = await generatePDF(aiAnalysis);
  
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║                    ✅ BATTLE PLAN GENERATED                           ║");
  console.log("╠══════════════════════════════════════════════════════════════════════╣");
  console.log(`║  File: ${path.basename(filepath).padEnd(58)}║`);
  console.log(`║  Path: ${filepath.substring(0, 58)}║`);
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");
  
  // Print immediate action summary
  console.log("🎯 IMMEDIATE ACTIONS (DO TODAY):\n");
  console.log("1. Apply for FL Notary Commission:");
  console.log("   → notaries.dos.state.fl.us ($25)\n");
  console.log("2. Apply to 3 remote jobs RIGHT NOW:");
  console.log("   → Amazon Virtual: amazonforceblog.com/virtual-locations");
  console.log("   → Liveops: liveops.com");
  console.log("   → TTEC: ttec.com\n");
  console.log("3. Verify your SAM.gov registration:");
  console.log("   → sam.gov (federal contracting)\n");
  console.log("4. Open the PDF and print it out");
  console.log("   → Check off tasks as you complete them\n");
  
  console.log("💪 You've got this. Execute the plan.\n");
}

main().catch(console.error);
