export const costsByCategory = {
    voiture: [
        { id: "assurance", label: "Assurance", type: "hide", value: 900 },
        { id: "entretien", label: "Entretien", type: "direct", value: 700 },
        // ...
    ],
    logement: [
        {
            id: "chargesCopro",
            label: "Charges de copropriété",
            type: "direct",
            value: 2400,
        },
        {
            id: "taxeFonciere",
            label: "Taxe foncière",
            type: "hide",
            value: 1200,
        },
        // ...
    ],
};
