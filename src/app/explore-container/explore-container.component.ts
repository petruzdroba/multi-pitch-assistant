import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.css'],
})
export class ExploreContainerComponent {
  @Input() name?: string;
}
