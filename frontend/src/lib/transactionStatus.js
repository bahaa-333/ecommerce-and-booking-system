const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function nextStatusOptions(status) {
  return TRANSITIONS[status] ?? [];
}