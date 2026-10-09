Q("dcf", [
{id:"v3",l:1,k:"concept",top:1,q:"Walk me through a DCF.",
quick:`<p>A DCF values a business at the present value of the cash it will generate.</p><ol class="steps"><li>Project unlevered free cash flow for 5 to 10 years.</li><li>Calculate a terminal value: perpetuity growth or exit multiple.</li><li>Discount both back at WACC and add them up for enterprise value.</li><li>Subtract net debt and other claims for equity value.</li><li>Divide by diluted shares for an implied share price.</li></ol>`,
detail:`<p>A DCF says a business is worth the present value of the cash it will generate. The projection period captures the years you can forecast in detail; the terminal value captures everything after. WACC is used because unlevered FCF belongs to both debt and equity holders.</p>`,
ex:`<p>FCF of 100 a year for 5 years at a 10% WACC is worth about 379 today. A terminal value of 1,500 in year 5 is worth 1,500 ÷ 1.1⁵ ≈ 931. EV ≈ 1,310. Subtract net debt of 310 → equity value 1,000.</p>`,
fu:[["Which assumptions matter most?","<p>The discount rate and the terminal value assumptions (growth rate or exit multiple), because terminal value is usually most of the total. Then revenue growth and margins.</p>"],
["Why stop detailed projections after 5 to 10 years?","<p>Forecasts become guesses. You project until the business reaches a steady state, then capture the rest with a terminal value.</p>"]]},

{id:"v4",l:1,k:"concept",top:1,q:"How do you calculate unlevered free cash flow?",
quick:`<p>Tax-effect EBIT, add back D&amp;A, then subtract capex and the increase in net working capital.</p><div class="formula">UFCF = EBIT × (1 − tax rate) + D&amp;A − Capex − ΔNWC</div><p>It's the cash available to all capital providers before any interest or debt repayment.</p>`,
detail:`<p>Start from EBIT, not net income, so interest is excluded. Taxing EBIT gives the taxes the company would pay with no debt; the interest tax shield is captured in WACC through the after-tax cost of debt. Add back non-cash charges, then subtract reinvestment.</p>`,
ex:`<p>EBIT 200, tax 25% → NOPAT 150. + D&amp;A 40 − capex 60 − ΔNWC 10 = UFCF 120.</p>`,
fu:[["Why don't you subtract interest?","<p>Unlevered FCF is for all capital providers. Interest is a payment to debt holders, which is reflected in the discount rate (WACC) instead.</p>"],
["Do you add back stock-based compensation?","<p>Many practitioners don't: SBC is a real cost paid in shares. If you add it back, you should increase the share count for future dilution.</p>"]]},

{id:"v5",l:1,k:"concept",top:1,q:"What is WACC and how do you calculate it?",
quick:`<p>WACC is the weighted average cost of capital: the blended return required by debt and equity holders.</p><div class="formula">WACC = E/(D+E) × cost of equity + D/(D+E) × cost of debt × (1 − tax rate)</div><p>Add a preferred term if there's preferred stock.</p>`,
detail:`<p>Use market values for the weights, ideally the target or long-run capital structure, not book values. Debt is tax-effected because interest is deductible.</p>`,
ex:`<p>60% equity at 10%, 40% debt at 5% pre-tax, tax 25%: 0.6 × 10% + 0.4 × 3.75% = 6.0% + 1.5% = 7.5%.</p>`,
fu:[["Why use target rather than current capital structure?","<p>The DCF values the company over a long period; the current mix may be temporary, for example right after a big acquisition.</p>"]]},

{id:"v6",l:1,k:"math",top:1,q:"Risk-free rate 4%, beta 1.2, equity risk premium 5%. What's the cost of equity?",o:["9.0%","10.0%","10.8%","8.8%"],a:1,
quick:`<p>10%. Using CAPM: 4% + 1.2 × 5% = 10%.</p>`,
detail:`<p>CAPM says investors need the risk-free return plus compensation for market risk, scaled by how sensitive the stock is to the market (beta). Some banks add a size premium or country risk premium.</p>`,
fu:[["What if beta were 0.8?","<p>4% + 0.8 × 5% = 8%.</p>"]]},

{id:"v7",l:2,k:"math",top:1,q:"Final-year FCF $100, perpetual growth 3%, WACC 8%. What's the terminal value?",o:["$1,250","$2,000","$2,060","$3,433"],a:2,
quick:`<p>$2,060, which you then discount back to today.</p><div class="formula">TV = FCF × (1 + g) ÷ (WACC − g) = 100 × 1.03 ÷ 0.05 = 2,060</div>`,
detail:`<p>The formula needs next year's cash flow, so grow the final-year FCF by one year first. Forgetting the (1 + g) is a common mistake: 100 ÷ 0.05 = 2,000 is wrong.</p>`,
fu:[["If that's year 5 and WACC is 8%, what's it worth today?","<p>2,060 ÷ 1.08⁵ = 2,060 ÷ 1.469 ≈ 1,402.</p>"]]},

{id:"v8",l:3,k:"math",q:"How do you unlever and relever beta?",
quick:`<p>Unlever each comparable's observed beta, take the median, then relever at your company's target capital structure.</p><div class="formula">Unlever: βu = βL ÷ (1 + (1 − t) × D/E)</div><div class="formula">Relever: βL = βu × (1 + (1 − t) × D/E)</div>`,
detail:`<p>Observed (levered) betas include financial risk from each company's debt. Unlevering strips that out to isolate business risk, which should be similar across peers. Relevering adds back your company's own financial risk.</p>`,
ex:`<p>Comp βL 1.3, D/E 50%, tax 25% → βu = 1.3 ÷ 1.375 ≈ 0.95. Target D/E 30% → βL = 0.95 × 1.225 ≈ 1.16.</p>`,
fu:[["Why not just use the target's own beta?","<p>It may be unavailable (private company), statistically noisy, or reflect a capital structure that's about to change. A peer median is more robust.</p>"]]},

{id:"v9",top:1,l:2,k:"concept",q:"Why discount unlevered FCF at WACC but levered FCF at the cost of equity?",
quick:`<p>Match the cash flow to whoever owns it.</p><ul><li><b>Unlevered FCF</b> goes to both debt and equity holders, so use their blended return (WACC) and you get enterprise value.</li><li><b>Levered FCF</b> is after interest and debt repayment, so it belongs to shareholders: use cost of equity and you get equity value.</li></ul>`,
detail:`<p>Mismatching (for example discounting levered FCF at WACC) understates the required return and overstates value.</p>`,
fu:[["Which DCF do bankers usually use?","<p>Unlevered, because it doesn't require projecting the capital structure and gives an EV comparable to multiples. Levered DCFs are used for banks and some LBO-style analyses.</p>"]]},

{id:"v10",top:1,l:1,k:"concept",q:"WACC goes up. What happens to the DCF value?",o:["It goes up","It goes down","No change","Depends on growth only"],a:1,
quick:`<p>It goes down. A higher discount rate shrinks the present value of every future cash flow, and especially of the terminal value.</p>`,
detail:`<p>Terminal value is hit twice: the perpetuity formula's denominator (WACC − g) gets bigger, and as the furthest-out cash flow it feels the higher discount rate the most.</p>`,
fu:[["What happens if interest rates rise across the economy?","<p>The risk-free rate and cost of debt rise, so WACC rises and DCF values fall, all else equal. That's why long-duration growth stocks are sensitive to rates.</p>"]]},

{id:"v11",top:1,l:2,k:"concept",q:"Why does adding some debt lower WACC, but too much debt raise it?",
quick:`<p>Debt is cheaper than equity, so some debt pulls WACC down, but too much raises the cost of both.</p><ul><li><b>Cheaper:</b> debt is senior and interest is tax-deductible.</li><li><b>Too much:</b> as leverage rises, default risk climbs, so both the cost of debt and the cost of equity rise, eventually outweighing the benefit.</li></ul>`,
detail:`<p>This is the trade-off theory: the optimal capital structure balances the tax shield against expected financial distress costs. In a model, raising the debt weight without raising the cost of equity (through a relevered beta) overstates the benefit.</p>`,
fu:[["Why does the cost of equity rise with leverage?","<p>Shareholders are paid after debt holders. More debt makes their residual claim more volatile, so they demand more return, which shows up as a higher relevered beta.</p>"]]},

{id:"v12",l:2,k:"concept",q:"Switching to the mid-year convention does what to DCF value?",o:["Lowers it","Raises it","No effect","Only changes terminal value"],a:1,
quick:`<p>It raises it slightly. Cash flows are assumed to arrive in the middle of each year instead of at the end, so each is discounted for half a year less.</p>`,
detail:`<p>It's more realistic, since businesses generate cash throughout the year. Year 1 is discounted at 0.5 years, year 2 at 1.5, and so on.</p>`,
fu:[["How is the terminal value discounted under the mid-year convention?","<p>With the exit multiple method, still at the full N years, since the multiple values the business at a point in time. With the perpetuity growth method, many practitioners use N − 0.5 to stay consistent with the mid-year cash flows.</p>"]]},

{id:"v14",l:3,k:"math",q:"How do you sanity-check a terminal value?",
quick:`<p>Cross-check the two methods; the implied figures should look reasonable next to comps and long-run economic growth.</p><ul><li><b>Used an exit multiple?</b> Back out the implied perpetuity growth rate.</li><li><b>Used perpetuity growth?</b> Back out the implied EV/EBITDA.</li></ul><div class="formula">Implied g = (TV × WACC − FCF) ÷ (TV + FCF)</div>`,
detail:`<p>An exit multiple implying 6% perpetual growth, or a growth rate implying a 25x exit multiple for a mature business, is a red flag.</p>`,
ex:`<p>TV 1,200, final-year FCF 100, WACC 10%: g = (120 − 100) ÷ 1,300 ≈ 1.5%. Reasonable for a mature company.</p>`,
fu:[["Where does that formula come from?","<p>Rearrange TV = FCF × (1 + g) ÷ (WACC − g) to solve for g.</p>"]]},

{id:"v17",top:1,l:1,k:"concept",q:"What share of a DCF's value usually comes from the terminal value?",
quick:`<p>Often 60% to 80% of enterprise value in a five-year DCF, and more for high-growth companies.</p><p>That's why small changes in the growth rate or exit multiple swing the answer so much.</p>`,
detail:`<p>It isn't a flaw in itself: most of a healthy company's value really is in cash flows beyond five years. But it means your terminal assumptions deserve the most scrutiny and sensitivity tables.</p>`,
fu:[["How could you reduce reliance on the terminal value?","<p>Extend the projection period until the company reaches steady state, so more value is explicitly forecast.</p>"]]},

{id:"v19",l:2,k:"math",q:"60% equity at a 10% cost, 40% debt at 5% pre-tax, tax rate 25%. What's the WACC?",o:["8.0%","7.5%","7.0%","6.5%"],a:1,
quick:`<p>7.5%.</p><ol class="steps"><li>Equity: 0.6 × 10% = 6.0%.</li><li>After-tax debt: 5% × 0.75 = 3.75%, times 0.4 = 1.5%.</li><li>Total: 6.0% + 1.5% = 7.5%.</li></ol>`,
detail:`<p>Always tax-effect the cost of debt and use market-value weights.</p>`,
fu:[["Shift to 50/50 with the same costs. New WACC?","<p>0.5 × 10% + 0.5 × 3.75% = 6.875%. In reality the cost of equity and debt would rise with more leverage, offsetting some of that.</p>"]]},

{id:"v22",l:3,k:"concept",q:"Should you add back stock-based compensation in a DCF?",
quick:`<p>It's debated, but the more rigorous answer is no.</p><ul><li>SBC is non-cash but a real cost: it dilutes shareholders instead of using cash.</li><li>If you do add it back, you must reflect future dilution in the share count, or you overstate value per share.</li></ul>`,
detail:`<p>For tech companies SBC can be 10% or more of revenue, so this choice moves valuations a lot. Treating it as a cash expense is consistent with how the company would pay employees otherwise.</p>`,
fu:[["Why does adding it back without adjusting shares overstate value?","<p>You count the cash saved by paying in stock, but ignore that those shares claim part of the equity value.</p>"]]},

{id:"v23",l:1,k:"math",q:"A company's debt yields 6% pre-tax, and its tax rate is 25%. What's the after-tax cost of debt?",o:["6.0%","4.5%","1.5%","7.5%"],a:1,
quick:`<p>4.5%. 6% × (1 − 0.25) = 4.5%. Interest is tax-deductible, so debt is cheaper after tax.</p>`,
detail:`<p>Use the yield on the company's debt or what it would pay to borrow today, not the historical coupon.</p>`,
fu:[["What if the company has large tax losses and pays no tax?","<p>Then it gets no tax benefit from interest now, so the after-tax cost is closer to the full 6%.</p>"]]},

{id:"v24",top:1,l:1,k:"concept",q:"What does the discount rate represent?",
quick:`<p>The return investors require for the risk they're taking, which is their opportunity cost.</p><p>Riskier cash flows need a higher rate, which lowers their present value.</p>`,
detail:`<p>A dollar tomorrow is worth less than a dollar today because money can earn a return and because future cash is uncertain. The discount rate captures both.</p>`,
fu:[["Why would a startup have a higher discount rate than a utility?","<p>Its cash flows are far less certain, and its stock moves much more with the market, so investors require a higher return.</p>"]]},

{id:"v25",top:1,l:2,k:"concept",q:"Exit multiple vs perpetuity growth: when would you use each?",
quick:`<p>Use one and cross-check with the other.</p><ul><li><b>Exit multiple:</b> market-based and common in banking, since it mirrors how deals are priced.</li><li><b>Perpetuity growth:</b> more theoretical; better for mature businesses or when multiples are distorted.</li></ul>`,
detail:`<p>Critics note that the exit multiple method imports today's market sentiment into an "intrinsic" valuation. The growth method makes you commit to a long-run growth rate, which should be at or below long-run nominal GDP.</p>`,
fu:[["Which would a private equity buyer naturally use?","<p>An exit multiple, since they plan to sell the business at a multiple in a few years.</p>"]]},

{id:"d1",l:2,k:"math",n:{v:120,u:""},top:1,q:"EBIT 200, tax rate 25%, D&A 40, capex 60, increase in net working capital 10. What's unlevered FCF?",
quick:`<p>120.</p><ol class="steps"><li>NOPAT = 200 × 0.75 = 150.</li><li>Add D&amp;A, subtract capex and the NWC increase: 150 + 40 − 60 − 10 = 120.</li></ol>`,
detail:`<p>NOPAT (net operating profit after tax) is the profit the company would report with no debt. Add back non-cash D&amp;A, then subtract the reinvestment needed: capex and working capital.</p>`,
ex:TB([["EBIT","200"],["− Taxes at 25%","(50)"],["NOPAT","150"],["+ D&amp;A","40"],["− Capex","(60)"],["− Increase in NWC","(10)"],["Unlevered FCF","120"]]),
fu:[["What if NWC decreased by 10 instead?","<p>It becomes a source of cash: 150 + 40 − 60 + 10 = 140.</p>"]]},

{id:"d2",l:2,k:"math",top:1,q:"How do you calculate terminal value with the exit multiple method?",
quick:`<p>Multiply final-year EBITDA by an EV/EBITDA multiple, usually based on comps, then discount it back.</p><div class="formula">TV = final-year EBITDA × EV/EBITDA multiple</div><div class="formula">PV of TV = TV ÷ (1 + WACC)^N, N = years in the projection</div>`,
detail:`<p>The result is an enterprise value at the end of the projection period. Use a multiple consistent with a mature version of the business, not today's high-growth multiple.</p>`,
ex:`<p>Year-5 EBITDA 150 × 8x = 1,200. At a 10% WACC: 1,200 ÷ 1.1⁵ = 1,200 ÷ 1.611 ≈ 745 today.</p>`,
fu:[["Why use a lower multiple than the company trades at today?","<p>By the terminal year growth should have slowed toward a mature rate, and mature companies trade at lower multiples.</p>"]]},

{id:"d3",l:1,k:"math",n:{v:1000,u:"$"},q:"What's the present value of $1,210 received in two years at a 10% discount rate?",
quick:`<p>$1,000. 1,210 ÷ 1.1² = 1,210 ÷ 1.21 = 1,000.</p>`,
detail:`<p>Discounting is the reverse of compounding: $1,000 growing at 10% for two years becomes $1,210.</p>`,
fu:[["And $1,331 in three years?","<p>1,331 ÷ 1.331 = $1,000.</p>"]]},

{id:"d4",l:2,k:"concept",top:1,q:"How do you get from the DCF's enterprise value to an implied share price?",
quick:`<p>Bridge from enterprise value to equity value, then divide by diluted shares.</p><ol class="steps"><li>Subtract debt, preferred stock and noncontrolling interest.</li><li>Add cash and non-operating assets like equity investments. That gives equity value.</li><li>Divide by diluted shares to get the implied price per share.</li></ol>`,
detail:`<p>Use balance sheet items as of the valuation date. Because diluted shares depend on the share price (through the treasury stock method), the share count and implied price are solved together.</p>`,
ex:`<p>EV 1,310 − debt 400 + cash 90 = equity value 1,000. ÷ 50 diluted shares = $20.</p>`,
fu:[["Why is that last step circular?","<p>The implied price determines which options are in the money and how many shares are repurchased, which changes the share count, which changes the price. Models iterate or use a goal seek.</p>"]]},

{id:"d5",top:1,l:1,k:"concept",q:"What is a reasonable terminal growth rate?",
quick:`<p>Typically around 2% to 3% for a company in a developed economy, at or below long-run nominal GDP growth.</p><p>A company can't grow faster than the economy forever, or it would eventually become the economy.</p>`,
detail:`<p>The rate should match the currency and inflation built into the cash flows. Higher rates may be defensible in high-inflation currencies, but then the discount rate is higher too.</p>`,
fu:[["Could the terminal growth rate be negative?","<p>Yes, for a business in structural decline, such as print media. The formula still works as long as WACC − g is positive.</p>"]]},

{id:"d6",l:1,k:"concept",q:"What is beta?",
quick:`<p>Beta measures how much a stock moves relative to the overall market.</p><ul><li>A beta of 1.2 means the stock tends to move 1.2% when the market moves 1%.</li><li>It's the measure of market (non-diversifiable) risk in CAPM.</li></ul>`,
detail:`<p>Beta is usually estimated by regressing the stock's returns against an index over 2 to 5 years. Only market risk is priced, because company-specific risk can be diversified away.</p>`,
fu:[["Is a stock with a beta of 0.5 necessarily low-risk?","<p>No. It moves less with the market, but it can still be very volatile for company-specific reasons. Beta only captures market risk.</p>"]]},

{id:"d7",l:2,k:"concept",q:"Which risk-free rate should you use in a DCF?",
quick:`<p>The yield on a long-term government bond in the same currency as the cash flows.</p><p>Typically the 10-year (some banks use 20- or 30-year), to match the long horizon of the cash flows being valued.</p>`,
detail:`<p>A euro-denominated DCF should use a euro risk-free rate, not US Treasuries, because inflation expectations differ by currency.</p>`,
fu:[["Why not use a 3-month T-bill rate?","<p>Its duration doesn't match long-lived cash flows, and short rates can be temporarily distorted by central bank policy.</p>"]]},

{id:"d8",l:3,k:"concept",q:"How would you reflect a company's net operating losses (NOLs) in a DCF?",
quick:`<p>Reduce cash taxes in the years the NOLs can be used.</p><ul><li>Either within the projections, or by valuing the tax savings separately and adding their present value.</li><li>In an acquisition, check limits on using NOLs after a change of ownership (Section 382 in the US).</li></ul>`,
detail:`<p>NOLs are valuable only if the company becomes profitable enough to use them before they expire (if they have a time limit). Valuing them separately makes the assumption visible.</p>`,
ex:`<p>NOLs of 100, tax rate 25%, used evenly over years 1 to 2 → tax savings of 12.5 per year, discounted at the cost of equity or WACC.</p>`,
fu:[["Why might an acquirer get less value from a target's NOLs?","<p>After an ownership change, the usable NOL per year is capped (roughly the target's equity value × the long-term tax-exempt rate in the US), which delays the savings.</p>"]]},

{id:"d9",l:3,k:"math",q:"Which usually moves a perpetuity-growth DCF more: a 1-point cut in WACC or a 1-point increase in terminal growth?",
quick:`<p>A WACC cut usually moves value slightly more.</p><ul><li>Both shrink the WACC − g spread equally.</li><li>WACC also discounts every projected cash flow and the terminal value back to today.</li><li>Growth only changes the terminal cash flow a little.</li></ul>`,
detail:`<p>The spread is what drives the terminal value. Going from a 5% to a 4% spread raises TV by about 25% either way. The extra effect of WACC comes from discounting over the projection period.</p>`,
ex:`<p>WACC 8%, g 3%. Raising g to 4% raises the terminal value by (1.04 ÷ 1.03) × (5 ÷ 4) ≈ 26%. Cutting WACC to 7% raises TV by 25% and its 5-year discount factor by (1.08 ÷ 1.07)⁵ ≈ 4.8%, so its present value rises about 31%.</p>`,
fu:[["Why build a sensitivity table instead of a single number?","<p>Small changes in these inputs swing value a lot. A WACC × growth grid shows the range and which assumption drives it.</p>"]]},

{id:"d10",l:2,k:"concept",q:"How do you estimate the cost of equity for a private company?",
quick:`<p>Borrow betas from public comparables, then apply CAPM.</p><ol class="steps"><li>Take the comparables' betas and unlever them.</li><li>Take the median.</li><li>Relever at the private company's target capital structure.</li><li>Apply CAPM, often adding a size premium or company-specific risk premium.</li></ol>`,
detail:`<p>Private companies have no traded stock, so there's no observable beta. Smaller, less diversified businesses are riskier, which is why practitioners add premiums. Those are judgment calls, so disclose them.</p>`,
fu:[["Why add a size premium?","<p>Historically, smaller companies have earned higher returns than CAPM predicts, which suggests investors demand more for their risk.</p>"]]},

{id:"d11",l:2,k:"math",n:{v:1428.57,u:"$",ap:1},q:"What's the present value of a $100 annual cash flow growing 3% forever, starting next year, at a 10% discount rate?",
quick:`<p>About $1,429. Value = 100 ÷ (10% − 3%) = 100 ÷ 0.07.</p>`,
detail:`<p>This is the growing perpetuity formula, the core of the Gordon growth terminal value. The cash flow in the numerator is next year's.</p>`,
fu:[["What if growth is 0%?","<p>100 ÷ 0.10 = $1,000.</p>"]]},

{id:"d12",l:3,k:"concept",q:"What's wrong with using a constant WACC for a company that's deleveraging fast, like after an LBO?",
quick:`<p>WACC assumes a stable capital structure, so a single WACC misstates value when debt is paid down quickly.</p><ul><li>The weights and the cost of equity change each year.</li><li>Alternatives: an APV (adjusted present value) approach or a year-by-year WACC.</li></ul>`,
detail:`<p>APV values the business as if all-equity (discounting at the unlevered cost of equity) and adds the present value of the interest tax shields separately, which handles a changing debt balance cleanly.</p>`,
fu:[["What are the two pieces of an APV?","<p>The unlevered value of the business, plus the present value of financing side effects, mainly the interest tax shields (minus expected distress costs).</p>"]]}
]);
