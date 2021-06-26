/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { NbComponentOrCustomStatus } from '../component-status';

/**
 * Chat form component.
 *
 * Show a message form with a send message button.
 *
 * ```ts
 * <nb-chat-form showButton="true" buttonIcon="nb-send">
 * </nb-chat-form>
 * ```
 *
 * When `[dropFiles]="true"` handles files drag&drop with a file preview.
 *
 * Drag & drop available for files and images:
 * @stacked-example(Drag & Drop Chat, chat/chat-drop.component)
 *
 * New message could be tracked outside by using `(send)` output.
 *
 * ```ts
 * <nb-chat-form (send)="onNewMessage($event)">
 * </nb-chat-form>
 *
 * // ...
 *
 * onNewMessage({ message: string, files: any[] }) {
 *   this.service.sendToServer(message, files);
 * }
 * ```
 */
@Component({
  selector: 'nb-chat-form',
  template: `
    <div class="dropped-files" *ngIf="droppedFiles?.length">
      <ng-container *ngFor="let file of droppedFiles">
        <div *ngIf="file.urlStyle" [style.background-image]="file.urlStyle">
          <span class="remove" (click)="removeFile(file)">&times;</span>
        </div>
        <div *ngIf="!file.urlStyle">
          <nb-icon icon="file-text-outline" pack="nebular-essentials"></nb-icon>
          <span class="remove" (click)="removeFile(file)">&times;</span>
        </div>
      </ng-container>
    </div>
    <div class="quoted-message-div" *ngIf="messageQuoted">
      <nb-chat-message class="form-message-quoted"
                        [type]="'text'"
                        [message]="messageQuoted.text ? messageQuoted.text : ('This is a ' + messageQuoted.type + ' message')"
                        [reply]="false"
                        [sender]=""
                        [date]="messageQuoted.date"
                        [isAQuote]="true"
                        dateFormat="short"
      >
      </nb-chat-message>
      <nb-icon class="cancel-quote-icon" icon="close-outline" status="primary" (click)="cancelQuotedMessage()"></nb-icon>
    </div>
    <div class="message-row">
      <button nbButton
              status="basic"
              [class.with-icon]="!buttonTitle"
              (click)="fileInput.click()"
              class="attach-file-button">
        <nb-icon *ngIf="!buttonTitle; else title" icon="attach-outline" ></nb-icon>
        <ng-template #title>{{ buttonTitle }}</ng-template>
      </button>
      <input #fileInput type="file" (change)="onAttachFileFromButton($event)" hidden multiple />
      <input nbInput
             fullWidth
             [status]="getInputStatus()"
             (focus)="inputFocus = true"
             (blur)="inputFocus = false"
             (mouseenter)="inputHover = true"
             (mouseleave)="inputHover = false"
             [(ngModel)]="message"
             [class.with-button]="showButton"
             type="text"
             placeholder="{{ fileOver ? dropFilePlaceholder : messagePlaceholder }}"
             (keyup.enter)="sendMessage()">
      <button nbButton
              [status]="getButtonStatus()"
              *ngIf="showButton"
              [class.with-icon]="!buttonTitle"
              (click)="sendMessage()"
              class="send-button">
        <nb-icon *ngIf="!buttonTitle; else title" [icon]="buttonIcon" pack="nebular-essentials"></nb-icon>
        <ng-template #title>{{ buttonTitle }}</ng-template>
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NbChatFormComponent {

  status: NbComponentOrCustomStatus = 'basic';
  inputFocus: boolean = false;
  inputHover: boolean = false;

  droppedFiles: any[] = [];
  imgDropTypes = ['image/png', 'image/jpeg', 'image/gif'];

  /**
   * messageQuoted event
   * @type {string}
   */
  @Input() messageQuoted: any;

  /**
   * Predefined message text
   * @type {string}
   */
  @Input() message: string = '';

  /**
   * Message placeholder text
   * @type {string}
   */
  @Input() messagePlaceholder: string = 'Type a message';
  /**
   * Send button title
   * @type {string}
   */
  @Input() buttonTitle: string = '';

  /**
   * Send button icon, shown if `buttonTitle` is empty
   * @type {string}
   */
  @Input() buttonIcon: string = 'paper-plane-outline';

  /**
   * Show send button
   * @type {boolean}
   */
  @Input() showButton: boolean = true;

  /**
   * Show send button
   * @type {boolean}
   */
  @Input() dropFiles: boolean = false;

  /**
   * File drop placeholder text
   * @type {string}
   */
  @Input() dropFilePlaceholder: string = 'Drop file to send';

  /**
   *
   * @type {EventEmitter<{ message: string, files: File[] }>}
   */
  @Output() send = new EventEmitter<{ message: string, files: File[] }>();

  @HostBinding('class.file-over') fileOver = false;

  constructor(protected cd: ChangeDetectorRef, protected domSanitizer: DomSanitizer) {
  }

  @HostListener('drop', ['$event'])
  onDrop(event: any) {
    if (this.dropFiles) {
      event.preventDefault();
      event.stopPropagation();

      this.fileOver = false;
      if (event.dataTransfer && event.dataTransfer.files) {

        for (const file of event.dataTransfer.files) {
          const res = file;

          if (this.imgDropTypes.includes(file.type)) {
            const fr = new FileReader();
            fr.onload = (e: any) => {
              res.src = e.target.result;
              res.urlStyle = this.domSanitizer.bypassSecurityTrustStyle(`url(${res.src})`);
              this.cd.detectChanges();
            };

            fr.readAsDataURL(file);
          }
          this.droppedFiles.push(res);
        }
      }
    }
    // tslint:disable-next-line:no-console
    console.log(this.droppedFiles);
  }

  onAttachFileFromButton(event: any) {
    if (this.dropFiles) {
      this.fileOver = false;

      for (const file of event.target.files) {
        const res = file;

        if (this.imgDropTypes.includes(file.type)) {
          const fr = new FileReader();
          fr.onload = (e: any) => {
            res.src = e.target.result;
            res.urlStyle = this.domSanitizer.bypassSecurityTrustStyle(`url(${res.src})`);
            this.cd.detectChanges();
          };

          fr.readAsDataURL(file);
        }
        this.droppedFiles.push(res);
      }
    }
  }

  cancelQuotedMessage() {
    this.messageQuoted = null;
  }

  removeFile(file) {
    const index = this.droppedFiles.indexOf(file);
    if (index >= 0) {
      this.droppedFiles.splice(index, 1);
    }
  }

  @HostListener('dragover')
  onDragOver() {
    if (this.dropFiles) {
      this.fileOver = true;
    }
  }

  @HostListener('dragleave')
  onDragLeave() {
    if (this.dropFiles) {
      this.fileOver = false;
    }
  }

  sendMessage() {
    if (this.droppedFiles.length || String(this.message).trim().length) {
      this.send.emit({ message: this.message, files: this.droppedFiles });
      this.message = '';
      this.droppedFiles = [];
    }
  }

  setStatus(status: NbComponentOrCustomStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.cd.detectChanges();
    }
  }

  getInputStatus(): NbComponentOrCustomStatus {
    if (this.fileOver) {
      return this.getHighlightStatus();
    }

    if (this.inputFocus || this.inputHover) {
      return this.status;
    }

    return 'basic';
  }

  getButtonStatus(): NbComponentOrCustomStatus {
    return this.getHighlightStatus();
  }

  protected getHighlightStatus(): NbComponentOrCustomStatus {
    if (this.status === 'basic' || this.status === 'control') {
      return 'primary';
    }

    return this.status;
  }
}
