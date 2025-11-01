import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TaglistComponent } from './taglist/taglist.component';
import { AddEditTagComponent } from './add-edit-tag/add-edit-tag.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'list',
        component: TaglistComponent,
        data: {
          title: 'Vendor List'
        }
      },
      {
        path: 'add',
        component: AddEditTagComponent,
        data: {
          title: 'Add Vendor'
        }
      },
      {
        path: 'edit/:id',
        component: AddEditTagComponent,
        data: {
          title: 'Edit Vendor'
        }
      },
      {
        path: 'view/:id',
        component: AddEditTagComponent,
        data: {
          title: 'Vendor View Page'
        }
      },
      {
        path: '',
        redirectTo: 'tags',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TagsRoutingModule { }
