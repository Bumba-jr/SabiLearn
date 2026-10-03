// Collapses text that was accidentally saved multiple times in a row
// (an old draft-restore bug duplicated whole bios in the database, often
// without sentence punctuation and truncated mid-repeat by the bio length
// limit, e.g. "A A A" or "A A A-part"). Unique text is left untouched.
const MIN_UNIT_LENGTH = 16; // a real repeated sentence/paragraph, not "hahaha"

export function dedupeRepeatedText(text: string | null | undefined): string {
    if (!text) return '';
    const normalized = text.replace(/\s+/g, ' ').trim();
    const { length } = normalized;
    if (length < MIN_UNIT_LENGTH * 2) return normalized;

    // Find the shortest unit U where the whole text is U repeated
    // (possibly with a truncated final copy): every char matches U[i % U.length].
    for (let unitLen = MIN_UNIT_LENGTH; unitLen <= length / 2; unitLen++) {
        let isRepetition = true;
        for (let i = unitLen; i < length; i++) {
            if (normalized[i] !== normalized[i % unitLen]) {
                isRepetition = false;
                break;
            }
        }
        if (isRepetition) return normalized.slice(0, unitLen).trim();
    }

    return normalized;
}
