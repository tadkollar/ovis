/**
 * Finds the max in a set
 *
 * @param {[Number]} dataset
 */
function max(dataset) {
    let cur = Number.MIN_VALUE;
    for (let i = 0; i < dataset.length; ++i) {
        let num = Number(dataset[i]);
        if (num > cur) {
            cur = num;
        }
    }

    return cur;
}

/**
 * Finds the min in a set
 * @param {[Number]} dataset
 */
function min(dataset) {
    let cur = Number.MAX_VALUE;
    for (let i = 0; i < dataset.length; ++i) {
        let num = Number(dataset[i]);
        if (num < cur) {
            cur = num;
        }
    }

    return cur;
}
