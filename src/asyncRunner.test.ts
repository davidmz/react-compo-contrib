import { useWith, SimpleEvents, Events, Use } from 'react-compo';
import { asyncRunner } from './asyncRunner';

describe('#asyncRunner', () => {
  let events: Events;
  let use: Use;

  beforeEach(() => {
    events = new SimpleEvents();
    use = useWith(events);
  });

  it('should return initial state', () => {
    const [, getStatus] = use(asyncRunner(async () => true));
    expect(getStatus()).toEqual({ loading: false });
  });

  it('should run async function', async () => {
    const [run, getStatus] = use(asyncRunner(async () => true));
    expect(getStatus()).toEqual({ loading: false });
    const p = run();
    expect(getStatus()).toEqual({ loading: true });
    await p;
    expect(getStatus()).toEqual({ loading: false, result: true });
  });

  it('should run async function with error', async () => {
    const error = new Error();
    const [run, getStatus] = use(
      asyncRunner(async () => {
        throw error;
      })
    );
    expect(getStatus()).toEqual({ loading: false });
    const p = run();
    expect(getStatus()).toEqual({ loading: true });
    await p;
    expect(getStatus()).toEqual({ loading: false, error });
  });

  it('should reset async status', async () => {
    const [run, getStatus, reset] = use(asyncRunner(async () => true));
    expect(getStatus()).toEqual({ loading: false });
    const p = run();
    expect(getStatus()).toEqual({ loading: true });
    await p;
    expect(getStatus()).toEqual({ loading: false, result: true });
    reset();
    expect(getStatus()).toEqual({ loading: false });
  });
});
