/**
 * Navigation contracts for Expo Router.
 *
 * `app.json` enables `experiments.typedRoutes`, which generates `Href` checking from the
 * file tree under `src/app/`. This module documents the product routes and the one dynamic
 * param (`session id` on Summary) so feature code can name params without stringly typing.
 *
 * Insights and Profile are intentionally absent (ADR-09).
 */

/** Params for `/session/[id]/summary`. */
export type SessionSummaryParams = {
  readonly id: string;
};

/**
 * Static pathnames the app navigates to.
 * Dynamic Summary is typed separately via `SessionSummaryParams` + `Href`.
 */
export type AppPath =
  | '/(tabs)'
  | '/(tabs)/history'
  | '/settings'
  | '/session/active';

/** Typed push target for Summary — use with `params: SessionSummaryParams`. */
export type SessionSummaryHref = {
  readonly pathname: '/session/[id]/summary';
  readonly params: SessionSummaryParams;
};
