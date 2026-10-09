Q("lbo", [
{id:"l1",l:1,k:"concept",top:1,q:"Walk me through an LBO model.",
quick:`<p>Buy with debt and equity, pay down debt, sell, and measure the sponsor's returns.</p><ol class="steps"><li>Set the purchase price and fund it with debt and sponsor equity.</li><li>Project cash flows and use them to pay down debt.</li><li>At exit, usually after 3 to 7 years, apply an exit multiple to get enterprise value.</li><li>Subtract remaining net debt to get equity value.</li><li>Calculate the sponsor's IRR and multiple of money (MOIC).</li></ol>`,
detail:`<p>The model has four parts: sources and uses (how the deal is funded), the operating projections, the debt schedule (interest, mandatory repayments, cash sweep), and the returns analysis. Sensitivity tables on entry multiple, exit multiple and leverage show what drives returns.</p>`,
fu:[["Why is an LBO often called a \"floor\" valuation?","<p>It shows the most a financial buyer could pay and still hit its target return without synergies. Strategic buyers can usually pay more.</p>"],
["What are the three ways the sponsor makes money?","<p>EBITDA growth, multiple expansion, and debt paydown (deleveraging).</p>"]]},

{id:"l2",l:1,k:"concept",top:1,q:"Why use leverage in an LBO?",
quick:`<p>Debt shrinks the sponsor's equity check, so any gain in the company's value is a bigger percentage return on that check.</p><ul><li>Interest is also tax-deductible.</li><li>The cost is more risk: the company must service the debt even in a downturn.</li></ul>`,
detail:`<p>Leverage magnifies outcomes in both directions. If the business does well, equity returns soar; if it struggles, the equity can be wiped out.</p>`,
ex:`<p>Buy for 1,000 and sell for 1,300 later. All equity: 1.3x. With 600 of debt (repaid only at exit): equity 400 → 700, 1.75x.</p>`,
fu:[["What limits how much debt you can use?","<p>Lenders' appetite (leverage and interest coverage limits), the stability of cash flows, interest rates, and the sponsor's tolerance for default risk.</p>"]]},

{id:"l3",l:1,k:"concept",top:1,q:"What makes a good LBO candidate? Which of these is weakest?",o:["Stable cash flows, low capex","Strong market position","Cyclical, capex-heavy, thin margins","Clear cost-cutting opportunities"],a:2,
quick:`<p>The cyclical, capex-heavy, thin-margin business is weakest; a good candidate can reliably service debt.</p><ul><li>Stable, predictable cash flows and low capex needs</li><li>A defensible market position and room to improve margins</li><li>Little existing debt and a clear exit path</li></ul>`,
detail:`<p>Every dollar of free cash flow goes to debt paydown, which increases equity value. Volatile or capital-hungry businesses leave little to repay debt and risk breaching covenants in a downturn.</p>`,
fu:[["Why does a strong management team matter so much?","<p>Sponsors rely on management to execute the value creation plan, often with heavy equity incentives aligned to the exit.</p>"]]},

{id:"l4",l:1,k:"concept",top:1,q:"What are the three drivers of LBO returns?",
quick:`<p>EBITDA growth, multiple expansion and debt paydown.</p><ul><li><b>EBITDA growth:</b> revenue growth and margin expansion</li><li><b>Multiple expansion:</b> exiting at a higher multiple than entry</li><li><b>Debt paydown:</b> cash flow reduces debt, so more of the enterprise value belongs to equity</li></ul>`,
detail:`<p>Sponsors prefer returns from EBITDA growth and deleveraging because they're within their control. Multiple expansion depends on market conditions, so base cases often assume exit multiple = entry multiple.</p>`,
fu:[["Which driver is most within the sponsor's control?","<p>EBITDA growth through operational improvements, followed by deleveraging. Multiple expansion is largely market-driven.</p>"]]},

{id:"l5",l:2,k:"math",top:1,q:"Buy at 10x $100 EBITDA with 60% debt. Pay down $200 of debt over 5 years. Exit at 10x $120 EBITDA. What's the MOIC?",o:["1.5x","2.0x","2.5x","3.0x"],a:1,
quick:`<p>2.0x, roughly a 15% IRR over 5 years.</p><ol class="steps"><li>Entry: EV 1,000, debt 600, equity 400</li><li>Exit: EV 1,200, debt 400, equity 800</li><li>MOIC = 800 ÷ 400 = 2.0x</li></ol>`,
detail:`<p>Of the 400 equity gain, 200 came from EBITDA growth (20 × 10x) and 200 from debt paydown. There was no multiple expansion.</p>`,
ex:TB([["Entry EV","10 × 100 = 1,000"],["Debt / equity","600 / 400"],["Exit EV","10 × 120 = 1,200"],["Exit debt","600 − 200 = 400"],["Exit equity","800"],["MOIC","2.0x (≈15% IRR)"]]),
fu:[["What if the exit multiple were 11x?","<p>Exit EV 1,320, equity 920, MOIC 2.3x.</p>"]]},

{id:"l6",l:1,k:"math",top:1,q:"What IRR do these returns roughly equal: 2x in 3 years, 2x in 5, 3x in 3, 3x in 5?",
quick:`<p>About 26%, 15%, 44% and 25%.</p>`,
detail:`<p>IRR for a single in-and-out investment = MOIC^(1/years) − 1. Memorizing a few anchors lets you estimate any paper LBO fast.</p>`,
ex:TB([["2x / 3 yrs","≈ 26%"],["2x / 5 yrs","≈ 15%"],["3x / 3 yrs","≈ 44%"],["3x / 5 yrs","≈ 25%"],["2.5x / 5 yrs","≈ 20%"],["1.5x / 3 yrs","≈ 14%"]]),
fu:[["Roughly what IRR is 2.5x over 4 years?","<p>About 26%: 2.5^(1/4) ≈ 1.257.</p>"]]},

{id:"l7",top:1,l:2,k:"concept",q:"What types of debt go into an LBO, from most to least senior?",
quick:`<p>Revolver, term loans, senior notes or high-yield bonds, then subordinated or mezzanine debt; cost rises as seniority falls.</p><ul><li><b>Revolver:</b> cheapest, drawn as needed</li><li><b>Term loans:</b> secured, floating-rate; TLA amortizes, TLB is mostly bullet</li><li><b>Senior notes or high-yield bonds:</b> often fixed-rate, fewer covenants</li><li><b>Subordinated or mezzanine:</b> higher rate, may include PIK interest or warrants</li></ul>`,
detail:`<p>Senior secured lenders get repaid first in bankruptcy and have a claim on collateral, so they accept lower rates. Private credit funds now often provide a single "unitranche" loan instead of several tranches.</p>`,
fu:[["Why does a TLB have little amortization?","<p>It's sold mostly to institutional investors who want to stay invested; it usually amortizes around 1% a year with the rest due at maturity.</p>"]]},

{id:"l8",l:2,k:"math",q:"Same 2.5x MOIC, but the hold goes from 4 to 6 years. What happens to IRR?",o:["Rises","Falls","Unchanged","Doubles"],a:1,
quick:`<p>It falls, from about 26% to about 16.5%.</p><p>MOIC ignores time; IRR doesn't, so the same multiple earned over more years means a lower annual return.</p>`,
detail:`<p>That's why sponsors try to exit once most of the value has been created, and why dividend recaps (returning cash early) boost IRR.</p>`,
fu:[["Why do LPs look at both IRR and MOIC?","<p>A high IRR on a quick flip may return little actual money; a high MOIC over 10 years may be a mediocre annual return. Together they show both speed and size.</p>"]]},

{id:"l9",l:3,k:"concept",q:"What is a dividend recap and why do sponsors do it?",
quick:`<p>The company raises new debt and pays it out as a dividend to the sponsor.</p><ul><li><b>Why:</b> it returns cash early, which boosts IRR (MOIC barely changes), and takes risk off the table.</li><li><b>Cost:</b> higher leverage on the company.</li></ul>`,
detail:`<p>Recaps are popular when credit markets are strong and the company has already paid down debt. They can be controversial if the extra leverage later contributes to distress.</p>`,
fu:[["Does a dividend recap increase MOIC?","<p>Not much. Total cash returned is similar; the recap shifts some of it earlier. The extra interest cost can even lower MOIC slightly.</p>"]]},

{id:"l10",top:1,l:2,k:"concept",q:"Why might a sponsor choose less leverage than lenders offer?",
quick:`<p>To balance a higher IRR against the risk of losing the whole equity check.</p><ul><li>More debt means more interest, tighter covenants and a bigger chance of default if the business slips.</li><li>When rates are high, the extra interest can wipe out the return benefit.</li></ul>`,
detail:`<p>Sponsors also want flexibility to fund growth or add-on acquisitions, which heavy debt service would crowd out.</p>`,
fu:[["What's an interest coverage ratio?","<p>EBITDA ÷ interest expense. Lenders want it comfortably above about 2x; it falls quickly when rates rise on floating-rate debt.</p>"]]},

{id:"l11",l:1,k:"concept",q:"The exit multiple goes up, all else equal. What happens to IRR?",o:["Up","Down","No change","Depends on debt"],a:0,
quick:`<p>IRR and MOIC both go up.</p><p>A higher exit EV with the same debt means more equity value at exit: that's multiple expansion.</p>`,
detail:`<p>Because debt is fixed, every extra dollar of exit EV goes to equity, so leverage magnifies the effect.</p>`,
fu:[["What about a higher entry multiple, all else equal?","<p>Returns fall: the sponsor pays more for the same cash flows. Unless the exit multiple rises by the same amount, IRR and MOIC drop.</p>"]]},

{id:"l12",l:2,k:"math",q:"A sponsor puts in $200 and gets $600 back after 3 years. Roughly what IRR?",o:["≈26%","≈33%","≈44%","≈60%"],a:2,
quick:`<p>About 44%. That's 3.0x in 3 years: 3^(1/3) − 1 ≈ 44%.</p>`,
detail:`<p>Anchor: 3x in 3 years ≈ 44%, 2x in 3 years ≈ 26%.</p>`,
fu:[["Same $600 back after 5 years?","<p>About 25%: 3^(1/5) ≈ 1.246.</p>"]]},

{id:"l13",l:3,k:"concept",q:"What's the difference between maintenance and incurrence covenants?",
quick:`<p>Maintenance covenants must be met every quarter; incurrence covenants are only tested when the company takes an action.</p><ul><li><b>Maintenance:</b> for example a maximum leverage ratio; common in bank loans</li><li><b>Incurrence:</b> tested on actions like raising more debt or paying a dividend; common in high-yield bonds and "cov-lite" loans</li></ul>`,
detail:`<p>Breaching a maintenance covenant can trigger a default even if every payment is made, so they give lenders early control. Cov-lite loans shift that risk to lenders.</p>`,
fu:[["What usually happens when a company is about to breach a covenant?","<p>It negotiates an amendment or waiver, often paying a fee and a higher rate, or the sponsor injects equity (an \"equity cure\").</p>"]]},

{id:"l14",top:1,l:1,k:"concept",q:"What's the difference between IRR and MOIC?",
quick:`<p>MOIC (multiple of invested capital) ignores time; IRR is an annual rate that rewards getting money back sooner.</p><div class="formula">MOIC = Total equity returned ÷ Equity invested</div><p>IRR is the annual discount rate that makes the net present value of the sponsor's cash flows zero.</p>`,
detail:`<p>Funds are judged on both: IRR for speed and MOIC for the size of the gain.</p>`,
ex:`<p>Invest 100, get 200 back in 3 years: MOIC 2.0x, IRR ≈ 26%. Get 200 back in 6 years: same MOIC, IRR ≈ 12%.</p>`,
fu:[["Can a deal have a high IRR and a low MOIC?","<p>Yes: a quick exit. 1.3x in 1 year is a 30% IRR but only a 30% gain.</p>"]]},

{id:"l15",l:3,k:"concept",q:"How is an LBO used as a valuation method?",
quick:`<p>Solve for the maximum price a sponsor could pay and still hit its target IRR; that sets a floor on valuation.</p><ul><li>Target IRR is often 20% to 25%, with realistic leverage and exit assumptions.</li><li>The floor is what a financial buyer would pay without synergies.</li></ul>`,
detail:`<p>In a sale process, the LBO range tells a seller whether private equity bidders can compete with strategics.</p>`,
fu:[["Why does a lower target IRR raise the LBO valuation?","<p>The sponsor can pay more today for the same exit proceeds and still meet a lower hurdle.</p>"]]},

{id:"l16",top:1,l:2,k:"concept",q:"In a typical LBO, what share of the price does the sponsor's equity usually fund?",o:["90%+ of the price","Roughly 30% to 60%","Nothing; it's all debt","Exactly 50% by law"],a:1,
quick:`<p>Roughly 30% to 60% of the purchase price.</p><p>Equity checks are higher when rates are high and credit is tight, and lower in strong credit markets.</p>`,
detail:`<p>In the 1980s equity could be 10% or less. Today lenders cap leverage by multiples of EBITDA and interest coverage, so equity fills the rest.</p>`,
fu:[["What does a bigger equity check do to returns?","<p>It usually lowers IRR and MOIC, since gains are spread over more equity, but it reduces risk.</p>"]]},

{id:"l17",l:2,k:"math",top:1,q:"Paper LBO: buy at 8x $100 EBITDA with 5x debt. EBITDA grows to $130 and $250 of debt is repaid over 5 years. Exit at 8x. MOIC and IRR?",
quick:`<p>About 2.6x MOIC and a 21% IRR.</p><ol class="steps"><li>Entry: EV 800, debt 500, equity 300</li><li>Exit: EV 8 × 130 = 1,040, debt 250, equity 790</li><li>MOIC = 790 ÷ 300 ≈ 2.63x; IRR = 2.63^(1/5) − 1 ≈ 21%</li></ol>`,
detail:`<p>Estimate the IRR from anchors: 2.5x in 5 years ≈ 20%, 3x ≈ 25%, so 2.6x is a little above 20%.</p>`,
ex:TB([["Entry EV","8 × 100 = 800"],["Debt / equity","500 / 300"],["Exit EV","8 × 130 = 1,040"],["Exit debt","500 − 250 = 250"],["Exit equity","790"],["MOIC","2.63x"],["IRR","≈ 21%"]]),
fu:[["Split the 490 equity gain into drivers.","<p>EBITDA growth: 30 × 8x = 240. Debt paydown: 250. Multiple expansion: 0. Total 490.</p>"],
["What if fees of $20 were funded with extra equity?","<p>Equity 320, so MOIC = 790 ÷ 320 ≈ 2.47x and IRR ≈ 20%.</p>"]]},

{id:"l18",l:1,k:"concept",top:1,q:"What is a sources and uses table?",
quick:`<p>It shows how a deal is funded; total sources must equal total uses.</p><ul><li><b>Uses:</b> what the money is spent on, mainly the equity purchase price, refinancing existing debt, and fees</li><li><b>Sources:</b> where it comes from, such as new debt tranches, sponsor equity, rolled-over management equity and existing cash</li></ul>`,
detail:`<p>Sponsor equity is usually the plug: total uses minus all other sources.</p>`,
ex:TB([["Uses: purchase equity","700"],["Uses: refinance debt","300"],["Uses: fees","30"],["Total uses","1,030"],["Sources: new debt","600"],["Sources: sponsor equity (plug)","430"],["Total sources","1,030"]]),
fu:[["Why refinance the target's existing debt?","<p>Most debt has change-of-control clauses requiring repayment, and the new lenders want to be the senior creditors.</p>"]]},

{id:"l19",l:2,k:"math",n:{v:470,u:""},q:"EBITDA is 100. Lenders allow 5.5x total leverage. The purchase EV is 10x and fees are 20. How much equity does the sponsor need?",
quick:`<p>470, about 46% of uses.</p><ol class="steps"><li>Uses = 1,000 + 20 = 1,020</li><li>Debt = 5.5 × 100 = 550</li><li>Equity = 1,020 − 550 = 470</li></ol>`,
detail:`<p>Leverage capacity is set by lenders based on EBITDA, so the equity check is the plug that funds the rest of the price and fees.</p>`,
fu:[["If rates rise and lenders cut leverage to 4.5x, what happens?","<p>Debt 450, equity 570. Returns fall unless the sponsor pays a lower price.</p>"]]},

{id:"l20",l:2,k:"math",q:"How do you estimate IRR in your head?",
quick:`<p>Use MOIC^(1/years) − 1, anchored by a few known pairs.</p><ul><li><b>Anchors:</b> 2x in 5 years ≈ 15%, 2x in 3 ≈ 26%, 3x in 5 ≈ 25%</li><li><b>Rule of 72:</b> money doubles in about 72 ÷ rate years</li></ul>`,
detail:`<p>For multiple cash flows (like a dividend recap), approximate with the anchors and adjust: earlier cash raises IRR.</p>`,
ex:`<p>At 15%, 72 ÷ 15 ≈ 4.8 years to double, consistent with 2x in 5 years ≈ 15%.</p>`,
fu:[["Roughly what IRR doubles money in 4 years?","<p>About 18%–19% (72 ÷ 4 = 18; exact is 2^(1/4) − 1 ≈ 18.9%).</p>"]]},

{id:"l21",l:2,k:"concept",q:"What is a revolver used for in an LBO, and why is it usually undrawn at close?",
quick:`<p>It's a credit line for liquidity, usually undrawn at close so the capacity is available after the deal.</p><ul><li>Seasonal working capital swings</li><li>Unexpected cash needs</li><li>Covering a shortfall in a bad quarter</li></ul>`,
detail:`<p>Undrawn revolvers carry a small commitment fee. In a model, the revolver is drawn automatically when cash would fall below a minimum balance and repaid first when there's excess cash.</p>`,
fu:[["What's a commitment fee?","<p>A small annual fee (for example 0.25%–0.5%) on the undrawn amount, paid to keep the line available.</p>"]]},

{id:"l22",l:3,k:"math",q:"How does a cash sweep work in an LBO model?",
quick:`<p>After interest and mandatory amortization, a percentage of the remaining free cash flow is used to prepay debt.</p><ul><li>Often 50% to 100% of that cash flow</li><li>Usually starting with the most senior prepayable tranche</li></ul>`,
detail:`<p>Lower debt means lower interest next year, which means more free cash flow: the model is circular, so it uses an average debt balance with iterative calculation enabled, or beginning balances to avoid the circularity.</p>`,
ex:`<p>FCF after interest 80, mandatory amortization 10, minimum cash already met, 100% sweep → 70 of optional prepayment. Total debt falls by 80.</p>`,
fu:[["Why might a sponsor negotiate a lower sweep percentage?","<p>To keep cash for growth, acquisitions or dividends instead of repaying cheap debt early.</p>"]]},

{id:"l23",l:3,k:"concept",q:"Walk me through an LBO debt schedule.",
quick:`<p>For each tranche, roll the balance forward and charge interest on it (often the average) at the tranche's rate.</p><div class="formula">Ending balance = Beginning balance − Mandatory amortization − Optional prepayments (sweep) + Draws (revolver) or PIK accrual</div><div class="formula">Cash available for repayment = Beginning cash + Free cash flow − Minimum cash</div>`,
detail:`<p>Repayments follow the seniority waterfall. Floating-rate tranches use a base rate (like SOFR) plus a spread, sometimes with a floor.</p>`,
fu:[["Why use average balances for interest?","<p>Debt is repaid throughout the year, so the average better reflects actual interest. It creates a circular reference, so many models offer a toggle.</p>"]]},

{id:"l24",l:3,k:"math",q:"Entry: 10x EBITDA of 100, net debt 600. Exit: 12x EBITDA of 150, net debt 300. Attribute the equity gain.",
quick:`<p>Equity grows from 400 to 1,500, a gain of 1,100, split across the three drivers.</p><ul><li><b>EBITDA growth:</b> 50 × 10x = 500</li><li><b>Multiple expansion:</b> 2x × 150 = 300</li><li><b>Debt paydown:</b> 600 − 300 = 300</li></ul>`,
detail:`<p>Other orderings are possible, for example valuing EBITDA growth at the exit multiple, which shifts credit between growth and multiple expansion. Be explicit about the method.</p>`,
ex:TB([["Entry equity","1,000 − 600 = 400"],["Exit equity","1,800 − 300 = 1,500"],["EBITDA growth","+500"],["Multiple expansion","+300"],["Debt paydown","+300"],["Total","+1,100 (3.75x MOIC)"]]),
fu:[["Which of these drivers would an investment committee discount most?","<p>Multiple expansion, because it depends on market conditions at exit.</p>"]]},

{id:"l25",l:2,k:"concept",q:"What are a sponsor's main exit options?",
quick:`<p>A sale to a strategic buyer or another sponsor (a secondary buyout), an IPO, or partial liquidity through a dividend recap.</p><p>Continuation funds, where the sponsor sells to a new vehicle it also manages, are increasingly common.</p>`,
detail:`<p>Strategic sales often give the highest price and a clean exit. An IPO usually only sells part of the stake at first, with the rest sold over time.</p>`,
fu:[["Why is an IPO a slower exit?","<p>Sponsors usually sell only part of their stake at IPO and are subject to lock-ups, then sell the rest in follow-on offerings.</p>"]]},

{id:"l26",l:2,k:"concept",q:"Why do sponsors use management rollover and option pools?",
quick:`<p>To align management with the sponsor.</p><ul><li><b>Rollover:</b> rolled-over equity keeps managers invested.</li><li><b>Option pool:</b> often 5% to 15% of equity, it rewards them heavily if the exit is successful.</li></ul>`,
detail:`<p>Options dilute the sponsor's share of exit equity, which you should reflect in returns. Rollover reduces the cash equity the sponsor must contribute.</p>`,
fu:[["How does a management option pool affect sponsor returns?","<p>It reduces the sponsor's share of exit equity, so returns are lower than a gross calculation suggests.</p>"]]},

{id:"l27",l:3,k:"concept",q:"How do rising interest rates affect LBOs?",
quick:`<p>Higher rates raise interest costs on mostly floating-rate debt, which cuts free cash flow and coverage ratios.</p><ul><li>Lenders allow less leverage, so sponsors write bigger equity checks.</li><li>Returns fall unless purchase prices come down.</li></ul>`,
detail:`<p>Higher rates also tend to lower valuation multiples, which hurts exits for deals bought at peak prices. Sponsors respond with interest rate hedges, lower leverage and more focus on operational value creation.</p>`,
fu:[["Why does floating-rate debt make LBOs sensitive to rates?","<p>Term loans reset with the base rate, so interest expense rises immediately when rates rise, unless hedged.</p>"]]},

{id:"l28",l:1,k:"concept",q:"How is an LBO different from a normal acquisition by a company?",
quick:`<p>In an LBO, a financial sponsor puts heavy debt on the target itself and plans to sell within a few years.</p><p>The debt is repaid from the target's own cash flows; a corporate buyer usually funds with its own cash, debt or stock and plans to keep the business.</p>`,
detail:`<p>Because the sponsor will exit, the LBO is judged on IRR and MOIC, not on EPS accretion.</p>`,
fu:[["Who owns the debt risk in an LBO?","<p>The target company is the borrower. If it can't pay, lenders can take control; the sponsor's loss is generally limited to its equity.</p>"]]}
]);
