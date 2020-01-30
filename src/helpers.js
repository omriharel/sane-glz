export const getStored = (key) => {
    let item = localStorage.getItem(key);

    return item ? JSON.parse(item) : null;
}

export const store = (key, item) => {
    localStorage.setItem(key, JSON.stringify(item));
}
