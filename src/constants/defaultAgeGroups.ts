export interface AgeGroupOption {
  name: string;
  min_age: number;
  max_age: number;
}

// Default age groups used across the app
export const DEFAULT_AGE_GROUPS: AgeGroupOption[] = [
  {"name": "Children", "min_age": 0, "max_age": 13},
  {"name": "Teens", "min_age": 14, "max_age": 19},
  {"name": "Young Adults", "min_age": 20, "max_age": 35},
  {"name": "Adults", "min_age": 36, "max_age": 49},
  {"name": "Mature", "min_age": 50, "max_age": 64},
  {"name": "Seniors", "min_age": 65, "max_age": 120}
];

export function formatAgeGroupLabel(group: AgeGroupOption): string {
  if (group.max_age >= 120) {
    return `${group.min_age}+`;
  }
  return `${group.min_age}-${group.max_age}`;
}