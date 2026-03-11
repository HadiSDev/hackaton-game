// Player physics
export const JUMP_FORCE = 9;
export const GRAVITY_SCALE = 1.4;
export const PLAYER_FORWARD_SPEED = 6;
export const PLAYER_LATERAL_SPEED = 5;
export const PLAYER_RADIUS = 0.4;

// Jump feel — generous windows for forgiveness
export const COYOTE_TIME = 0.15;
export const JUMP_BUFFER_TIME = 0.15;

// Death
export const DEATH_Y_THRESHOLD = -8;

// Platform generation
export const SPAWN_DISTANCE = 60;
export const DESPAWN_DISTANCE = 15;
export const INITIAL_PLATFORM_COUNT = 15;

// Platform sizing (lerps with difficulty)
export const PLATFORM_WIDTH_MIN = 1.8;
export const PLATFORM_WIDTH_MAX = 5;
export const PLATFORM_DEPTH_MIN = 2;
export const PLATFORM_DEPTH_MAX = 5;
export const PLATFORM_HEIGHT = 0.4;

// Gap distances (lerps with difficulty)
export const GAP_DISTANCE_MIN = 2;
export const GAP_DISTANCE_MAX = 5.5;
export const HEIGHT_DELTA_MIN = -0.3;
export const HEIGHT_DELTA_MAX = 1.8;
export const LATERAL_OFFSET_MAX = 2;

// Platform types
export const MOVING_PLATFORM_THRESHOLD = 0.3;
export const CRUMBLING_PLATFORM_THRESHOLD = 0.5;
export const MOVING_AMPLITUDE = 1.5;
export const MOVING_SPEED = 2;
export const CRUMBLE_DELAY = 1.0;

// Lives
export const MAX_LIVES = 3;
export const RESPAWN_INVINCIBILITY = 1.5;
