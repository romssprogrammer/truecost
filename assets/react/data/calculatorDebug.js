export function sum(anArray = []) {
    return anArray.reduce(
        (accumulator, currentValue) =>
            Number(accumulator) + Number(currentValue),
        0,
    );
}
