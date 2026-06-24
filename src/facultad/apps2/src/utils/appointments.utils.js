class AppointmentsUtils {
    getRandomItem(items) {
        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * items.length);
        return items[randomIndex];
    }
}

module.exports = { AppointmentsUtils };