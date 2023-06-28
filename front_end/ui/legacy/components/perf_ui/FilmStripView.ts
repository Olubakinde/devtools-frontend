// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as Common from '../../../../core/common/common.js';
import * as Host from '../../../../core/host/host.js';
import * as i18n from '../../../../core/i18n/i18n.js';
import * as Platform from '../../../../core/platform/platform.js';
import type * as SDK from '../../../../core/sdk/sdk.js';
import * as UI from '../../legacy.js';
import * as TraceEngine from '../../../../models/trace/trace.js';

import filmStripViewStyles from './filmStripView.css.legacy.js';

const UIStrings = {
  /**
   *@description Element title in Film Strip View of the Performance panel
   */
  doubleclickToZoomImageClickTo: 'Doubleclick to zoom image. Click to view preceding requests.',
  /**
   *@description Aria label for captured screenshots in network panel.
   *@example {3ms} PH1
   */
  screenshotForSSelectToView: 'Screenshot for {PH1} - select to view preceding requests.',
  /**
   *@description Text for one or a group of screenshots
   */
  screenshot: 'Screenshot',
  /**
   *@description Prev button title in Film Strip View of the Performance panel
   */
  previousFrame: 'Previous frame',
  /**
   *@description Next button title in Film Strip View of the Performance panel
   */
  nextFrame: 'Next frame',
};
const str_ = i18n.i18n.registerUIStrings('ui/legacy/components/perf_ui/FilmStripView.ts', UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(undefined, str_);
export class FilmStripView extends Common.ObjectWrapper.eventMixin<EventTypes, typeof UI.Widget.HBox>(UI.Widget.HBox) {
  private statusLabel: HTMLElement;
  private zeroTime!: number;
  private model!: SDK.FilmStripModel.FilmStripModel;

  constructor() {
    super(true);
    this.registerRequiredCSS(filmStripViewStyles);
    this.contentElement.classList.add('film-strip-view');
    this.statusLabel = this.contentElement.createChild('div', 'label');
    this.reset();
  }

  static setImageData(imageElement: HTMLImageElement, data: string|null): void {
    if (data) {
      imageElement.src = 'data:image/jpg;base64,' + data;
    }
  }

  setModel(filmStripModel: SDK.FilmStripModel.FilmStripModel, zeroTime: number): void {
    this.model = filmStripModel;
    this.zeroTime = zeroTime;
    const frames = filmStripModel.frames();
    if (!frames.length) {
      this.reset();
      return;
    }
    this.update();
  }

  createFrameElement(frame: SDK.FilmStripModel.Frame): Promise<Element> {
    const time = frame.timestamp;
    const frameTime = i18n.TimeUtilities.millisToString(time - this.zeroTime);
    const element = document.createElement('div');
    element.classList.add('frame');
    UI.Tooltip.Tooltip.install(element, i18nString(UIStrings.doubleclickToZoomImageClickTo));
    element.createChild('div', 'time').textContent = frameTime;
    element.tabIndex = 0;
    element.setAttribute('aria-label', i18nString(UIStrings.screenshotForSSelectToView, {PH1: frameTime}));
    UI.ARIAUtils.markAsButton(element);
    const imageElement = (element.createChild('div', 'thumbnail').createChild('img') as HTMLImageElement);
    imageElement.alt = i18nString(UIStrings.screenshot);
    element.addEventListener('mousedown', this.onMouseEvent.bind(this, Events.FrameSelected, time), false);
    element.addEventListener('mouseenter', this.onMouseEvent.bind(this, Events.FrameEnter, time), false);
    element.addEventListener('mouseout', this.onMouseEvent.bind(this, Events.FrameExit, time), false);
    element.addEventListener('dblclick', this.onDoubleClick.bind(this, frame), false);
    element.addEventListener('focusin', this.onMouseEvent.bind(this, Events.FrameEnter, time), false);
    element.addEventListener('focusout', this.onMouseEvent.bind(this, Events.FrameExit, time), false);
    element.addEventListener('keydown', event => {
      if (event.code === 'Enter' || event.code === 'Space') {
        this.onMouseEvent(Events.FrameSelected, time);
      }
    });

    return frame.imageDataPromise().then(FilmStripView.setImageData.bind(null, imageElement)).then(returnElement);
    function returnElement(): Element {
      return element;
    }
  }

  frameByTime(time: number): SDK.FilmStripModel.Frame {
    function comparator(time: number, frame: SDK.FilmStripModel.Frame): number {
      return time - frame.timestamp;
    }
    // Using the first frame to fill the interval between recording start
    // and a moment the frame is taken.
    const frames = this.model.frames();
    const index = Math.max(Platform.ArrayUtilities.upperBound(frames, time, comparator) - 1, 0);
    return frames[index];
  }

  update(): void {
    if (!this.model) {
      return;
    }
    const frames = this.model.frames();
    if (!frames.length) {
      return;
    }

    function appendElements(this: FilmStripView, elements: Element[]): void {
      this.contentElement.removeChildren();
      for (let i = 0; i < elements.length; ++i) {
        this.contentElement.appendChild(elements[i]);
      }
    }
    void Promise.all(frames.map(this.createFrameElement.bind(this))).then(appendElements.bind(this));
  }

  private onMouseEvent(eventName: string|symbol, timestamp: number): void {
    // TODO(crbug.com/1228674): Use type-safe event dispatch and remove <any>.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.dispatchEventToListeners<any>(eventName, timestamp);
  }

  private onDoubleClick(filmStripFrame: SDK.FilmStripModel.Frame): void {
    Dialog.fromSDKFrame(filmStripFrame, TraceEngine.Types.Timing.MilliSeconds(this.zeroTime));
  }

  reset(): void {
    this.zeroTime = 0;
    this.contentElement.removeChildren();
    this.contentElement.appendChild(this.statusLabel);
  }

  setStatusText(text: string): void {
    this.statusLabel.textContent = text;
  }
}

// TODO(crbug.com/1167717): Make this a const enum again
// eslint-disable-next-line rulesdir/const_enum
export enum Events {
  FrameSelected = 'FrameSelected',
  FrameEnter = 'FrameEnter',
  FrameExit = 'FrameExit',
}

export type EventTypes = {
  [Events.FrameSelected]: number,
  [Events.FrameEnter]: number,
  [Events.FrameExit]: number,
};

interface DialogSDKData {
  source: 'SDK';
  frames: readonly SDK.FilmStripModel.Frame[];
  index: number;
  zeroTime: TraceEngine.Types.Timing.MilliSeconds;
}

interface DialogTraceEngineData {
  source: 'TraceEngine';
  index: number;
  zeroTime: TraceEngine.Types.Timing.MilliSeconds;
  frames: readonly TraceEngine.Extras.FilmStrip.FilmStripFrame[];
}

export class Dialog {
  private fragment: UI.Fragment.Fragment;
  private readonly widget: UI.XWidget.XWidget;
  private index: number;
  private dialog: UI.Dialog.Dialog|null = null;

  #data: DialogSDKData|DialogTraceEngineData;

  static fromSDKFrame(frame: SDK.FilmStripModel.Frame, zeroTime?: TraceEngine.Types.Timing.MilliSeconds): Dialog {
    const data: DialogSDKData = {
      source: 'SDK',
      frames: frame.model().frames(),
      index: frame.index,
      zeroTime: zeroTime || TraceEngine.Types.Timing.MilliSeconds(frame.model().zeroTime()),
    };

    return new Dialog(data);
  }

  static fromFilmStrip(filmStrip: TraceEngine.Extras.FilmStrip.FilmStripData, selectedFrameIndex: number): Dialog {
    const data: DialogTraceEngineData = {
      source: 'TraceEngine',
      frames: filmStrip.frames,
      index: selectedFrameIndex,
      zeroTime: TraceEngine.Helpers.Timing.microSecondsToMilliseconds(filmStrip.zeroTime),
    };
    return new Dialog(data);
  }

  private constructor(data: DialogSDKData|DialogTraceEngineData) {
    this.#data = data;
    this.index = data.index;
    const prevButton = UI.UIUtils.createTextButton('\u25C0', this.onPrevFrame.bind(this));
    UI.Tooltip.Tooltip.install(prevButton, i18nString(UIStrings.previousFrame));
    const nextButton = UI.UIUtils.createTextButton('\u25B6', this.onNextFrame.bind(this));
    UI.Tooltip.Tooltip.install(nextButton, i18nString(UIStrings.nextFrame));
    this.fragment = UI.Fragment.Fragment.build`
      <x-widget flex=none margin=12px>
        <x-hbox overflow=auto border='1px solid #ddd'>
          <img $='image' data-film-strip-dialog-img style="max-height: 80vh; max-width: 80vw;"></img>
        </x-hbox>
        <x-hbox x-center justify-content=center margin-top=10px>
          ${prevButton}
          <x-hbox $='time' margin=8px></x-hbox>
          ${nextButton}
        </x-hbox>
      </x-widget>
    `;
    this.widget = (this.fragment.element() as UI.XWidget.XWidget);
    (this.widget as HTMLElement).tabIndex = 0;
    this.widget.addEventListener('keydown', this.keyDown.bind(this), false);
    this.dialog = null;

    void this.render();
  }

  hide(): void {
    if (this.dialog) {
      this.dialog.hide();
    }
  }

  #framesCount(): number {
    return this.#data.frames.length;
  }

  #zeroTime(): TraceEngine.Types.Timing.MilliSeconds {
    return this.#data.zeroTime;
  }

  private resize(): void {
    if (!this.dialog) {
      this.dialog = new UI.Dialog.Dialog();
      this.dialog.contentElement.appendChild(this.widget);
      this.dialog.setDefaultFocusedElement(this.widget);
      this.dialog.show();
    }
    this.dialog.setSizeBehavior(UI.GlassPane.SizeBehavior.MeasureContent);
  }

  private keyDown(event: Event): void {
    const keyboardEvent = (event as KeyboardEvent);
    switch (keyboardEvent.key) {
      case 'ArrowLeft':
        if (Host.Platform.isMac() && keyboardEvent.metaKey) {
          this.onFirstFrame();
        } else {
          this.onPrevFrame();
        }
        break;

      case 'ArrowRight':
        if (Host.Platform.isMac() && keyboardEvent.metaKey) {
          this.onLastFrame();
        } else {
          this.onNextFrame();
        }
        break;

      case 'Home':
        this.onFirstFrame();
        break;

      case 'End':
        this.onLastFrame();
        break;
    }
  }

  private onPrevFrame(): void {
    if (this.index > 0) {
      --this.index;
    }
    void this.render();
  }

  private onNextFrame(): void {
    if (this.index < this.#framesCount() - 1) {
      ++this.index;
    }
    void this.render();
  }

  private onFirstFrame(): void {
    this.index = 0;
    void this.render();
  }

  private onLastFrame(): void {
    this.index = this.#framesCount() - 1;
    void this.render();
  }

  async #currentFrameData(): Promise<{snapshot: string, timestamp: TraceEngine.Types.Timing.MilliSeconds}> {
    if (this.#data.source === 'SDK') {
      const frame = this.#data.frames[this.index];
      const snapshot = await frame.imageDataPromise();
      return {
        timestamp: TraceEngine.Types.Timing.MilliSeconds(frame.timestamp),
        snapshot: snapshot || '',
      };
    }
    const frame = this.#data.frames[this.index];
    return {
      snapshot: frame.screenshotAsString,
      timestamp: TraceEngine.Helpers.Timing.microSecondsToMilliseconds(frame.screenshotEvent.ts),
    };
  }

  private async render(): Promise<void> {
    const currentFrameData = await this.#currentFrameData();
    this.fragment.$('time').textContent =
        i18n.TimeUtilities.millisToString(currentFrameData.timestamp - this.#zeroTime());
    const image = (this.fragment.$('image') as HTMLImageElement);
    image.setAttribute('data-frame-index', this.index.toString());
    FilmStripView.setImageData(image, currentFrameData.snapshot);
    this.resize();
  }
}
