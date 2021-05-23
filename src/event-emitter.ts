export interface IEvent {
  type: string;
  data?: unknown;
  asyncHandle?: IEventListenerAsyncHandle<unknown>;
}

export interface IEventListener {
  (evt: IEvent): void;
}

export interface IEventListenerObject {
  type: string;
  listener: IEventListener;
  options: IEventListenerOptions;
  asyncHandle?: IEventListenerAsyncHandle<unknown>;
}

export interface IEventListenerOptions {
  once?: boolean;
}

interface IEventListenerAsyncHandle<T> {
  resolve: (value: (T | PromiseLike<T>)) => void;
  reject: (value: (unknown | PromiseLike<unknown>)) => void;
}

export class EventEmitter {
  private events: Map<string, Map<number, IEventListenerObject>>;

  constructor() {
    this.events = new Map();
  }

  on(type: string, listener: IEventListener, options: IEventListenerOptions = {}): void {
    this.registerListener<never>(type, listener, options);
  }

  onAsync<T>(type: string, listener: IEventListener, options: IEventListenerOptions = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.registerListener<T>(type, listener, options, {resolve, reject});
    });
  }

  off(type: string, listener: IEventListener, options: IEventListenerOptions = {}): void {
    const key = this.getKey({type, listener, options} as IEventListenerObject);
    this.events.get(type)?.delete(key);
  }

  emit(type: string, data?: unknown): void {
    const listenerObjMap: Map<number, IEventListenerObject> | undefined = this.events.get(type);
    if (listenerObjMap) {
      for (const [key, {options, asyncHandle, listener}] of listenerObjMap) {
        if (options.once || asyncHandle) listenerObjMap.delete(key);
        listener({type, data, asyncHandle} as IEvent);
      }
    }
  }

  protected registerListener<T>(type: string,
                                listener: IEventListener,
                                options: IEventListenerOptions,
                                asyncHandle?: IEventListenerAsyncHandle<T>): void {
    let listenerObjMap: Map<number, IEventListenerObject> | undefined = this.events.get(type);

    if (!listenerObjMap) {
      listenerObjMap = new Map();
      this.events.set(type, listenerObjMap);
    }

    const wrapper = {type, listener, options, asyncHandle} as IEventListenerObject;
    listenerObjMap.set(this.getKey(wrapper), wrapper);
  }

  protected getKey({type, listener, options}: IEventListenerObject): number {
    const str: string = type + listener.toString() + JSON.stringify(options);
    // Hash generation inspired by: https://stackoverflow.com/a/7616484
    let hash = 0;
    for (const chr of str) {
      hash = ((hash << 5) - hash) + chr.charCodeAt(0);
      hash |= 0;  // bitwise OR to make hash into a 32bit int
    }
    return hash;
  }
}
