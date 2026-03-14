import { Ad, Area, Schedule, ScheduledAd, PlacementEngine } from './placementEngine';

export class RevenueEngine {
    placementEngine: PlacementEngine;

    constructor(placementEngine: PlacementEngine) {
        this.placementEngine = placementEngine;
    }

    private buildAdMap(ads: Ad[]): Record<string, Ad> {
        const map: Record<string, Ad> = {};
        for (const ad of ads) {
            map[ad.adId] = ad;
        }
        return map;
    }

    private buildAreaMap(areas: Area[]): Record<string, Area> {
        const map: Record<string, Area> = {};
        for (const area of areas) {
            map[area.areaId] = area;
        }
        return map;
    }

    getAdvertiserScheduleCount(
        advertiserId: string,
        ads: Ad[],
        schedule: Schedule
    ): number {
        if (!advertiserId) {
            return 0;
        }

        const adMap = this.buildAdMap(ads);
        let count = 0;

        for (const areaAds of Object.values(schedule)) {
            for (const scheduled of areaAds) {
                const ad = adMap[scheduled.adId];
                if (ad && ad.advertiserId === advertiserId) {
                    count += 1;
                }
            }
        }

        return count;
    }

    calculateDiminishedRevenue(
        baseRevenue: number,
        advertiserScheduledCount: number,
        decayRate: number
    ): number {
        if (baseRevenue === 0) {
            return 0;
        }

        // The very first placement for an advertiser earns full value.
        if (advertiserScheduledCount <= 0) {
            return baseRevenue;
        }

        // Each extra placement from the same advertiser earns a smaller slice.
        const exponent = advertiserScheduledCount;
        const multiplier = Math.pow(decayRate, exponent);
        return baseRevenue * multiplier;
    }

    calculatePlacementRevenue(
        ad: Ad,
        areas: Area[],
        ads: Ad[],
        schedule: Schedule,
        decayRate: number
    ): number {
        const adMap = this.buildAdMap(ads);
        const areaMap = this.buildAreaMap(areas);

        const targetAd = adMap[ad.adId];
        if (!targetAd) {
            return 0;
        }

        type PlacementInfo = {
            adId: string;
            areaId: string;
            startTime: number;
            rawRevenue: number;
        };

        const advertiserId = targetAd.advertiserId;
        const placements: PlacementInfo[] = [];

        // Collect all placements for this advertiser across the schedule.
        for (const [areaId, areaAds] of Object.entries(schedule)) {
            const area = areaMap[areaId];
            if (!area) {
                continue;
            }

            for (const scheduled of areaAds) {
                const scheduledAd = adMap[scheduled.adId];
                if (!scheduledAd || scheduledAd.advertiserId !== advertiserId) {
                    continue;
                }

                const rawRevenue = scheduledAd.baseRevenue * area.multiplier;
                placements.push({
                    adId: scheduledAd.adId,
                    areaId,
                    startTime: scheduled.startTime,
                    rawRevenue,
                });
            }
        }

        if (placements.length === 0) {
            return 0;
        }

        // Sort according to decay ordering rules:
        // 1. startTime ascending
        // 2. raw placement revenue ascending
        // 3. adId lexicographically ascending
        placements.sort((a, b) => {
            if (a.startTime !== b.startTime) {
                return a.startTime - b.startTime;
            }
            if (a.rawRevenue !== b.rawRevenue) {
                return a.rawRevenue - b.rawRevenue;
            }
            return a.adId.localeCompare(b.adId);
        });

        // Find this placement's index within the ordered list.
        const placementIndex = placements.findIndex(
            (p) => p.adId === ad.adId
        );

        if (placementIndex === -1) {
            return 0;
        }

        const placement = placements[placementIndex];
        const placementArea = areaMap[placement.areaId];
        if (!placementArea) {
            return 0;
        }

        const basePlacementRevenue = ad.baseRevenue * placementArea.multiplier;
        const advertiserScheduledCountBefore = placementIndex;

        return this.calculateDiminishedRevenue(
            basePlacementRevenue,
            advertiserScheduledCountBefore,
            decayRate
        );
    }

    getAdvertiserDiversity(ads: Ad[], schedule: Schedule): number {
        if (Object.keys(schedule).length === 0) {
            return 0;
        }

        const adMap = this.buildAdMap(ads);
        const advertisers = new Set<string>();

        for (const areaAds of Object.values(schedule)) {
            for (const scheduled of areaAds) {
                const ad = adMap[scheduled.adId];
                if (ad) {
                    advertisers.add(ad.advertiserId);
                }
            }
        }

        return advertisers.size;
    }

    getAreaRevenue(
        area: Area,
        areasArray: Area[],
        fullSchedule: Schedule,
        ads: Ad[],
        decayRate: number
    ): number {
        const areaSchedule = fullSchedule[area.areaId];
        if (!areaSchedule || areaSchedule.length === 0) {
            return 0;
        }

        const adMap = this.buildAdMap(ads);
        const areaMap = this.buildAreaMap(areasArray);

        type PlacementInfo = {
            advertiserId: string;
            adId: string;
            areaId: string;
            startTime: number;
            rawRevenue: number;
        };

        const placementsByAdvertiser: Record<string, PlacementInfo[]> = {};

        // Build global placement lists per advertiser, constrained to known areas.
        for (const [areaId, scheduledAds] of Object.entries(fullSchedule)) {
            const placementArea = areaMap[areaId];
            if (!placementArea) {
                continue;
            }

            for (const scheduled of scheduledAds) {
                const ad = adMap[scheduled.adId];
                if (!ad) {
                    continue;
                }

                const advertiserId = ad.advertiserId;
                const rawRevenue = ad.baseRevenue * placementArea.multiplier;

                if (!placementsByAdvertiser[advertiserId]) {
                    placementsByAdvertiser[advertiserId] = [];
                }

                placementsByAdvertiser[advertiserId].push({
                    advertiserId,
                    adId: ad.adId,
                    areaId,
                    startTime: scheduled.startTime,
                    rawRevenue,
                });
            }
        }

        const revenueByPlacementKey: Record<string, number> = {};

        for (const advertiserPlacements of Object.values(placementsByAdvertiser)) {
            advertiserPlacements.sort((a, b) => {
                if (a.startTime !== b.startTime) {
                    return a.startTime - b.startTime;
                }
                if (a.rawRevenue !== b.rawRevenue) {
                    return a.rawRevenue - b.rawRevenue;
                }
                return a.adId.localeCompare(b.adId);
            });

            advertiserPlacements.forEach((placement, index) => {
                const multiplier = Math.pow(decayRate, index);
                const revenue = placement.rawRevenue * multiplier;
                const key = `${placement.areaId}:${placement.adId}`;
                revenueByPlacementKey[key] = revenue;
            });
        }

        let total = 0;
        for (const scheduled of areaSchedule) {
            const key = `${area.areaId}:${scheduled.adId}`;
            const value = revenueByPlacementKey[key];
            if (typeof value === 'number') {
                total += value;
            }
        }

        return total;
    }
}