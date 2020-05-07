import {Injectable, OnDestroy} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SerialService implements OnDestroy {

  public output$ = new Subject();
  public connect$ = new BehaviorSubject(false);
  public isSerialSupported: boolean;
  private port: any;
  private reader: any;
  private inputDone: any;
  private outputDone: any;
  private outputStream: any;

  constructor() {
    this.isSerialSupported = 'serial' in navigator;
  }

  async connect() {
    this.port = await (navigator as any).serial.requestPort();
    await this.port.open({baudrate: 9600});
    const decoder = new TextDecoderStream();
    this.inputDone = this.port.readable.pipeTo(decoder.writable);
    this.reader = decoder.readable.getReader();

    const encoder = new TextEncoderStream();
    this.outputDone = encoder.readable.pipeTo(this.port.writable);
    this.outputStream = encoder.writable;
    this.connect$.next(true);
    while (true) {
      const {value, done} = await this.reader.read();
      if (value) {
        this.output$.next(value);
      }
      if (done) {
        this.output$.complete();
        this.reader.releaseLock();
        break;
      }
    }
  }

  send(msg: string) {
    const writer = this.outputStream.getWriter();
    writer.write(msg);
    writer.releaseLock();
  }

  async disconnect() {
    if (this.port) {
      if (this.reader) {
        await this.reader.cancel();
        await this.inputDone.catch(() => {
        });
        this.reader = null;
        this.inputDone = null;
      }
      if (this.outputStream) {
        await this.outputStream.getWriter().close();
        await this.outputDone;
        this.outputStream = null;
        this.outputDone = null;
      }
      await this.port.close();
      this.port = null;
    }
    this.connect$.next(false);
  }

  ngOnDestroy(): void {
    this.disconnect().then();
  }
}
