Q("val", [
{id:"v1",l:1,k:"concept",top:1,q:"What are the main ways to value a company?",
quick:`<p>Three core methods: comparable companies, precedent transactions and a DCF.</p><ul><li><b>Comparable companies:</b> trading multiples of similar public companies.</li><li><b>Precedent transactions:</b> multiples paid in past acquisitions.</li><li><b>DCF:</b> present value of projected cash flows.</li></ul><p>Others include LBO analysis, sum-of-the-parts, dividend discount models and liquidation value.</p>`,
detail:`<p>Comps and precedents are relative valuations: they tell you what the market pays for similar businesses. A DCF is intrinsic: it values the company's own cash flows. Bankers show all of them together on a football field because each has blind spots.</p>`,
fu:[["Which method is most useful for a mature, stable company?","<p>A DCF can work well because cash flows are predictable, cross-checked against trading comps. For a high-growth or loss-making company, multiples of revenue or forward earnings are often more practical.</p>"],
["Why show several methods instead of picking the best one?","<p>Each one's weaknesses differ: comps reflect market mood, precedents can be stale, DCFs hinge on assumptions. Where the ranges overlap gives more confidence.</p>"]]},

{id:"v2",l:1,k:"concept",top:1,q:"Which valuation method usually gives the highest value?",o:["Trading comps","Precedent transactions","Liquidation value","52-week trading range"],a:1,
quick:`<p>Precedent transactions, usually: they include a control premium, and buyers often pay for synergies.</p><p>It's a tendency, not a rule: a DCF with aggressive assumptions or a hot market for comps can come out higher.</p>`,
detail:`<p>Liquidation value is usually lowest because it assumes the business stops operating. An LBO analysis also tends to be lower than precedents, since a financial buyer is limited by its return target and the debt it can raise.</p>`,
fu:[["When might trading comps beat precedents?","<p>When public markets are trading at peak multiples while the precedents happened in a weaker market, or when the precedents are old.</p>"]]},

{id:"v13",top:1,l:1,k:"concept",q:"When would you not use a DCF?",
quick:`<p>When cash flows are unpredictable or deeply negative, like early-stage startups, or for banks and insurers.</p><ul><li><b>Banks and insurers:</b> debt is part of operations and working capital doesn't mean much.</li><li>For banks you'd use P/E, P/TBV or a dividend discount model instead.</li></ul>`,
detail:`<p>A DCF is only as good as its projections. If almost all the value sits in a terminal value many years out, small assumption changes swing the answer so much that the result isn't very informative.</p>`,
fu:[["What would you use for a pre-revenue biotech?","<p>A risk-adjusted NPV: project each drug's cash flows, weight them by the probability of approval, and discount. Comparable deals for similar-stage assets are a cross-check.</p>"]]},

{id:"v15",l:1,k:"concept",top:1,q:"How do you pick comparable companies?",
quick:`<p>Start with the same industry and business model, then filter for similar size, geography, growth and margins.</p><p>Usually 5 to 10 names. A short list of truly comparable companies beats a long loose one.</p>`,
detail:`<p>Bankers often split comps into tiers: a core group of closest peers and a broader group. Then explain why the target deserves a multiple near the top or bottom of the range, usually because of differences in growth, margins or risk.</p>`,
fu:[["What if there are no good public comps?","<p>Widen the criteria (adjacent industries, other geographies), lean more on precedent transactions and a DCF, and explain the limitations.</p>"]]},

{id:"v16",top:1,l:1,k:"concept",q:"Why might a company trade at a higher EV/EBITDA than its peers?",o:["Lower expected growth","Higher leverage","Higher growth or margins, lower risk","Larger share count"],a:2,
quick:`<p>Investors pay more per dollar of EBITDA for faster growth, better margins, more predictable cash flows or higher returns on capital.</p><p>Leverage and share count don't change EV/EBITDA directly.</p>`,
detail:`<p>A multiple is shorthand for a DCF: value = cash flow ÷ (discount rate − growth). Higher growth or lower risk means a lower denominator, so a higher multiple.</p>`,
fu:[["Could low capex needs justify a higher EV/EBITDA?","<p>Yes. If less of each dollar of EBITDA is needed for reinvestment, more becomes free cash flow, so each dollar of EBITDA is worth more.</p>"]]},

{id:"v18",l:1,k:"math",q:"Share price $30, EPS $2. What's the P/E?",o:["6.7x","15x","20x","60x"],a:1,
quick:`<p>15x. 30 ÷ 2 = 15.</p>`,
detail:`<p>P/E can also be computed as equity value ÷ net income; the answer is the same.</p>`,
fu:[["What's the earnings yield?","<p>The inverse: 2 ÷ 30 = 6.7%. It's useful in accretion/dilution analysis.</p>"]]},

{id:"v20",l:3,k:"concept",q:"How do you value a bank?",
quick:`<p>Use equity-based methods: P/E, price to book or tangible book (P/TBV), and a dividend discount model.</p><p>Debt is a bank's raw material, not just financing, so EV, EBITDA and unlevered FCF don't mean much.</p>`,
detail:`<p>P/TBV is linked to return on tangible equity (ROTE): banks earning a ROTE above their cost of equity trade above 1x tangible book. In a DDM, regulatory capital requirements (like the CET1 ratio) limit how much can be paid out.</p>`,
fu:[["Why does ROTE drive P/TBV?","<p>Book equity is the bank's capital base. If it earns more than shareholders require, each dollar of equity is worth more than a dollar: P/TBV ≈ (ROTE − g) ÷ (cost of equity − g).</p>"]]},

{id:"v21",l:1,k:"concept",q:"What is a football field?",
quick:`<p>A chart showing valuation ranges from each method side by side.</p><ul><li><b>Bars:</b> 52-week high/low, trading comps, precedent transactions, DCF and LBO.</li><li><b>Purpose:</b> bankers use it to show where an offer price sits relative to each method.</li></ul>`,
detail:`<p>Each bar is a range from sensitivity analysis, for example comps at the 25th to 75th percentile multiple, or a DCF across a grid of WACC and growth assumptions.</p>`,
fu:[["Why ranges instead of a single value?","<p>Valuation is a judgment. Ranges show the uncertainty and help a board see whether an offer is reasonable across methods.</p>"]]},

{id:"v26",l:1,k:"concept",top:1,q:"Walk me through how you'd build a trading comps analysis.",
quick:`<p>Value the target off the multiples of similar public companies.</p><ol class="steps"><li>Pick a peer group.</li><li>Gather each company's financials: last twelve months and forward estimates.</li><li>Calculate equity value and EV, then multiples like EV/Revenue, EV/EBITDA and P/E.</li><li>Take the median and quartiles.</li><li>Apply those multiples to the target's metrics for an implied valuation range.</li></ol>`,
detail:`<p>Clean the numbers: remove one-off items, calendarize to the same year-end, and use diluted shares. Then judge where the target belongs in the range based on how it compares on growth, margins and risk.</p>`,
fu:[["Why use the median instead of the mean?","<p>The median isn't distorted by an outlier, such as a peer trading at 40x because of a takeover rumor.</p>"]]},

{id:"v27",l:1,k:"concept",top:1,q:"Why use forward multiples instead of LTM multiples?",
quick:`<p>Valuation is about the future, and forward multiples use expected earnings.</p><ul><li>They better reflect where the business is going.</li><li>They're less distorted by one-off items in the past year.</li><li>For fast-growing companies, LTM multiples look misleadingly high.</li></ul>`,
detail:`<p>LTM numbers are actual results, so they're more reliable. Forward numbers depend on analyst estimates. Bankers usually show both.</p>`,
ex:`<p>EV 1,000, LTM EBITDA 50, next-year EBITDA 80. LTM multiple 20x, forward 12.5x. The forward multiple gives a fairer comparison with a mature peer.</p>`,
fu:[["When would LTM be preferred?","<p>When forecasts are unreliable or unavailable (small or private companies), or in precedent transactions where you only know trailing numbers at the deal date.</p>"]]},

{id:"v28",l:2,k:"concept",top:1,q:"What are the pros and cons of precedent transactions?",
quick:`<p>They show what buyers actually paid for control, but deals can be dated and deal-specific.</p><ul><li><b>Pros:</b> they reflect real prices, including the control premium, which is directly relevant in a sale.</li><li><b>Cons:</b> deals can be old and done in different market conditions, details are often limited, and prices include deal-specific synergies.</li></ul>`,
detail:`<p>Precedents also have fewer data points than comps, and each deal had its own circumstances: a bidding war, a distressed seller, a strategic buyer with unique synergies.</p>`,
fu:[["How do you screen for relevant precedents?","<p>Same industry, similar size, recent (often the last 3 to 5 years), and similar deal type, such as a control acquisition of a whole company.</p>"]]},

{id:"v29",top:1,l:2,k:"concept",q:"How would you value a company with negative EBITDA?",
quick:`<p>Value it on metrics that are still positive, or with a longer DCF.</p><ul><li>Multiples of revenue or gross profit.</li><li>Forward multiples of future EBITDA, discounted back.</li><li>Operating metrics like users or subscribers.</li><li>A DCF with a longer projection period that reaches steady-state margins.</li></ul>`,
detail:`<p>The key question is how and when the company becomes profitable. Revenue multiples implicitly assume it eventually earns margins like its peers, so check that the path to profitability is credible.</p>`,
fu:[["Why might EV/Gross Profit beat EV/Revenue?","<p>It adjusts for differences in business model. A marketplace and a reseller with the same revenue can have very different gross profits.</p>"]]},

{id:"v30",l:2,k:"math",n:{v:15,u:"$"},top:1,q:"Peer median EV/EBITDA is 8x. The target has EBITDA of 50, net debt of 100 and 20 diluted shares. What's the implied share price?",
quick:`<p>$15 a share.</p><ol class="steps"><li>Implied EV = 8 × 50 = 400.</li><li>Equity value = 400 − 100 = 300.</li><li>Per share = 300 ÷ 20 = $15.</li></ol>`,
detail:`<p>Multiples on EV give you EV. You need the bridge (subtract net debt and other claims) to get to equity value and a share price.</p>`,
ex:TB([["EBITDA","50"],["× Multiple","8.0x"],["Implied EV","400"],["− Net debt","(100)"],["Equity value","300"],["÷ Shares","20"],["Price","$15.00"]]),
fu:[["What if you'd applied a P/E instead?","<p>You'd get equity value directly: P/E × net income, with no bridge needed.</p>"]]},

{id:"v31",l:3,k:"math",q:"What is a sum-of-the-parts valuation, and when would you use it?",
quick:`<p>Value each business segment separately with the multiples or DCF that fit it, then add them up.</p><p>Use it for conglomerates or companies whose divisions have very different growth and risk.</p>`,
detail:`<p>A single blended multiple misprices a company with a fast-growing software unit and a slow industrial unit. Markets sometimes apply a "conglomerate discount" to the total, which is often the argument for a spin-off.</p>`,
ex:`<p>Segment A: EBITDA 50 × 10x = 500. Segment B: EBITDA 30 × 6x = 180. Total EV = 680. Here 8.5x on 80 total EBITDA also gives 680, but only because 8.5x is the EBITDA-weighted average of the two multiples. A blended multiple taken from peers usually won't match the sum of the parts.</p>`,
fu:[["What costs might you need to subtract?","<p>Unallocated corporate costs (head office) that no segment carries, valued at a multiple. Possibly also tax costs of separation.</p>"]]},

{id:"v32",top:1,l:2,k:"concept",q:"Why might a DCF value differ widely from what comps imply?",
quick:`<p>The DCF reflects your assumptions about growth, margins, discount rate and terminal value; comps reflect the market's current mood.</p><p>If your forecasts are more optimistic than consensus, or the sector is out of favor, they'll diverge.</p>`,
detail:`<p>When they diverge, find which assumption explains it. For example, back out the growth rate the market is implying at the current price and ask whether it's reasonable.</p>`,
fu:[["Which one would you trust?","<p>Neither blindly. A big gap is a prompt to question your assumptions or identify why the market might be mispricing the company.</p>"]]},

{id:"v33",l:2,k:"math",q:"What is the PEG ratio?",
quick:`<p>It's P/E adjusted for growth: a lower PEG suggests you pay less per unit of growth.</p><div class="formula">PEG = P/E ÷ expected EPS growth (in percent)</div>`,
detail:`<p>It's a quick heuristic, not a valuation method. It ignores risk, the duration of growth and return on capital.</p>`,
ex:`<p>P/E 20x, EPS growth 10% → PEG 2.0. P/E 30x with 25% growth → PEG 1.2, arguably cheaper.</p>`,
fu:[["Why can PEG mislead for very low-growth companies?","<p>Dividing by a tiny growth rate inflates PEG even if the stock is cheap on cash flow.</p>"]]},

{id:"v34",l:1,k:"concept",q:"How would you value an early-stage startup?",
quick:`<p>Mostly with relative methods, since cash flows are too uncertain for a reliable DCF.</p><ul><li>Recent funding rounds of comparable startups.</li><li>Revenue or user multiples.</li><li>The VC method: estimate exit value and discount it at a high target return.</li></ul>`,
detail:`<p>Cash flows are too uncertain for a reliable DCF, and there may be no revenue. Valuation is driven by market size, growth and the team, and by the terms of each round (like liquidation preferences), not just the headline price.</p>`,
ex:`<p>VC method: expected exit value 500 in 5 years, target return 40% a year → today's value ≈ 500 ÷ 1.4^5 ≈ 93 (post-money).</p>`,
fu:[["Why is a headline post-money valuation often overstated?","<p>Preferred shares with liquidation preferences are worth more than common shares, but the post-money price applies the preferred price to every share.</p>"]]},

{id:"v35",l:3,k:"concept",q:"How would you value a REIT?",
quick:`<p>Use price to FFO or AFFO, net asset value (NAV) and dividend yield.</p><ul><li><b>FFO</b> (funds from operations) adds back real estate depreciation. Net income is distorted by depreciation on assets that often appreciate.</li><li><b>NAV:</b> properties at market value, often via cap rates, minus debt.</li></ul>`,
detail:`<p>Cap rate = net operating income ÷ property value, so value = NOI ÷ cap rate. AFFO also subtracts recurring capex, so it's closer to free cash flow.</p>`,
ex:`<p>NOI 60, market cap rate 6% → property value 1,000. Minus debt 400 → NAV 600.</p>`,
fu:[["What happens to REIT values when interest rates rise?","<p>Cap rates usually rise, which lowers property values (NOI ÷ a higher cap rate), and higher borrowing costs cut FFO.</p>"]]},

{id:"v36",l:2,k:"math",n:{v:12.5,u:"x"},q:"A stock trades at 15x trailing EPS of $4. Next year's EPS is expected to grow 20%. What's the forward P/E?",
quick:`<p>12.5x.</p><ol class="steps"><li>Price = 15 × 4 = $60.</li><li>Forward EPS = 4 × 1.2 = $4.80.</li><li>Forward P/E = 60 ÷ 4.80 = 12.5x.</li></ol>`,
detail:`<p>Forward multiples are lower than trailing ones for growing companies. Don't compare a trailing P/E for one company with a forward P/E for another.</p>`,
fu:[["What's the shortcut?","<p>Forward P/E = trailing P/E ÷ (1 + growth): 15 ÷ 1.2 = 12.5x.</p>"]]},

{id:"v37",l:2,k:"math",q:"How do you calendarize a company with a March fiscal year-end?",
quick:`<p>Weight the fiscal years to match the calendar year.</p><div class="formula">CY2025 = 25% × FY Mar-25 + 75% × FY Mar-26</div><ul><li>FY ending March 2025 contributes Jan–Mar 2025: 3 of its 12 months.</li><li>FY ending March 2026 contributes Apr–Dec 2025: 9 of its 12 months.</li></ul>`,
detail:`<p>Calendarizing puts every comp on the same time period so multiples are comparable. Seasonality makes simple weighting imprecise; quarterly data is better when available.</p>`,
ex:`<p>Revenue FY Mar-25 = 100, FY Mar-26 = 120. CY2025 ≈ 0.25 × 100 + 0.75 × 120 = 115.</p>`,
fu:[["Fiscal year ends September. How do you get calendar 2025?","<p>75% of FY Sep-25 (Jan–Sep 2025) + 25% of FY Sep-26 (Oct–Dec 2025).</p>"]]},

{id:"v38",l:2,k:"math",q:"How do you calculate last-twelve-months (LTM) figures?",
quick:`<p>Roll the most recent fiscal year forward with year-to-date results.</p><div class="formula">LTM = most recent fiscal year + current YTD − prior year's same YTD</div>`,
detail:`<p>It gives the most up-to-date 12-month figure. Use the 10-K for the full year and the latest 10-Q for the year-to-date periods.</p>`,
ex:`<p>FY2024 revenue 400. Nine months 2025 = 330, nine months 2024 = 300. LTM = 400 + 330 − 300 = 430.</p>`,
fu:[["Why adjust LTM EBITDA for one-off items?","<p>A lawsuit settlement or restructuring charge in the period would distort the multiple; you want recurring earnings power.</p>"]]},

{id:"v39",l:2,k:"concept",q:"Which multiples would you use for a high-growth software company?",
quick:`<p>Mainly EV/Revenue on forward (next twelve months) numbers, sometimes EV/ARR or EV/Gross Profit, because many are not yet profitable.</p><p>Investors also screen on growth plus margin, like the "Rule of 40":</p><div class="formula">Revenue growth % + FCF or EBITDA margin % ≥ 40</div>`,
detail:`<p>Revenue multiples implicitly bet on future margins. Compare multiples against growth: plotting EV/NTM revenue against growth usually shows a clear relationship across peers.</p>`,
fu:[["Company grows 30% with a 15% FCF margin. Does it pass the Rule of 40?","<p>Yes: 30 + 15 = 45.</p>"]]},

{id:"v40",l:3,k:"concept",q:"A company has a higher P/E than its peers but a lower EV/EBITDA. What could explain that?",
quick:`<p>Things that sit between EBITDA and net income, or between EV and equity value.</p><ul><li>A large net cash position: lowers EV relative to equity and earns little interest.</li><li>Heavy D&amp;A or amortization of acquired intangibles, which depresses net income.</li><li>A higher tax rate.</li></ul>`,
detail:`<p>P/E is affected by capital structure, D&amp;A and taxes; EV/EBITDA isn't. When the two disagree, walk down the income statement and through the EV bridge to find the difference.</p>`,
fu:[["Which would a leveraged company more likely show: higher or lower P/E than EV/EBITDA suggests?","<p>Usually a lower P/E: interest expense reduces net income, but debt also shrinks equity value. The net effect depends on the cost of debt versus the earnings yield.</p>"]]},

{id:"v41",l:2,k:"math",q:"What fundamentally drives a company's valuation multiple?",
quick:`<p>Growth, risk and the return on reinvested capital.</p><div class="formula">Value = next year's FCF ÷ (discount rate − growth)</div><ul><li>From this perpetuity formula, faster sustainable growth or lower risk raises the multiple.</li><li>Higher returns on capital mean less reinvestment is needed to grow.</li></ul>`,
detail:`<p>Growth only adds value when the return on new investment exceeds the cost of capital. A company that grows by investing at returns below its cost of capital destroys value as it grows.</p>`,
ex:`<p>FCF next year 100, discount rate 9%, growth 4% → value 2,000, or 20x FCF. Growth 5% → 2,500, 25x. Discount rate 10% at 4% growth → 1,667, 16.7x.</p>`,
fu:[["Why doesn't growth always increase value?","<p>Growth requires reinvestment. If the return on that investment is below the cost of capital, the cash spent is worth more than the value created.</p>"]]}
]);
