export type Pivot = { rotation: { x: number; y: number; z: number }; position: { y: number } };
export type Joints = Partial<Record<'body' | 'head' | 'leg_l' | 'leg_r' | 'knee_l' | 'knee_r' | 'arm_l' | 'arm_r' | 'elbow_l' | 'elbow_r' | 'tail_l' | 'tail_r', Pivot>>;
export type Gesture = 'wave' | 'water' | 'press' | 'inspect' | 'jump' | 'cheer' | 'stretch' | 'place';
export type RigInput = {
  dt: number;
  now: number;
  animate: boolean;
  speed: number;
  sitting: number;
  recline: boolean;
  activity: 'piano' | 'computer' | 'tv' | null;
  keys: number;
  keySide: number;
  typing: boolean;
  playing: boolean;
  carry?: boolean;
  clip?: boolean;
  look: number;
};

const DURATION: Record<Gesture, number> = { wave: 1.2, water: 1.4, press: 0.5, inspect: 1.2, jump: 0.95, cheer: 1, stretch: 1.6, place: 1.2 };
const CROUCH = 0.15, AIR = 0.6, LAND = 0.2, JUMP_HEIGHT = 0.3, RAMP = 0.15, MAX_DT = 0.05;
const BEAT = Math.PI * 2 * 76 / 60;
const POSE_KEYS = ['by', 'brx', 'bry', 'brz', 'hrx', 'hry', 'hrz', 'llx', 'lrx', 'klx', 'krx', 'alx', 'arx', 'alz', 'arz', 'elx', 'erx', 'tx', 'tz'] as const;
type Pose = Record<typeof POSE_KEYS[number], number>;
const JOINT_NAMES = ['body', 'head', 'leg_l', 'leg_r', 'knee_l', 'knee_r', 'arm_l', 'arm_r', 'elbow_l', 'elbow_r', 'tail_l', 'tail_r'] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blank = (): Pose => Object.fromEntries(POSE_KEYS.map((key) => [key, 0])) as Pose;

export function createRig(joints: Joints) {
  const rest = Object.fromEntries(JOINT_NAMES.map((name) => {
    const j = joints[name];
    return [name, j ? { x: j.rotation.x, y: j.rotation.y, z: j.rotation.z, py: j.position.y } : null];
  })) as Record<typeof JOINT_NAMES[number], { x: number; y: number; z: number; py: number } | null>;

  const fresh = () => ({ stride: 0, run: 0, rec: 0, piano: 0, comp: 0, tv: 0, press: 0, typing: 0, music: 0, carry: 0, alive: 0, yaw: 0 });
  let w = fresh();
  let out = blank();
  let phase = 0, animateNow = true, sittingNow = 0, wasSeated = false;
  let gesture: Gesture | null = null, gestureTime = 0;

  function apply(p: Pose) {
    const set = (name: typeof JOINT_NAMES[number], x?: number, y?: number, z?: number) => {
      const j = joints[name], r = rest[name];
      if (!j) return;
      if (x !== undefined) j.rotation.x = r.x + x;
      if (y !== undefined) j.rotation.y = r.y + y;
      if (z !== undefined) j.rotation.z = r.z + z;
    };
    const { body } = joints;
    if (body) body.position.y = rest.body.py + p.by;
    set('body', p.brx, p.bry, p.brz);
    set('head', p.hrx, p.hry, p.hrz);
    set('leg_l', p.llx);
    set('leg_r', p.lrx);
    set('knee_l', p.klx);
    set('knee_r', p.krx);
    set('elbow_l', p.elx);
    set('elbow_r', p.erx);
    set('arm_l', p.alx, undefined, p.alz);
    set('arm_r', p.arx, undefined, p.arz);
    set('tail_l', p.tx, undefined, p.tz);
    set('tail_r', p.tx, undefined, p.tz);
  }

  function trigger(g: Gesture) {
    if (g === 'jump' && sittingNow > 0.5) return false;
    if (!animateNow) return true;
    gesture = g;
    gestureTime = 0;
    return true;
  }

  function reset() {
    w = fresh();
    out = blank();
    phase = gestureTime = 0;
    wasSeated = false;
    gesture = null;
    apply(out);
  }

  function update(input: RigInput) {
    const { animate, activity, keySide } = input;
    const finite = (v: number) => Number.isFinite(v) ? v : 0;
    const dt = clamp(finite(input.dt), 0, MAX_DT);
    const now = finite(input.now);
    const speed = finite(input.speed);
    const sitting = clamp(finite(input.sitting), 0, 1);
    const blend = (rate: number) => animate ? 1 - Math.exp(-dt * rate) : 1;
    const chase = (v: number, goal: number, rate: number) => {
      const next = v + (goal - v) * blend(rate);
      return Math.abs(goal - next) < 0.002 ? goal : next;
    };
    animateNow = animate;
    sittingNow = sitting;

    const seated = sitting > 0.01;
    if (seated !== wasSeated || !animate || (gesture === 'jump' && sitting > 0.5)) gesture = null;
    wasSeated = seated;
    const moving = animate && speed > 0.5;

    const k = smooth(sitting);
    w.stride = chase(w.stride, moving && !input.clip ? 1 : 0, 12);
    w.run = chase(w.run, speed > 1.5 ? 1 : 0, 6);
    w.rec = chase(w.rec, input.recline ? 1 : 0, 5);
    w.piano = chase(w.piano, activity === 'piano' ? 1 : 0, 6);
    w.comp = chase(w.comp, activity === 'computer' ? 1 : 0, 6);
    w.tv = chase(w.tv, activity === 'tv' ? 1 : 0, 6);
    w.press = chase(w.press, clamp(finite(input.keys), 0, 4) / 4, 14);
    w.typing = chase(w.typing, animate && input.typing ? 1 : 0, 10);
    w.music = chase(w.music, animate && input.playing ? 1 : 0, 4);
    w.carry = chase(w.carry, input.carry ? 1 : 0, 8);
    w.alive = chase(w.alive, animate ? 1 : 0, 4);
    w.yaw = chase(w.yaw, clamp(finite(input.look), -0.6, 0.6), 8);
    if (moving) phase += dt * lerp(6.7, 8.5, w.run);

    const p = blank();
    const still = w.alive * (1 - w.stride);
    const idleOnly = still * (1 - k);
    const swing = Math.sin(phase) * lerp(0.65, 0.9, w.run) * w.stride;
    const sit = k * (1 - w.rec);
    const reach = k * (0.25 + w.piano * (0.2 + 0.2 * w.press) + w.comp * 0.35 - w.rec * 0.1);
    const bend = k * (1 - 0.15 * w.piano - 0.25 * w.comp) + w.carry * 1.2 + 0.3 * w.stride * (1 - w.carry);
    const pressing = w.press * w.piano * k;
    const typing = w.typing * w.comp * k;
    const beat = Math.sin(now * BEAT);

    p.llx = swing - 1.45 * k;
    p.lrx = -swing - 1.45 * k;
    p.klx = 1.45 * k + w.stride * (0.15 + lerp(0.75, 1.1, w.run) * Math.max(0, -Math.cos(phase)));
    p.krx = 1.45 * k + w.stride * (0.15 + lerp(0.75, 1.1, w.run) * Math.max(0, Math.cos(phase)));
    p.alx = -swing * 0.8 * (1 - w.carry) - reach - 0.4 * w.carry;
    p.arx = swing * 0.8 * (1 - w.carry) - reach - 0.4 * w.carry;
    p.elx = -bend;
    p.erx = -bend;
    p.by = Math.abs(Math.cos(phase)) * lerp(0.025, 0.045, w.run) * w.stride
      + Math.sin(now * Math.PI * 2 / lerp(4, 6, w.rec * k)) * 0.004 * still;
    p.brx = 0.15 * w.run * w.stride + 0.06 * sit + 0.22 * w.comp * k - 0.18 * w.rec * k;
    p.tx = 0.18 * w.stride;
    p.tz = Math.sin(phase) * 0.1 * w.stride;

    p.hry = w.yaw + 0.35 * Math.sin(now * 0.31) * Math.sin(now * 0.77) * idleOnly;
    p.brz = Math.sin(now * 0.9) * 0.012 * idleOnly;
    p.bry = Math.sin(now * 0.5) * 0.02 * idleOnly;
    p.hrx = 0.05 * w.comp * k;
    p.hrz = 0.08 * w.comp * k;

    p.alx += Math.sin(now * 14) * 0.08 * pressing + Math.sin(now * 22) * 0.06 * typing;
    p.arx -= Math.sin(now * 14) * 0.08 * pressing + Math.sin(now * 22 + 2.2) * 0.06 * typing;
    p.brz += finite(keySide) * 0.08 * pressing;
    p.bry -= finite(keySide) * 0.1 * pressing;
    p.hrx += 0.07 * beat * w.piano * w.music * k;
    p.by += 0.006 * Math.abs(Math.sin(now * 9)) * w.tv * w.music * k;

    let lift = 0;
    if (gesture) {
      gestureTime += dt;
      const d = DURATION[gesture], t = gestureTime;
      if (t >= d) gesture = null;
      else {
        const e = smooth(clamp(t / RAMP, 0, 1)) * smooth(clamp((d - t) / RAMP, 0, 1));
        const mix = (key: keyof Pose, target: number, amount = e) => { p[key] = lerp(p[key], target, amount); };
        if (gesture === 'wave') {
          mix('arx', -2.6);
          mix('arz', 0.35 * Math.sin(t * 14));
        } else if (gesture === 'water') {
          mix('arx', -0.9);
          p.brx += 0.15 * e;
          p.hrx += 0.15 * e;
        } else if (gesture === 'press') {
          mix('arx', -1 - 0.2 * Math.sin(t * 25));
        } else if (gesture === 'inspect') {
          p.brx += 0.2 * e;
          p.hrx += 0.15 * e;
          p.hrz += 0.25 * e;
        } else if (gesture === 'cheer') {
          mix('alx', -2.7);
          mix('arx', -2.7);
          p.by += 0.03 * Math.abs(Math.sin(t * Math.PI * 3)) * e;
        } else if (gesture === 'place') {
          p.brx += 0.45 * e;
          p.by -= 0.06 * e;
          p.llx -= 0.2 * e;
          p.lrx -= 0.2 * e;
          p.klx += 0.4 * e;
          p.krx += 0.4 * e;
          mix('alx', -0.05);
          mix('arx', -0.05);
          mix('elx', -0.25);
          mix('erx', -0.25);
          mix('alz', -0.12);
          mix('arz', 0.12);
        } else if (gesture === 'stretch') {
          mix('alx', -2.9);
          mix('arx', -2.9);
          p.brx -= 0.12 * e;
          p.hrx -= 0.2 * e;
        } else {
          let crouch = 0, arms = 0;
          if (t < CROUCH) crouch = smooth(t / CROUCH);
          else if (t < CROUCH + AIR) {
            const v = (t - CROUCH) / AIR;
            lift = JUMP_HEIGHT * 4 * v * (1 - v);
            crouch = Math.max(0, 1 - v * 5);
            arms = smooth(clamp(v * 4, 0, 1)) * (1 - smooth(clamp((v - 0.75) * 4, 0, 1)));
          } else crouch = Math.sin(Math.PI * (t - CROUCH - AIR) / LAND);
          p.by -= 0.12 * crouch;
          p.brx += 0.12 * crouch;
          p.llx -= 0.45 * crouch + 0.3 * arms;
          p.lrx -= 0.45 * crouch + 0.3 * arms;
          p.klx += 0.9 * crouch + 0.6 * arms;
          p.krx += 0.9 * crouch + 0.6 * arms;
          mix('alx', -2.7, arms);
          mix('arx', -2.7, arms);
        }
      }
    }

    const rate = blend(40);
    for (const key of POSE_KEYS) {
      const next = out[key] + (p[key] - out[key]) * rate;
      out[key] = Math.abs(p[key] - next) < 1e-5 ? p[key] : next;
    }
    apply(out);
    return { busy: animate || gesture !== null, lift, walkPhase: phase };
  }

  return { trigger, update, reset };
}
