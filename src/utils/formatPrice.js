// si le chiffre appartient au millier , centaine de millier...ect

function restOfStringfrom(string, sliceNumber) {
    if (sliceNumber > 0) {
        return string.slice(sliceNumber);
    }
}

export function formatPrice(aValue) {
    if (aValue.length <= 0) return;

    if (typeof aValue === "number") {
        let numberConverted = convertToString(aValue);

        return checkNumberPart(numberConverted);
    } else {
        return checkNumberPart(aValue);
    }
}

function checkNumberPart(aValue) {
    switch (aValue.length) {
        case 4:
            return (
                aValue.slice(0, aValue.length - 3) +
                " " +
                restOfStringfrom(aValue, 1)
            );
        case 5:
            return (
                aValue.slice(0, aValue.length - 3) +
                " " +
                restOfStringfrom(aValue, 2)
            );
        case 6:
            return (
                aValue.slice(0, aValue.length - 3) +
                " " +
                restOfStringfrom(aValue, 3)
            );

        case 7:
            return (
                aValue.slice(0, aValue.length - 6) + //[0,1[
                " " +
                aValue.slice(1, aValue.length - 3) +
                " " +
                restOfStringfrom(aValue, 4)
            );
        case 8:
            return (
                aValue.slice(0, aValue.length - 6) +
                " " +
                aValue.slice(1, aValue.length - 3) +
                " " +
                restOfStringfrom(aValue, 4)
            );
        case 9:
            return (
                aValue.slice(0, aValue.length - 6) +
                " " +
                aValue.slice(1, aValue.length - 3) +
                " " +
                restOfStringfrom(aValue, 4)
            );
        default:
            //gére les nombre plus grand
            /* en pratique on sépare les chiffre d'un nombre par 3 
            en partant de la fin*/
            TODO: console.log("billionnaire?");
            break;
    }
}

function convertToString(aNumber) {
    return String(aNumber);
}

export function formatpriceTo(value, localisation) {
    return Math.round(value).toLocaleString(localisation) + "";
}

export function getCurrencySymbol(currencyCode) {
    return new Intl.NumberFormat("en", {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "narrowSymbol",
    })
        .formatToParts(0)
        .find((part) => part.type === "currency").value;
}

export const currencyTYpe = {
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    JPY: "JPY",
};

export const currencyLocation = {
    USD: "en-US",
    EUR: "fr-FR",
    GBP: "en-GB",
    JPY: "ja-JP",
};
