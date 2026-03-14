/**
 * CHALLENGE 1: Single Technician — Shortest Route
 *
 * A technician starts at a known GPS location and must visit every broken
 * box exactly once. Your goal is to find the shortest possible total travel
 * distance.
 *
 * Scoring:
 *   - Correctness  — every box visited exactly once, distance is accurate.
 *   - Route quality — your total distance is compared against other teams;
 *                     shorter routes score higher on the load tests.
 *
 * Do NOT modify any interface or the pre-implemented helper methods.
 * Implement every method marked with TODO.
 */

export interface Location {
    latitude: number;   // decimal degrees
    longitude: number;  // decimal degrees
}

export interface Box {
    id: string;
    name: string;
    location: Location;
}

export interface Technician {
    id: string;
    name: string;
    startLocation: Location;
}

export interface RouteResult {
    technicianId: string;
    /** Ordered list of box IDs. Every box must appear exactly once. */
    route: string[];
    /** Total travel distance in km. Does NOT include a return leg to start. */
    totalDistanceKm: number;
}

export class RouteOptimizer {

    // ── Pre-implemented helper — do not modify ────────────────────────────────

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

    // ── Your implementation below ─────────────────────────────────────────────

    calculateRouteDistance(
        technician: Technician,
        boxes: Box[],
        routeIds: string[]
    ): number | null {
        // If we don't visit any boxes, the technician never leaves home.
        if (routeIds.length === 0) {
            return 0;
        }

        // Keep a quick lookup from box id to its data.
        const boxMap = new Map<string, Box>(boxes.map((b) => [b.id, b]));

        let totalDistance = 0;
        let currentLocation: Location = technician.startLocation;
        const visited = new Set<string>();

        for (const id of routeIds) {
            const box = boxMap.get(id);
            if (!box) {
                // If the route mentions a box we don't know about, bail out.
                return null;
            }

            // If we loop over the same ID again, don't double‑charge the distance.
            if (!visited.has(id)) {
                const dist = this.haversineDistance(currentLocation, box.location);
                totalDistance += dist;
                currentLocation = box.location;
                visited.add(id);
            }
        }

        return totalDistance;
    }

    findShortestRoute(technician: Technician, boxes: Box[]): RouteResult {
        // No broken boxes today: nothing to plan.
        if (boxes.length === 0) {
            return {
                technicianId: technician.id,
                route: [],
                totalDistanceKm: 0,
            };
        }

        // With only one box, the "shortest route" is obvious.
        if (boxes.length === 1) {
            const only = boxes[0];
            const distance = this.calculateRouteDistance(
                technician,
                boxes,
                [only.id]
            ) ?? 0;

            return {
                technicianId: technician.id,
                route: [only.id],
                totalDistanceKm: distance,
            };
        }

        // Greedy nearest‑neighbour:
        // from wherever we are, walk to the closest unvisited box next.
        // When two options are equally far, pick the one with the smaller ID
        // so the result is deterministic.
        const unvisited = new Set<string>(boxes.map((b) => b.id));
        const boxMap = new Map<string, Box>(boxes.map((b) => [b.id, b]));
        let currentLocation: Location = technician.startLocation;
        const route: string[] = [];

        while (unvisited.size > 0) {
            let bestId: string | null = null;
            let bestDistance = Infinity;

            for (const id of unvisited) {
                const box = boxMap.get(id)!;
                const dist = this.haversineDistance(currentLocation, box.location);

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

        const totalDistance =
            this.calculateRouteDistance(technician, boxes, route) ?? 0;

        return {
            technicianId: technician.id,
            route,
            totalDistanceKm: totalDistance,
        };
    }
}
