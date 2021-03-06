import chai, {expect} from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {EventEmitter, IEvent} from './event-emitter';

chai.use(sinonChai);
chai.should();

describe(EventEmitter.name, () => {
  it('should only call listeners of the correct event type', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();
    const spy3 = sinon.spy();

    const emitter: EventEmitter = new EventEmitter();
    emitter.on('event1', spy1);
    emitter.on('event2', spy2);
    emitter.on('event3', spy3);
    emitter.emit('event2');
    emitter.emit('event-with-no-listeners');

    spy1.should.not.have.been.called;
    spy2.should.have.been.calledOnce;
    spy3.should.not.have.been.called;
  });

  it('should call listeners with {once: true} only once', () => {
    const spy = sinon.spy();

    const emitter: EventEmitter = new EventEmitter();
    emitter.on('event1', spy, {once: true});
    emitter.emit('event1');
    emitter.emit('event1');

    spy.should.have.been.calledOnce;
  });

  it('should call listeners without {once: true} multiple times', () => {
    const spy1 = sinon.spy();
    const spy2 = sinon.spy();

    const emitter: EventEmitter = new EventEmitter();
    emitter.on('event1', spy1, {once: false});
    emitter.on('event1', spy2);  // implicit
    emitter.emit('event1');
    emitter.emit('event1');

    spy1.should.have.callCount(2);
    spy2.should.have.callCount(2);
  });

  it('should be possible to remove listeners', () => {
    const spy = sinon.spy();

    const emitter: EventEmitter = new EventEmitter();
    emitter.on('event', spy);
    emitter.off('event', spy);
    emitter.emit('event');

    spy.should.not.have.been.called;
  });

  it('should not remove listeners when .on() vs .off() signature does not match', () => {
    const spy = sinon.spy();

    const emitter: EventEmitter = new EventEmitter();
    emitter.on('event1', spy, {once: false});
    emitter.off('event1', spy); // implicit options
    emitter.off('event2', spy, {once: false});  // different type
    emitter.emit('event1');

    spy.should.have.been.calledOnce;
  });

  it('should never overwrite existing listeners as long as created with different signature', () => {
    const spy = sinon.spy();

    const emitter: EventEmitter = new EventEmitter();
    emitter.on('event1', spy, {once: true});
    emitter.on('event1', spy, {once: false});
    emitter.on('event2', spy);
    emitter.emit('event1', 'by-event1');
    emitter.emit('event2', 'by-event2');

    spy.getCall(0).should.have.been.calledWithMatch({type: 'event1', data: 'by-event1'});
    spy.getCall(1).should.have.been.calledWithMatch({type: 'event1', data: 'by-event1'});
    spy.getCall(2).should.have.been.calledWithMatch({type: 'event2', data: 'by-event2'});
  });

  it('should wait for synchronous event chain to resolve', async () => {
    const emitter = new EventEmitter();
    emitter.on('ping', (evt: IEvent) => emitter.emit('pong', evt.data + ' world'));
    const onPing: Promise<string> = emitter.onAsync<string>('pong', (evt: IEvent) => evt.asyncHandle?.resolve(evt.data));

    emitter.emit('ping', 'hello');
    const pingPong: string = await onPing;

    expect(pingPong).to.equal('hello world');
  });

  it('should wait for asynchronous event chain to resolve', async () => {
    const emitter = new EventEmitter();
    emitter.on('ping', (evt: IEvent) => {
      setTimeout(() => emitter.emit('pong', evt.data + ' async world'), 1);
    });

    emitter.emit('ping', 'hello');
    const pingPong: string = await emitter.onAsync<string>('pong', (evt: IEvent) => evt.asyncHandle?.resolve(evt.data));

    expect(pingPong).to.equal('hello async world');
  });

  it('should call listeners attached with onAsync() only once', () => {
    const spy = sinon.spy((evt: IEvent) => evt.asyncHandle?.resolve(null));

    const emitter: EventEmitter = new EventEmitter();
    emitter.onAsync('event', spy);
    emitter.emit('event');
    emitter.emit('event');

    spy.should.have.been.calledOnce;
  });
});
