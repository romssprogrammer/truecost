import React from "react";

import { useState, useMemo } from "react";
import {
    currencyLocation,
    getCurrencySymbol,
    formatpriceTo,
    currencyTYpe,
} from "../../../src/utils/formatPrice";
import { BrowserRouter, Link } from "react-router";
import HeaderTrueCost from "./HeaderTrueCost";
import CostList from "./CostList";
import { costsList } from "../data/costList";
import { sum } from "../data/calculatorDebug";
async function fetchCostlist() {
    const costInput = await fetch("");
}

function priceDeductionFromRealPrice(aRealCost, aPrice) {
    return aRealCost ? aRealCost - aPrice : 0;
}

/**
 * Formulaire "coût réel" d'une décision d'achat (walking skeleton TrueCost).
 * Toutes les props sont optionnelles — le composant fonctionne seul avec des valeurs par défaut.
 *
 * @param {string} title - Titre affiché en haut du formulaire
 * @param {number} initialPrice - Prix d'achat initial
 * @param {number} initialDuration - Durée de détention initiale (années)
 * @param {Array}  initialCosts - Liste des postes de coût [{ id, label, icon, value }]
 * @param {(result: { price:number, duration:number, costs:object, total:number }) => void} onChange
 *        Appelé à chaque recalcul avec le résultat courant (utile pour brancher l'API Symfony plus tard)
 */

export default function TrueCostForm({
    title = "Acheter cette voiture",
    initialPrice = 30000,
    initialDuration = 5,
    initialCosts = costsList,
}) {
    const initialValue = 0;
    const [currency, setCurrency] = useState("USD");
    const [price, setPrice] = useState(initialPrice);
    const [duration, setDuration] = useState(initialDuration);
    const [costs, setCosts] = useState(initialCosts);
    const [realCost, setRealCost] = useState(0);
    const [costValues, setCostValues] = useState(() =>
        Object.fromEntries(costsList.map((c) => [c.id, c.value])),
    );
    const [shownPrice, setshownPrice] = useState();

    const handleCurrencyChange = (event) => {
        setCurrency(event.target.value);
    };

    function handleDurationChange(value) {
        setDuration(value);
    }

    function handleCostChange(id, value) {
        setCostValues((previousValue) => {
            return { ...previousValue, [id]: value };
        });
    }

    function handlePurchasePrice(value) {
        // /!\ new render for each setPrice execution
        setPrice(value);
    }

    //TODO: REAL SUBMIT TO USE
    async function handleSubmit(e) {
        e.preventDefault(); // empêche le rechargement natif
        const payload = {
            prix,
            duree,
            costs: costsList.map((c) => ({
                label: c.label,
                montantAnnuel: Number(costValues[c.id]) || 0,
            })),
        };

        const res = await fetch("/api/scenarios/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const result = await res.json();
        setResult(result);
    }

    // DEBUG
    function handleSubmitDebug(e) {
        e.preventDefault();
        const payload = submitDebug();
        let result = updateCostlistObject();
        console.log(result);
        //TODO: envoyer payload à Symfony ici
    }

    function submitDebug() {
        setRealCost(price + sum(Object.values(costValues)) * duration);
        const payload = {
            price: price,
            duration: duration,
            costs: costsList.map((c) => ({
                label: c.label,
                montantAnnuel: Number(costValues[c.id]) || 0,
            })),
            real_cost: realCost,
        };

        return payload;
    }

    function updateCostlistObject() {
        setCosts((previousValue) => {
            return { ...previousValue, value: costs };
        });
    }
    // const { additionalTotal, total } = useMemo(() => {
    //     const perYear = costs.reduce(
    //         (sum, currentValue) => sum + (Number(currentValue.value) || 0),
    //         initialValue,
    //     );
    //     const additionalTotal = perYear * (Number(duration) || 0);
    //     const total = (Number(price) || 0) + additionalTotal;
    //     return { additionalTotal, total };
    // }, [price, duration, costs]);

    return (
        <div>
            <HeaderTrueCost
                currencyValue={currency}
                onCurrencyChange={handleCurrencyChange}
            />
            <div class="wrap">
                <div class="intro">
                    <h2>
                        {`« Est ce que je peux me permettre cette voiture à ${formatpriceTo(price, currencyLocation[currency])} ${getCurrencySymbol(currency)} ? »`}
                    </h2>
                    <p>
                        Le prix affiché n'est jamais le coût réel. Configurez
                        votre décision ci-dessous.
                    </p>
                </div>

                <div class="categories">
                    <div class="cat-btn active ">🚗 Voiture</div>
                    <div class="cat-btn">🏠 Logement</div>
                    <div class="cat-btn">💻 Équipement</div>
                    <div class="cat-btn">✈️ Abonnement</div>

                    <a href="/machine_pme" className="cat-btn">
                        🏢 Machine PME
                    </a>
                </div>

                {/* <!-- FORM --> */}
                <form onSubmit={handleSubmitDebug}>
                    <div class=" card ">
                        <div class="card-label">Votre décision</div>
                        <div class="row2">
                            <div class="field">
                                <label>Prix d'achat (€)</label>
                                <input
                                    type="number"
                                    id="prix"
                                    value={price}
                                    step="500"
                                    onChange={(e) =>
                                        handlePurchasePrice(
                                            e.target.value === ""
                                                ? ""
                                                : Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                            <div class="field">
                                <label>Durée de projection (ans)</label>
                                <input
                                    type="number"
                                    id="duree"
                                    value={duration}
                                    min="1"
                                    max="15"
                                    onChange={(e) => {
                                        handleDurationChange(
                                            e.target.value === ""
                                                ? ""
                                                : Number(e.target.value),
                                        );
                                    }}
                                />
                            </div>
                        </div>

                        <div class="card-label">Postes de coût annuels</div>

                        {/* CostList  */}
                        <CostList
                            costList={costsList}
                            values={costValues}
                            onCostChange={handleCostChange}
                        />
                    </div>
                    <button
                        type="submit"
                        className="calc-btn mb-8 rounded-full items-center justify-center bg-blue-500 p-5"
                    >
                        Calculer
                    </button>
                </form>
                {/* <!-- REVEAL --> */}
                <div class="reveal">
                    <div class="price-shown">
                        Ce que vous regardez :{" "}
                        <b id="shownPrice">
                            {price
                                ? formatpriceTo(
                                      price,
                                      currencyLocation[currency],
                                  )
                                : 0}{" "}
                            {getCurrencySymbol(currency)}
                        </b>
                    </div>
                    <div class="arrow">↓</div>
                    <div class="real-label">
                        Ce que ça vous coûte réellement
                    </div>
                    <div class="real-cost" id="realCost">
                        {realCost
                            ? formatpriceTo(
                                  realCost,
                                  currencyLocation[currency],
                              )
                            : 0}
                        {getCurrencySymbol(currency)}
                    </div>
                    <div class="delta" id="delta">
                        soit{" "}
                        {formatpriceTo(
                            priceDeductionFromRealPrice(realCost, price),
                            currencyLocation[currency],
                        )}
                        {getCurrencySymbol(currency) + " "} de plus que le prix
                        affiché
                    </div>

                    <div class="breakdown">
                        <div class="breakdown-col">
                            <h4>Coûts directs</h4>
                            <div id="directList"></div>
                        </div>
                        <div class="breakdown-col">
                            <h4>Coûts cachés</h4>
                            <div id="hiddenList"></div>
                        </div>
                    </div>
                </div>

                {/* <!-- COMPARISON --> */}
                <div class="section-title">Et si vous faisiez autrement ?</div>
                <div class="compare-grid" id="compareGrid"></div>
                <div class="savings-banner" id="savingsBanner"></div>
            </div>
        </div>
    );
}
