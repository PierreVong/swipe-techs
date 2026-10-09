Q("math", [
{id:"n1",l:1,k:"math",top:1,q:"What's 15% of 240?",o:["32","36","38","42"],a:1,
quick:`<p>36. 10% is 24, 5% is half of that, 12. 24 + 12 = 36.</p>`,
detail:`<p>Break percentages into 10%, 5% and 1% chunks. It's faster and less error-prone than multiplying directly.</p>`,
fu:[["What's 35% of 240?","<p>30% is 72, 5% is 12 → 84.</p>"]]},

{id:"n2",l:1,k:"math",q:"An EV of 1,250 and EBITDA of 125. What's the multiple?",o:["8.0x","10.0x","12.5x","15.6x"],a:1,
quick:`<p>10.0x. 1,250 ÷ 125 = 10.</p>`,
detail:`<p>Scale the numbers: 125 × 10 = 1,250. Checking by multiplication is often faster than dividing.</p>`,
fu:[["Same EV, EBITDA 160?","<p>1,250 ÷ 160 ≈ 7.8x (160 × 8 = 1,280, slightly more than 1,250).</p>"]]},

{id:"n3",l:1,k:"math",top:1,q:"Net income after a 25% tax on pre-tax income of 120?",o:["90","95","96","100"],a:0,
quick:`<p>90. 120 × 0.75 = 90 (tax is 30).</p>`,
detail:`<p>Multiplying by (1 − t) is the single most common calculation in interview walkthroughs. Know 0.75 and 0.6 (for 40%) by heart.</p>`,
fu:[["Same with a 21% tax rate?","<p>120 × 0.79 = 94.8 (tax 25.2).</p>"]]},

{id:"n4",l:1,k:"math",q:"What's 25% of 1,640?",o:["400","410","420","440"],a:1,
quick:`<p>410. A quarter: halve twice. 1,640 → 820 → 410.</p>`,
detail:`<p>Halving is easy to do in your head, so 50%, 25% and 12.5% are all just repeated halving.</p>`,
fu:[["And 12.5% of 1,640?","<p>Halve once more: 205.</p>"]]},

{id:"n5",l:2,k:"math",top:1,q:"Using the rule of 72, how long does money take to double at 9% a year?",o:["6 years","7 years","8 years","9 years"],a:2,
quick:`<p>About 8 years. 72 ÷ 9 = 8.</p>`,
detail:`<p>The rule of 72 approximates doubling time: years ≈ 72 ÷ annual rate (in %). It's most accurate between about 6% and 12%.</p>`,
ex:`<p>Check: 1.09⁸ ≈ 1.99. Very close to 2.</p>`,
fu:[["What return doubles money in 5 years?","<p>72 ÷ 5 ≈ 14.4%. The exact answer is 14.9%.</p>"]]},

{id:"n6",l:2,k:"math",q:"What's 1.08 cubed?",o:["1.24","1.26","1.28","1.30"],a:1,
quick:`<p>About 1.26. 1.08² = 1.1664; × 1.08 ≈ 1.2597.</p>`,
detail:`<p>Shortcut: 3 × 8% = 24%, plus a compounding bump. For small rates, (1 + r)ⁿ ≈ 1 + nr + n(n−1)/2 × r²: 1 + 0.24 + 3 × 0.0064 ≈ 1.259.</p>`,
fu:[["What's 1.1⁵?","<p>About 1.61 (1.61051). Worth memorizing for discounting.</p>"]]},

{id:"n7",l:2,k:"math",top:1,q:"A value goes from 80 to 100. Then from 100 back to 80. What are the two percentage changes?",o:["+20% and −20%","+25% and −20%","+25% and −25%","+20% and −25%"],a:1,
quick:`<p>+25% then −20%. The base changes: 20 ÷ 80 = 25%, and 20 ÷ 100 = 20%.</p>`,
detail:`<p>Percentage changes aren't symmetric. A 50% loss needs a 100% gain to get back to even.</p>`,
fu:[["A stock falls 50% then rises 50%. Net change?","<p>−25%: 100 → 50 → 75.</p>"]]},

{id:"n8",l:2,k:"math",top:1,q:"Revenue goes from 100 to 200 over 5 years. Roughly what's the CAGR?",o:["~12%","~15%","~18%","~20%"],a:1,
quick:`<p>About 15%. Doubling in 5 years: 2^(1/5) − 1 ≈ 14.9%. Rule of 72: 72 ÷ 5 ≈ 14.4%.</p>`,
detail:`<p>CAGR = (ending ÷ beginning)^(1/years) − 1. For a doubling, use the rule of 72 for a quick estimate.</p>`,
fu:[["100 to 300 over 5 years?","<p>3^(1/5) − 1 ≈ 24.6%, about 25%.</p>"]]},

{id:"n9",l:2,k:"math",q:"What's 1,000 divided by 1.08?",o:["920","926","930","935"],a:1,
quick:`<p>About 926. 1 ÷ 1.08 ≈ 0.926.</p>`,
detail:`<p>Shortcut: 1 ÷ (1 + r) ≈ 1 − r + r². For 8%: 1 − 0.08 + 0.0064 = 0.9264.</p>`,
fu:[["1,000 ÷ 1.1²?","<p>1,000 ÷ 1.21 ≈ 826.</p>"]]},

{id:"n10",l:2,k:"math",q:"What's 7.5 × 140?",o:["1,000","1,050","1,080","1,120"],a:1,
quick:`<p>1,050. 7 × 140 = 980, plus 0.5 × 140 = 70.</p>`,
detail:`<p>Split multiples into easy parts. Or: 7.5 = 30 ÷ 4, so 140 × 30 ÷ 4 = 4,200 ÷ 4 = 1,050.</p>`,
fu:[["8.5 × 160?","<p>8 × 160 = 1,280 + 80 = 1,360.</p>"]]},

{id:"n11",l:1,k:"math",q:"EBITDA of 45 on revenue of 300. What's the margin?",o:["12%","15%","18%","20%"],a:1,
quick:`<p>15%. 45 ÷ 300 = 0.15.</p>`,
detail:`<p>Simplify the fraction first: 45 ÷ 300 = 15 ÷ 100.</p>`,
fu:[["Revenue grows to 360 at the same margin. EBITDA?","<p>360 × 15% = 54.</p>"]]},

{id:"n12",l:3,k:"math",q:"What's the present value of $100 a year for 3 years at 10%?",o:["~$249","~$270","~$300","~$231"],a:0,
quick:`<p>About $249. 90.9 + 82.6 + 75.1 = 248.7.</p>`,
detail:`<p>Discount each year: 100 ÷ 1.1, 100 ÷ 1.21, 100 ÷ 1.331. Or use the annuity formula: 100 × (1 − 1.1⁻³) ÷ 0.1.</p>`,
fu:[["Why is it less than $300?","<p>Money later is worth less than money now; each later payment is discounted more.</p>"]]},

{id:"n13",top:1,l:2,k:"math",q:"Express 1/8, 1/7 and 1/6 as percentages.",
quick:`<p>12.5%, about 14.3%, and about 16.7%.</p>`,
detail:`<p>Fractions show up constantly as earnings yields (1 ÷ P/E) and inverses of multiples. Memorize 1/3 to 1/12.</p>`,
ex:TB([["1/6","16.7%"],["1/7","14.3%"],["1/8","12.5%"],["1/9","11.1%"],["1/11","9.1%"],["1/12","8.3%"]]),
fu:[["A 14x P/E implies what earnings yield?","<p>1 ÷ 14 ≈ 7.1%.</p>"]]},

{id:"n14",l:3,k:"math",top:1,q:"$100 grows to $150 in 2 years. What's the IRR?",o:["~20%","~22.5%","~25%","~27.5%"],a:1,
quick:`<p>About 22.5%. √1.5 ≈ 1.225.</p>`,
detail:`<p>For two years, IRR = √MOIC − 1. Know a few square roots: √1.44 = 1.2, √1.5 ≈ 1.225, √1.69 = 1.3.</p>`,
fu:[["$100 to $169 in 2 years?","<p>√1.69 = 1.3 → 30%.</p>"]]},

{id:"n15",l:2,k:"math",q:"A company's P/E is 25x. What's its earnings yield?",o:["2.5%","4%","5%","25%"],a:1,
quick:`<p>4%. 1 ÷ 25 = 0.04.</p>`,
detail:`<p>Earnings yield is the inverse of P/E. It's the "cost" of issuing stock in accretion/dilution analysis.</p>`,
fu:[["A 4% after-tax cost of debt versus a 25x P/E: which funding is cheaper for an acquirer?","<p>They're equal at 4%; any cheaper debt would make debt the better choice for EPS.</p>"]]},

{id:"n16",l:3,k:"math",top:1,q:"Revenue grows 10% and the profit margin goes from 20% to 22%. How much does profit grow?",o:["12%","20%","21%","32%"],a:2,
quick:`<p>21%. Profit = revenue × margin, so growth = 1.1 × (22 ÷ 20) − 1 = 1.1 × 1.1 − 1 = 21%.</p>`,
detail:`<p>Multiply the growth factors; don't add them. Adding (10% + 10%) understates the answer by the cross term.</p>`,
ex:`<p>Revenue 100 → 110. Profit 20 → 24.2. Growth 21%.</p>`,
fu:[["Margin goes from 20% to 18% instead?","<p>1.1 × 0.9 − 1 = −1%.</p>"]]},

{id:"n17",l:2,k:"math",q:"A margin rises from 10% to 12%. Is that 2% or 20%?",
quick:`<p>Both, said correctly: it's up 2 percentage points, which is a 20% relative increase.</p>`,
detail:`<p>Bankers say "basis points" (bps) to avoid confusion: 2 percentage points = 200 bps. Use points for changes in rates and margins.</p>`,
fu:[["Interest rates go from 4.0% to 4.25%. How many basis points?","<p>25 bps.</p>"]]},

{id:"n18",l:3,k:"math",q:"What's 1,300 ÷ 0.065?",o:["2,000","8,450","20,000","200,000"],a:2,
quick:`<p>20,000. Dividing by 0.065 is the same as multiplying by 1,000 ÷ 65: 1,300 ÷ 65 = 20, × 1,000 = 20,000.</p>`,
detail:`<p>This is the perpetuity shape: cash flow ÷ (rate − growth). Move decimals first, then divide.</p>`,
fu:[["Cash flow 1,300 at a 9% discount rate with 2.5% growth?","<p>1,300 ÷ 0.065 = 20,000. (Strictly, growing the cash flow one year first gives 1,332.5 ÷ 0.065 = 20,500.)</p>"]]},

{id:"n19",l:1,k:"math",q:"120 shares at $45. What's the market cap?",o:["$4,800","$5,400","$5,600","$5,040"],a:1,
quick:`<p>$5,400. 120 × 45 = 100 × 45 + 20 × 45 = 4,500 + 900.</p>`,
detail:`<p>Split one factor into round numbers.</p>`,
fu:[["Add 300 of net debt. EV?","<p>5,700.</p>"]]},

{id:"n20",l:3,k:"math",q:"Debt of 600 is repaid 10% of the original amount each year. Interest is 8% on the beginning balance. What's interest in year 3?",o:["38.4","43.2","48.0","33.6"],a:0,
quick:`<p>38.4. Two repayments of 60 happen before year 3, so the beginning balance is 480. 480 × 8% = 38.4.</p>`,
detail:`<p>Track the balance year by year: 600 (year 1), 540 (year 2), 480 (year 3).</p>`,
fu:[["Total interest over the 3 years?","<p>48 + 43.2 + 38.4 = 129.6.</p>"]]},

{id:"n21",l:1,k:"math",q:"EPS of $3.20 at a 15x P/E. What's the share price?",o:["$45","$48","$50","$52"],a:1,
quick:`<p>$48. 3.20 × 15 = 3 × 15 + 0.2 × 15 = 45 + 3.</p>`,
detail:`<p>Price = EPS × P/E.</p>`,
fu:[["At 18x?","<p>3.20 × 18 = 57.6.</p>"]]},

{id:"n22",l:2,k:"math",q:"What's 1.05 squared?",o:["1.100","1.1025","1.105","1.110"],a:1,
quick:`<p>1.1025. (1 + r)² = 1 + 2r + r² = 1 + 0.10 + 0.0025.</p>`,
detail:`<p>The r² term is the compounding. It's small for one or two years but adds up over long horizons.</p>`,
fu:[["1.12 squared?","<p>1 + 0.24 + 0.0144 = 1.2544.</p>"]]},

{id:"n23",l:2,k:"math",q:"An investment returns 1.8x over 3 years. Roughly what IRR?",o:["~16%","~22%","~26%","~30%"],a:1,
quick:`<p>About 22%. 2x in 3 years ≈ 26%, 1.5x ≈ 14.5%, and 1.8x falls between, closer to 2x. Exact: 1.8^(1/3) − 1 ≈ 21.6%.</p>`,
detail:`<p>Interpolate between anchors you know, then sanity-check: 1.22³ ≈ 1.82.</p>`,
fu:[["Same 1.8x over 5 years?","<p>About 12.5%: 1.8^(1/5) ≈ 1.125.</p>"]]},

{id:"n24",l:1,k:"math",q:"What's 0.75 × 360?",o:["250","260","270","280"],a:2,
quick:`<p>270. Three quarters of 360: a quarter is 90, three of them is 270.</p>`,
detail:`<p>Turning decimals into fractions (0.75 = 3/4, 0.6 = 3/5, 0.125 = 1/8) makes most interview math easy.</p>`,
fu:[["0.6 × 450?","<p>3/5 of 450: 90 × 3 = 270.</p>"]]},

{id:"n25",l:2,k:"math",q:"A company has 50 shares at $30 and issues $300 of new stock at the same price. How many shares now?",o:["55","60","65","70"],a:1,
quick:`<p>60. 300 ÷ 30 = 10 new shares.</p>`,
detail:`<p>New shares = amount raised ÷ issue price. Ownership of existing holders falls from 100% to 50 ÷ 60 ≈ 83%.</p>`,
fu:[["If net income stays at 120, what happens to EPS?","<p>From 2.40 to 2.00, unless the new cash earns something.</p>"]]},

{id:"n26",l:3,k:"math",q:"A business worth 1,000 today grows 6% a year. Roughly what's it worth in 12 years?",o:["~1,700","~2,000","~2,400","~2,900"],a:1,
quick:`<p>About 2,000. At 6% money doubles in about 72 ÷ 6 = 12 years. Exact: 1.06¹² ≈ 2.01.</p>`,
detail:`<p>The rule of 72 works in both directions: doubling time from a rate, or the rate from a doubling time.</p>`,
fu:[["And in 24 years?","<p>Two doublings: about 4,000 (exact 1.06²⁴ ≈ 4.05).</p>"]]}
]);
