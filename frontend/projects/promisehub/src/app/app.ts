import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PhToastRegion } from '@promisehub/components';

@Component({
  selector: 'ph-root',
  imports: [RouterOutlet, PhToastRegion],
  templateUrl: './app.html',
})
export class App {}
