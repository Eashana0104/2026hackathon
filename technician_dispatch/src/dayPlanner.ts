/**
 * CHALLENGE 2: Single Technician — Maximum Boxes in a Working Day
 *
 * A technician has a fixed number of working minutes today. Each box has a
 * GPS location and a repair time. Travelling between locations also burns
 * time. Your goal: choose WHICH boxes to visit and in WHAT ORDER to maximise
 * the number of boxes fixed before time runs out.
 *
 * The key insight — the closest box is NOT always the best choice:
 *   A nearby box with a long fix time can consume all remaining budget,
 *   whereas skipping it might let you fix two or three faster boxes instead.
 *   Your algorithm must weigh travel time against fix time to make the right call.
 *
 * Do NOT modify any interface or the pre-implemented helper methods.
 * Implement every method marked with TODO.
 */

export interface Location {
    latitude: number;
    longitude: number;
}

export interface Box {
    id: string;
    name: string;
    location: Location;
    /** Minutes needed to fully repair this box once the technician arrives. */
    fixTimeMinutes: number;
}

export interface Technician {
    id: string;
    name: string;
    startLocation: Location;
    speedKmh: number;
    workingMinutes: number;
}

export interface DayPlanResult {
    technicianId: string;
    /** Ordered list of box IDs visited today. Every box must be fully completed. */
    plannedRoute: string[];
    /** Total minutes used (travel + all fix times). Must be ≤ workingMinutes. */
    totalTimeUsedMinutes: number;
    /** Equal to plannedRoute.length. */
    boxesFixed: number;
    /** Every box NOT in plannedRoute. */
    skippedBoxIds: string[];
}

export class DayPlanner {

    // ── Pre-implemented helpers — do not modify ───────────────────────────────

    /**
     * Returns the great-circle distance in kilometres between two GPS
     * coordinates using the Haversine formula (Earth radius = 6 371 km).
     */
    haversineDistance(loc1: Location, loc2: Location): number {
        const R = 6371;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const dLat = toRad(loc2.latitude  - loc1.latitude);
        const dLng = toRad(loc2.longitude - loc1.longitude);
        const lat1 = toRad(loc1.latitude);
        const lat2 = toRad(loc2.latitude);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Returns the travel time in minutes between two locations at a given speed.
     *   travelTimeMinutes = (distanceKm / speedKmh) × 60
     */
    travelTimeMinutes(loc1: Location, loc2: Location, speedKmh: number): number {
        return (this.haversineDistance(loc1, loc2) / speedKmh) * 60;
    }

    // ── Your implementation below ─────────────────────────────────────────────

    calculateRouteDuration(
        technician: Technician,
        boxes: Box[],
        routeIds: string[]
    ): number | null {
        // No planned stops means we spend no time on the road.
        if (routeIds.length === 0) {
            return 0;
        }

        if (boxes.length === 0) {
            return null;
        }

        const boxMap = new Map<string, Box>(boxes.map((b) => [b.id, b]));

        // Keep track of how long the technician has been busy so far.
        let totalMinutes = 0;
        let currentLocation: Location = technician.startLocation;

        for (const id of routeIds) {
            const box = boxMap.get(id);
            if (!box) {
                return null;
            }

            const travel = this.travelTimeMinutes(
                currentLocation,
                box.location,
                technician.speedKmh
            );

            totalMinutes += travel + box.fixTimeMinutes;
            currentLocation = box.location;
        }

        return totalMinutes;
    }

    planDay(technician: Technician, boxes: Box[]): DayPlanResult {
        // If there are no boxes, the technician's day is empty but valid.
        if (boxes.length === 0) {
            return {
                technicianId: technician.id,
                plannedRoute: [],
                totalTimeUsedMinutes: 0,
                boxesFixed: 0,
                skippedBoxIds: [],
            };
        }

        const workingLimit = technician.workingMinutes;

        // Given a chosen subset of boxes, build a route that keeps travel
        // short by always walking to the nearest unvisited box next.
        const buildGreedyRoute = (selected: Box[]): string[] => {
            if (selected.length === 0) return [];

            const boxMap = new Map<string, Box>(selected.map((b) => [b.id, b]));
            const unvisited = new Set<string>(selected.map((b) => b.id));

            let currentLocation: Location = technician.startLocation;
            const route: string[] = [];

            while (unvisited.size > 0) {
                let bestId: string | null = null;
                let bestDistance = Infinity;

                for (const id of unvisited) {
                    const box = boxMap.get(id)!;
                    const dist = this.haversineDistance(
                        currentLocation,
                        box.location
                    );

                    if (
                        dist < bestDistance ||
                        (dist === bestDistance && bestId !== null && id < bestId)
                    ) {
                        bestDistance = dist;
                        bestId = id;
                    }
                }

                if (bestId === null) {
                    break;
                }

                route.push(bestId);
                const box = boxMap.get(bestId)!;
                currentLocation = box.location;
                unvisited.delete(bestId);
            }

            return route;
        };

        // First guess which boxes are "cheap" to handle:
        // approximate cost = travel from start + fix time. When two boxes cost
        // about the same, sort by ID so the behaviour stays predictable.
        const sortedCandidates = [...boxes].sort((a, b) => {
            const travelA = this.travelTimeMinutes(
                technician.startLocation,
                a.location,
                technician.speedKmh
            );
            const travelB = this.travelTimeMinutes(
                technician.startLocation,
                b.location,
                technician.speedKmh
            );

            const costA = travelA + a.fixTimeMinutes;
            const costB = travelB + b.fixTimeMinutes;

            if (costA !== costB) {
                return costA - costB;
            }

            return a.id.localeCompare(b.id);
        });

        let selected: Box[] = [];
        let bestRoute: string[] = [];
        let bestDuration = 0;

        for (const candidate of sortedCandidates) {
            const tentative = [...selected, candidate];
            const tentativeRoute = buildGreedyRoute(tentative);
            const duration = this.calculateRouteDuration(
                technician,
                boxes,
                tentativeRoute
            );

            if (duration !== null && duration <= workingLimit) {
                selected = tentative;
                bestRoute = tentativeRoute;
                bestDuration = duration;
            }
        }

        const plannedRoute = bestRoute;
        const totalTimeUsedMinutes = bestDuration;
        const plannedSet = new Set(plannedRoute);
        const skippedBoxIds = boxes
            .map((b) => b.id)
            .filter((id) => !plannedSet.has(id));

        return {
            technicianId: technician.id,
            plannedRoute,
            totalTimeUsedMinutes,
            boxesFixed: plannedRoute.length,
            skippedBoxIds,
        };
    }
}
