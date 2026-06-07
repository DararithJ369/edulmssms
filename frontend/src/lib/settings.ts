import { getRouteAccessMap } from "./navigation";

export const ITEM_PER_PAGE = 10;

type RouteAccessMap = {
  [key: string]: string[];
};

export const routeAccessMap: RouteAccessMap = getRouteAccessMap();