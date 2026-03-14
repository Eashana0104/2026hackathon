/**
 * CHALLENGE 3: Minimum Technicians — Fix All Boxes Within a Deadline
 *
 * All boxes must be repaired within deadlineMinutes. All technicians start
 * from the SAME location. Each box is assigned to exactly one technician
 * (no overlapping). Your goal: find the MINIMUM number of technicians needed
 * so that every technician finishes all their assigned boxes on time.
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
    /** Minutes needed to fully repair this box. */
    fixTimeMinutes: number;
}

export interface TechnicianAssignment {
    /** Label for this technician, e.g. "Technician 1", "Technician 2", … */
    technicianLabel: string;
    /** Ordered list of box IDs this technician will visit and fix. */
    assignedBoxIds: string[];
    /** Total time used (travel + fix). Must be ≤ deadlineMinutes. */
    totalTimeMinutes: number;
}

export interface TeamSizeResult {
    /** Minimum number of technicians needed. Equals assignments.length. */
    techniciansNeeded: number;
    /** One entry per technician. No box ID appears in more than one entry. */
    assignments: TechnicianAssignment[];
    /** True when all boxes are assigned and every technician finishes on time. */
    feasible: boolean;
}

export class TeamSizer {

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

    calculateAssignmentDuration(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
        routeIds: string[]
    ): number | null {
        // If this technician has no boxes, they don't spend any time.
        if (routeIds.length === 0) {
            return 0;
        }

        if (boxes.length === 0) {
            return null;
        }

        const boxMap = new Map<string, Box>(boxes.map((b) => [b.id, b]));

        // Track the running total of travel + fix time for this technician.
        let totalMinutes = 0;
        let currentLocation: Location = startLocation;

        for (const id of routeIds) {
            const box = boxMap.get(id);
            if (!box) {
                return null;
            }

            const travel = this.travelTimeMinutes(
                currentLocation,
                box.location,
                speedKmh
            );

            totalMinutes += travel + box.fixTimeMinutes;
            currentLocation = box.location;
        }

        return totalMinutes;
    }

    tryAssign(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
        numTechnicians: number,
        deadlineMinutes: number
    ): TechnicianAssignment[] | null {
        // If there is no work, we still return one entry per technician with nothing to do.
        if (boxes.length === 0) {
            return Array.from({ length: numTechnicians }, (_, i) => ({
                technicianLabel: `Technician ${i + 1}`,
                assignedBoxIds: [],
                totalTimeMinutes: 0,
            }));
        }

        // Start with the heaviest boxes (longest fixes, then farthest away)
        // so we don’t get stuck with an impossible leftover job at the end.
        const boxesSorted = [...boxes].sort((a, b) => {
            if (b.fixTimeMinutes !== a.fixTimeMinutes) {
                return b.fixTimeMinutes - a.fixTimeMinutes;
            }
            const distA = this.haversineDistance(startLocation, a.location);
            const distB = this.haversineDistance(startLocation, b.location);
            return distB - distA;
        });

        const assignments: TechnicianAssignment[] = Array.from(
            { length: numTechnicians },
            (_, i) => ({
                technicianLabel: `Technician ${i + 1}`,
                assignedBoxIds: [],
                totalTimeMinutes: 0,
            })
        );

        // Remember where each technician last finished so we can price new travel correctly.
        const lastLocation: Location[] = Array.from(
            { length: numTechnicians },
            () => ({ ...startLocation })
        );

        for (const box of boxesSorted) {
            let bestTech = -1;
            let bestAddedTime = Infinity;
            let bestNewTotal = Infinity;

            for (let i = 0; i < numTechnicians; i++) {
                const currentLoc = lastLocation[i];
                const travel = this.travelTimeMinutes(
                    currentLoc,
                    box.location,
                    speedKmh
                );
                const added = travel + box.fixTimeMinutes;
                const newTotal = assignments[i].totalTimeMinutes + added;

                if (newTotal <= deadlineMinutes + 1e-6) {
                    if (
                        added < bestAddedTime ||
                        (added === bestAddedTime && newTotal < bestNewTotal)
                    ) {
                        bestAddedTime = added;
                        bestNewTotal = newTotal;
                        bestTech = i;
                    }
                }
            }

            if (bestTech === -1) {
                // If nobody can take this box without blowing their budget, the plan fails.
                return null;
            }

            assignments[bestTech].assignedBoxIds.push(box.id);
            assignments[bestTech].totalTimeMinutes += bestAddedTime;
            lastLocation[bestTech] = { ...box.location };
        }

        return assignments;
    }

    findMinimumTeamSize(
        startLocation: Location,
        speedKmh: number,
        boxes: Box[],
        deadlineMinutes: number
    ): TeamSizeResult {
        // With no boxes, we need no technicians and everything is trivially OK.
        if (boxes.length === 0) {
            return {
                techniciansNeeded: 0,
                assignments: [],
                feasible: true,
            };
        }

        // Quick sanity check: if even one box cannot be done by a single tech
        // within the deadline, no team configuration will ever work.
        for (const box of boxes) {
            const single = this.calculateAssignmentDuration(
                startLocation,
                speedKmh,
                [box],
                [box.id]
            );
            if (single === null || single > deadlineMinutes + 1e-6) {
                return {
                    techniciansNeeded: 0,
                    assignments: [],
                    feasible: false,
                };
            }
        }

        let technicians = 1;
        let bestAssignments: TechnicianAssignment[] | null = null;

        while (technicians <= boxes.length) {
            const attempt = this.tryAssign(
                startLocation,
                speedKmh,
                boxes,
                technicians,
                deadlineMinutes
            );

            if (attempt !== null) {
                bestAssignments = attempt;
                break;
            }

            technicians += 1;
        }

        if (!bestAssignments) {
            return {
                techniciansNeeded: 0,
                assignments: [],
                feasible: false,
            };
        }

        return {
            techniciansNeeded: technicians,
            assignments: bestAssignments,
            feasible: true,
        };
    }
}
