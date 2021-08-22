export default class DisjoinedSet {
    private disjoints = new Map<number, number>();

    constructor(numItems: number) {
        for (let i = 0; i < numItems; i++) {
            this.disjoints.set(i, -1);
        }
    }

    connect(idxA: number, idxB: number) {
        this.disjoints.set(idxB, idxA);
    }

    getParent(key: number) {
        let lastParentIdx = key;
        let parentIdx = this.disjoints.get(key)!;
        while (parentIdx >= 0) {
            lastParentIdx = parentIdx;
            parentIdx = this.disjoints.get(parentIdx)!;
        }
        return lastParentIdx;
    }

    /**
     * Returns an array of groups. Where each group is a set of idxs that have been set together.
     * for example: 0 -> 1, 1 -> 2, 3 -> 4. Then [[0, 1, 2], [3, 4]].
     */
    getDisjoinetedGroups() {
        const groups = new Map<number, number[]>();
        for (let key of Array.from(this.disjoints.keys())) {
            const parentKey = this.getParent(key);
            if (!groups.has(parentKey)) {
                groups.set(parentKey, []);
            }
            groups.get(parentKey)!.push(key);
        }
        return Array.from(groups.values());
    }
}

