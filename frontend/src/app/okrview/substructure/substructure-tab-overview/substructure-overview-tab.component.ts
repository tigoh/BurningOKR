import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { DepartmentUnit } from '../../../shared/model/ui/OrganizationalUnit/department-unit';
import { ViewObjective } from '../../../shared/model/ui/view-objective';
import { ContextRole } from '../../../shared/services/helper/department-context-role.service';
import { ObjectiveViewMapper } from '../../../shared/services/mapper/objective-view.mapper';
import { ObjectiveFormComponent } from '../../objective/objective-form/objective-form.component';
import { CycleUnit } from '../../../shared/model/ui/cycle-unit';
import { DepartmentMapper } from '../../../shared/services/mapper/department.mapper';

@Component({
  selector: 'app-substructure-overview-tab',
  templateUrl: './substructure-overview-tab.component.html',
  styleUrls: ['./substructure-overview-tab.component.scss']
})
export class SubstructureOverviewTabComponent implements OnInit, OnDestroy, OnChanges {
  @Input() department: DepartmentUnit;
  @Input() currentUserRole: ContextRole;
  @Input() cycle: CycleUnit;

  subscriptions: Subscription[] = [];

  objectiveList: ViewObjective[];

  constructor(
    private objectiveMapper: ObjectiveViewMapper,
    private departmentMapper: DepartmentMapper,
    private matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.objectiveMapper
        .getObjectivesForDepartment$(this.department.id)
        .subscribe(newObjectiveList => (this.objectiveList = newObjectiveList))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.department) {
      this.objectiveList = undefined;
      this.objectiveMapper
        .getObjectivesForDepartment$(this.department.id)
        .subscribe(newObjectiveList => (this.objectiveList = newObjectiveList));
    }
  }
  // --
  // Objective ordering logic
  // --
  dropObjective(event: CdkDragDrop<ViewObjective[]>): void {
    moveItemInArray(this.objectiveList, event.previousIndex, event.currentIndex);
    this.queryUpdatedObjectiveOrder();
  }

  moveObjectiveToTop(objectiveToMove: ViewObjective): void {
    const currentIndex: number = this.objectiveList.indexOf(objectiveToMove);
    moveItemInArray(this.objectiveList, currentIndex, 0);
    this.queryUpdatedObjectiveOrder();
  }

  moveObjectiveToBottom(objectiveToMove: ViewObjective): void {
    const currentIndex: number = this.objectiveList.indexOf(objectiveToMove);
    moveItemInArray(this.objectiveList, currentIndex, this.objectiveList.length - 1);
    this.queryUpdatedObjectiveOrder();
  }

  queryUpdatedObjectiveOrder(): void {
    const sequenceList: number[] = this.calculateDepartmentOrderedIdList();
    this.departmentMapper
      .putDepartmentObjectiveSequence$(this.department.id, sequenceList)
      .pipe(take(1))
      .subscribe();
  }

  calculateDepartmentOrderedIdList(): number[] {
    const objectiveIdList: number[] = [];
    this.objectiveList.forEach(x => objectiveIdList.push(x.id));

    return objectiveIdList;
  }

  // --
  // Objective add new logic
  // --

  clickedAddObjective(): void {
    const dialogReference: MatDialogRef<ObjectiveFormComponent> = this.matDialog.open(ObjectiveFormComponent, {
      data: { departmentId: this.department.id }
    });

    this.subscriptions.push(
      dialogReference
        .afterClosed()
        .pipe(
          take(1),
          filter(v => v),
          switchMap(n => n)
        )
        .subscribe(newObjective => this.onObjectiveAdded(newObjective as ViewObjective))
    );
  }

  onObjectiveAdded(newObjective: ViewObjective): void {
    this.objectiveList.unshift(newObjective);
    this.department.objectives.unshift(newObjective.id);
  }
}
