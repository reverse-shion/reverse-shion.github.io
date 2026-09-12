export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export function createState(map) {
  return { mode: 'start', player: { ...map.spawn }, eventId: null, completed: 0, snapshot: null };
}
export function movePlayer(state, input, delta, map) {
  if (state.mode !== 'explore') return;
  let x = input.x, z = input.z;
  const length = Math.hypot(x, z);
  if (length > 1) { x /= length; z /= length; }
  const dt = clamp(delta, 0, 0.05), p = state.player;
  const distance = map.player.speed * dt, c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  const dx = (x * c + z * s) * distance, dz = (-x * s + z * c) * distance;
  const radius = map.player.radius, bounds = map.bounds;
  const collides = (px, pz) => map.obstacles.some(o => Math.abs(px - o.x) < o.halfX + radius && Math.abs(pz - o.z) < o.halfZ + radius);
  const nx = clamp(p.x + dx, bounds.minX + radius, bounds.maxX - radius);
  if (!collides(nx, p.z)) p.x = nx;
  const nz = clamp(p.z + dz, bounds.minZ + radius, bounds.maxZ - radius);
  if (!collides(p.x, nz)) p.z = nz;
}
export function lookPlayer(state, dx, dy) {
  if (state.mode !== 'explore') return;
  state.player.yaw = (state.player.yaw - clamp(dx, -80, 80) * 0.003) % (Math.PI * 2);
  state.player.pitch = clamp(state.player.pitch - clamp(dy, -80, 80) * 0.0025, -0.8, 0.8);
}
export function assistView(state, delta) {
  if (state.mode !== 'explore') return;
  const dt = clamp(delta, 0, 0.05);
  const factor = 1 - Math.exp(-5.5 * dt);
  state.player.pitch += (0 - state.player.pitch) * factor;
  if (Math.abs(state.player.pitch) < 0.002) state.player.pitch = 0;
}
export function nearbyEvent(state, events, map) {
  if (state.mode !== 'explore') return null;
  return events.find(e => e.mapId === map.mapId && e.era === map.era && Math.hypot(state.player.x - e.position.x, state.player.z - e.position.z) <= e.radius) || null;
}
export function enterSkit(state, event) {
  if (state.mode !== 'explore' || !event) return false;
  state.snapshot = { ...state.player };
  state.mode = 'skit'; state.eventId = event.id;
  return true;
}
export function leaveSkit(state, completed = false) {
  if (state.mode !== 'skit') return false;
  if (state.snapshot) Object.assign(state.player, state.snapshot);
  state.snapshot = null; state.eventId = null; state.mode = 'explore';
  if (completed) state.completed++;
  return true;
}
