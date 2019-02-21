import React, { ReactNode } from 'react';
import { mount } from 'enzyme';
import { compo, useWith, DO_UPDATE, DID_UPDATE } from 'react-compo';

import { createSharedState } from './sharedState';
import { EventEmitter } from 'events';

describe('sharedState', async () => {
  it('should propagate the shared state', () => {
    const [subscribe, update] = createSharedState(42);

    const Leaf = compo('Leaf', (use) => {
      const getNum = use(subscribe());
      return () => <p>The number is {getNum()}</p>;
    });

    function Tree() {
      return (
        <div>
          <Leaf />
          <Leaf />
          <button onClick={() => update((n) => n + 1)}>+1</button>
        </div>
      );
    }

    const wrapper = mount(<Tree />);
    expect(wrapper).toMatchSnapshot();

    wrapper.find('button').simulate('click');
    expect(wrapper).toMatchSnapshot();
  });

  it('should propagate shared state with selector', () => {
    const [subscribe, update] = createSharedState({ a: 1, b: 2 });

    const Leaf = compo('Leaf', (use) => {
      const getA = use(subscribe((s) => s.a));
      return () => <p>The 'a' field is {getA()}</p>;
    });

    const Tree = compo('Tree', () => {
      return () => (
        <div>
          <Leaf />
          <Leaf />
          <button onClick={() => update((s) => ({ ...s, a: s.a + 1 }))}>
            a + 1
          </button>
        </div>
      );
    });

    const wrapper = mount(<Tree />);
    expect(wrapper).toMatchSnapshot();

    wrapper.find('button').simulate('click');
    expect(wrapper).toMatchSnapshot();
  });

  it('should not update component if selected value is not changed', () => {
    const [subscribe, update] = createSharedState({ a: 1, b: 2 });

    const leafRender = jest.fn();

    const Leaf = compo('Leaf', (use) => {
      const getA = use(subscribe((s) => s.a));
      return () => (
        <p>
          {leafRender()}The 'a' field is {getA()}
        </p>
      );
    });

    const Tree = compo('Tree', () => {
      return () => (
        <div>
          <Leaf />
          <button onClick={() => update((s) => ({ ...s, b: s.b + 1 }))}>
            b + 1
          </button>
        </div>
      );
    });

    const wrapper = mount(<Tree />);
    leafRender.mockClear();
    wrapper.find('button').simulate('click');
    expect(leafRender).not.toBeCalled();
  });

  it('should not update nested components multiple times', () => {
    const [subscribe, update] = createSharedState(42);

    const mocks: jest.Mock<{}>[] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];

    const Leaf = compo('Leaf', (use) => {
      use(subscribe()); // just subscribe to state
      return ({ idx, children }: { idx: number; children: ReactNode }) => {
        mocks[idx]();
        return children;
      };
    });

    const Tree = () => (
      <div>
        <Leaf idx={0}>
          <Leaf idx={1}>
            <Leaf idx={3}>end</Leaf>
          </Leaf>
          <Leaf idx={2}>end</Leaf>
        </Leaf>
        <button onClick={() => update((n) => n + 1)}>+1</button>
      </div>
    );

    const wrapper = mount(<Tree />);
    jest.clearAllMocks();
    wrapper.find('button').simulate('click');

    mocks.forEach((m) => expect(m).toBeCalledTimes(1));
  });

  describe('Without React', () => {
    it('should propagate the shared state', () => {
      const e1 = new EventEmitter();
      const e2 = new EventEmitter();
      const upd1 = jest.fn();
      const upd2 = jest.fn();
      e1.on(DO_UPDATE, upd1);
      e2.on(DO_UPDATE, upd2);

      const [subscribe, update] = createSharedState(42);
      const get1 = useWith(e1)(subscribe());
      const get2 = useWith(e2)(subscribe());

      // After the "first render"
      e1.emit(DID_UPDATE);
      e2.emit(DID_UPDATE);

      expect(upd1).not.toBeCalled();
      expect(upd2).not.toBeCalled();

      expect(get1()).toBe(42);
      expect(get2()).toBe(42);

      update(43);

      expect(upd1).toBeCalled();
      expect(upd2).toBeCalled();

      expect(get1()).toBe(43);
      expect(get2()).toBe(43);
    });

    it('should propagate state with selector', () => {
      const e = new EventEmitter();
      const upd = jest.fn();
      e.on(DO_UPDATE, upd);

      const [subscribe, update] = createSharedState(42);
      const get = useWith(e)(subscribe((n) => n % 2));

      // After the "first render"
      e.emit(DID_UPDATE);

      expect(upd).not.toBeCalled();
      expect(get()).toBe(0);

      update(43);

      expect(upd).toBeCalled();
      expect(get()).toBe(1);

      upd.mockClear();
      update(45); // should not change selected value
      expect(upd).not.toBeCalled();
      expect(get()).toBe(1);
    });
  });
});
