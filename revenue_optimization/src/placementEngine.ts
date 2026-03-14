export interface Ad {
    adId: string;
    advertiserId: string;
    timeReceived: number;
    timeout: number;
    duration: number;
    baseRevenue: number;
    bannedLocations: string[];
}

export interface Area {
    areaId: string;
    location: string;
    multiplier: number;
    totalScreens: number;
    timeWindow: number;
}

export interface ScheduledAd {
    adId: string;
    areaId: string;
    startTime: number;
    endTime: number;
}

export type Schedule = Record<string, ScheduledAd[]>;

export class PlacementEngine {

    constructor() {
    }

    isAdCompatibleWithArea(ad: Ad, area: Area): boolean {
        // An ad can run here only if this area's location isn't on its banned list.
        return !ad.bannedLocations.includes(area.location);
    }

    getTotalScheduledTimeForArea(areaSchedule: ScheduledAd[]): number {
        // Add up how long ads are actually on screen, slot by slot.
        return areaSchedule.reduce(
            (total, scheduledAd) => total + (scheduledAd.endTime - scheduledAd.startTime),
            0
        );
    }

    doesPlacementFitTimingConstraints(
        ad: Ad,
        area: Area,
        startTime: number
    ): boolean {
        // Ignore placements that pretend time can go backwards.
        if (startTime < 0) {
            return false;
        }

        const availabilityStart = ad.timeReceived;
        const availabilityEnd = ad.timeReceived + ad.timeout;

        // Start time must fall inside the ad's availability window.
        if (startTime < availabilityStart || startTime > availabilityEnd) {
            return false;
        }

        const endTime = startTime + ad.duration;

        // The ad must finish before the area itself closes for scheduling.
        if (endTime > area.timeWindow) {
            return false;
        }

        return true;
    }

    isAdAlreadyScheduled(adId: string, schedule: Schedule): boolean {
        for (const areaAds of Object.values(schedule)) {
            for (const scheduled of areaAds) {
                if (scheduled.adId === adId) {
                    return true;
                }
            }
        }

        return false;
    }

    canScheduleAd(
        ad: Ad,
        area: Area,
        schedule: Schedule,
        startTime: number
    ): boolean {
        // First, make sure this ad is even allowed in this area.
        if (!this.isAdCompatibleWithArea(ad, area)) {
            return false;
        }

        // Each ad is single-use across the whole venue.
        if (this.isAdAlreadyScheduled(ad.adId, schedule)) {
            return false;
        }

        // Now check that the timing works for both ad and area.
        if (!this.doesPlacementFitTimingConstraints(ad, area, startTime)) {
            return false;
        }

        const newStart = startTime;
        const newEnd = startTime + ad.duration;

        const areaSchedule = schedule[area.areaId] ?? [];

        // Finally, this slot has to be free on this particular screen.
        for (const existing of areaSchedule) {
            const existingStart = existing.startTime;
            const existingEnd = existing.endTime;

            const overlaps = newStart < existingEnd && newEnd > existingStart;
            if (overlaps) {
                return false;
            }
        }

        return true;
    }

    isAreaScheduleValid(area: Area, areaSchedule: ScheduledAd[], ads: Ad[]): boolean {
        // No ads scheduled for this area is always a valid situation.
        if (areaSchedule.length === 0) {
            return true;
        }

        const adMap: Record<string, Ad> = {};
        for (const ad of ads) {
            adMap[ad.adId] = ad;
        }

        // Walk each placement and make sure it lines up with the ad catalog and rules.
        for (const scheduled of areaSchedule) {
            const ad = adMap[scheduled.adId];

            // If we don't know this ad, the schedule is invalid.
            if (!ad) {
                return false;
            }

            // The time booked for the ad has to match its declared duration.
            const scheduledDuration = scheduled.endTime - scheduled.startTime;
            if (scheduledDuration !== ad.duration) {
                return false;
            }

            // Don't let ads run outside the area's working hours.
            if (scheduled.startTime < 0 || scheduled.endTime > area.timeWindow) {
                return false;
            }

            // Respect the ad's banned locations for this area.
            if (!this.isAdCompatibleWithArea(ad, area)) {
                return false;
            }

            // And double‑check that the ad is still "fresh" when it starts.
            if (!this.doesPlacementFitTimingConstraints(ad, area, scheduled.startTime)) {
                return false;
            }
        }

        // Sort locally so we can spot any overlaps regardless of input order.
        const sorted = [...areaSchedule].sort(
            (a, b) => a.startTime - b.startTime
        );

        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];

            // If one ad bleeds into the next, this area schedule isn't valid.
            if (prev.endTime > curr.startTime) {
                return false;
            }
        }

        // As a final sanity check, don't book more time than the area even has.
        const totalScheduled = this.getTotalScheduledTimeForArea(areaSchedule);
        if (totalScheduled > area.timeWindow) {
            return false;
        }

        return true;
    }
}