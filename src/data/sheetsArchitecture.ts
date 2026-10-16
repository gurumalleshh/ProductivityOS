import { SheetArchitectSpec } from '../types';

export const SHEETS_ARCHITECTURE: SheetArchitectSpec[] = [
  {
    sheetNumber: '01',
    title: 'README',
    purpose: 'System philosophy, quick start guide, duration input instructions, scoring methodology, and data contract.',
    headerColumns: [
      { col: 'A:E', name: 'Executive Overview', formulaOrType: 'Rich Text Blocks', format: 'Inter Bold 14pt + Regular 10pt' },
      { col: 'F:J', name: 'Scoring & Data Protocol', formulaOrType: 'Rules & Target Breakdown', format: 'Code & Callout cards' },
    ],
    keyFormulas: [
      {
        label: 'System Status Indicator',
        formula: '=IF(COUNTA(\'DAILY TRACKER\'!A6:A)>0, "SYSTEM OPERATIONAL • " & TEXT(MAX(\'DAILY TRACKER\'!A6:A),"YYYY-MM-DD"), "INITIALIZING")',
        description: 'Verifies active tracking link and displays most recent tracked entry.'
      },
      {
        label: 'Total Lifetime Hours Logged',
        formula: '=TEXT(SUM(\'DAILY TRACKER\'!U6:U)/1440, "[h]\"h \"mm\"m\"")',
        description: 'Reads master raw minutes from column U and converts to standard Google Sheets duration format [h]:mm.'
      }
    ],
    conditionalFormatting: [
      'Editable field guidelines shaded in subtle tint #F8FAFC',
      'Target standards highlighted in subtle brand indigo #4F46E5',
    ],
    charts: []
  },
  {
    sheetNumber: '02',
    title: 'DASHBOARD',
    purpose: 'Executive SaaS command center displaying live KPIs, primary hero trend, target vs actual comparisons, and activity cards.',
    headerColumns: [
      { col: 'B:D', name: 'Today KPI Card', formulaOrType: 'Completion % & Time logged', format: '32pt Bold + Contextual Sub' },
      { col: 'E:G', name: 'This Week KPI', formulaOrType: '7-Day Rolling Completion', format: '32pt Bold + Contextual Sub' },
      { col: 'H:J', name: 'This Month KPI', formulaOrType: 'MTD Target vs Actual', format: '32pt Bold + Contextual Sub' },
      { col: 'K:M', name: 'Active Streak', formulaOrType: 'Consecutive Days >= 80%', format: '32pt Bold + Fire badge' },
      { col: 'N:P', name: 'Lifetime Hours', formulaOrType: 'Grand Total Duration', format: '32pt Bold + All-time badge' },
    ],
    keyFormulas: [
      {
        label: 'Today Overall Completion %',
        formula: '=VLOOKUP(TODAY(), \'DAILY TRACKER\'!A6:W, 22, FALSE)',
        description: 'Dynamically looks up today\'s overall completion % calculated with capped activity balancing.'
      },
      {
        label: 'Today Hours Logged',
        formula: '=VLOOKUP(TODAY(), \'DAILY TRACKER\'!A6:U, 21, FALSE)',
        description: 'Extracts today\'s total actual minutes formatted as duration.'
      },
      {
        label: 'Current 80%+ Streak',
        formula: '=LET(dates, \'DAILY TRACKER\'!A6:A, pcts, \'DAILY TRACKER\'!V6:V, ...)',
        description: 'Computes consecutive unbroken days meeting or exceeding 80% daily target.'
      },
      {
        label: 'Rolling 30-Day Trend Data Provider',
        formula: '=QUERY(\'DAILY TRACKER\'!A6:W, "SELECT A, V, U, T WHERE A >= date \'"&TEXT(TODAY()-30,"YYYY-MM-DD")&"\' ORDER BY A ASC", 0)',
        description: 'Feeds dynamic 30-day window to the Primary Hero Chart without manual ranges.'
      }
    ],
    conditionalFormatting: [
      'Completion >= 100% → Soft Emerald tint #ECFDF5, text #065F46',
      'Completion 80%-99% → Soft Indigo tint #EEF2FF, text #3730A3',
      'Completion 50%-79% → Soft Amber tint #FFFBEB, text #92400E',
      'Completion < 50% → Soft Rose tint #FEF2F2, text #991B1B'
    ],
    charts: [
      {
        title: 'Productivity Over Time (Primary Hero)',
        type: 'Smooth Line Chart',
        dataRange: '\'DASHBOARD\'!R6:S36',
        xAxis: 'Date (Last 30 Days)',
        yAxis: 'Completion Percentage (0% - 120%)',
        purpose: 'Instantly answers: Am I becoming more consistent over time?'
      },
      {
        title: 'Target vs Actual Hours (30D)',
        type: 'Dual Column / Combo Chart',
        dataRange: '\'DASHBOARD\'!R6:U36',
        xAxis: 'Date',
        yAxis: 'Hours Logged vs Target Benchmark',
        purpose: 'Direct visual comparison of hours delivered versus active daily benchmark standard.'
      },
      {
        title: 'Activity Performance Composition',
        type: 'Horizontal Bar / Stacked',
        dataRange: '\'DASHBOARD\'!W6:X10',
        xAxis: 'Activity Domain',
        yAxis: 'Completion % & Relative Share',
        purpose: 'Identifies individual strengths and bottlenecks across active activity disciplines.'
      }
    ]
  },
  {
    sheetNumber: '03',
    title: 'DAILY TRACKER',
    purpose: 'Master Lifetime Raw Database. Single source of truth with 23 standardized columns and zero hardcoded targets.',
    headerColumns: [
      { col: 'A', name: 'Date', formulaOrType: 'Input (YYYY-MM-DD)', format: 'Date YYYY-MM-DD' },
      { col: 'B', name: 'Day', formulaOrType: '=TEXT(A6,"dddd")', format: 'Text' },
      { col: 'C', name: 'Week', formulaOrType: '=ISOWEEKNUM(A6)', format: 'Number 0' },
      { col: 'D', name: 'Month', formulaOrType: '=TEXT(A6,"YYYY-MM")', format: 'Text YYYY-MM' },
      { col: 'E', name: 'Year', formulaOrType: '=YEAR(A6)', format: 'Number 0000' },
      { col: 'F', name: 'Coding Target', formulaOrType: '=SETTINGS!$C$6', format: 'Duration [h]:mm' },
      { col: 'G', name: 'Coding Actual', formulaOrType: 'User Input [h]:mm', format: 'Duration [h]:mm' },
      { col: 'H', name: 'Coding %', formulaOrType: '=IF(F6>0, G6/F6, 1)', format: 'Percentage 0%' },
      { col: 'I', name: 'Dev Target', formulaOrType: '=SETTINGS!$C$7', format: 'Duration [h]:mm' },
      { col: 'J', name: 'Dev Actual', formulaOrType: 'User Input [h]:mm', format: 'Duration [h]:mm' },
      { col: 'K', name: 'Dev %', formulaOrType: '=IF(I6>0, J6/I6, 1)', format: 'Percentage 0%' },
      { col: 'L', name: 'Soft Skills Target', formulaOrType: '=SETTINGS!$C$8', format: 'Duration [h]:mm' },
      { col: 'M', name: 'Soft Skills Actual', formulaOrType: 'User Input [h]:mm', format: 'Duration [h]:mm' },
      { col: 'N', name: 'Soft Skills %', formulaOrType: '=IF(L6>0, M6/L6, 1)', format: 'Percentage 0%' },
      { col: 'O', name: 'Editing Target', formulaOrType: '=SETTINGS!$C$9', format: 'Duration [h]:mm' },
      { col: 'P', name: 'Editing Actual', formulaOrType: 'User Input [h]:mm', format: 'Duration [h]:mm' },
      { col: 'Q', name: 'Editing %', formulaOrType: '=IF(O6>0, P6/O6, 1)', format: 'Percentage 0%' },
      { col: 'R', name: 'Workout Target', formulaOrType: '=SETTINGS!$C$10', format: 'Duration [h]:mm' },
      { col: 'S', name: 'Workout Actual', formulaOrType: 'User Input [h]:mm', format: 'Duration [h]:mm' },
      { col: 'T', name: 'Workout %', formulaOrType: '=IF(R6>0, S6/R6, 1)', format: 'Percentage 0%' },
      { col: 'U', name: 'Total Target', formulaOrType: '=SUM(F6,I6,L6,O6,R6)', format: 'Duration [h]:mm' },
      { col: 'V', name: 'Total Actual', formulaOrType: '=SUM(G6,J6,M6,P6,S6)', format: 'Duration [h]:mm' },
      { col: 'W', name: 'Overall %', formulaOrType: '=LET(capSum, MIN(G6,F6)+MIN(J6,I6)+MIN(M6,L6)+MIN(P6,O6)+MIN(S6,R6), IF(U6>0, capSum/U6, 0))', format: 'Percentage 0%' },
      { col: 'X', name: 'Daily Status', formulaOrType: '=IFS(W6>=1,"COMPLETED", W6>=0.8,"GOOD", W6>=0.5,"PARTIAL", TRUE,"LOW")', format: 'Status Pill' },
      { col: 'Y', name: 'Notes', formulaOrType: 'User Input (Optional)', format: 'Text' },
    ],
    keyFormulas: [
      {
        label: 'Balanced Overall Scoring',
        formula: '=LET(capSum, MIN(G6,F6)+MIN(J6,I6)+MIN(M6,L6)+MIN(P6,O6)+MIN(S6,R6), IF(U6>0, capSum/U6, 0))',
        description: 'Caps individual activity credit at 100% of target so 4 hours of workout cannot cover 0 hours of coding.'
      },
      {
        label: 'Status Classification',
        formula: '=IFS(W6>=1,"COMPLETED", W6>=0.8,"GOOD", W6>=0.5,"PARTIAL", TRUE,"LOW")',
        description: 'Auto-categorizes each daily record for filtering, aggregation, and conditional styling.'
      }
    ],
    conditionalFormatting: [
      'Editable Actuals (Cols G, J, M, P, S) formatted with soft slate fill #F1F5F9 for instant clarity',
      'Overall % color scale: 100% (#059669), 80% (#3B82F6), 50% (#F59E0B), <50% (#EF4444)',
      'Status Pills: COMPLETED (#DCFCE7 / #15803D), GOOD (#DBEAFE / #1D4ED8), PARTIAL (#FEF3C7 / #B45309), LOW (#FEE2E2 / #B91C1C)'
    ],
    charts: []
  },
  {
    sheetNumber: '04',
    title: 'WEEKLY ANALYTICS',
    purpose: 'Aggregates multi-year performance by ISO calendar weeks with automated consistency scoring.',
    headerColumns: [
      { col: 'A', name: 'Week Code', formulaOrType: 'UNIQUE(\'DAILY TRACKER\'!C6:C & " - " & \'DAILY TRACKER\'!E6:E)', format: 'Text' },
      { col: 'B', name: 'Start Date', formulaOrType: '=MINIFS(\'DAILY TRACKER\'!A:A, \'DAILY TRACKER\'!C:C, C6)', format: 'Date' },
      { col: 'C', name: 'Total Hours', formulaOrType: '=SUMIFS(\'DAILY TRACKER\'!V:V, \'DAILY TRACKER\'!C:C, C6)', format: 'Duration [h]:mm' },
      { col: 'D', name: 'Target Hours', formulaOrType: '=SUMIFS(\'DAILY TRACKER\'!U:U, \'DAILY TRACKER\'!C:C, C6)', format: 'Duration [h]:mm' },
      { col: 'E', name: 'Weekly Pct', formulaOrType: '=AVERAGEIFS(\'DAILY TRACKER\'!W:W, \'DAILY TRACKER\'!C:C, C6)', format: 'Percentage 0%' },
      { col: 'F', name: 'Days Completed', formulaOrType: '=COUNTIFS(\'DAILY TRACKER\'!C:C, C6, \'DAILY TRACKER\'!X:X, "COMPLETED")', format: 'Number 0' },
      { col: 'G', name: 'Consistency Index', formulaOrType: '=F6/7', format: 'Percentage 0%' }
    ],
    keyFormulas: [
      {
        label: 'Weekly Aggregator',
        formula: '=QUERY(\'DAILY TRACKER\'!A6:W, "SELECT E, C, SUM(V), SUM(U), AVG(W), COUNT(A) GROUP BY E, C ORDER BY E DESC, C DESC", 0)',
        description: 'Dynamic lifetime weekly pivot generating non-empty weeks automatically.'
      }
    ],
    conditionalFormatting: ['Weekly Pct >= 80% colored in emerald text'],
    charts: [
      {
        title: 'Weekly Productivity Trend',
        type: 'Column & Trendline Chart',
        dataRange: '\'WEEKLY ANALYTICS\'!A5:E56',
        xAxis: 'Week Number',
        yAxis: 'Average Completion %',
        purpose: 'Monitors micro-consistency rhythm across 52 weeks of the year.'
      },
      {
        title: 'Weekly Target vs Actual Hours',
        type: 'Clustered Column Chart',
        dataRange: '\'WEEKLY ANALYTICS\'!A5:D56',
        xAxis: 'Week',
        yAxis: 'Hours Logged vs 29h 45m Target',
        purpose: 'Validates cumulative weekly output volume.'
      }
    ]
  },
  {
    sheetNumber: '05',
    title: 'MONTHLY ANALYTICS',
    purpose: 'High-level executive month-by-month review tracking adherence, best days, and seasonal trends.',
    headerColumns: [
      { col: 'A', name: 'Month YYYY-MM', formulaOrType: 'Unique Months', format: 'Text YYYY-MM' },
      { col: 'B', name: 'Total Tracked Days', formulaOrType: '=COUNTIF(\'DAILY TRACKER\'!D:D, A6)', format: 'Integer' },
      { col: 'C', name: 'Days Completed', formulaOrType: '=COUNTIFS(\'DAILY TRACKER\'!D:D, A6, \'DAILY TRACKER\'!X:X, "COMPLETED")', format: 'Integer' },
      { col: 'D', name: 'Actual Hours', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!D:D, A6, \'DAILY TRACKER\'!V:V)', format: 'Duration [h]:mm' },
      { col: 'E', name: 'Target Hours', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!D:D, A6, \'DAILY TRACKER\'!U:U)', format: 'Duration [h]:mm' },
      { col: 'F', name: 'Average Daily %', formulaOrType: '=AVERAGEIF(\'DAILY TRACKER\'!D:D, A6, \'DAILY TRACKER\'!W:W)', format: 'Percentage 0%' },
      { col: 'G', name: 'Best Day Record', formulaOrType: '=MAXIFS(\'DAILY TRACKER\'!V:V, \'DAILY TRACKER\'!D:D, A6)', format: 'Duration [h]:mm' }
    ],
    keyFormulas: [
      {
        label: 'Monthly Summary Query',
        formula: '=QUERY(\'DAILY TRACKER\'!A6:W, "SELECT D, COUNT(A), SUM(V), SUM(U), AVG(W) GROUP BY D ORDER BY D DESC", 0)',
        description: 'Summarizes all historical months in real time.'
      }
    ],
    conditionalFormatting: ['Monthly % >= 80% colored in subtle emerald'],
    charts: [
      {
        title: 'Monthly Hours & Adherence',
        type: 'Combo Line + Bar',
        dataRange: '\'MONTHLY ANALYTICS\'!A5:F25',
        xAxis: 'Month',
        yAxis: 'Total Actual Hours',
        purpose: 'Tracks high-level volume across quarters and years.'
      }
    ]
  },
  {
    sheetNumber: '06',
    title: 'YEARLY ANALYTICS',
    purpose: 'Multi-year lifetime historical archive comparing 2026, 2027, 2028, and beyond.',
    headerColumns: [
      { col: 'A', name: 'Year', formulaOrType: '2026, 2027, 2028...', format: 'Number 0000' },
      { col: 'B', name: 'Total Days Tracked', formulaOrType: '=COUNTIF(\'DAILY TRACKER\'!E:E, A6)', format: 'Integer' },
      { col: 'C', name: 'Total Productive Hours', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!V:V)', format: 'Duration [h]:mm' },
      { col: 'D', name: 'Total Coding Hours', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!G:G)', format: 'Duration [h]:mm' },
      { col: 'E', name: 'Total Dev Hours', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!J:J)', format: 'Duration [h]:mm' },
      { col: 'F', name: 'Total Soft Skills', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!M:M)', format: 'Duration [h]:mm' },
      { col: 'G', name: 'Total Editing', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!P:P)', format: 'Duration [h]:mm' },
      { col: 'H', name: 'Total Workout', formulaOrType: '=SUMIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!S:S)', format: 'Duration [h]:mm' },
      { col: 'I', name: 'Annual Adherence', formulaOrType: '=AVERAGEIF(\'DAILY TRACKER\'!E:E, A6, \'DAILY TRACKER\'!W:W)', format: 'Percentage 0%' }
    ],
    keyFormulas: [
      {
        label: 'Annual Milestone Aggregator',
        formula: '=QUERY(\'DAILY TRACKER\'!A6:W, "SELECT E, COUNT(A), SUM(V), AVG(W) GROUP BY E ORDER BY E ASC", 0)',
        description: 'Computes annual compounding totals.'
      }
    ],
    conditionalFormatting: [],
    charts: [
      {
        title: 'Year-over-Year Compounding Hours',
        type: 'Stacked Column Chart',
        dataRange: '\'YEARLY ANALYTICS\'!A5:H10',
        xAxis: 'Year',
        yAxis: 'Cumulative Annual Hours by Skill',
        purpose: 'Visualizes 5-year and 10-year mastery trajectory.'
      }
    ]
  },
  {
    sheetNumber: '07-11',
    title: 'DOMAIN ANALYTICS (Coding, Dev, Soft Skills, Editing, Workout)',
    purpose: 'Deep-dive vertical views for each specific discipline with 365-day consistency heatmaps, streak milestones, and rate of growth.',
    headerColumns: [
      { col: 'A:D', name: 'Discipline KPI Cards', formulaOrType: 'Lifetime Hours, Current Streak, Longest Streak, Avg Mins', format: 'KPI Card Layout' },
      { col: 'F:L', name: 'Rolling 12-Month Calendar Grid', formulaOrType: '52 Weeks x 7 Days Heatmap Array', format: 'Square Matrix with CF' }
    ],
    keyFormulas: [
      {
        label: 'Discipline Lifetime Total',
        formula: '=SUM(\'DAILY TRACKER\'!G6:G) / 60',
        description: 'Sum of minutes converted into hours.'
      },
      {
        label: 'Domain Streak Calculation',
        formula: '=LET(acts, \'DAILY TRACKER\'!G6:G, tgts, \'DAILY TRACKER\'!F6:F, ...)',
        description: 'Identifies consecutive days meeting or exceeding individual target.'
      }
    ],
    conditionalFormatting: [
      'Heatmap intensity level 4 (>=100% target): #059669',
      'Heatmap intensity level 3 (80%-99% target): #34D399',
      'Heatmap intensity level 2 (50%-79% target): #A7F3D0',
      'Heatmap intensity level 1 (1%-49% target): #E0E7FF',
      'Heatmap intensity level 0 (0% / No data): #F1F5F9'
    ],
    charts: [
      {
        title: 'Monthly Skill Cumulative Growth',
        type: 'Area Chart',
        dataRange: 'Calculated from helper pivot',
        xAxis: 'Month',
        yAxis: 'Cumulative Hours',
        purpose: 'Validates 10,000 hours rule progression.'
      }
    ]
  },
  {
    sheetNumber: '12',
    title: 'SETTINGS',
    purpose: 'Centralized global parameter control. All targets reference this sheet. Zero hardcoding in formula logic.',
    headerColumns: [
      { col: 'B', name: 'Activity Domain', formulaOrType: 'Constant Text', format: 'Bold Text' },
      { col: 'C', name: 'Daily Target (Duration)', formulaOrType: 'User Input [h]:mm', format: 'Duration [h]:mm' },
      { col: 'D', name: 'Target in Minutes', formulaOrType: '=HOUR(C6)*60 + MINUTE(C6)', format: 'Integer' },
      { col: 'E', name: 'Weekly Target', formulaOrType: '=C6*7', format: 'Duration [h]:mm' },
      { col: 'F', name: 'Annual Target', formulaOrType: '=C6*365', format: 'Duration [h]:mm' }
    ],
    keyFormulas: [
      {
        label: 'Total Daily Target Sum',
        formula: '=SUM(C6:C10)',
        description: 'Calculates the baseline standard (Default 4:15:00 = 4 hours 15 minutes).'
      }
    ],
    conditionalFormatting: [
      'Editable cells (C6:C10) highlighted with soft slate fill #F8FAFC + subtle blue border'
    ],
    charts: []
  },
  {
    sheetNumber: '13',
    title: 'CHART DATA (Hidden Helper)',
    purpose: 'Optimized calculation engine running high-speed QUERY, LET, and FILTER arrays away from the user presentation layer.',
    headerColumns: [
      { col: 'A:E', name: '30-Day Rolling Window Engine', formulaOrType: 'QUERY arrays', format: 'Helper table' },
      { col: 'G:L', name: 'Heatmap Matrix Flatteners', formulaOrType: 'ArrayFormula calendar maps', format: 'Helper table' },
      { col: 'N:S', name: 'Personal Record Benchmarks', formulaOrType: 'MAX, SORT, FILTER arrays', format: 'Helper table' }
    ],
    keyFormulas: [
      {
        label: 'Dynamic Chart Feed',
        formula: '=QUERY(\'DAILY TRACKER\'!A6:W, "SELECT A, V, U, W WHERE A IS NOT NULL ORDER BY A DESC LIMIT 30", 0)',
        description: 'Provides exact 30-day chronological feed for dashboard graphics.'
      }
    ],
    conditionalFormatting: [],
    charts: []
  }
];
