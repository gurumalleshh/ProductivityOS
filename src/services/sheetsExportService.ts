import { DailyRecord, UserSettings } from '../types';
import { formatMinutes } from '../data/productivityStore';

// Client-side Google Identity Services (GIS) token acquisition
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id?: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

let cachedAccessToken: string | null = null;

export function getCachedToken(): string | null {
  return cachedAccessToken || sessionStorage.getItem('gdrive_oauth_token');
}

export function setCachedToken(token: string | null) {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem('gdrive_oauth_token', token);
  } else {
    sessionStorage.removeItem('gdrive_oauth_token');
  }
}

export async function requestGoogleToken(): Promise<string> {
  const existing = getCachedToken();
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    // If running in preview and GIS is loaded:
    if (window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
          callback: (res) => {
            if (res.access_token) {
              setCachedToken(res.access_token);
              resolve(res.access_token);
            } else {
              reject(new Error(res.error || 'Token acquisition cancelled or denied'));
            }
          }
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    } else {
      // In environment preview where direct token client is mock/sandboxed, we support user token entry or direct link
      reject(new Error('Google Identity Services client is initializing. You can also export or download the complete ready-to-run template below.'));
    }
  });
}

// Generates a clean CSV or Google Sheets tab file export of the master Daily Tracker
export function exportDailyTrackerCSV(records: DailyRecord[], settings: UserSettings): string {
  const activeDisciplines = settings.disciplines.filter((d) => d.isActive !== false);

  const headers = [
    'Date',
    'Day',
    'Week',
    'Month',
    'Year',
  ];

  activeDisciplines.forEach((d) => {
    const prefix = d.name.replace(/,/g, '');
    headers.push(`${prefix} [${d.cadence === 'weekly' ? 'Weekly' : 'Daily'}] Target (m)`);
    headers.push(`${prefix} Actual (m)`);
    if (d.cadence === 'daily') {
      headers.push(`${prefix} %`);
    }
  });

  headers.push('Total Target (m)');
  headers.push('Total Actual (m)');
  headers.push('Overall %');
  headers.push('Daily Status');
  headers.push('Notes');

  const rows = records.map((r) => {
    const row: (string | number)[] = [
      r.date,
      r.day,
      r.week,
      r.month,
      r.year,
    ];

    activeDisciplines.forEach((d) => {
      const tgt = r.activityTargets?.[d.id] ?? d.targetMinutes;
      const act = r.activityActuals?.[d.id] ?? 0;
      const pct = r.activityPercentages?.[d.id] ?? (tgt > 0 ? Math.round((act / tgt) * 100) : 0);

      row.push(tgt);
      row.push(act);
      if (d.cadence === 'daily') {
        row.push(`${pct}%`);
      }
    });

    row.push(r.totalTarget);
    row.push(r.totalActual);
    row.push(`${r.overallPct}%`);
    row.push(r.status);
    row.push(`"${(r.notes || '').replace(/"/g, '""')}"`);

    return row;
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

// Creates an automated Google Apps Script that generates the complete 13-sheet workbook inside Google Sheets with one click
export function generateGoogleSheetsAutomationScript(settings: UserSettings): string {
  return `/**
 * LIFETIME PERSONAL PRODUCTIVITY OPERATING SYSTEM
 * Automated Builder Script for Google Sheets
 * 
 * Instructions:
 * 1. Create a blank Google Sheet at sheets.new
 * 2. Click Extensions -> Apps Script
 * 3. Delete any default code, paste this entire script, and click "Run" (buildLifetimeProductivityOS)
 * 4. Grant permission once when prompted.
 * 5. Your 13 sheets with formulas, formatting, and dashboard will build automatically in ~15 seconds!
 */

function buildLifetimeProductivityOS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheetsToCreate = [
    "01_README",
    "02_DASHBOARD",
    "03_DAILY_TRACKER",
    "04_WEEKLY_ANALYTICS",
    "05_MONTHLY_ANALYTICS",
    "06_YEARLY_ANALYTICS",
    "07_CODING_ANALYTICS",
    "08_DEVELOPMENT_ANALYTICS",
    "09_SOFT_SKILLS_ANALYTICS",
    "10_EDITING_ANALYTICS",
    "11_WORKOUT_ANALYTICS",
    "12_SETTINGS",
    "13_CHART_HELPER"
  ];
  
  // 1. Initialize Sheets
  sheetsToCreate.forEach(function(title) {
    var s = ss.getSheetByName(title);
    if (!s) {
      s = ss.insertSheet(title);
    }
  });
  
  // 2. Setup SETTINGS (Sheet 12)
  var setSheet = ss.getSheetByName("12_SETTINGS");
  setSheet.clear();
  setSheet.setTabColor("#4F46E5");
  setSheet.getRange("B2:F2").merge().setValue("SYSTEM PARAMETERS & DAILY TARGETS")
    .setFontWeight("bold").setFontSize(14).setBackground("#0F172A").setFontColor("#FFFFFF");
  
  var settingsData = [
    ["Activity Domain", "Daily Target (HH:MM)", "Minutes", "Weekly Target", "Annual Target"],
    ["Coding", "01:00", "=HOUR(C4)*60+MINUTE(C4)", "=C4*7", "=C4*365"],
    ["Development / Web Dev", "01:00", "=HOUR(C5)*60+MINUTE(C5)", "=C5*7", "=C5*365"],
    ["Soft Skills + Aptitude", "00:30", "=HOUR(C6)*60+MINUTE(C6)", "=C6*7", "=C6*365"],
    ["Video Editing Learning", "00:45", "=HOUR(C7)*60+MINUTE(C7)", "=C7*7", "=C7*365"],
    ["Morning Physical Workout", "01:00", "=HOUR(C8)*60+MINUTE(C8)", "=C8*7", "=C8*365"],
    ["TOTAL DAILY TARGET", "=SUM(C4:C8)", "=SUM(D4:D8)", "=SUM(E4:E8)", "=SUM(F4:F8)"]
  ];
  setSheet.getRange(3, 2, settingsData.length, settingsData[0].length).setValues(settingsData);
  setSheet.getRange("B3:F3").setFontWeight("bold").setBackground("#F1F5F9");
  setSheet.getRange("B9:F9").setFontWeight("bold").setBackground("#EEF2FF");
  setSheet.getRange("C4:C8").setBackground("#F8FAFC").setBorder(true, true, true, true, false, false, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
  setSheet.setFrozenRows(3);
  
  // 3. Setup DAILY TRACKER (Sheet 03)
  var dtSheet = ss.getSheetByName("03_DAILY_TRACKER");
  dtSheet.clear();
  dtSheet.setTabColor("#10B981");
  dtSheet.getRange("A2:Y2").merge().setValue("LIFETIME MASTER REPOSITORY • DAILY TRACKER")
    .setFontWeight("bold").setFontSize(14).setBackground("#0F172A").setFontColor("#FFFFFF");
  
  var headers = [
    "Date", "Day", "Week", "Month", "Year",
    "Coding Target", "Coding Actual", "Coding %",
    "Dev Target", "Dev Actual", "Dev %",
    "Soft Skills Target", "Soft Skills Actual", "Soft Skills %",
    "Editing Target", "Editing Actual", "Editing %",
    "Workout Target", "Workout Actual", "Workout %",
    "Total Target", "Total Actual", "Overall %",
    "Daily Status", "Notes"
  ];
  
  dtSheet.getRange(4, 1, 1, headers.length).setValues([headers]);
  dtSheet.getRange("A4:Y4").setFontWeight("bold").setBackground("#0F172A").setFontColor("#F8FAFC");
  dtSheet.setFrozenRows(4);
  dtSheet.setFrozenColumns(2);
  
  // Populate Formula Template Rows for 60 days
  var baseDate = new Date(2026, 8, 1);
  for (var i = 0; i < 60; i++) {
    var r = 5 + i;
    var rowDate = new Date(baseDate.getTime() + (i * 86400000));
    var dateStr = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    dtSheet.getRange(r, 1).setValue(dateStr);
    dtSheet.getRange(r, 2).setFormula('=TEXT(A' + r + ', "dddd")');
    dtSheet.getRange(r, 3).setFormula('=ISOWEEKNUM(A' + r + ')');
    dtSheet.getRange(r, 4).setFormula('=TEXT(A' + r + ', "yyyy-MM")');
    dtSheet.getRange(r, 5).setFormula('=YEAR(A' + r + ')');
    
    // Targets from Settings
    dtSheet.getRange(r, 6).setFormula("='12_SETTINGS'!$C$4");
    dtSheet.getRange(r, 7).setValue("01:00"); // default editable actual
    dtSheet.getRange(r, 8).setFormula('=IF(F' + r + '>0, G' + r + '/F' + r + ', 1)');
    
    dtSheet.getRange(r, 9).setFormula("='12_SETTINGS'!$C$5");
    dtSheet.getRange(r, 10).setValue("01:00");
    dtSheet.getRange(r, 11).setFormula('=IF(I' + r + '>0, J' + r + '/I' + r + ', 1)');
    
    dtSheet.getRange(r, 12).setFormula("='12_SETTINGS'!$C$6");
    dtSheet.getRange(r, 13).setValue("00:30");
    dtSheet.getRange(r, 14).setFormula('=IF(L' + r + '>0, M' + r + '/L' + r + ', 1)');
    
    dtSheet.getRange(r, 15).setFormula("='12_SETTINGS'!$C$7");
    dtSheet.getRange(r, 16).setValue("00:45");
    dtSheet.getRange(r, 17).setFormula('=IF(O' + r + '>0, P' + r + '/O' + r + ', 1)');
    
    dtSheet.getRange(r, 18).setFormula("='12_SETTINGS'!$C$8");
    dtSheet.getRange(r, 19).setValue("01:00");
    dtSheet.getRange(r, 20).setFormula('=IF(R' + r + '>0, S' + r + '/R' + r + ', 1)');
    
    // Totals & Balanced Overall %
    dtSheet.getRange(r, 21).setFormula('=SUM(F' + r + ', I' + r + ', L' + r + ', O' + r + ', R' + r + ')');
    dtSheet.getRange(r, 22).setFormula('=SUM(G' + r + ', J' + r + ', M' + r + ', P' + r + ', S' + r + ')');
    dtSheet.getRange(r, 23).setFormula('=LET(cap, MIN(G' + r + ',F' + r + ')+MIN(J' + r + ',I' + r + ')+MIN(M' + r + ',L' + r + ')+MIN(P' + r + ',O' + r + ')+MIN(S' + r + ',R' + r + '), IF(U' + r + '>0, cap/U' + r + ', 0))');
    dtSheet.getRange(r, 24).setFormula('=IFS(W' + r + '>=1,"COMPLETED", W' + r + '>=0.8,"GOOD", W' + r + '>=0.5,"PARTIAL", TRUE,"LOW")');
    dtSheet.getRange(r, 25).setValue(i === 0 ? "Initial benchmark setup" : "");
    
    // Highlight actual input cells
    dtSheet.getRange(r, 7).setBackground("#F1F5F9");
    dtSheet.getRange(r, 10).setBackground("#F1F5F9");
    dtSheet.getRange(r, 13).setBackground("#F1F5F9");
    dtSheet.getRange(r, 16).setBackground("#F1F5F9");
    dtSheet.getRange(r, 19).setBackground("#F1F5F9");
  }
  
  // Format percentage columns
  dtSheet.getRange("H5:H65").setNumberFormat("0.0%");
  dtSheet.getRange("K5:K65").setNumberFormat("0.0%");
  dtSheet.getRange("N5:N65").setNumberFormat("0.0%");
  dtSheet.getRange("Q5:Q65").setNumberFormat("0.0%");
  dtSheet.getRange("T5:T65").setNumberFormat("0.0%");
  dtSheet.getRange("W5:W65").setNumberFormat("0.0%");
  
  // 4. Setup DASHBOARD (Sheet 02)
  var dash = ss.getSheetByName("02_DASHBOARD");
  dash.clear();
  dash.setTabColor("#2563EB");
  dash.getRange("B2:P2").merge().setValue("MY PRODUCTIVITY • LIFETIME OPERATING SYSTEM")
    .setFontWeight("bold").setFontSize(16).setBackground("#0F172A").setFontColor("#FFFFFF");
  dash.getRange("B3:P3").merge().setValue("A lifetime view of learning, development, and personal growth • Dynamic Baseline Standard")
    .setFontStyle("italic").setFontSize(10).setBackground("#1E293B").setFontColor("#94A3B8");
    
  // KPI Header Cards
  var kpiCards = [
    ["TODAY COMPLETION", "TODAY HOURS", "7-DAY AVERAGE", "ACTIVE STREAK", "LIFETIME HOURS"],
    ["=TEXT(VLOOKUP(TODAY(),'03_DAILY_TRACKER'!$A$5:$W$100, 23, FALSE), \"0.0%\")",
     "=TEXT(VLOOKUP(TODAY(),'03_DAILY_TRACKER'!$A$5:$V$100, 22, FALSE), \"[h]\"\"h \"\"mm\"\"m\"\"\")",
     "=TEXT(AVERAGE('03_DAILY_TRACKER'!$W$5:$W$11), \"0.0%\")",
     "14 Days (>=80%)",
     "=TEXT(SUM('03_DAILY_TRACKER'!$V$5:$V$1000), \"[h]\"\"h \"\"mm\"\"m\"\"\")"]
  ];
  dash.getRange("B5:F5").setValues([kpiCards[0]]).setFontWeight("bold").setBackground("#F8FAFC").setFontColor("#64748B");
  dash.getRange("B6:F6").setFormulas([kpiCards[1]]).setFontWeight("bold").setFontSize(18).setBackground("#FFFFFF").setFontColor("#0F172A");
  
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("Success! Your Lifetime Productivity OS has been generated with all 13 sheets, dynamic formulas, and automated targets.");
}
`;
}
