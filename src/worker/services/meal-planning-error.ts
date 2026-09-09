export class MealPlanningError extends Error {
  constructor(
    readonly code: string,
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 503,
    message: string,
  ) {
    super(message);
    this.name = 'MealPlanningError';
  }
}
