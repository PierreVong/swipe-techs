Q("ev", [
{id:"e1",l:1,k:"concept",top:1,q:"What's the difference between enterprise value and equity value?",
quick:`<p>Equity value is the company's value to common shareholders; EV is the core business's value to all capital providers.</p><div class="formula">Equity value = Diluted shares × Share price</div><div class="formula">EV = Equity value + Debt + Preferred + NCI − Cash and other non-operating assets</div>`,
detail:`<p>Think of buying a house: the equity value is your down payment; the enterprise value is the price of the house, which is the down payment plus the mortgage you take on. Cash in the business reduces the effective price because you get it back. EV lets you compare businesses regardless of how they're financed.</p>`,
ex:`<p>Share price 20 × 50 diluted shares = equity value 1,000. Add debt 400, subtract cash 100 → EV 1,300.</p>`,
fu:[["Which one does a buyer actually pay to shareholders in an acquisition?","<p>Equity value (the offer price × diluted shares). But the buyer also takes on the debt and gets the cash, so the economic cost of the business is the enterprise value.</p>"]]},

{id:"e2",l:1,k:"concept",top:1,q:"What's the standard formula for enterprise value?",o:["Equity value + cash − debt","Equity value + debt + preferred + NCI − cash","Equity value − debt + NCI","Market cap + total liabilities"],a:1,
quick:`<p>Add the other claims on the business to equity value, then subtract cash.</p><div class="formula">EV = Equity value + Debt + Preferred stock + NCI − Cash</div><p>Many banks also subtract equity investments and other non-operating assets, and add debt-like items such as unfunded pensions.</p>`,
detail:`<p>Add every claim on the operating business that isn't common equity. Subtract assets whose value isn't produced by the operations that generate EBITDA.</p>`,
fu:[["Why not add all liabilities, like accounts payable?","<p>Operating liabilities such as payables and accrued expenses are part of working capital, which is already reflected in the business's cash flows. Only financing claims (debt, preferred) belong in the bridge.</p>"]]},

{id:"e3",l:1,k:"concept",top:1,q:"Why do you subtract cash when calculating enterprise value?",
quick:`<p>Cash is a non-operating asset, and EV measures the value of the core business.</p><p>A buyer who acquires the company also gets its cash, which effectively reduces the price of the operations.</p>`,
detail:`<p>A common wrong answer is "because you can use cash to pay off debt." That isn't the reason: EV is a valuation of the operations, and excess cash simply isn't part of them. In practice some analysts subtract only excess cash, leaving the minimum operating cash in the business.</p>`,
fu:[["Should you subtract all of the cash?","<p>Ideally only excess cash. Cash needed to run day-to-day operations, cash trapped in a jurisdiction, or customer funds (in payments businesses) arguably shouldn't be subtracted.</p>"]]},

{id:"e4",top:1,l:1,k:"concept",q:"A company raises $100 of debt and keeps it as cash. What happens to EV?",o:["Up $100","Down $100","No change","Up $200"],a:2,
quick:`<p>No change: debt rises 100 and cash rises 100, so they offset.</p><p>Equity value doesn't change either.</p>`,
detail:`<p>EV only changes when the operating business changes. Raising money and holding it doesn't change what the operations are worth.</p>`,
fu:[["What if the company immediately spends the $100 on a new factory?","<p>Cash goes back down and PP&amp;E rises. EV now includes the factory's value, so EV rises by roughly 100 if it was a fair-value investment.</p>"]]},

{id:"e5",l:1,k:"concept",top:1,q:"A company issues $100 of new shares and holds the cash. What happens to equity value and EV?",o:["Both up $100","Equity +$100, EV unchanged","EV +$100, equity unchanged","Both unchanged"],a:1,
quick:`<p>Equity value rises 100, but EV doesn't change.</p><ul><li><b>Equity value:</b> +100, because there are more shares at the same price.</li><li><b>EV:</b> the 100 increase in equity value is offset by the 100 of new cash.</li></ul>`,
detail:`<p>This assumes the market values the new cash at face value and the share price doesn't move.</p>`,
fu:[["Does the share price change?","<p>In theory no: the new shareholders paid fair value, so value per share is unchanged. In practice issuances can move the price through signaling (management may issue when shares look expensive).</p>"]]},

{id:"e6",l:2,k:"concept",q:"A company pays a $50 dividend. In theory, what happens to equity value and EV?",o:["Equity −$50, EV unchanged","Both unchanged","EV −$50, equity unchanged","Both −$50"],a:0,
quick:`<p>Equity value falls 50; EV is unchanged.</p><ul><li><b>Equity value:</b> −50, because cash left the company and went to shareholders.</li><li><b>EV:</b> equity value −50 and cash −50 cancel in the bridge.</li></ul>`,
detail:`<p>That's why the share price typically drops by about the dividend amount on the ex-dividend date. Shareholders aren't worse off: they now hold the 50 in cash.</p>`,
fu:[["What about a $50 share buyback?","<p>Same result: equity value −50 (fewer shares at the same price), cash −50, EV unchanged.</p>"]]},

{id:"e7",top:1,l:2,k:"concept",q:"Can enterprise value be negative?",
quick:`<p>Yes, if a company's cash exceeds its equity value plus debt and other claims.</p><p>You see it in cash-rich small caps or distressed companies the market expects to burn through their cash.</p>`,
detail:`<p>Negative EV means the market values the operating business below zero, usually because it expects losses to consume the cash, or it doubts the cash can be returned to shareholders.</p>`,
ex:`<p>Equity value 80, debt 0, cash 120 → EV = −40.</p>`,
fu:[["Can equity value be negative?","<p>Not market equity value: share prices can't go below zero. Book equity (shareholders' equity on the balance sheet) can be negative, for example after large buybacks or accumulated losses.</p>"]]},

{id:"e8",l:2,k:"math",top:1,q:"100 basic shares at $20. 10 options with a $10 strike. Diluted shares using the treasury stock method?",o:["110","105","100","107.5"],a:1,
quick:`<p>105 diluted shares, so equity value is 2,100.</p><ol class="steps"><li>Assume all 10 options are exercised, since they're in the money.</li><li>Collect 10 × $10 = $100 of proceeds.</li><li>Buy back $100 ÷ $20 = 5 shares.</li><li>Add net new shares: 10 − 5 = 5, so diluted shares = 100 + 5 = 105.</li></ol>`,
detail:`<p>The treasury stock method assumes exercise proceeds are used to repurchase shares at the current price. Only in-the-money options count; out-of-the-money ones are ignored.</p>`,
ex:TB([["Options exercised","10"],["Proceeds","10 × $10 = $100"],["Shares repurchased","$100 ÷ $20 = 5"],["Net new shares","10 − 5 = 5"],["Diluted shares","105"]]),
fu:[["What if the share price were $8?","<p>The options are out of the money (strike $10 > $8), so they're ignored: diluted shares = 100.</p>"],
["How do you treat restricted stock units?","<p>Add them as shares. There's no exercise price, so there are no proceeds to repurchase anything.</p>"]]},

{id:"e9",l:3,k:"concept",q:"How do convertible bonds affect diluted shares and enterprise value?",
quick:`<p>It depends on whether it's in the money, and you never count it twice.</p><ul><li><b>In the money</b> (share price above conversion price): assume conversion, add the new shares to the diluted count and remove the bond from debt (the if-converted method).</li><li><b>Out of the money:</b> leave it as debt.</li></ul>`,
detail:`<p>Count it once, either as equity or as debt, depending on which way a rational holder would go. Some convertibles settle the principal in cash and only the excess in shares (net share settlement), which creates less dilution.</p>`,
ex:`<p>$100 bond, conversion price $25 → 4 shares. If the stock is $30, add 4 shares and remove $100 from debt. If the stock is $20, keep $100 of debt and add no shares.</p>`,
fu:[["What's net share settlement?","<p>The bond's principal is repaid in cash, and only the value above principal is paid in shares. Dilution = (share price − conversion price) × conversion shares ÷ share price.</p>"]]},

{id:"e10",l:1,k:"concept",top:1,q:"How do you decide whether to pair a metric with EV or equity value?",
quick:`<p>Match who the metric belongs to.</p><ul><li><b>EV:</b> metrics before interest (revenue, EBITDA, EBIT, unlevered FCF) belong to all capital providers.</li><li><b>Equity value:</b> metrics after interest (net income, EPS, levered FCF) belong only to shareholders.</li></ul>`,
detail:`<p>EV/EBITDA, EV/Revenue and EV/EBIT are consistent. P/E (equity value / net income) and P/levered FCF are consistent. Mixing them gives multiples that change when capital structure changes, even if the business doesn't.</p>`,
fu:[["Why is EV/Net income wrong?","<p>Net income is after interest, so it belongs to equity holders only. EV includes debt holders' claims. The multiple would mix two different groups of investors.</p>"]]},

{id:"e11",l:1,k:"concept",q:"Which multiple is mismatched?",o:["EV / EBITDA","Price / Earnings","EV / Net income","EV / Revenue"],a:2,
quick:`<p>EV / net income.</p><p>Net income is after interest, so it belongs to shareholders only, but EV includes debt holders.</p>`,
detail:`<p>The numerator and denominator must represent the same investor group.</p>`,
fu:[["Is EV/Unlevered FCF consistent?","<p>Yes: unlevered FCF is before interest, available to all capital providers.</p>"]]},

{id:"e12",l:2,k:"concept",q:"Why do you add noncontrolling interest to enterprise value?",
quick:`<p>So EV covers the same 100% of a subsidiary that consolidated EBITDA does.</p><p>If a parent owns 70% of a subsidiary, it still consolidates 100% of its revenue and EBITDA, so you add the 30% minority stake.</p>`,
detail:`<p>Noncontrolling interest is the portion of consolidated subsidiaries owned by outsiders. It's a claim on the consolidated business, like debt or preferred.</p>`,
ex:`<p>Parent EBITDA includes all 100 of a 70%-owned sub's EBITDA. If the sub is worth 800, the minority stake is worth 240. Add 240 to EV so EV/EBITDA is consistent.</p>`,
fu:[["Should you use the book or market value of NCI?","<p>Market value if you can estimate it (for example from the subsidiary's own trading price). Book value is common in practice but often understates it.</p>"]]},

{id:"e13",l:2,k:"concept",q:"Why subtract equity investments (associates) from enterprise value?",
quick:`<p>EBITDA excludes the stake's results, so EV should exclude its value too.</p><ul><li>A minority stake, say 25%, isn't consolidated, so its revenue and EBITDA aren't in the company's numbers.</li><li>It's the mirror image of adding noncontrolling interest.</li></ul>`,
detail:`<p>The investment still has value to shareholders. It's captured in equity value, but it's not part of the operating business whose EBITDA you're valuing.</p>`,
fu:[["Where does the income from that investment show up?","<p>As equity income, below operating income on the income statement. It's in net income but not in EBITDA.</p>"]]},

{id:"e14",top:1,l:2,k:"concept",q:"Which is more affected by capital structure: EV or equity value?",
quick:`<p>Equity value; in theory, EV is capital-structure neutral.</p><p>Swapping debt for equity changes the mix of claims, not the value of the operations, which is why EV multiples are preferred when comparing companies with different leverage.</p>`,
detail:`<p>In practice capital structure can affect EV a bit, through interest tax shields (which add value) and financial distress costs (which reduce it). That's the trade-off theory of capital structure.</p>`,
fu:[["Two companies have the same EV. Why might their equity values differ?","<p>Different net debt. A company with 300 more net debt has 300 less equity value for the same EV.</p>"]]},

{id:"e15",l:3,k:"concept",q:"What debt-like items might you add to EV beyond bank debt and bonds?",
quick:`<p>Add other claims that act like debt, staying consistent with what EBITDA already bears.</p><ul><li>Unfunded pension obligations</li><li>Finance leases, and sometimes operating lease liabilities</li><li>Preferred stock</li><li>Other obligations like large legal settlements or deferred acquisition payments</li></ul>`,
detail:`<p>Example: if EBITDA is after rent (US GAAP operating leases), don't add operating lease liabilities, or you'd count the lease twice. If EBITDA is before rent (IFRS 16), add them.</p>`,
fu:[["Should you tax-affect unfunded pensions in the bridge?","<p>Often yes: pension contributions are tax-deductible, so the true after-tax obligation is the deficit × (1 − t). Practice varies by bank.</p>"]]},

{id:"e16",l:1,k:"math",q:"Share price $40, 50 diluted shares, $500 debt, $200 cash. What's the enterprise value?",o:["$2,000","$2,300","$2,700","$1,700"],a:1,
quick:`<p>EV is $2,300.</p><div class="formula">Equity value = 40 × 50 = 2,000</div><div class="formula">EV = 2,000 + 500 − 200 = 2,300</div>`,
detail:`<p>Always start from diluted equity value, then walk the bridge.</p>`,
fu:[["EBITDA is $230. What's the EV/EBITDA multiple?","<p>2,300 ÷ 230 = 10.0x.</p>"]]},

{id:"e17",top:1,l:2,k:"concept",q:"A company uses $100 of cash to repay $100 of debt. What happens to EV and equity value?",o:["EV down $100","EV up $100","Both unchanged","EV down $200"],a:2,
quick:`<p>Both are unchanged.</p><p>Debt −100 and cash −100 cancel in the EV bridge, and equity holders' claim on the business is the same.</p>`,
detail:`<p>Using cash to repay debt changes the composition of net debt but not its amount.</p>`,
fu:[["Could the share price react anyway?","<p>Possibly. Less leverage means less risk and less interest expense, but also a smaller tax shield. In theory it's neutral; in practice it depends on whether the company was over- or under-levered.</p>"]]},

{id:"e18",l:2,k:"concept",top:1,q:"What happens to enterprise value if a company issues $100 million of debt?",
quick:`<p>Nothing, as long as the cash stays on the balance sheet.</p><ul><li>Debt +100 and cash +100 cancel out in the bridge; equity value is also unchanged.</li><li>What matters is what the company does with the money.</li></ul>`,
detail:`<p>EV reflects the operating business. Raising debt changes how the business is financed, not what it owns or earns, until the proceeds are spent.</p>`,
fu:[["What if the company uses that debt to repurchase shares?","<p>Cash goes out to shareholders: equity value falls by 100 (fewer shares at the same price), debt is +100, cash is back to 0 net. EV is unchanged: −100 equity + 100 debt.</p>"],
["What if it uses the proceeds to acquire another company?","<p>Debt +100 and the cash is spent, so net debt is +100. Equity value is unchanged in theory. EV rises by 100 because the company now owns more operating assets. If it overpaid, the market would cut equity value and EV.</p>"],
["Why might equity value change after a debt issuance in practice?","<p>The interest tax shield adds value; higher bankruptcy risk and distress costs subtract it; and the market reacts to the expected use of proceeds and to what the issuance signals about management's view.</p>"]]},

{id:"e19",top:1,l:1,k:"concept",q:"What's the difference between basic and diluted shares, and which do you use?",
quick:`<p>Use diluted shares for equity value, because those claims exist and would dilute a buyer.</p><ul><li><b>Basic:</b> the shares actually outstanding.</li><li><b>Diluted:</b> basic plus the shares that would be created by in-the-money options, warrants, RSUs and convertibles.</li></ul>`,
detail:`<p>Get basic shares from the latest 10-Q or 10-K cover page, and the dilutive securities from the equity footnotes. Use the treasury stock method for options and warrants, and the if-converted method for convertibles.</p>`,
fu:[["Why use the most recent cover page instead of the weighted average share count?","<p>The weighted average describes the past period. For valuation you want the share count today.</p>"]]},

{id:"e20",l:2,k:"math",n:{v:120,u:""},q:"Share price $50, 100 basic shares, 10 RSUs, 20 options at a $25 strike, and 10 options at a $60 strike. Diluted shares?",
quick:`<p>120 diluted shares, so equity value is 6,000.</p><ol class="steps"><li>Add the 10 RSUs: +10.</li><li>Run the $25 options (in the money): proceeds 20 × 25 = 500 buy back 500 ÷ 50 = 10 shares, net +10.</li><li>Ignore the $60 options: out of the money.</li><li>Total: 100 + 10 + 10 = 120.</li></ol>`,
detail:`<p>Treat each tranche separately. Out-of-the-money options add nothing under the treasury stock method.</p>`,
ex:TB([["Basic","100"],["RSUs","+10"],["$25 options","20 − 500/50 = +10"],["$60 options","out of the money, +0"],["Diluted","120"]]),
fu:[["The share price rises to $75. New diluted count?","<p>RSUs +10. $25 options: 20 − (500 ÷ 75) = 20 − 6.67 = +13.33. $60 options: 10 − (600 ÷ 75) = 10 − 8 = +2. Total ≈ 125.3.</p>"]]},

{id:"e21",l:2,k:"concept",q:"How do you treat preferred stock in the enterprise value bridge?",
quick:`<p>Add it: preferred stock is a claim on the business that ranks ahead of common equity, like debt.</p><p>If it's convertible and conversion would be worth more, treat it as common shares instead (and don't also add it).</p>`,
detail:`<p>Preferred typically has a fixed dividend and liquidation preference. Its value belongs to preferred holders, not common shareholders, so it sits between debt and common equity.</p>`,
fu:[["Do preferred dividends affect net income or EPS?","<p>They're paid out of net income, so they reduce net income available to common shareholders, which is what EPS uses.</p>"]]},

{id:"e22",top:1,l:2,k:"math",n:{v:1020,u:""},q:"Equity value 800, debt 300, cash 100, noncontrolling interest 50, equity investments 30. What's the EV?",
quick:`<p>EV is 1,020.</p><div class="formula">EV = 800 + 300 + 50 − 100 − 30 = 1,020</div>`,
detail:`<p>Add claims ranking with or ahead of common equity on the consolidated business (debt, NCI). Subtract non-operating assets (cash, equity investments).</p>`,
ex:TB([["Equity value","800"],["+ Debt","300"],["+ NCI","50"],["− Cash","(100)"],["− Equity investments","(30)"],["Enterprise value","1,020"]]),
fu:[["Now bridge back from EV to equity value.","<p>1,020 − 300 − 50 + 100 + 30 = 800. The bridge works in both directions; DCFs use it from EV to equity.</p>"]]},

{id:"e23",l:3,k:"concept",q:"A company's share price rises 10%. What happens to its enterprise value?",
quick:`<p>EV rises by the same dollar amount as equity value, not by 10%.</p><p>A higher price also pushes more options into the money, so diluted shares rise and equity value rises slightly more than 10%.</p>`,
detail:`<p>The percentage change in EV depends on leverage: a company with lots of net debt sees a smaller percentage change in EV than in its share price.</p>`,
ex:`<p>Equity value 1,000, net debt 500 → EV 1,500. Price +10% → equity value ≈ 1,100 (more with dilution) → EV ≈ 1,600, up about 6.7%.</p>`,
fu:[["What happens to EV/EBITDA for this company?","<p>It rises proportionally with EV. At 150 EBITDA it goes from 10.0x to about 10.7x.</p>"]]},

{id:"e24",l:2,k:"concept",q:"Should you use the book value or market value of debt in enterprise value?",
quick:`<p>Market value is more correct, because that's what it would cost to retire the debt.</p><ul><li>In practice, book (face) value is common when debt trades near par.</li><li>For distressed companies, use market value, since it can be far below face value.</li></ul>`,
detail:`<p>When an acquirer buys a company, change-of-control clauses often require repaying debt at par or at a premium, so in M&amp;A you may use face value or even the repayment price.</p>`,
fu:[["A bond with $100 face value trades at 60. Which do you use for a distressed valuation?","<p>Usually 60: it reflects what investors think the claim is worth and what it would cost to buy it back.</p>"]]},

{id:"e25",l:3,k:"concept",q:"A company has $200 of cash, but needs $50 for day-to-day operations and $40 is trapped overseas. How much do you subtract?",
quick:`<p>A careful answer subtracts only excess cash: 200 − 50 = 150.</p><ul><li>Potentially haircut the trapped 40 for taxes or restrictions on moving it.</li><li>Many banks simply subtract all 200, so state your assumption.</li></ul>`,
detail:`<p>EV subtracts cash because it's not needed to run the business. Operating cash is needed, so it's arguably part of the business. Trapped cash may face withholding taxes or capital controls before it can reach shareholders.</p>`,
fu:[["Why does this matter more for some industries?","<p>Retailers and banks need significant operating cash (registers, branches). Payments companies hold customer funds that look like cash but aren't theirs.</p>"]]},

{id:"e26",l:1,k:"concept",top:1,q:"Why do bankers prefer EV/EBITDA over P/E for comparing companies?",
quick:`<p>EV/EBITDA compares the operating businesses more cleanly.</p><ul><li><b>EV/EBITDA</b> isn't distorted by capital structure, interest, taxes or depreciation policy.</li><li><b>P/E</b> is affected by leverage, one-off items below EBITDA, and different tax situations.</li></ul>`,
detail:`<p>Two identical businesses with different debt levels have different P/Es but similar EV/EBITDA. P/E still matters for public equity investors and for sectors like banks, where EBITDA isn't meaningful.</p>`,
fu:[["When might EV/EBIT be better than EV/EBITDA?","<p>When capital intensity differs across comps. EBIT subtracts depreciation, a proxy for the capex needed to maintain the business.</p>"]]},

{id:"e27",l:2,k:"concept",q:"How does an unfunded pension obligation affect the EV bridge?",
quick:`<p>It's usually treated as a debt-like item and added to EV, often net of tax.</p><p>Funding the deficit will require cash in the future, just like debt repayment.</p>`,
detail:`<p>To stay consistent, check whether EBITDA already includes the pension's service cost. The deficit itself is a separate financing-like claim on the business.</p>`,
ex:`<p>Unfunded pension 100, tax rate 25% → add 75 to EV if you tax-affect it.</p>`,
fu:[["Why tax-affect it?","<p>Pension contributions are tax-deductible, so paying 100 into the plan costs 75 after tax.</p>"]]}
]);
