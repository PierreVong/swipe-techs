Q("model", [
{id:"f1",l:1,k:"concept",top:1,q:"How do you build a three-statement model?",
quick:`<p>Build the statements in order: income statement first, cash flow statement last.</p><ol class="steps"><li>Enter historicals; set assumptions (growth, margins, working capital, capex).</li><li>Project the income statement, then the balance sheet items those assumptions drive.</li><li>Build the cash flow statement from net income and balance sheet changes; cash flows back to the balance sheet.</li><li>Add a debt schedule for interest and repayment.</li><li>Check that the balance sheet balances every year.</li></ol>`,
detail:`<p>Order matters because of the links: revenue drives working capital and capex; capex drives PP&amp;E and depreciation; debt drives interest, which drives net income. Supporting schedules (PP&amp;E, working capital, debt, equity) keep the main statements clean.</p>`,
fu:[["Which statement do you build last?","<p>The cash flow statement, because it's derived from net income and the changes in balance sheet items. Its ending cash then feeds the balance sheet.</p>"],
["How do you know the model works?","<p>The balance sheet balances in every period, cash on the CFS ties to the balance sheet, and flexing an input (like growth) produces sensible changes everywhere.</p>"]]},

{id:"f2",l:1,k:"concept",top:1,q:"How do you project revenue?",
quick:`<p>Top-down or bottom-up; bottom-up is more defensible because each driver can be checked against history and management guidance.</p><ul><li><b>Top-down:</b> market size × market share.</li><li><b>Bottom-up:</b> units × price, stores × sales per store, or customers × revenue per customer.</li></ul>`,
detail:`<p>A simple model grows revenue at a percentage rate, but driver-based models explain why: pricing, volume, new locations or customer churn. Cross-check bottom-up projections against market growth.</p>`,
ex:`<p>120 stores × $2.5m sales per store = $300m. Next year: 132 stores (+12) × $2.6m = $343m, +14%.</p>`,
fu:[["What's the risk of a purely top-down approach?","<p>It's easy to assume an unrealistic market share without explaining how the company wins it.</p>"]]},

{id:"f3",top:1,l:1,k:"concept",q:"How do you project working capital items?",
quick:`<p>Tie each item to the line that drives it.</p><ul><li><b>Receivables:</b> revenue (days sales outstanding).</li><li><b>Inventory and payables:</b> cost of goods sold (days inventory, days payables).</li><li><b>Other items:</b> a percentage of revenue or expenses.</li></ul><p>The change from one year to the next flows to the cash flow statement.</p>`,
detail:`<p>Using days rather than a flat percentage makes the assumptions intuitive and comparable with history. Watch for seasonality: year-end balances may not represent the average.</p>`,
ex:`<p>Revenue 1,000, DSO 36.5 → AR = 1,000 × 36.5 ÷ 365 = 100. If revenue grows to 1,100 at the same DSO, AR = 110 and cash falls by 10.</p>`,
fu:[["Why drive inventory off COGS rather than revenue?","<p>Inventory is carried at cost, so COGS is the more direct driver; using revenue would mix in the margin.</p>"]]},

{id:"f4",l:2,k:"math",n:{v:520,u:""},q:"Beginning PP&E is 500, capex is 80 and depreciation is 60. What's ending PP&E?",
quick:`<p>520.</p><div class="formula">Ending PP&amp;E = Beginning + Capex − Depreciation (− asset sales or impairments)</div><div class="formula">500 + 80 − 60 = 520</div>`,
detail:`<p>Capex is often projected as a percentage of revenue and depreciation as a percentage of beginning PP&amp;E or capex. If capex is consistently below depreciation, the asset base is shrinking, which may not be sustainable for a growing business.</p>`,
fu:[["Capex as % of revenue falls far below depreciation in your projections. Is that a problem?","<p>Probably. It implies the asset base is shrinking, which is hard to reconcile with revenue growth unless the business is becoming much more asset-light.</p>"]]},

{id:"f5",l:2,k:"concept",top:1,q:"Why do circular references appear in financial models, and how do you handle them?",
quick:`<p>The classic loop runs through interest expense on the average debt balance.</p><div class="formula">Interest → Net income → Cash flow → Debt repayment → Average debt → Interest</div><ul><li>Handle it with Excel's iterative calculation plus a circuit-breaker toggle.</li><li>Or calculate interest on beginning balances to break the loop.</li></ul>`,
detail:`<p>A circuit breaker (a switch that sets interest to zero) lets you reset the model if errors propagate through the loop. Using beginning balances is simpler and avoids the circularity at a small cost in accuracy.</p>`,
fu:[["What's the trade-off of using beginning balances?","<p>No circularity and a more stable model, but interest is slightly overstated when debt is being repaid during the year.</p>"]]},

{id:"f6",l:2,k:"concept",top:1,q:"Your balance sheet doesn't balance. How do you troubleshoot it?",
quick:`<p>Check the size and pattern of the difference first.</p><ul><li><b>Appears in the first projected year:</b> check that every balance sheet change has a matching cash flow line.</li><li><b>Exactly twice a number in the model:</b> look for a sign error.</li><li><b>Grows each year:</b> look for something that compounds, like a missing link to retained earnings.</li></ul>`,
detail:`<p>Systematically walk every balance sheet line: is its change on the cash flow statement with the right sign (asset increases are negative, liability increases are positive)? Then confirm net income links to retained earnings and ending cash links to the balance sheet.</p>`,
fu:[["The difference equals 20 and a working capital item changed by 10. What's likely wrong?","<p>A sign error on that item: it's added when it should be subtracted (or vice versa), which creates a gap of twice the change.</p>"]]},

{id:"f7",top:1,l:1,k:"concept",q:"What balances a three-statement model?",
quick:`<p>Cash, calculated on the cash flow statement from all the other changes.</p><ul><li>Ending cash from the cash flow statement goes to the balance sheet.</li><li>If cash would fall below a minimum, a revolver draw fills the gap.</li><li>Never hard-code a number to force it to balance.</li></ul>`,
detail:`<p>Because every other line is projected from its own driver, cash (and the revolver) is the result, not an assumption.</p>`,
fu:[["Why include a minimum cash balance?","<p>Companies need operating cash; the minimum triggers revolver draws instead of allowing negative cash.</p>"]]},

{id:"f8",l:1,k:"concept",q:"Why do bankers color-code their models?",
quick:`<p>So anyone can see what's an assumption and what's a calculation.</p><ul><li><b>Blue:</b> hard-coded inputs.</li><li><b>Black:</b> formulas.</li><li><b>Green:</b> links to other sheets.</li></ul><p>That's the common convention; it makes models easier to audit and change.</p>`,
detail:`<p>Inputs should live in one place. A hard-coded number buried inside a formula is one of the most common sources of model errors.</p>`,
fu:[["Why avoid formulas like =B5*1.05?","<p>The 5% growth is a hidden input. Put it in its own cell so it's visible and can be changed or sensitized.</p>"]]},

{id:"f9",l:2,k:"concept",q:"What's the difference between a scenario analysis and a sensitivity analysis?",
quick:`<p>A sensitivity changes one or two inputs at a time; a scenario changes a coherent set of assumptions together.</p><ul><li><b>Sensitivity analysis:</b> often a data table, for example WACC against terminal growth.</li><li><b>Scenario analysis:</b> base, upside and downside cases with different growth, margins and capex.</li></ul>`,
detail:`<p>Scenarios are usually built with a case switch that selects which row of assumptions feeds the model. Sensitivities show which assumptions matter most; scenarios show plausible overall outcomes.</p>`,
fu:[["Why can a data table slow down a model?","<p>Excel recalculates the entire model for every cell in the table. Many models set calculation to \"automatic except tables.\"</p>"]]},

{id:"f10",l:2,k:"math",q:"How do you model a $300 share buyback when the share price is $50?",
quick:`<p>The company repurchases 300 ÷ 50 = 6 shares.</p><ul><li>Cash falls 300 (financing outflow).</li><li>Equity falls 300 (treasury stock).</li><li>The share count drops by 6, weighted for when during the year the buyback happens.</li></ul>`,
detail:`<p>EPS rises if the earnings given up (lost interest on the cash, or new interest if debt-funded) are smaller than the share count reduction. Use a projected share price, not today's, for future years.</p>`,
ex:`<p>Net income 100, 100 shares (EPS 1.00). Buyback of 6 shares using cash earning 4% pre-tax: lost after-tax interest = 300 × 4% × 0.75 = 9. EPS = 91 ÷ 94 = 0.968, which is dilutive. At a lower share price the buyback would be accretive.</p>`,
fu:[["When is a buyback accretive?","<p>When the company's earnings yield (1 ÷ P/E) is higher than the after-tax cost of the cash or debt used. Here the yield is 1 ÷ 50 = 2% (EPS 1 ÷ price 50), below the 3% after-tax cost of cash.</p>"]]},

{id:"f11",l:2,k:"math",q:"Debt is 400 at 5%, with 100 repaid at year-end. What's interest using beginning vs average balances?",
quick:`<p>20 on the beginning balance, 17.5 on the average balance.</p><div class="formula">Beginning: 400 × 5% = 20</div><div class="formula">Average: (400 + 300) ÷ 2 × 5% = 17.5</div>`,
detail:`<p>The average balance is more accurate when repayments happen during the year, but it creates a circular reference if repayments depend on cash flow after interest.</p>`,
fu:[["Which is more conservative?","<p>Beginning balance: it shows higher interest expense when debt is being repaid.</p>"]]},

{id:"f12",top:1,l:1,k:"concept",q:"How do you project the main income statement lines?",
quick:`<p>Project each line from its own driver or supporting schedule.</p><ul><li><b>Revenue:</b> drivers or growth rates.</li><li><b>COGS and opex:</b> COGS as a percentage of revenue (gross margin); opex as a percentage of revenue or split into fixed and variable.</li><li><b>D&amp;A and interest:</b> from the PP&amp;E and debt schedules.</li><li><b>Taxes:</b> an effective rate on pre-tax income.</li></ul>`,
detail:`<p>Use historical ratios as a starting point and explain any changes, like margin expansion from scale. Keep one-off items out of projections.</p>`,
fu:[["Why use an effective tax rate instead of the statutory rate?","<p>The effective rate reflects the company's actual mix of jurisdictions, credits and deductions, so it better predicts taxes paid.</p>"]]},

{id:"f13",l:2,k:"math",n:{v:25,u:"%"},q:"Revenue is 1,000, fixed costs are 300 and variable costs are 50% of revenue. Revenue grows 10%. How much does EBIT grow?",
quick:`<p>25%: EBIT goes from 200 to 250.</p><div class="formula">Before: 1,000 − 300 − 500 = 200</div><div class="formula">After: 1,100 − 300 − 550 = 250</div>`,
detail:`<p>That's operating leverage: fixed costs don't grow with revenue, so profit grows faster than sales. It works in reverse too, which is why high-fixed-cost businesses are risky in downturns.</p>`,
fu:[["What if revenue falls 10% instead?","<p>EBIT = 900 − 300 − 450 = 150, down 25%.</p>"]]},

{id:"f14",l:3,k:"math",q:"How would you model deferred revenue for a subscription software company?",
quick:`<p>Project billings (what customers are invoiced), then derive revenue from them.</p><div class="formula">Revenue = Billings − Increase in deferred revenue</div><ul><li>Or project deferred revenue as a percentage of next year's revenue.</li><li>The increase in deferred revenue is a source of cash, so cash flow can exceed net income.</li></ul>`,
detail:`<p>Annual upfront billing creates a large deferred revenue balance that unwinds over the year. Changes in billing terms (annual to monthly) can sharply cut cash flow without changing revenue.</p>`,
ex:`<p>Billings 500, deferred revenue rises from 200 to 240. Revenue = 500 − 40 = 460. The 40 increase adds cash on the CFS.</p>`,
fu:[["A customer moves from annual upfront to monthly billing. Effect on revenue and cash?","<p>Revenue is unchanged; deferred revenue falls and cash flow drops in that year because less is collected in advance.</p>"]]},

{id:"f15",l:2,k:"math",q:"How do you calculate diluted EPS?",
quick:`<p>Earnings available to common shareholders divided by the weighted average diluted share count.</p><div class="formula">Diluted EPS = (Net income − Preferred dividends) ÷ Weighted average diluted shares</div><p>Diluted shares include in-the-money options and warrants (treasury stock method), RSUs, and convertibles if they'd be dilutive.</p>`,
detail:`<p>Accounting EPS uses the weighted average share count over the period, unlike valuation, which uses the current count. Anti-dilutive securities (those that would increase EPS) are excluded.</p>`,
ex:`<p>Net income 210, preferred dividends 10, weighted diluted shares 80 → EPS 200 ÷ 80 = 2.50.</p>`,
fu:[["Why exclude anti-dilutive securities?","<p>Diluted EPS is meant to show the worst case. Including a security that would raise EPS would understate dilution.</p>"]]},

{id:"f16",l:2,k:"math",q:"A $1,000 term loan B has 1% annual amortization and a 7-year maturity. How much is repaid each year?",
quick:`<p>10 a year for years 1 to 6, then the remaining 940 at maturity in year 7, ignoring any optional prepayments.</p><div class="formula">Amortization: 1% × 1,000 = 10 a year</div><div class="formula">Year 7: 10 scheduled + 930 bullet = 940</div>`,
detail:`<p>In an LBO model, mandatory amortization is paid first; excess cash may then sweep the loan down faster, reducing the final bullet.</p>`,
fu:[["Why does the maturity matter for an LBO even if the sponsor exits earlier?","<p>If an exit is delayed, the company must refinance before maturity, which is risky if credit markets are tight.</p>"]]},

{id:"f17",l:2,k:"concept",q:"How would you handle a highly seasonal business in a model?",
quick:`<p>Model quarterly or monthly, at least for working capital and liquidity, because year-end balances hide the peak.</p><p>A retailer builds inventory before the holidays and draws on its revolver, then repays it after.</p>`,
detail:`<p>Annual models can understate the revolver size needed and misstate interest. Check covenant tests at the seasonal low point too.</p>`,
fu:[["Why might year-end working capital look unusually low for a retailer?","<p>Its fiscal year often ends right after the holiday season, when inventory has been sold and cash collected.</p>"]]},

{id:"f18",l:3,k:"math",q:"Revenue is 500 growing 20%. Gross margin is 40%. Opex is 120 fixed plus 10% of revenue. What's EBIT this year and next?",
quick:`<p>EBIT is 30 this year and 60 next year: it doubles on 20% revenue growth.</p><ul><li><b>This year:</b> gross profit 200, opex 170, EBIT 30.</li><li><b>Next year:</b> revenue 600, gross profit 240, opex 180, EBIT 60.</li></ul>`,
detail:`<p>The fixed portion of opex creates operating leverage. Margins go from 6% to 10%.</p>`,
ex:TB([["Revenue","500 → 600"],["Gross profit (40%)","200 → 240"],["Opex (120 + 10%)","170 → 180"],["EBIT","30 → 60"],["EBIT margin","6% → 10%"]]),
fu:[["What revenue makes EBIT zero?","<p>0.4R − 120 − 0.1R = 0 → 0.3R = 120 → R = 400.</p>"]]},

{id:"f19",l:2,k:"concept",q:"What are the most common financial modeling mistakes?",
quick:`<p>Two of the most common are hard-coded numbers inside formulas and sign errors on the cash flow statement.</p><ul><li>Mixing periods (annual vs quarterly).</li><li>Forgetting to link a balance sheet change to cash flow.</li><li>Double counting items, like SBC or leases.</li><li>Projections that drift away from history without explanation.</li></ul>`,
detail:`<p>Good habits: one input per cell, consistent formulas across a row, checks (balance check, cash tie-out), and simple formulas over clever ones.</p>`,
fu:[["Why keep formulas consistent across a row?","<p>So one formula can be checked and copied. A one-off change in a single year is easy to miss and often an error.</p>"]]},

{id:"f20",l:1,k:"concept",q:"Which Excel functions do bankers use most when modeling?",
quick:`<p>SUM, IF, MIN/MAX, lookups, SUMIFS, IRR/XIRR, and data tables for sensitivities.</p><ul><li><b>MIN and MAX:</b> debt sweeps and floors.</li><li><b>Lookups:</b> INDEX/MATCH or XLOOKUP.</li></ul>`,
detail:`<p>Shortcuts matter as much as functions, because speed comes from never touching the mouse.</p><p>MIN is used constantly in debt schedules: optional repayment = MIN(cash available, debt balance). MAX keeps values from going negative.</p>`,
fu:[["How would you cap a cash sweep at the remaining loan balance?","<p>=MIN(cash available for sweep, beginning balance − mandatory amortization).</p>"]]},

{id:"f21",l:2,k:"math",q:"When should you use XIRR instead of IRR?",
quick:`<p>When cash flows don't occur at regular annual intervals.</p><ul><li>XIRR uses actual dates, so it's accurate for real deals with mid-year dividends, add-on investments or irregular exit timing.</li><li>IRR assumes equal periods.</li></ul>`,
detail:`<p>Sponsors report returns with dated cash flows, so XIRR matches how funds actually calculate performance.</p>`,
ex:`<p>Invest 100 on Jan 1, 2025, receive 200 on Jul 1, 2028 (3.5 years). XIRR ≈ 2^(1/3.5) − 1 ≈ 21.9%. IRR on annual periods would treat it as 3 or 4 years.</p>`,
fu:[["Does XIRR change MOIC?","<p>No. MOIC only depends on the amounts, not the timing.</p>"]]},

{id:"f22",l:3,k:"concept",q:"How do you project stock-based compensation and dilution?",
quick:`<p>Model both the expense and the dilution.</p><ol class="steps"><li>Project SBC as a percentage of revenue (based on history and guidance) in operating expenses.</li><li>Add it back on the cash flow statement.</li><li>Grow the diluted share count each year to reflect new grants, net of buybacks, so per-share metrics capture the dilution.</li></ol>`,
detail:`<p>If the model adds back SBC but holds the share count flat, it overstates cash flow per share. Consistency between the two is what matters.</p>`,
fu:[["Where do you see the share count trend in filings?","<p>The equity footnotes and EPS reconciliation in the 10-K, which show grants, exercises and weighted share counts.</p>"]]},

{id:"f23",l:2,k:"concept",q:"What does a model's equity schedule include?",
quick:`<p>A roll-forward from beginning to ending shareholders' equity.</p><div class="formula">Ending equity = Beginning + Net income + SBC + Issuances − Dividends − Buybacks ± OCI</div>`,
detail:`<p>Retained earnings and share count are often tracked alongside the equity roll-forward.</p><p>Each item ties to the cash flow statement (issuances, buybacks, dividends) or the income statement (net income, SBC), which is how equity stays in sync with the other statements.</p>`,
fu:[["Which equity changes don't affect cash?","<p>Net income does indirectly, but SBC and OCI items like currency translation don't involve cash at all.</p>"]]},

{id:"f24",l:3,k:"concept",q:"How would you model a company with a big acquisition mid-way through the forecast?",
quick:`<p>Model the acquisition date explicitly, then layer in the target, the funding and purchase accounting.</p><ul><li>Add the target's revenue and costs only from closing (prorated for that year).</li><li>Reflect the funding: cash, new debt, new shares.</li><li>Add purchase accounting effects like amortization of new intangibles.</li><li>Show organic growth separately so it isn't confused with acquired growth.</li></ul>`,
detail:`<p>Prorating matters: a deal closing on September 30 contributes only one quarter of revenue in its first year, which affects growth rates and leverage ratios.</p>`,
fu:[["How do you present pro forma leverage at closing?","<p>Use the combined company's LTM EBITDA as if the deal had happened at the start of the period, including run-rate synergies only if lenders accept them.</p>"]]}
]);
