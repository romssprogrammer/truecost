import { useState } from "react";
import InputCost from "./InputCost";

export default function CostList({ costList, values, onCostChange }) {
    const TAGDIRECT = "direct";
    const TAGHIDDEN = "caché";

    return (
        <div className="cost-list" id="costList">
            {costList.map((cost) => {
                return (
                    <div className="cost-row" key={cost.id}>
                        <span className="name">{cost.label}</span>
                        <span className={`tag ${cost.type}`}>
                            {cost.type === TAGDIRECT ? TAGDIRECT : TAGHIDDEN}
                        </span>
                        <InputCost
                            costData={cost}
                            costvalue={values?.[cost.id]}
                            onChange={onCostChange}
                        />
                        <span className="unit">€/an</span>
                    </div>
                );
            })}
        </div>
    );
}
