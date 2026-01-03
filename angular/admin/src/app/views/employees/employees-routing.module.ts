import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddNewEmployeesComponent } from './add-new-employees/add-new-employees.component';
import { ActiveEmployeesComponent } from './active-employees/active-employees.component';
import { SalaryViewComponent } from './salary-view/salary-view.component';
import { SalaryListComponent } from './salary-list/salary-list.component';

const routes: Routes = [
  {
    path: 'add',
    component: AddNewEmployeesComponent,
    data: {
      title: 'Add',
    },
    // canActivate: [AuthGuard]
  },
  {
    path: 'edit/:id',
    component: AddNewEmployeesComponent,
    data: {
      title: 'Add',
    },
  },
  {
    path: 'view/:id',
    component: AddNewEmployeesComponent,
    data: {
      title: 'View',
    },
  },
  {
    path: 'active-list',
    component: ActiveEmployeesComponent,
    data: {
      title: 'List',
    },
    // canActivate: [AuthGuard]
  },
  {
    path: 'salary-view/:id',
    component: SalaryViewComponent,
    data: {
      title: 'Salary View',
    },
  },
  {
    path: 'salary-list',
    component: SalaryListComponent,
    data: {
      title: 'Salary List',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeesRoutingModule { }
