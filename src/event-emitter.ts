export interface IEvent {
  type: string;
  data?: unknown;
}

export interface IEventListener {
  (evt: IEvent): void;
}

export interface IEventListenerObject {
  type: string;
  listener: IEventListener;
  options: IEventListenerOptions;
}

export interface IEventListenerOptions {
  once?: boolean;
}

export class EventEmitter {
  private events: Map<string, Map<number, IEventListenerObject>>;

  constructor() {
    this.events = new Map();
  }

  on(type: string, listener: IEventListener, options: IEventListenerOptions = {}) {
    let listenerObjMap: Map<number, IEventListenerObject> | undefined = this.events.get(type);

    if (!listenerObjMap) {
      listenerObjMap = new Map();
      this.events.set(type, listenerObjMap);
    }

    const wrapper: IEventListenerObject = {type, listener, options};
    listenerObjMap.set(this.getKey(wrapper), wrapper);
  }

  off(type: string, listener: IEventListener, options: IEventListenerOptions = {}) {
    const key = this.getKey({type, listener, options} as IEventListenerObject);
    this.events.get(type)?.delete(key);
  }

  emit(type: string, data?: unknown) {
    const listenerObjMap: Map<number, IEventListenerObject> | undefined = this.events.get(type);
    if (listenerObjMap) {
      for (const [key, obj] of listenerObjMap) {
        if (obj.options.once) listenerObjMap.delete(key);
        obj.listener({type, data} as IEvent);
      }
    }
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
