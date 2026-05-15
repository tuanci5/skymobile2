/**
 * Calculates financial results based on gross revenue, net costs, and operating expenses.
 * Handles cumulative profit, KPI bonuses, PBT, tax, and PAT calculations.
 */
export const calculateFinancials = (d: any) => {
  const opProfitArray = d.months.map((_: any, i: number) => d.grossRevenueByCohort[i] - d.netCostsToProvider[i] - d.operatingExpenses.total[i]);

  let cumOpProfit = 0;
  const kpiBonusArray = opProfitArray.map((p: number, i: number) => {
    cumOpProfit += p;
    return cumOpProfit > 0 ? Math.round(d.grossRevenueByCohort[i] * 0.05) : 0;
  });

  const pbtArray = opProfitArray.map((p: number, i: number) => p - kpiBonusArray[i]);

  let cumPBT = 0;
  let cumTaxPaid = 0;
  const taxArray = pbtArray.map((pbt: number) => {
    cumPBT += pbt;
    if (cumPBT > 0) {
      const totalTaxDue = Math.round(cumPBT * 0.2);
      const taxThisMonth = Math.max(0, totalTaxDue - cumTaxPaid);
      cumTaxPaid += taxThisMonth;
      return taxThisMonth;
    }
    return 0;
  });

  const patArray = pbtArray.map((pbt: number, i: number) => pbt - taxArray[i]);

  const patMarginArray = patArray.map((pat: number, i: number) => {
    const rev = d.grossRevenueByCohort[i];
    return rev > 0 ? ((pat / rev) * 100).toFixed(1) + '%' : '0%';
  });

  return { opProfitArray, kpiBonusArray, pbtArray, taxArray, patArray, patMarginArray };
};
