import {
  StateSetter,
  StateSetterArg,
  Use,
  HookCreator,
  state,
  effector,
  SimpleEvents,
} from 'react-compo';

export type SharedStateUpdate<T> = StateSetter<T>;

interface SharedStateSubscriber<T> {
  <O>(selector: (v: T) => O): HookCreator<() => O>;
  (): HookCreator<() => T>;
}

const UPDATE = 'UPDATE';
const identity = <T>(x: T) => x;

export function createSharedState<T>(
  initial: T
): [SharedStateSubscriber<T>, SharedStateUpdate<T>] {
  const events = new SimpleEvents();
  let val = initial;

  return [
    // Subscribe
    (selector: (x: any) => any = identity) => (use: Use) => {
      const [, set] = use(state(selector(val)));
      const onUpdate = () => set(selector(val));

      const effect = use(effector());
      effect(() => {
        events.on(UPDATE, onUpdate);
        return () => events.off(UPDATE, onUpdate);
      }, []);

      return () => selector(val);
    },

    // Update
    (v: StateSetterArg<T>) => {
      if (typeof v === 'function') {
        v = (v as ((v: T) => T))(val);
      }
      if (val !== v) {
        val = v;
        events.emit(UPDATE);
      }
    },
  ];
}
