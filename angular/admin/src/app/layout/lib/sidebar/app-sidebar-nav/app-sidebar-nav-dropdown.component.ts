import { Component, Input } from '@angular/core';

import { SidebarNavHelper } from '../app-sidebar-nav.service';
import { INavData } from '../app-sidebar-nav';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-nav-dropdown, cui-sidebar-nav-dropdown',
  template: `
    <a class="nav-link nav-dropdown-toggle {{helper.isActive(router, item) ? 'seleted-menu' : ''}}"
       appNavDropdownToggle
       [appHtmlAttr]="item.attributes">
          <img src={{item.icon}} [ngClass]="item | appSidebarNavIcon">
      <!-- <i *ngIf="helper.hasIcon(item)" [ngClass]="item | appSidebarNavIcon"></i> -->
      <ng-container>{{item.name}}</ng-container>
      <span *ngIf="helper.hasBadge(item)" [ngClass]="item | appSidebarNavBadge">{{ item.badge.text }} </span>
    </a>
    <app-sidebar-nav-items
      class="nav-dropdown-items"
      [items]="item.children">
    </app-sidebar-nav-items>
  `,
  styles: [
   '.nav-dropdown-toggle { cursor: pointer; }',
    '.nav-dropdown-items { display: block; max-height: 0; overflow: hidden; transition: max-height 0.8s ease-in-out; }',
    '.open .nav-dropdown-items { max-height: 1000px;  transition: max-height 0.1s ease-in-out;}',
  ],
  providers: [SidebarNavHelper]
})
export class AppSidebarNavDropdownComponent {
  @Input() item: INavData;

  constructor(
    public helper: SidebarNavHelper,
    public router: Router,
  ) { }
}
