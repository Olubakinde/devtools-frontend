// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Utils from './utils/utils.js';

let iconConstructor: (() => Element)|null = null;

export class Icon extends HTMLSpanElement {
  private descriptor: Descriptor|null;
  private spriteSheet: SpriteSheet|null;
  private iconType: string;
  constructor() {
    super();
    this.descriptor = null;
    this.spriteSheet = null;
    this.iconType = '';
  }

  static create(iconType?: string, className?: string): Icon {
    if (!iconConstructor) {
      iconConstructor = Utils.registerCustomElement('span', 'ui-icon', Icon);
    }

    const icon = (iconConstructor() as Icon);
    if (className) {
      icon.className = className;
    }
    if (iconType) {
      icon.setIconType(iconType);
    }
    return icon;
  }

  setIconType(iconType: string): void {
    if (this.descriptor) {
      this.style.removeProperty('--spritesheet-position');
      this.style.removeProperty('width');
      this.style.removeProperty('height');
      this.toggleClasses(false);
      this.iconType = '';
      this.descriptor = null;
      this.spriteSheet = null;
    }
    const descriptor = descriptors.get(iconType) || null;
    if (descriptor) {
      this.iconType = iconType;
      this.descriptor = descriptor;
      this.spriteSheet = spriteSheets.get(this.descriptor.spritesheet) || null;
      if (!this.spriteSheet) {
        throw new Error(`ERROR: icon ${this.iconType} has unknown spritesheet: ${this.descriptor.spritesheet}`);
      }
      this.style.setProperty('--spritesheet-position', this.propertyValue());
      this.style.setProperty('width', this.spriteSheet.cellWidth + 'px');
      this.style.setProperty('height', this.spriteSheet.cellHeight + 'px');
      this.toggleClasses(true);
    } else if (iconType) {
      throw new Error(`ERROR: failed to find icon descriptor for type: ${iconType}`);
    }
  }

  private toggleClasses(value: boolean): void {
    if (this.descriptor) {
      this.classList.toggle('spritesheet-' + this.descriptor.spritesheet, value);
      this.classList.toggle(this.iconType, value);
      this.classList.toggle('icon-mask', value && Boolean(this.descriptor.isMask));
      this.classList.toggle('icon-invert', value && Boolean(this.descriptor.invert));
    }
  }

  private propertyValue(): string {
    if (!this.descriptor || !this.spriteSheet) {
      throw new Error('Descriptor and spriteSheet expected to be present');
    }
    if (!this.descriptor.coordinates) {
      if (!this.descriptor.position || !_positionRegex.test(this.descriptor.position)) {
        throw new Error(`ERROR: icon '${this.iconType}' has malformed position: '${this.descriptor.position}'`);
      }
      const column = this.descriptor.position[0].toLowerCase().charCodeAt(0) - 97;
      const row = parseInt(this.descriptor.position.substring(1), 10) - 1;
      this.descriptor.coordinates = {
        x: -(this.spriteSheet.cellWidth + this.spriteSheet.padding) * column,
        y: (this.spriteSheet.cellHeight + this.spriteSheet.padding) * (row + 1) - this.spriteSheet.padding,
      };
    }
    return `${this.descriptor.coordinates.x}px ${this.descriptor.coordinates.y}px`;
  }
}

// TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
// eslint-disable-next-line @typescript-eslint/naming-convention
const _positionRegex = /^[a-z][1-9][0-9]*$/;

const spriteSheets = new Map<string, SpriteSheet>([
  ['smallicons', {cellWidth: 10, cellHeight: 10, padding: 10}],
  ['mediumicons', {cellWidth: 16, cellHeight: 16, padding: 0}],
  ['largeicons', {cellWidth: 28, cellHeight: 24, padding: 0}],
  ['arrowicons', {cellWidth: 19, cellHeight: 19, padding: 0}],

  ['bottom-panel-close', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['bottom-panel-open', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['chevron-double-right', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['cross', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['database', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['devices', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['dots-vertical', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['gear', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['left-panel-close', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['left-panel-open', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['pause', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['resume', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['right-panel-close', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['right-panel-open', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['select-element', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['step-into', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['step-out', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['step-over', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['step', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['table', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['top-panel-close', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['top-panel-open', {cellWidth: 20, cellHeight: 20, padding: 0}],
  ['triangle-down', {cellWidth: 14, cellHeight: 14, padding: 0}],
  ['triangle-right', {cellWidth: 14, cellHeight: 14, padding: 0}],
]);

const initialDescriptors = new Map<string, Descriptor>([
  ['smallicon-bezier', {position: 'a5', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-checkmark', {position: 'b5', spritesheet: 'smallicons'}],
  ['smallicon-checkmark-square', {position: 'b6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-checkmark-behind', {position: 'd6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-command-result', {position: 'a4', spritesheet: 'smallicons'}],
  ['smallicon-contrast-ratio', {position: 'a6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-cross', {position: 'b4', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-device', {position: 'c5', spritesheet: 'smallicons'}],
  ['smallicon-error', {position: 'c4', spritesheet: 'smallicons'}],
  ['smallicon-expand-less', {position: 'f5', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-expand-more', {position: 'e6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-green-arrow', {position: 'a3', spritesheet: 'smallicons'}],
  ['smallicon-green-ball', {position: 'b3', spritesheet: 'smallicons'}],
  ['smallicon-info', {position: 'c3', spritesheet: 'smallicons'}],
  ['smallicon-inline-breakpoint-conditional', {position: 'd4', spritesheet: 'smallicons'}],
  ['smallicon-inline-breakpoint', {position: 'd5', spritesheet: 'smallicons'}],
  ['smallicon-no', {position: 'c6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-orange-ball', {position: 'd3', spritesheet: 'smallicons'}],
  ['smallicon-red-ball', {position: 'a2', spritesheet: 'smallicons'}],
  ['smallicon-shadow', {position: 'b2', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-step-in', {position: 'c2', spritesheet: 'smallicons'}],
  ['smallicon-step-out', {position: 'd2', spritesheet: 'smallicons'}],
  ['smallicon-text-prompt', {position: 'e5', spritesheet: 'smallicons'}],
  ['smallicon-thick-left-arrow', {position: 'e4', spritesheet: 'smallicons'}],
  ['smallicon-thick-right-arrow', {position: 'e3', spritesheet: 'smallicons'}],
  ['smallicon-triangle-down', {position: 'e2', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-triangle-right', {position: 'a1', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-triangle-up', {position: 'b1', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-user-command', {position: 'c1', spritesheet: 'smallicons'}],
  ['smallicon-warning', {position: 'd1', spritesheet: 'smallicons'}],
  ['smallicon-network-product', {position: 'e1', spritesheet: 'smallicons'}],
  ['smallicon-clear-warning', {position: 'f1', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-clear-info', {position: 'f2', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-clear-error', {position: 'f3', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-account-circle', {position: 'f4', spritesheet: 'smallicons'}],
  ['smallicon-videoplayer-paused', {position: 'f6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-videoplayer-playing', {position: 'g6', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-videoplayer-destroyed', {position: 'g5', spritesheet: 'smallicons', isMask: true}],
  ['smallicon-issue-yellow-text', {position: 'g1', spritesheet: 'smallicons'}],
  ['smallicon-issue-blue-text', {position: 'g2', spritesheet: 'smallicons'}],

  ['mediumicon-clear-storage', {position: 'a4', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-cookie', {position: 'b4', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-info', {position: 'c1', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-manifest', {position: 'd4', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-service-worker', {position: 'a3', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-arrow-in-circle', {position: 'c3', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-file-sync', {position: 'd3', spritesheet: 'mediumicons', invert: true}],
  ['mediumicon-file', {position: 'a2', spritesheet: 'mediumicons', invert: true}],
  ['mediumicon-gray-cross-active', {position: 'b2', spritesheet: 'mediumicons'}],
  ['mediumicon-gray-cross-hover', {position: 'c2', spritesheet: 'mediumicons'}],
  ['mediumicon-red-cross-active', {position: 'd2', spritesheet: 'mediumicons'}],
  ['mediumicon-red-cross-hover', {position: 'a1', spritesheet: 'mediumicons'}],
  ['mediumicon-search', {position: 'b1', spritesheet: 'mediumicons'}],
  ['mediumicon-replace', {position: 'c5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-account-circle', {position: 'e4', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-warning-triangle', {position: 'e1', spritesheet: 'mediumicons'}],
  ['mediumicon-error-circle', {position: 'e3', spritesheet: 'mediumicons'}],
  ['mediumicon-info-circle', {position: 'e2', spritesheet: 'mediumicons'}],
  ['mediumicon-bug', {position: 'd1', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-list', {position: 'e5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-warning', {position: 'd5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-sync', {position: 'a5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-fetch', {position: 'b5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-cloud', {position: 'a6', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-bell', {position: 'b6', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-payment', {position: 'c6', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-schedule', {position: 'd6', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-frame', {position: 'e6', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-frame-embedded', {position: 'f6', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-frame-opened', {position: 'f5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-frame-embedded-blocked', {position: 'f4', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-frame-blocked', {position: 'g4', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-elements-panel', {position: 'f3', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-network-panel', {position: 'f2', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-sources-panel', {position: 'g1', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-frame-top', {position: 'f1', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-checkmark', {position: 'g2', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-not-available', {position: 'g3', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-warning-circle', {position: 'g5', spritesheet: 'mediumicons', isMask: true}],
  ['mediumicon-feedback', {position: 'g6', spritesheet: 'mediumicons', isMask: true}],

  ['badge-navigator-file-sync', {position: 'a9', spritesheet: 'largeicons'}],
  ['largeicon-add', {position: 'a8', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-camera', {position: 'b7', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-center', {position: 'c9', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-checkmark', {position: 'c8', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-clear', {position: 'a6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-copy', {position: 'b6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-deactivate-breakpoints', {position: 'c6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-delete', {position: 'd9', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-delete-filter', {position: 'i5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-delete-list', {position: 'i6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-dock-to-bottom', {position: 'd8', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-dock-to-left', {position: 'd7', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-dock-to-right', {position: 'd6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-download', {position: 'h6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-edit', {position: 'a5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-eyedropper', {position: 'b5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-filter', {position: 'c5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-font-editor', {position: 'i7', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-large-list', {position: 'e5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-layout-editor', {position: 'a4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-load', {position: 'h5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-longclick-triangle', {position: 'b4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-menu', {position: 'c4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-domain', {position: 'd4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-file', {position: 'e4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-file-sync', {position: 'f9', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-folder', {position: 'f8', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-frame', {position: 'f7', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-snippet', {position: 'f6', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-navigator-worker', {position: 'f5', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-pan', {position: 'a3', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-pause-animation', {position: 'b3', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-pause-on-exceptions', {position: 'd3', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-phone', {position: 'e3', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-play-animation', {position: 'f3', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-play-back', {position: 'a2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-play', {position: 'b2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-pretty-print', {position: 'c2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-refresh', {position: 'd2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-replay-animation', {position: 'e2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-rotate', {position: 'g9', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-rotate-screen', {position: 'g8', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-search', {position: 'h4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-settings-gear', {position: 'g7', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-shortcut-changed', {position: 'i4', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-start-recording', {position: 'g2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-stop-recording', {position: 'd1', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-terminate-execution', {position: 'h2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-trash-bin', {position: 'f1', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-undo', {position: 'h7', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-undock', {position: 'g1', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-visibility', {position: 'h9', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-waterfall', {position: 'h8', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-breaking-change', {position: 'h3', spritesheet: 'largeicons'}],
  ['largeicon-link', {position: 'i1', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-dual-screen', {position: 'i2', spritesheet: 'largeicons', isMask: true}],
  ['largeicon-experimental-api', {position: 'i3', spritesheet: 'largeicons', isMask: true}],

  ['mediumicon-arrow-top', {position: 'a4', spritesheet: 'arrowicons'}],
  ['mediumicon-arrow-bottom', {position: 'a3', spritesheet: 'arrowicons'}],
  ['mediumicon-arrow-left', {position: 'a2', spritesheet: 'arrowicons'}],
  ['mediumicon-arrow-right', {position: 'a1', spritesheet: 'arrowicons'}],

  ['bottom-panel-close', {position: 'a1', spritesheet: 'bottom-panel-close', isMask: true}],
  ['bottom-panel-open', {position: 'a1', spritesheet: 'bottom-panel-open', isMask: true}],
  ['chevron-double-right', {position: 'a1', spritesheet: 'chevron-double-right', isMask: true}],
  ['cross', {position: 'a1', spritesheet: 'cross', isMask: true}],
  ['database', {position: 'a1', spritesheet: 'database', isMask: true}],
  ['devices', {position: 'a1', spritesheet: 'devices', isMask: true}],
  ['dots-vertical', {position: 'a1', spritesheet: 'dots-vertical', isMask: true}],
  ['gear', {position: 'a1', spritesheet: 'gear', isMask: true}],
  ['left-panel-close', {position: 'a1', spritesheet: 'left-panel-close', isMask: true}],
  ['left-panel-open', {position: 'a1', spritesheet: 'left-panel-open', isMask: true}],
  ['pause', {position: 'a1', spritesheet: 'pause', isMask: true}],
  ['resume', {position: 'a1', spritesheet: 'resume', isMask: true}],
  ['right-panel-close', {position: 'a1', spritesheet: 'right-panel-close', isMask: true}],
  ['right-panel-open', {position: 'a1', spritesheet: 'right-panel-open', isMask: true}],
  ['step-into', {position: 'a1', spritesheet: 'step-into', isMask: true}],
  ['step-out', {position: 'a1', spritesheet: 'step-out', isMask: true}],
  ['step-over', {position: 'a1', spritesheet: 'step-over', isMask: true}],
  ['step', {position: 'a1', spritesheet: 'step', isMask: true}],
  ['select-element', {position: 'a1', spritesheet: 'select-element', isMask: true}],
  ['table', {position: 'a1', spritesheet: 'table', isMask: true}],
  ['top-panel-close', {position: 'a1', spritesheet: 'top-panel-close', isMask: true}],
  ['top-panel-open', {position: 'a1', spritesheet: 'top-panel-open', isMask: true}],
  ['triangle-down', {position: 'a1', spritesheet: 'triangle-down', isMask: true}],
  ['triangle-right', {position: 'a1', spritesheet: 'triangle-right', isMask: true}],
]);

const descriptors = (initialDescriptors as Map<string, Descriptor>);
export interface Descriptor {
  position: string;
  spritesheet: string;
  isMask?: boolean;
  coordinates?: {
    x: number,
    y: number,
  };
  invert?: boolean;
}
export interface SpriteSheet {
  cellWidth: number;
  cellHeight: number;
  padding: number;
}
