import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeesRoutingModule } from './employees-routing.module';
import { AddNewEmployeesComponent } from './add-new-employees/add-new-employees.component';
import { ActiveEmployeesComponent } from './active-employees/active-employees.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SalaryViewComponent } from './salary-view/salary-view.component';
import { SalaryListComponent } from './salary-list/salary-list.component';


@NgModule({
  declarations: [
    AddNewEmployeesComponent,
    ActiveEmployeesComponent,
    SalaryViewComponent,
    SalaryListComponent
  ],
  imports: [
    CommonModule,
    EmployeesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule
  ]
})
export class EmployeesModule { }
