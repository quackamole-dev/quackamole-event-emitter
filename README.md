Quackamole EventEmitter
=========================
[![npm version](https://badge.fury.io/js/quackamole-event-emitter.svg)](https://badge.fury.io/js/quackamole-event-emitter) [![GitHub license](https://img.shields.io/github/license/quackamole-dev/quackamole-event-emitter.svg)](https://github.com/quackamole-dev/quackamole-event-emitter/blob/main/LICENSE) ![Dependencies](https://img.shields.io/david/quackamole-dev/quackamole-event-emitter) [![Maintainability](https://api.codeclimate.com/v1/badges/a99a88d28ad37a79dbf6/maintainability)](https://codeclimate.com/github/quackamole-dev/quackamole-event-emitter) ![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/andreas-schoch/63f6547acd916bfb217f065a6357f29a/raw/quackamole-event-emitter__heads_github-actions-experimenting.json)

## Install

```bash
npm install quackamole-event-emitter
```

or

```bash
yarn add quackamole-event-emitter
```

## Basic Usage

```typescript
import EventEmitter from 'quackamole-event-emitter';

const emitter = new EventEmitter();

// basic
emitter.on('some-event', (evt: IEvent) => console.log(evt.data.foo), {once: true});
emitter.off('some-event', (evt: IEvent) => console.log(evt.data.foo), {once: true});
emitter.emit('some-event', {foo: 'bar'})
```

## Experimental Usage

Subject to change over time depending on usefulness and usability.

### Wait for follow-up event

As a response to "ping" we expect the follow up event "pong" to be emitted. 

```typescript
import EventEmitter from 'quackamole-event-emitter';

const emitter = new EventEmitter();

emitter.on('ping', (evt: IEvent) => {
  setTimeout(() => emitter.emit('pong', evt.data + ' world'), 1000);
});

emitter.emit('ping', 'hello');

const pingPong: string = await emitter.onAsync<string>('pong', (evt: IEvent) => {
  evt.asyncHandle?.resolve(evt.data);
}); // pingPong === 'hello world';
```

## License

MIT
