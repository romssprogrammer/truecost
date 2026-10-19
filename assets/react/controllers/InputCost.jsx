import { useState } from "react";

export default function InputCost({ costData, costvalue, onChange }) {
    function isValuePositif(aValue) {
        return aValue === "" || Number(aValue) >= 0;
    }
    return (
        <>
            <input
                onChange={(e) => {
                    if (!isValuePositif(e.target.value)) return;
                    onChange(
                        costData.id,
                        e.target.value === "" ? "" : Number(e.target.value),
                    );
                }}
                type="number"
                id={costData.id}
                value={costvalue ?? costData.value}
                step="50"
                data-cost
            />
        </>
    );
}
