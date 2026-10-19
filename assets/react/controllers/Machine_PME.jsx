import React, { useState, useMemo } from "react";

/**
 * TrueCost — calculateur de coût réel d'un équipement (PME)
 *
 * Composant autonome : aucune dépendance externe hormis React.
 * Les styles sont injectés via une balise <style> scopée à la classe
 * racine ".truecost", donc ce composant ne fuit pas de CSS global.
 *
 * Usage :
 *   import TrueCostCalculator from "./TrueCostCalculator";
 *   <TrueCostCalculator />
 */

const DEFAULTS = {
    // Profil entreprise
    discountRate: 8,
    hourlyCost: 45,
    energyRate: 0.18,
    analysisYears: 5,
    // La décision
    decisionName: "Machine de production",
    price: 120000,
    install: 8000,
    training: 12000,
    maintenance: 24000,
    energyKwh: 172000,
    downtimeHours: 120,
    financedShare: 70,
    loanRate: 5.5,
    loanYears: 5,
    // Statu quo
    statusQuoCost: 84000,
};

const SCENARIO_MULTIPLIER = { pess: 1.15, real: 1.0, opt: 0.9 };

const SCENARIO_TEXT = {
    pess: "Majore de 15 % la maintenance, l'énergie et les arrêts, pour couvrir l'usure et les imprévus.",
    real: "Coûts de maintenance, d'énergie et d'arrêts inchangés par rapport à vos estimations.",
    opt: "Réduit de 10 % la maintenance, l'énergie et les arrêts, en cas d'usage optimal de l'équipement.",
};

// ---------- Financial helpers ----------

function loanTotalInterest(principal, annualRatePct, years) {
    if (principal <= 0 || years <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    const n = years * 12;
    if (r === 0) return 0;
    const payment = (principal * r) / (1 - Math.pow(1 + r, -n));
    return payment * n - principal;
}

function npv(rate, cashflows) {
    return cashflows.reduce(
        (acc, cf, t) => acc + cf / Math.pow(1 + rate, t),
        0,
    );
}

function irr(cashflows) {
    let lo = -0.9,
        hi = 5,
        mid = 0;
    let fLo = npv(lo, cashflows);
    for (let i = 0; i < 100; i++) {
        mid = (lo + hi) / 2;
        const fMid = npv(mid, cashflows);
        if (Math.abs(fMid) < 1e-6) return mid;
        if (fLo < 0 === fMid < 0) {
            lo = mid;
            fLo = fMid;
        } else {
            hi = mid;
        }
    }
    return mid;
}

function discountedPayback(rate, investment, annualCashflow, maxYears) {
    let cum = 0;
    for (let t = 1; t <= maxYears; t++) {
        cum += annualCashflow / Math.pow(1 + rate, t);
        if (cum >= investment) {
            const prevCum = cum - annualCashflow / Math.pow(1 + rate, t);
            const frac = (investment - prevCum) / (cum - prevCum);
            return t - 1 + frac;
        }
    }
    return null;
}

const fmt = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
const fmtPct = (n) => (n * 100).toFixed(1).replace(".", ",") + " %";

// ---------- Small presentational pieces ----------

function Field({ label, hint, unit, children }) {
    return (
        <div className="tc-field">
            <label>
                {label}{" "}
                {hint && (
                    <span className="tc-hint" title={hint}>
                        ?
                    </span>
                )}
            </label>
            <div className="tc-unit-row">
                {children}
                {unit && <span className="tc-unit">{unit}</span>}
            </div>
        </div>
    );
}

function NumberInput({ value, onChange, step = 1, min = 0, max }) {
    return (
        <input
            type="number"
            className="tc-num"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
    );
}

function Chart({ statusQuoAnnual, investment, annualVariable, years }) {
    const W = 640,
        H = 220,
        padL = 46,
        padB = 24,
        padT = 10,
        padR = 10;
    const plotW = W - padL - padR,
        plotH = H - padT - padB;

    const pointsA = []; // ne rien faire
    const pointsB = []; // investir
    for (let t = 0; t <= years; t++) {
        pointsA.push(statusQuoAnnual * t);
        pointsB.push(t === 0 ? investment : investment + annualVariable * t);
    }
    const maxVal = Math.max(...pointsA, ...pointsB, 1);

    const x = (t) => padL + (t / years) * plotW;
    const y = (val) => padT + plotH - (val / maxVal) * plotH;
    const toPath = (pts) =>
        pts
            .map(
                (v, t) =>
                    `${t === 0 ? "M" : "L"} ${x(t).toFixed(1)} ${y(v).toFixed(1)}`,
            )
            .join(" ");

    const gridSteps = [0, 1, 2, 3, 4];

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height="220"
            role="img"
            aria-label="Comparaison du coût cumulé, ne rien faire contre investir"
        >
            {gridSteps.map((i) => {
                const yy = padT + (plotH / 4) * i;
                const val = maxVal * (1 - i / 4);
                return (
                    <g key={i}>
                        <line
                            x1={padL}
                            y1={yy}
                            x2={W - padR}
                            y2={yy}
                            stroke="var(--tc-line)"
                            strokeWidth="1"
                        />
                        <text
                            x={padL - 8}
                            y={yy + 4}
                            textAnchor="end"
                            fontSize="10"
                            fontFamily="IBM Plex Mono, monospace"
                            fill="var(--tc-ink-soft)"
                        >
                            {Math.round(val / 1000)}k
                        </text>
                    </g>
                );
            })}
            {Array.from({ length: years + 1 }, (_, t) => (
                <text
                    key={t}
                    x={x(t)}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="var(--tc-ink-soft)"
                >
                    an {t}
                </text>
            ))}
            <path
                d={toPath(pointsA)}
                fill="none"
                stroke="var(--tc-amber)"
                strokeWidth="2.5"
            />
            <path
                d={toPath(pointsB)}
                fill="none"
                stroke="var(--tc-teal)"
                strokeWidth="2.5"
            />
        </svg>
    );
}

// ---------- Main component ----------

export default function TrueCostCalculator() {
    const [companyName, setCompanyName] = useState("");
    const [v, setV] = useState(DEFAULTS);
    const [scenario, setScenario] = useState("real");
    const [statusQuoOn, setStatusQuoOn] = useState(false);

    const set = (key) => (val) => setV((prev) => ({ ...prev, [key]: val }));

    const reset = () => setV(DEFAULTS);

    const years = Math.max(1, Math.round(v.analysisYears));
    const mult = SCENARIO_MULTIPLIER[scenario];

    const calc = useMemo(() => {
        const energyCost = v.energyKwh * v.energyRate * mult;
        const downtimeCost = v.downtimeHours * v.hourlyCost * mult;
        const maintenanceCost = v.maintenance * mult;
        const annualVariable = energyCost + downtimeCost + maintenanceCost;

        const principal = v.price * (v.financedShare / 100);
        const interest = loanTotalInterest(principal, v.loanRate, v.loanYears);

        const upfront = v.price + v.install + v.training;
        const total = upfront + interest + annualVariable * years;

        const rows = [
            { label: "Prix d'achat", value: v.price },
            { label: "Installation & mise en service", value: v.install },
            { label: "Formation des équipes", value: v.training },
            {
                label: "Intérêts de financement",
                value: interest,
                sub: `${v.financedShare}% financé à ${v.loanRate}% sur ${v.loanYears} ans`,
            },
            {
                label: `Maintenance (${years} ans)`,
                value: maintenanceCost * years,
            },
            {
                label: `Énergie (${years} ans)`,
                value: energyCost * years,
                sub: `${v.energyKwh.toLocaleString("fr-FR")} kWh/an × ${v.energyRate} €`,
            },
            {
                label: `Arrêts estimés (${years} ans)`,
                value: downtimeCost * years,
                sub: `${v.downtimeHours} h/an × ${v.hourlyCost} €`,
            },
        ];

        const deltaPct = v.price > 0 ? total / v.price - 1 : 0;

        let statusQuo = null;
        if (statusQuoOn) {
            const rate = v.discountRate / 100;
            const annualSavings = v.statusQuoCost - annualVariable;
            const investment = upfront + interest;
            const cashflows = [
                -investment,
                ...Array(years).fill(annualSavings),
            ];

            const vanVal = npv(rate, cashflows);
            const triVal = irr(cashflows);
            const payback = discountedPayback(
                rate,
                investment,
                annualSavings,
                years,
            );

            const horizon = Math.min(3, years);
            const totalStatusQuoH = v.statusQuoCost * horizon;
            const totalInvestH = investment + annualVariable * horizon;
            const gapH = totalStatusQuoH - totalInvestH;

            statusQuo = {
                annualSavings,
                investment,
                vanVal,
                triVal,
                payback,
                horizon,
                gapH,
                annualVariable,
            };
        }

        return {
            annualVariable,
            upfront,
            interest,
            total,
            rows,
            deltaPct,
            statusQuo,
        };
    }, [v, scenario, statusQuoOn, years, mult]);

    return (
        <div className="truecost">
            <style>{CSS}</style>

            <div className="tc-shell">
                <header className="tc-top">
                    <div>
                        <div className="tc-wordmark">
                            TrueCost<span className="tc-dot">.</span>
                        </div>
                        <div className="tc-tagline">
                            Le coût réel de vos décisions d'équipement
                        </div>
                    </div>
                    <div className="tc-company-field">
                        <label htmlFor="tc-companyName">Entreprise</label>
                        <input
                            id="tc-companyName"
                            type="text"
                            placeholder="Nom de votre entreprise"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                </header>

                <div className="tc-layout">
                    {/* SIDEBAR */}
                    <aside className="tc-sidebar">
                        <p className="tc-side-heading">Profil entreprise</p>
                        <p className="tc-side-sub">
                            Ces valeurs sont propres à votre activité. Elles
                            alimentent tous les calculs ci-contre.
                        </p>

                        <Field label="Taux d'actualisation" unit="% / an">
                            <NumberInput
                                value={v.discountRate}
                                onChange={set("discountRate")}
                                step={0.5}
                                max={30}
                            />
                        </Field>
                        <Field label="Coût horaire chargé" unit="€ / h">
                            <NumberInput
                                value={v.hourlyCost}
                                onChange={set("hourlyCost")}
                                step={1}
                            />
                        </Field>
                        <Field label="Tarif énergie" unit="€ / kWh">
                            <NumberInput
                                value={v.energyRate}
                                onChange={set("energyRate")}
                                step={0.01}
                            />
                        </Field>
                        <Field label="Durée d'analyse" unit="ans">
                            <NumberInput
                                value={v.analysisYears}
                                onChange={set("analysisYears")}
                                step={1}
                                min={1}
                                max={15}
                            />
                        </Field>

                        <button className="tc-reset-link" onClick={reset}>
                            Réinitialiser les valeurs
                        </button>
                    </aside>

                    {/* MAIN */}
                    <main className="tc-main">
                        <h1 className="tc-hero">Un prix n'est pas un coût.</h1>
                        <p className="tc-hero-sub">
                            Décrivez l'achat que vous envisagez. TrueCost
                            calcule ce qu'il vous coûtera réellement sur la
                            durée et si ne rien faire ne coûterait pas plus
                            cher.
                        </p>

                        {/* 1. Decision */}
                        <section className="tc-section">
                            <p className="tc-section-label">1 · La décision</p>

                            <div
                                className="tc-field"
                                style={{ maxWidth: 420, marginBottom: 22 }}
                            >
                                <label>Intitulé</label>
                                <div className="tc-unit-row">
                                    <input
                                        type="text"
                                        className="tc-decision-name"
                                        value={v.decisionName}
                                        onChange={(e) =>
                                            set("decisionName")(e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <div className="tc-grid-fields">
                                <Field
                                    label="Prix d'achat"
                                    hint="Prix facturé par le fournisseur, hors installation."
                                    unit="€"
                                >
                                    <NumberInput
                                        value={v.price}
                                        onChange={set("price")}
                                        step={1000}
                                    />
                                </Field>
                                <Field
                                    label="Installation & mise en service"
                                    unit="€"
                                >
                                    <NumberInput
                                        value={v.install}
                                        onChange={set("install")}
                                        step={500}
                                    />
                                </Field>
                                <Field label="Formation des équipes" unit="€">
                                    <NumberInput
                                        value={v.training}
                                        onChange={set("training")}
                                        step={500}
                                    />
                                </Field>
                                <Field
                                    label="Maintenance annuelle"
                                    unit="€ / an"
                                >
                                    <NumberInput
                                        value={v.maintenance}
                                        onChange={set("maintenance")}
                                        step={500}
                                    />
                                </Field>
                                <Field
                                    label="Consommation énergie"
                                    hint="Multipliée par le tarif énergie de votre profil entreprise."
                                    unit="kWh / an"
                                >
                                    <NumberInput
                                        value={v.energyKwh}
                                        onChange={set("energyKwh")}
                                        step={1000}
                                    />
                                </Field>
                                <Field
                                    label="Arrêts estimés"
                                    hint="Multipliés par votre coût horaire chargé."
                                    unit="h / an"
                                >
                                    <NumberInput
                                        value={v.downtimeHours}
                                        onChange={set("downtimeHours")}
                                        step={5}
                                    />
                                </Field>

                                <div className="tc-divider-row">
                                    Financement — laissez à 0 % si l'achat est
                                    payé comptant
                                </div>

                                <Field label="Part financée" unit="%">
                                    <NumberInput
                                        value={v.financedShare}
                                        onChange={set("financedShare")}
                                        step={5}
                                        max={100}
                                    />
                                </Field>
                                <Field label="Taux d'emprunt" unit="% / an">
                                    <NumberInput
                                        value={v.loanRate}
                                        onChange={set("loanRate")}
                                        step={0.1}
                                    />
                                </Field>
                                <Field label="Durée d'emprunt" unit="ans">
                                    <NumberInput
                                        value={v.loanYears}
                                        onChange={set("loanYears")}
                                        step={1}
                                        min={1}
                                    />
                                </Field>
                            </div>
                        </section>

                        {/* 2. Scenario */}
                        <section className="tc-section">
                            <p className="tc-section-label">2 · Scénario</p>
                            <div
                                className="tc-scenario-toggle"
                                role="group"
                                aria-label="Choix du scénario"
                            >
                                {[
                                    ["pess", "Pessimiste"],
                                    ["real", "Réaliste"],
                                    ["opt", "Optimiste"],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        className={
                                            scenario === key ? "active" : ""
                                        }
                                        onClick={() => setScenario(key)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <p className="tc-scenario-caption">
                                {SCENARIO_TEXT[scenario]}
                            </p>
                        </section>

                        {/* 3. Results */}
                        <section className="tc-section">
                            <p className="tc-section-label">
                                3 · Coût total de possession
                            </p>

                            <div className="tc-headline-compare">
                                <div className="tc-compare-block">
                                    <div className="tc-k">Prix affiché</div>
                                    <div className="tc-v tc-muted">
                                        {fmt(v.price)}
                                    </div>
                                </div>
                                <div className="tc-compare-block">
                                    <div className="tc-k">
                                        Coût réel sur {years} ans
                                    </div>
                                    <div className="tc-v">
                                        {fmt(calc.total)}
                                    </div>
                                    <div className="tc-delta tc-up">
                                        soit {fmt(calc.total - v.price)} de plus
                                        que le prix affiché (+
                                        {fmtPct(calc.deltaPct)})
                                    </div>
                                </div>
                            </div>

                            <div className="tc-ledger">
                                {calc.rows.map((row, i) => (
                                    <div className="tc-ledger-row" key={i}>
                                        <span className="tc-label">
                                            {row.label}
                                            {row.sub && (
                                                <span className="tc-sub">
                                                    {row.sub}
                                                </span>
                                            )}
                                        </span>
                                        <span className="tc-val tc-num">
                                            {fmt(row.value)}
                                        </span>
                                    </div>
                                ))}
                                <div className="tc-ledger-row tc-total">
                                    <span className="tc-label">
                                        Coût total sur {years} ans
                                    </span>
                                    <span className="tc-val tc-num">
                                        {fmt(calc.total)}
                                    </span>
                                </div>
                            </div>

                            <details className="tc-assumptions">
                                <summary>
                                    Comment ce total est-il calculé ?
                                </summary>
                                <div>
                                    Coûts annuels supposés constants sur la
                                    période (hors inflation). Le financement est
                                    amorti de façon linéaire mensuelle. Scénario
                                    «{" "}
                                    {scenario === "pess"
                                        ? "pessimiste"
                                        : scenario === "opt"
                                          ? "optimiste"
                                          : "réaliste"}{" "}
                                    » : {SCENARIO_TEXT[scenario]}
                                </div>
                            </details>
                        </section>

                        {/* 4. Coût de ne rien faire */}
                        <section className="tc-section">
                            <p className="tc-section-label">
                                4 · Le coût de ne rien faire
                            </p>
                            <div className="tc-toggle-row">
                                <button
                                    className={
                                        "tc-switch" + (statusQuoOn ? " on" : "")
                                    }
                                    aria-pressed={statusQuoOn}
                                    onClick={() => setStatusQuoOn((s) => !s)}
                                />
                                <span className="tc-toggle-label">
                                    Comparer avec la situation actuelle (statu
                                    quo)
                                </span>
                            </div>

                            {statusQuoOn && calc.statusQuo && (
                                <div>
                                    <div
                                        className="tc-grid-fields"
                                        style={{ marginBottom: 22 }}
                                    >
                                        <Field
                                            label="Coût annuel de la situation actuelle"
                                            hint="Ce que coûte aujourd'hui la tâche, le processus ou l'équipement que cet achat remplacerait."
                                            unit="€ / an"
                                        >
                                            <NumberInput
                                                value={v.statusQuoCost}
                                                onChange={set("statusQuoCost")}
                                                step={1000}
                                            />
                                        </Field>
                                    </div>

                                    <div className="tc-metric-row">
                                        <div
                                            className={
                                                "tc-metric" +
                                                (calc.statusQuo.vanVal >= 0
                                                    ? " good"
                                                    : " warn")
                                            }
                                        >
                                            <div className="tc-m-label">
                                                VAN{" "}
                                                <span
                                                    className="tc-hint"
                                                    title="Valeur actuelle nette : somme des économies futures actualisées, moins l'investissement de départ."
                                                >
                                                    ?
                                                </span>
                                            </div>
                                            <div className="tc-m-val">
                                                {fmt(calc.statusQuo.vanVal)}
                                            </div>
                                            <div className="tc-m-note">
                                                Au taux d'actualisation de votre
                                                profil
                                            </div>
                                        </div>
                                        <div className="tc-metric">
                                            <div className="tc-m-label">
                                                TRI{" "}
                                                <span
                                                    className="tc-hint"
                                                    title="Taux de rendement interne : le taux auquel la VAN de ce projet devient nulle."
                                                >
                                                    ?
                                                </span>
                                            </div>
                                            <div className="tc-m-val">
                                                {isFinite(calc.statusQuo.triVal)
                                                    ? fmtPct(
                                                          calc.statusQuo.triVal,
                                                      )
                                                    : "—"}
                                            </div>
                                            <div className="tc-m-note">
                                                À comparer à votre coût du
                                                capital
                                            </div>
                                        </div>
                                        <div className="tc-metric">
                                            <div className="tc-m-label">
                                                Délai de retour actualisé
                                            </div>
                                            <div className="tc-m-val">
                                                {calc.statusQuo.payback === null
                                                    ? `> ${years} ans`
                                                    : calc.statusQuo.payback
                                                          .toFixed(1)
                                                          .replace(".", ",") +
                                                      " ans"}
                                            </div>
                                            <div className="tc-m-note">
                                                Économies actualisées cumulées
                                            </div>
                                        </div>
                                    </div>

                                    <p
                                        className="tc-footnote"
                                        style={{ marginTop: 14 }}
                                    >
                                        {calc.statusQuo.annualSavings >= 0
                                            ? `Ne rien faire coûterait environ ${fmt(
                                                  Math.abs(calc.statusQuo.gapH),
                                              )} de plus sur ${calc.statusQuo.horizon} ans que d'investir maintenant.`
                                            : `Investir coûte plus cher chaque année que la situation actuelle (${fmt(
                                                  Math.abs(
                                                      calc.statusQuo
                                                          .annualSavings,
                                                  ),
                                              )} de plus par an) : ce projet ne s'autofinance pas sur la période choisie.`}
                                    </p>

                                    <div className="tc-chart-wrap">
                                        <div className="tc-chart-legend">
                                            <span className="tc-item">
                                                <span
                                                    className="tc-swatch"
                                                    style={{
                                                        background:
                                                            "var(--tc-amber)",
                                                    }}
                                                />{" "}
                                                Ne rien faire (cumulé)
                                            </span>
                                            <span className="tc-item">
                                                <span
                                                    className="tc-swatch"
                                                    style={{
                                                        background:
                                                            "var(--tc-teal)",
                                                    }}
                                                />{" "}
                                                Investir (cumulé)
                                            </span>
                                        </div>
                                        <Chart
                                            statusQuoAnnual={v.statusQuoCost}
                                            investment={
                                                calc.statusQuo.investment
                                            }
                                            annualVariable={
                                                calc.statusQuo.annualVariable
                                            }
                                            years={years}
                                        />
                                    </div>
                                </div>
                            )}
                        </section>

                        <footer className="tc-actions">
                            <p className="tc-footnote">
                                Estimation fondée sur les hypothèses que vous
                                avez saisies. Elle n'engage pas TrueCost et ne
                                remplace pas l'avis de votre expert-comptable.
                            </p>
                            <button
                                className="tc-btn-primary"
                                onClick={() => window.print()}
                            >
                                Exporter en PDF
                            </button>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
}

// ---------- Scoped CSS ----------

const CSS = `
.truecost {
  --tc-paper: #F3F2ED;
  --tc-paper-raised: #FBFAF7;
  --tc-ink: #1C2321;
  --tc-ink-soft: #4B5450;
  --tc-line: #D8D4C6;
  --tc-line-strong: #B9B4A2;
  --tc-teal: #1F5C4F;
  --tc-teal-deep: #123B32;
  --tc-amber: #8A4B10;
  --tc-red: #7A2E2E;
  --tc-green-pos: #2F6B3D;

  font-family: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: var(--tc-ink);
  background: var(--tc-paper);
}

@media (prefers-color-scheme: dark) {
  .truecost {
    --tc-paper: #14181A;
    --tc-paper-raised: #1B211F;
    --tc-ink: #EDEAE1;
    --tc-ink-soft: #A8AFA9;
    --tc-line: #33392F;
    --tc-line-strong: #454C40;
    --tc-teal: #6FBBA4;
    --tc-teal-deep: #9FD7C4;
    --tc-amber: #D9A15C;
    --tc-red: #D98C8C;
    --tc-green-pos: #7FC98F;
  }
}

.truecost * { box-sizing: border-box; }
.truecost .tc-num, .truecost input[type="number"] {
  font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  font-variant-numeric: tabular-nums;
}
.truecost input, .truecost select, .truecost button { color: var(--tc-ink); font-family: inherit; font-size: inherit; }
.truecost *:focus-visible { outline: 2px solid var(--tc-teal); outline-offset: 2px; }

.tc-shell { max-width: 1180px; margin: 0 auto; padding: 28px 24px 64px; }

.tc-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;
  padding-bottom: 18px; border-bottom: 1px solid var(--tc-line-strong); margin-bottom: 28px; flex-wrap: wrap; }
.tc-wordmark { font-family: "Fraunces", Georgia, serif; font-weight: 600; font-size: 27px; letter-spacing: -0.01em; display: flex; align-items: baseline; gap: 10px; }
.tc-dot { color: var(--tc-teal); }
.tc-tagline { color: var(--tc-ink-soft); font-size: 13.5px; margin-top: 2px; }

.tc-company-field { display: flex; flex-direction: column; gap: 4px; min-width: 220px; }
.tc-company-field label { font-size: 11.5px; color: var(--tc-ink-soft); }
.tc-company-field input { border: none; border-bottom: 1px solid var(--tc-line-strong); background: transparent;
  font-family: "Fraunces", Georgia, serif; font-size: 17px; padding: 3px 2px; width: 240px; }
.tc-company-field input:focus { border-bottom-color: var(--tc-teal); }

.tc-layout { display: grid; grid-template-columns: 236px 1fr; gap: 40px; align-items: start; }
@media (max-width: 860px) { .tc-layout { grid-template-columns: 1fr; } .tc-sidebar { order: 2; } .tc-main { order: 1; } }

.tc-sidebar { position: sticky; top: 20px; padding-right: 4px; }
.tc-side-heading { font-size: 12px; color: var(--tc-ink-soft); margin: 0 0 4px; }
.tc-side-sub { font-size: 12.5px; color: var(--tc-ink-soft); margin: 0 0 16px; line-height: 1.45; }

.tc-field { margin-bottom: 14px; }
.tc-field label { display: flex; justify-content: space-between; gap: 6px; font-size: 12.5px; color: var(--tc-ink-soft); margin-bottom: 4px; }
.tc-unit-row { display: flex; align-items: center; border-bottom: 1px solid var(--tc-line-strong); padding-bottom: 2px; }
.tc-unit-row:focus-within { border-bottom-color: var(--tc-teal); }
.tc-unit-row input { border: none; background: transparent; font-size: 14.5px; width: 100%; padding: 3px 0; }
.tc-unit { font-size: 12px; color: var(--tc-ink-soft); white-space: nowrap; margin-left: 6px; }
.tc-decision-name { font-family: "Fraunces", serif; font-size: 16px; }
.tc-hint { color: var(--tc-line-strong); cursor: help; border-bottom: 1px dotted var(--tc-line-strong); }

.tc-reset-link { background: none; border: none; color: var(--tc-ink-soft); font-size: 12.5px; text-decoration: underline; padding: 0; margin-top: 6px; cursor: pointer; }

.tc-section { margin-bottom: 40px; }
.tc-section-label { font-size: 12px; color: var(--tc-ink-soft); margin: 0 0 14px; }

.tc-hero { font-family: "Fraunces", Georgia, serif; font-weight: 500; font-size: 27px; line-height: 1.25; margin: 0 0 8px; max-width: 30ch; }
.tc-hero-sub { color: var(--tc-ink-soft); max-width: 56ch; margin: 0 0 28px; }

.tc-grid-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px 24px; }
@media (max-width: 700px) { .tc-grid-fields { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 460px) { .tc-grid-fields { grid-template-columns: 1fr; } }
.tc-divider-row { grid-column: 1 / -1; border-top: 1px solid var(--tc-line); margin-top: 4px; padding-top: 16px; font-size: 12px; color: var(--tc-ink-soft); }

.tc-scenario-toggle { display: inline-flex; border: 1px solid var(--tc-line-strong); margin: 4px 0; }
.tc-scenario-toggle button { background: transparent; border: none; padding: 8px 16px; font-size: 13.5px; color: var(--tc-ink-soft); border-right: 1px solid var(--tc-line-strong); cursor: pointer; }
.tc-scenario-toggle button:last-child { border-right: none; }
.tc-scenario-toggle button.active { background: var(--tc-teal); color: var(--tc-paper-raised); }
.tc-scenario-caption { font-size: 12px; color: var(--tc-ink-soft); margin: 8px 0 0; max-width: 60ch; }

.tc-ledger { border-top: 1px solid var(--tc-line-strong); border-bottom: 1px solid var(--tc-line-strong); }
.tc-ledger-row { display: flex; justify-content: space-between; align-items: baseline; padding: 9px 0; border-bottom: 1px solid var(--tc-line); gap: 12px; }
.tc-ledger-row:last-child { border-bottom: none; }
.tc-ledger-row .tc-label { color: var(--tc-ink-soft); font-size: 14px; }
.tc-ledger-row .tc-sub { display: block; font-size: 11.5px; color: var(--tc-line-strong); margin-top: 1px; }
.tc-ledger-row .tc-val { font-size: 14.5px; white-space: nowrap; }
.tc-ledger-row.tc-total { padding-top: 14px; border-top: 1px solid var(--tc-line-strong); margin-top: 4px; }
.tc-ledger-row.tc-total .tc-label { color: var(--tc-ink); font-family: "Fraunces", Georgia, serif; font-size: 16px; }
.tc-ledger-row.tc-total .tc-val { font-family: "Fraunces", Georgia, serif; font-size: 20px; }

.tc-headline-compare { display: flex; gap: 32px; margin: 22px 0 26px; flex-wrap: wrap; }
.tc-compare-block { min-width: 160px; }
.tc-k { font-size: 12px; color: var(--tc-ink-soft); margin-bottom: 4px; }
.tc-v { font-family: "Fraunces", Georgia, serif; font-size: 30px; line-height: 1; }
.tc-v.tc-muted { color: var(--tc-ink-soft); font-size: 22px; }
.tc-delta { font-size: 12.5px; margin-top: 5px; }
.tc-delta.tc-up { color: var(--tc-red); }
.tc-delta.tc-down { color: var(--tc-green-pos); }

.tc-metric-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 18px 0 6px; }
@media (max-width: 640px) { .tc-metric-row { grid-template-columns: 1fr; } }
.tc-metric { border: 1px solid var(--tc-line); padding: 14px 16px; background: var(--tc-paper-raised); }
.tc-m-label { font-size: 12px; color: var(--tc-ink-soft); display: flex; justify-content: space-between; }
.tc-m-val { font-family: "Fraunces", Georgia, serif; font-size: 24px; margin-top: 6px; }
.tc-m-note { font-size: 11.5px; color: var(--tc-ink-soft); margin-top: 4px; }
.tc-metric.warn .tc-m-val { color: var(--tc-amber); }
.tc-metric.good .tc-m-val { color: var(--tc-green-pos); }

.tc-chart-wrap { border: 1px solid var(--tc-line); background: var(--tc-paper-raised); padding: 18px 18px 10px; margin-top: 8px; }
.tc-chart-legend { display: flex; gap: 20px; font-size: 12.5px; color: var(--tc-ink-soft); margin-bottom: 10px; flex-wrap: wrap; }
.tc-item { display: flex; align-items: center; gap: 6px; }
.tc-swatch { width: 11px; height: 11px; display: inline-block; }

.tc-toggle-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.tc-switch { position: relative; width: 38px; height: 21px; background: var(--tc-line-strong); border: none; padding: 0; cursor: pointer; }
.tc-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; background: var(--tc-paper-raised); transition: transform .15s ease; }
.tc-switch.on { background: var(--tc-teal); }
.tc-switch.on::after { transform: translateX(17px); }
.tc-toggle-label { font-size: 13.5px; }

.tc-assumptions { font-size: 12px; color: var(--tc-ink-soft); margin-top: 10px; line-height: 1.6; }
.tc-assumptions summary { cursor: pointer; color: var(--tc-ink-soft); font-size: 12.5px; margin-bottom: 6px; }

.tc-actions { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; border-top: 1px solid var(--tc-line); flex-wrap: wrap; gap: 12px; }
.tc-btn-primary { background: var(--tc-teal); color: var(--tc-paper-raised); border: none; padding: 11px 22px; font-size: 14px; cursor: pointer; }
.tc-btn-primary:hover { background: var(--tc-teal-deep); }
.tc-footnote { font-size: 12px; color: var(--tc-ink-soft); max-width: 46ch; }

@media print {
  .tc-sidebar, .tc-actions, .tc-scenario-caption { display: none; }
  .tc-layout { grid-template-columns: 1fr; }
}
`;
