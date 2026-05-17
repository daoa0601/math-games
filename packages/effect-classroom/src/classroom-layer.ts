import { Layer } from "effect";

import { AccountLinkServiceLive } from "./account-link";
import { AnalyticsDashboardServiceLive } from "./analytics-dashboard";
import { AssignmentServiceLive } from "./assignment";
import { ClassroomServiceLive } from "./classroom";

export const ClassroomLayer = Layer.mergeAll(
  ClassroomServiceLive,
  AssignmentServiceLive,
  AccountLinkServiceLive,
  AnalyticsDashboardServiceLive,
);
