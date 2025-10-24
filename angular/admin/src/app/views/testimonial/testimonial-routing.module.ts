import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddEditTestimonialComponent } from './add-edit-testimonial/add-edit-testimonial.component';
import { ListTestimonialComponent } from './list-testimonial/list-testimonial.component';
import { AssignmentComponent } from './assignment/assignment.component';
const routes: Routes = [

  {
    path: 'add',
    component: AddEditTestimonialComponent,
    data: {
      title: 'Add',
    },
    // canActivate: [AuthGuard]
  },
  {
    path: 'edit/:id',
    component: AddEditTestimonialComponent,
    data: {
      title: 'Edit',
    },
  },
  {
    path: 'list',
    component: ListTestimonialComponent,
    data: {
      title: 'List',
    },
    
    // canActivate: [AuthGuard]
  },
  {
    path: 'assignment',
    component: AssignmentComponent,
    data: {
      title: 'Assignment',
    },
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TestimonialRoutingModule { }
