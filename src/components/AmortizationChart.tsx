import React, {useMemo, useState} from 'react';
import {BRAZILIAN_BANKS} from '../data/banks';
import {SimulationInput} from '../types';
import {buildSchedule, formatBRL, formatBRLCompact} from '../utils/finance';

interface AmortizationChartProps {
  input: SimulationInput;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({input}) => {
  const [chartMode, setChartMode] = useState<'installment' | 'balance'>('installment');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const series = useMemo(() => {
    const selectedBank = BRAZILIAN_BANKS.find((b) => b.id === input.selectedBankId);
    const adminFeeMonthly = selectedBank ? selectedBank.adminFeeMonthly : 25;
    const financedAmount = Math.max(0, input.propertyValue - input.downPayment - input.fgtsAmount);
    const termMonths = Math.max(12, Math.round(input.termYears * 12));

    const sac = buildSchedule({
      financedAmount,
      propertyValue: input.propertyValue,
      termMonths,
      annualRate: input.annualRate,
      system: 'SAC',
      buyerAge: input.buyerAge,
      adminFeeMonthly,
    });

    const price = buildSchedule({
      financedAmount,
      propertyValue: input.propertyValue,
      termMonths,
      annualRate: input.annualRate,
      system: 'PRICE',
      buyerAge: input.buyerAge,
      adminFeeMonthly,
    });

    const points: {
      label: string;
      month: number;
      sacInstallment: number;
      priceInstallment: number;
      sacBalance: number;
      priceBalance: number;
    }[] = [];

    if (sac.schedule.length > 0 && price.schedule.length > 0) {
      points.push({
        label: 'Mês 1',
        month: 1,
        sacInstallment: sac.schedule[0].totalInstallment,
        priceInstallment: price.schedule[0].totalInstallment,
        sacBalance: sac.schedule[0].remainingBalance,
        priceBalance: price.schedule[0].remainingBalance,
      });

      const step = Math.max(12, Math.floor(termMonths / 15));
      for (let m = step; m < termMonths; m += step) {
        const idx = m - 1;
        points.push({
          label: `Ano ${Math.ceil(m / 12)}`,
          month: m,
          sacInstallment: sac.schedule[idx].totalInstallment,
          priceInstallment: price.schedule[idx].totalInstallment,
          sacBalance: sac.schedule[idx].remainingBalance,
          priceBalance: price.schedule[idx].remainingBalance,
        });
      }

      const lastIdx = termMonths - 1;
      if (points[points.length - 1]?.month !== termMonths) {
        points.push({
          label: `Ano ${input.termYears}`,
          month: termMonths,
          sacInstallment: sac.schedule[lastIdx].totalInstallment,
          priceInstallment: price.schedule[lastIdx].totalInstallment,
          sacBalance: sac.schedule[lastIdx].remainingBalance,
          priceBalance: price.schedule[lastIdx].remainingBalance,
        });
      }
    }

    return points;
  }, [input]);

  if (series.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        Informe um valor financiado positivo para visualizar a curva de amortização.
      </div>
    );
  }

  const width = 620;
  const height = 240;
  const padLeft = 68;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = series.flatMap((p) =>
    chartMode === 'installment'
      ? [p.sacInstallment, p.priceInstallment]
      : [p.sacBalance, p.priceBalance]
  );
  const maxVal = Math.max(...values, 1) * 1.08;

  const getX = (idx: number) =>
    series.length === 1 ? padLeft + plotW / 2 : padLeft + (idx / (series.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const sacPath = series
    .map((p, i) => {
      const val = chartMode === 'installment' ? p.sacInstallment : p.sacBalance;
      return `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`;
    })
    .join(' ');

  const pricePath = series
    .map((p, i) => {
      const val = chartMode === 'installment' ? p.priceInstallment : p.priceBalance;
      return `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(val).toFixed(1)}`;
    })
    .join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => maxVal * t);
  const activePoint = hoverIndex !== null ? series[hoverIndex] : series[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0B1622]">
            CURVA COMPARATIVA: SAC VS PRICE
          </h3>
          <p className="text-xs text-slate-500">
            {chartMode === 'installment'
              ? 'Evolução da parcela mensal ao longo do financiamento'
              : 'Redução do saldo devedor até a quitação'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setChartMode('installment')}
            className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
              chartMode === 'installment'
                ? 'bg-[#0B1622] text-white'
                : 'text-slate-600 hover:text-[#0B1622]'
            }`}
          >
            Parcela
          </button>
          <button
            type="button"
            onClick={() => setChartMode('balance')}
            className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
              chartMode === 'balance'
                ? 'bg-[#0B1622] text-white'
                : 'text-slate-600 hover:text-[#0B1622]'
            }`}
          >
            Saldo Devedor
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-100 py-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1622]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#089166]" />
            SAC
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1622]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#0B1622]" />
            Price
          </span>
        </div>

        {activePoint && (
          <div className="flex flex-wrap items-center gap-2.5 font-semibold tabular-nums text-[#0B1622]">
            <span className="text-slate-500">{activePoint.label}:</span>
            <span className="text-[#089166]">
              SAC {formatBRL(chartMode === 'installment' ? activePoint.sacInstallment : activePoint.sacBalance)}
            </span>
            <span className="text-slate-300">·</span>
            <span>
              Price {formatBRL(chartMode === 'installment' ? activePoint.priceInstallment : activePoint.priceBalance)}
            </span>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[440px] select-none"
          role="img"
          aria-label="Gráfico comparativo de financiamento SAC e Tabela Price"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={i === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-medium tabular-nums"
                >
                  {formatBRLCompact(tick)}
                </text>
              </g>
            );
          })}

          <path
            d={pricePath}
            fill="none"
            stroke="#0B1622"
            strokeWidth={2.25}
            strokeDasharray="5 3"
            strokeLinecap="round"
          />
          <path
            d={sacPath}
            fill="none"
            stroke="#089166"
            strokeWidth={2.75}
            strokeLinecap="round"
          />

          {series.map((p, idx) => {
            const x = getX(idx);
            const sacY = getY(chartMode === 'installment' ? p.sacInstallment : p.sacBalance);
            const priceY = getY(chartMode === 'installment' ? p.priceInstallment : p.priceBalance);
            const isHovered = hoverIndex === idx;
            const showXLabel = idx === 0 || idx === series.length - 1 || idx % 3 === 0;

            return (
              <g key={p.month} onMouseEnter={() => setHoverIndex(idx)}>
                <rect
                  x={x - plotW / (series.length * 2)}
                  y={padTop}
                  width={plotW / series.length}
                  height={plotH}
                  fill="transparent"
                  className="cursor-crosshair"
                />
                {isHovered && (
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={padTop + plotH}
                    stroke="#94a3b8"
                    strokeWidth={1}
                  />
                )}
                <circle
                  cx={x}
                  cy={priceY}
                  r={isHovered ? 4.5 : 2.5}
                  fill="#0B1622"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <circle
                  cx={x}
                  cy={sacY}
                  r={isHovered ? 5 : 3}
                  fill="#089166"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                {showXLabel && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-medium"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
