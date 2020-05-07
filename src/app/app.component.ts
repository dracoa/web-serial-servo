import {Component} from '@angular/core';
import {SerialService} from './serial.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  supported = false;
  connected = false;
  output$: Observable<any>;
  speed = 5;
  cmd = 90;

  constructor(private serial: SerialService) {
    this.supported = this.serial.isSerialSupported;
    this.serial.connect$.asObservable().subscribe(v => this.connected = v);
    this.output$ = this.serial.output$.asObservable();
  }

  connect() {
    this.serial.connect().then();
  }

  disconnect() {
    this.serial.disconnect().then();
  }

  move(dir: number) {
    this.cmd = 90 - (dir * this.speed * 10);
    console.log(this.cmd);
    this.serial.send(`${this.cmd};`);
  }

  stop() {
    this.cmd = 90;
    console.log(this.cmd);
    this.serial.send(`${this.cmd};`);
  }


}
