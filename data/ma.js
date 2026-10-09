Q("ma", [
{id:"m1",l:1,k:"concept",top:1,q:"Why would a company buy another company?",
quick:`<p>To grow faster than it could on its own (new markets, products or customers), to capture cost or revenue synergies, to gain market share, to acquire talent, technology or IP, or because the target is cheap relative to what it's worth to the buyer.</p>`,
detail:`<p>The test of a good deal is whether the value created (standalone value plus synergies) exceeds the price paid, including the premium and fees. EPS accretion alone doesn't prove value creation.</p>`,
fu:[["What's a defensive acquisition?","<p>Buying a target mainly to stop a competitor from getting it, or to neutralize a disruptive threat.</p>"]]},

{id:"m2",l:1,k:"concept",top:1,q:"What does it mean for a deal to be accretive or dilutive?",
quick:`<p>A deal is accretive if the buyer's pro forma EPS is higher than its standalone EPS, and dilutive if it's lower. It's measured on projected earnings, usually for the next one or two years.</p>`,
detail:`<p>Pro forma EPS = (buyer net income + target net income ± deal adjustments) ÷ (buyer shares + new shares issued). Adjustments include interest on new debt, lost interest on cash used, new D&amp;A from write-ups, and synergies.</p>`,
fu:[["Does accretive mean the deal creates value?","<p>No. A buyer with a high P/E can buy almost anything with stock and be accretive. Value creation depends on whether the price is below the target's value to the buyer.</p>"]]},

{id:"m3",l:2,k:"concept",top:1,q:"Walk me through a merger model.",
quick:`<p>Project both companies' income statements. Set the purchase price and funding mix (cash, debt, stock). Combine net incomes, then adjust: add synergies, subtract lost interest on cash used, add interest on new debt, and subtract new D&amp;A from asset write-ups, all after tax. Divide by the new share count and compare to the buyer's standalone EPS.</p>`,
detail:`<p>A full model also builds the combined balance sheet: eliminate the target's equity, record new debt or shares, write up assets, and create goodwill. Then show sensitivity tables for price, funding mix and synergies.</p>`,
fu:[["Which costs are usually excluded from pro forma EPS?","<p>One-time transaction and integration costs. They're real cash costs but are shown separately so recurring earnings aren't distorted.</p>"]]},

{id:"m4",l:2,k:"math",top:1,q:"All-stock deal. Buyer trades at 20x P/E, target is bought at 15x P/E. Accretive or dilutive?",o:["Accretive","Dilutive","Neutral","Can't tell"],a:0,
quick:`<p>Accretive, ignoring synergies and fees. When the buyer's P/E is higher than the P/E it pays for the target, each new share issued brings in more earnings than an existing share earns.</p>`,
detail:`<p>The buyer's earnings yield is 1 ÷ 20 = 5%; the target's is 1 ÷ 15 = 6.7%. The buyer "pays" 5% (in earnings per share given up) and "gets" 6.7%.</p>`,
ex:`<p>Buyer: net income 100, 50 shares at $40 (EPS 2.00, P/E 20). Target: net income 20, price 300 (P/E 15). Issue 300 ÷ 40 = 7.5 shares. Pro forma EPS = 120 ÷ 57.5 = 2.087, up 4.3%.</p>`,
fu:[["Would it be accretive at a 25x purchase P/E?","<p>No. The target yield (4%) is below the buyer's 5%: price 500, shares 12.5, EPS 120 ÷ 62.5 = 1.92, dilutive.</p>"]]},

{id:"m5",l:3,k:"concept",top:1,q:"How do you quickly tell if a deal will be accretive?",
quick:`<p>Compare the weighted after-tax cost of funding with the target's earnings yield (the inverse of the purchase P/E). Cash costs the forgone interest rate × (1 − t), debt costs the interest rate × (1 − t), and stock costs the buyer's earnings yield (1 ÷ buyer P/E). If the target's yield is higher than the funding cost, it's accretive.</p>`,
detail:`<p>This ignores synergies, write-up D&amp;A and fees, so it's a first pass. With a mix of funding sources, weight each cost by its share of the purchase price.</p>`,
ex:`<p>Funding 50% debt at 6% (4.5% after tax) and 50% stock at a 20x buyer P/E (5%): weighted cost 4.75%. Target bought at 16x → 6.25% yield → accretive.</p>`,
fu:[["Why does the cost of stock equal the buyer's earnings yield?","<p>Issuing a new share gives away a claim on that share's EPS. Per dollar raised, that's EPS ÷ price = 1 ÷ P/E.</p>"]]},

{id:"m6",l:3,k:"math",q:"Buyer P/E 10x. New debt costs 8% with a 25% tax rate. Target bought at 12.5x P/E. Which funding is accretive?",o:["All-stock only","All-debt only","Both","Neither"],a:1,
quick:`<p>All-debt only. Target earnings yield = 1 ÷ 12.5 = 8%. Debt costs 8% × 0.75 = 6%, which is below 8%: accretive. Stock costs 1 ÷ 10 = 10%, above 8%: dilutive.</p>`,
detail:`<p>Low-P/E buyers find stock expensive, so they prefer cash or debt.</p>`,
fu:[["At what purchase P/E would the all-debt deal break even?","<p>When the target's yield equals 6%: 1 ÷ 0.06 ≈ 16.7x.</p>"]]},

{id:"m7",l:1,k:"concept",top:1,q:"What are the types of synergies, and which do bankers trust more?",
quick:`<p>Cost synergies, like removing duplicate overhead, consolidating facilities and better procurement, and revenue synergies, like cross-selling, pricing power and new channels. Cost synergies are more trusted because management controls them; revenue synergies depend on customers.</p>`,
detail:`<p>Synergies usually phase in over 2 to 3 years and cost money to achieve (integration costs). Buyers that pay away all the synergies in the premium give the value to the seller.</p>`,
fu:[["How do you value synergies?","<p>Discount the projected after-tax synergies net of integration costs, or apply a multiple to run-rate synergies. Haircut revenue synergies heavily.</p>"]]},

{id:"m8",l:3,k:"math",q:"How is goodwill calculated in an acquisition?",
quick:`<p>Goodwill = purchase price for the equity − fair value of the target's identifiable net assets. Fair value = book value of net assets + write-ups to assets (like PP&amp;E and new intangibles) − the deferred tax liability created by those write-ups in a stock deal.</p>`,
detail:`<p>In a stock deal, the tax basis of assets doesn't change, so a book write-up creates a gap between book and tax basis: a deferred tax liability equal to the write-up × tax rate. That DTL reduces net assets and so increases goodwill.</p>`,
ex:`<p>Price 500. Book equity 300. Write-ups 40, DTL 40 × 25% = 10. Fair value of net assets = 300 + 40 − 10 = 330. Goodwill = 170.</p>`,
fu:[["Do you also eliminate the target's existing goodwill?","<p>Yes. The target's old goodwill is written off and replaced by the new goodwill from this transaction, so subtract it from book equity first.</p>"]]},

{id:"m9",l:3,k:"concept",q:"Asset deal vs stock deal: who prefers which?",
quick:`<p>Buyers prefer asset deals: they get a step-up in the tax basis, so future depreciation and amortization are tax-deductible, and they can leave unwanted liabilities behind. Sellers usually prefer stock deals: they're simpler, liabilities go with the company, and a C-corp seller avoids double taxation.</p>`,
detail:`<p>A 338(h)(10) election (available for S-corps and subsidiaries of corporations) lets a stock purchase be treated as an asset purchase for tax. Buyers may pay more to compensate the seller for the extra tax.</p>`,
fu:[["Why does a C-corp face double taxation in an asset sale?","<p>The corporation pays tax on the gain from selling assets, then shareholders pay tax again when the proceeds are distributed.</p>"]]},

{id:"m10",l:1,k:"concept",q:"What is a control premium?",
quick:`<p>The amount a buyer pays above the target's undisturbed share price to gain control. For US public companies it's typically 20% to 40%. It's why precedent transactions tend to value companies above trading comps.</p>`,
detail:`<p>Control lets the buyer change strategy, capture synergies and direct cash flows, which a minority investor can't. Premiums are measured against the price before deal rumors moved it.</p>`,
fu:[["Why use the \"undisturbed\" price?","<p>Leaks and rumors push the price up before an announcement. Measuring from a clean date avoids understating the premium.</p>"]]},

{id:"m11",top:1,l:1,k:"concept",q:"Which funding source is usually cheapest for the buyer?",o:["Cash on hand","New debt","New stock","They're always equal"],a:0,
quick:`<p>Cash on hand, usually. The interest it would have earned is low, so the after-tax cost is small. Debt is next, and stock is usually the most expensive. A buyer with a very high P/E can be an exception.</p>`,
detail:`<p>Cost here means the effect on EPS. The cost of stock is the buyer's earnings yield, which is usually higher than after-tax interest rates.</p>`,
fu:[["Why isn't cash always used?","<p>Most buyers don't have enough, and they may need it for operations or prefer to keep flexibility. Large deals also have leverage limits on how much debt can be raised.</p>"]]},

{id:"m12",top:1,l:2,k:"concept",q:"Why would a buyer pay with stock instead of cash?",
quick:`<p>Its shares are highly valued, it lacks cash or debt capacity, or it wants target shareholders to share the risk and upside of the combined company. Stock deals can also be tax-deferred for sellers.</p>`,
detail:`<p>Paying in stock is also a signal: if the buyer thinks its shares are overvalued, paying with them is cheap. Markets know this, so all-stock offers sometimes get a weaker reaction.</p>`,
fu:[["Why might target shareholders prefer cash?","<p>Certainty of value and no exposure to the buyer's share price. The trade-off is that cash is usually taxable right away.</p>"]]},

{id:"m13",top:1,l:2,k:"concept",q:"Can a dilutive deal still make sense?",
quick:`<p>Yes. EPS is one year's view. A deal can be dilutive at first and still create value through faster growth, a stronger market position, or synergies that take time to arrive. Bankers often show the year it turns accretive.</p>`,
detail:`<p>A target with a high multiple because it grows fast will often be dilutive in year one but accretive later as its earnings compound.</p>`,
fu:[["What metric besides EPS might boards focus on?","<p>Return on invested capital versus cost of capital, free cash flow per share, and impact on leverage and credit ratings.</p>"]]},

{id:"m14",l:3,k:"math",q:"How do you calculate the synergies needed to break even on a dilutive deal?",
quick:`<p>Pre-tax synergies needed = (standalone EPS − pro forma EPS) × pro forma shares ÷ (1 − tax rate).</p>`,
detail:`<p>The EPS shortfall times the new share count is the after-tax net income gap. Gross it up for taxes to get the pre-tax synergies required.</p>`,
ex:`<p>Standalone EPS 1.00, pro forma EPS 0.923, 130 pro forma shares, tax 25%. Gap = 0.077 × 130 = 10 after tax → 10 ÷ 0.75 ≈ 13.3 of pre-tax synergies.</p>`,
fu:[["Why divide by (1 − t)?","<p>Synergies are pre-tax cost savings; only 75% of each dollar reaches net income after a 25% tax.</p>"]]},

{id:"m15",l:3,k:"concept",q:"What's the difference between a fixed and a floating exchange ratio?",
quick:`<p>With a fixed exchange ratio, target holders get a set number of buyer shares per target share: the ownership split is locked, but the deal value moves with the buyer's stock. With a floating ratio, the dollar value per target share is fixed and the number of shares adjusts, so ownership moves instead.</p>`,
detail:`<p>Collars limit how far either can swing, for example by fixing the ratio only within a price band.</p>`,
ex:`<p>Fixed ratio 0.5 and buyer at $52 → target holders get $26 per share. If the buyer falls to $46, they get $23.</p>`,
fu:[["Which would a target prefer if it worries the buyer's stock will fall?","<p>A floating ratio (fixed value), possibly with a collar, so the value they receive is protected.</p>"]]},

{id:"m16",l:3,k:"concept",q:"What is a contribution analysis?",
quick:`<p>It compares how much revenue, EBITDA and net income each company contributes to the combined entity with the ownership each side receives. It's used mainly in stock-for-stock mergers to argue whether the ownership split is fair.</p>`,
detail:`<p>Contribution ignores synergies, growth differences and capital structure, so adjust for net debt before comparing at the equity level.</p>`,
fu:[["A target contributes 40% of EBITDA but gets 30% ownership. Who benefits?","<p>The buyer's shareholders, at first glance. The target would argue for a higher exchange ratio unless differences in net debt or growth explain the gap.</p>"]]},

{id:"m17",top:1,l:2,k:"concept",q:"The acquisition creates new intangible assets that are amortized. What does that do to accretion?",o:["Makes it more accretive","Makes it more dilutive","No effect on EPS","Only affects cash EPS"],a:1,
quick:`<p>It makes it more dilutive. Amortization is an expense that lowers pro forma net income, so GAAP EPS falls. That's why companies also show "cash EPS" or adjusted EPS excluding acquisition amortization.</p>`,
detail:`<p>In a stock deal, the amortization isn't tax-deductible, so there's no tax shield either (the DTL unwinds for book purposes). In an asset deal it's deductible, which softens the hit.</p>`,
fu:[["Does that amortization affect cash flow?","<p>Not directly: it's non-cash. In an asset deal it reduces cash taxes, which increases cash flow.</p>"]]},

{id:"m18",l:2,k:"math",top:1,q:"Buyer: net income 100, 50 shares at $40. It buys a target with net income 20 for $300, all with debt at 6%. Tax 25%. Accretive or dilutive?",
quick:`<p>Accretive by 6.5%. After-tax interest = 300 × 6% × 0.75 = 13.5. Pro forma net income = 100 + 20 − 13.5 = 106.5. Shares stay at 50, so EPS goes from 2.00 to 2.13.</p>`,
detail:`<p>Debt funding adds interest cost but no new shares. The target's earnings yield (20 ÷ 300 = 6.7%) beats the after-tax cost of debt (4.5%), so it's accretive.</p>`,
ex:TB([["Buyer net income","100"],["+ Target net income","20"],["− After-tax interest","(13.5)"],["Pro forma net income","106.5"],["Shares","50"],["Pro forma EPS","2.13 vs 2.00 (+6.5%)"]]),
fu:[["What if it's all stock at $40?","<p>Issue 300 ÷ 40 = 7.5 shares. EPS = 120 ÷ 57.5 = 2.087, still accretive by 4.3%, since 20x buyer P/E > 15x purchase P/E.</p>"],
["What if it's all cash that was earning 2% interest?","<p>Lost interest after tax = 300 × 2% × 0.75 = 4.5. EPS = 115.5 ÷ 50 = 2.31, up 15.5%.</p>"]]},

{id:"m19",l:2,k:"concept",q:"How do asset write-ups in an acquisition affect the pro forma income statement?",
quick:`<p>Writing up PP&amp;E and recognizing new intangibles creates extra depreciation and amortization, which reduces pro forma pre-tax income and EPS. In a stock deal it isn't tax-deductible, so book taxes fall (through the DTL unwinding) but cash taxes don't.</p>`,
detail:`<p>Goodwill itself isn't amortized under US GAAP for public companies, which is why buyers sometimes prefer to allocate more to goodwill than to amortizable intangibles.</p>`,
ex:`<p>Write-up of 100 in intangibles amortized over 10 years → 10 of extra amortization per year. After the book tax effect (25%), net income falls 7.5.</p>`,
fu:[["Why is the book tax effect still 25% in a stock deal?","<p>Book tax expense is based on book income, which is 10 lower. The DTL created at closing unwinds by 2.5 a year, so cash taxes don't change but book taxes fall.</p>"]]},

{id:"m20",l:1,k:"concept",top:1,q:"What's the difference between a strategic buyer and a financial buyer?",
quick:`<p>A strategic buyer is an operating company buying a business that fits its own, so it can count on synergies. A financial buyer, usually a private equity firm, buys to earn a return through leverage, operational improvements and an eventual exit. Strategics can often pay more because of synergies.</p>`,
detail:`<p>Financial buyers are limited by their target return (often 20%+ IRR) and the debt they can raise. Strategics are limited by accretion, their own valuation and integration risk.</p>`,
fu:[["When could a financial buyer outbid a strategic?","<p>When debt markets are loose and cheap, when the PE firm owns a related company and can capture synergies (an add-on acquisition), or when strategics are cautious.</p>"]]},

{id:"m21",l:1,k:"math",q:"A target trades at $20. The buyer offers $26 per share. What's the premium?",
quick:`<p>30%. (26 − 20) ÷ 20 = 30%.</p>`,
detail:`<p>Premiums are usually quoted against the undisturbed price and also against 30-day and 52-week averages.</p>`,
fu:[["The buyer pays in stock at $52 a share. What exchange ratio gives $26?","<p>26 ÷ 52 = 0.5 buyer shares per target share.</p>"]]},

{id:"m22",l:3,k:"math",q:"Can an all-stock deal be accretive if the buyer's P/E is lower than the purchase P/E?",
quick:`<p>Yes, but only with enough synergies. Without them it's dilutive, because the buyer issues shares that earn more than the target earnings they buy.</p>`,
detail:`<p>The P/E rule only compares standalone earnings. Synergies add earnings without adding shares, so they can close the gap.</p>`,
ex:`<p>Buyer: net income 100, 100 shares at $10 (P/E 10). Target: net income 20, bought for 300 (P/E 15). Issue 30 shares: EPS = 120 ÷ 130 = 0.923, dilutive vs 1.00. To break even, net income must reach 130, needing 10 after tax, or 13.3 pre-tax synergies.</p>`,
fu:[["Is 13.3 of synergies realistic here?","<p>That's 67% of the target's net income, which is aggressive. You'd check it against the target's cost base and peer deals.</p>"]]},

{id:"m23",l:3,k:"math",top:1,q:"Walk me through how you build the combined balance sheet in an acquisition.",
quick:`<p>Add the buyer's and target's balance sheets. Eliminate the target's shareholders' equity. Reflect the funding: cash used, new debt, or new shares. Write up the target's assets to fair value, create a deferred tax liability on the write-ups in a stock deal, and plug the remainder as goodwill. Transaction fees reduce cash and retained earnings.</p>`,
detail:`<p>Assets must equal liabilities plus equity after every adjustment. Goodwill is what makes it balance: the excess of price over the fair value of net assets.</p>`,
ex:`<p>Target: assets 800, liabilities 500, book equity 300. Buyer pays 500 cash; write-up 40, DTL 10, goodwill 500 − (300 + 40 − 10) = 170.</p>`+TB([["Buyer cash","−500"],["Target assets added","+800"],["Write-up","+40"],["Goodwill","+170"],["Total assets","+510"],["Target liabilities added","+500"],["DTL","+10"],["Target equity","eliminated, so buyer equity unchanged"],["Liabilities + equity","+510"]]),
fu:[["Where do financing fees go?","<p>Under US GAAP, debt issuance costs are netted against the debt and amortized into interest expense over the loan's life, unlike advisory fees, which are expensed.</p>"]]},

{id:"m24",l:2,k:"concept",q:"What are break fees and reverse termination fees?",
quick:`<p>A break fee is paid by the target to the buyer if the target walks away, for example to accept a better offer. A reverse termination fee is paid by the buyer to the target if the buyer can't close, often because financing or regulatory approval fails.</p>`,
detail:`<p>Target break fees in US public deals are typically around 2% to 4% of equity value. Reverse fees can be larger, especially where antitrust risk is high.</p>`,
fu:[["Why would a buyer want a break fee?","<p>To compensate for its costs and to discourage competing bidders from jumping in after it has done the work.</p>"]]},

{id:"m25",l:1,k:"concept",q:"Why do so many acquisitions fail to create value?",
quick:`<p>The buyer overpays, often in a competitive auction, synergies are overestimated or arrive late, integration is harder than expected, or cultures clash and key people leave.</p>`,
detail:`<p>The premium is paid up front and is certain; the synergies are uncertain and in the future. That asymmetry is why disciplined buyers set walk-away prices.</p>`,
fu:[["What's the \"winner's curse\"?","<p>In an auction the winner is often the bidder who most overestimated the target's value, so winning can mean overpaying.</p>"]]},

{id:"m26",l:3,k:"concept",q:"How does a 338(h)(10) election or asset deal change the accretion/dilution analysis?",
quick:`<p>The buyer gets a stepped-up tax basis, so depreciation and amortization of the write-ups (and goodwill, over 15 years in the US) become tax-deductible. Cash taxes fall, no deferred tax liability is created, and cash EPS improves, while GAAP EPS still bears the book amortization of intangibles.</p>`,
detail:`<p>The tax savings have real value, which is why buyers sometimes pay the seller more to compensate for the seller's higher tax bill.</p>`,
ex:`<p>Goodwill of 300 amortized for tax over 15 years = 20 a year of deductions → 5 a year of cash tax savings at 25%.</p>`,
fu:[["Is goodwill amortized on the GAAP income statement in this case?","<p>No. Public companies still don't amortize goodwill for book purposes; only the tax return gets the deduction.</p>"]]}
]);
