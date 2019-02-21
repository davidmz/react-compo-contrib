import { Use, state } from 'react-compo';

export type AsyncState<T> =
  | { loading: true }
  | { loading: false }
  | { loading: false; result: T }
  | { loading: false; error: any };

export const asyncRunner = <T, A extends any[]>(
  action: (...args: A) => Promise<T>
) => (
  use: Use
): [(...args: A) => Promise<void>, () => AsyncState<T>, () => void] => {
  const [getStatus, setStatus] = use(
    state({
      loading: false,
    } as AsyncState<T>)
  );

  const run = async (...args: A) => {
    try {
      setStatus({ loading: true });
      const result = await action(...args);
      setStatus({ loading: false, result });
    } catch (error) {
      setStatus({ loading: false, error });
    }
  };

  const reset = () => setStatus({ loading: false });

  return [run, getStatus, reset];
};

export function asyncRunner2() {
  return <T, A extends any[]>(action: (...args: A) => Promise<T>) => (
    use: Use
  ) => {
    const [getStatus, setStatus] = use(
      state({
        loading: false,
      } as AsyncState<T>)
    );

    const run = async (...args: A) => {
      try {
        setStatus({ loading: true });
        const result = await action(...args);
        setStatus({ loading: false, result });
      } catch (error) {
        setStatus({ loading: false, error });
      }
    };

    const reset = () => setStatus({ loading: false });

    return () => [run, getStatus, reset];
  };
}
