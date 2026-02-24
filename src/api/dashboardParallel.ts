/**
 * Parallel data fetching utilities for Dashboard
 * Combines multiple async operations using Promise.all to reduce latency
 */

import { getCases, getAllControlAlertas } from './db';

export type DashboardData = {
  allCases: any[];
  plazos: any[];
};

/**
 * Fetches dashboard data in parallel using Promise.all
 * Reduces total fetch time by running requests concurrently
 *
 * @param {string | null} tenantId - Tenant ID for the query
 * @returns {Promise<DashboardData>} - Both cases and alerts
 */
export async function fetchDashboardDataParallel(
  tenantId: string | null,
): Promise<DashboardData> {
  const [allCases, plazos] = await Promise.all([
    getCases(null, { tenantId: tenantId || null }),
    getAllControlAlertas(tenantId || null),
  ]);

  return { allCases, plazos };
}
