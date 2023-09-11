// Copyright 2023 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
import * as Platform from '../../core/platform/platform.js';

import type * as Handlers from './handlers/handlers.js';
import type * as Types from './types/types.js';

type EntryToNodeMap = Map<Types.TraceEvents.RendererEntry, Handlers.ModelHandlers.Renderer.RendererEntryNode>;

export interface UserTreeAction {
  type: 'MERGE_FUNCTION'|'COLLAPSE_FUNCTION';
  entry: Types.TraceEvents.RendererEntry;
}

/**
 * This class can take in a thread that has been generated by the
 * RendererHandler and apply certain actions to it in order to modify what is
 * shown to the user. These actions can be automatically applied by DevTools or
 * applied by the user.
 *
 * Once actions are applied, the visibleEntries() method will return only the
 * entries that are still visible, and this is the list of entries that can
 * then be used to render the resulting thread on the timeline.
 **/
export class TreeManipulator {
  readonly #thread: Handlers.ModelHandlers.Renderer.RendererThread;
  // Maps from an individual TraceEvent entry to its representation as a
  // RendererEntryNode. We need this so we can then parse the tree structure
  // generated by the RendererHandler.
  #entryToNode: EntryToNodeMap;

  // Track the last calculated set of visible entries. This means we can avoid
  // re-generating this if the set of actions that have been applied has not
  // changed.
  #lastVisibleEntries: readonly Types.TraceEvents.RendererEntry[]|null = null;
  #activeActions: UserTreeAction[] = [];

  constructor(
      thread: Handlers.ModelHandlers.Renderer.RendererThread,
      entryToNode: EntryToNodeMap,
  ) {
    this.#thread = thread;
    this.#entryToNode = entryToNode;
  }

  /**
   * Applies an action to the visible tree. This will also clear the cache of
   * visible entries, ensuring that it will be recalculated with the latest set
   * of actions.
   **/
  applyAction(action: UserTreeAction): void {
    if (this.#actionIsActive(action)) {
      // If the action is already active there is no reason to apply it again.
      return;
    }

    this.#activeActions.push(action);
    // Clear the last list of visible entries - this invalidates the cache and
    // ensures that the visible list will be recalculated, which we have to do
    // now we have changed the list of actions.
    this.#lastVisibleEntries = null;
  }

  /**
   * Removes a matching action, if one is found, from the active actions set.
   * Note that we do not match on action equality and instead search through
   * the set of active actions for one that is of the same type, and has the
   * same entry associated with it.
   *
   * This is a no-op if the action is not active.
   **/
  removeActiveAction(action: UserTreeAction): void {
    let removedAction = false;
    this.#activeActions = this.#activeActions.filter(activeAction => {
      if (activeAction.type === action.type && activeAction.entry === action.entry) {
        removedAction = true;
        return false;
      }
      return true;
    });

    if (removedAction) {
      // If we found and removed an action, we need to clear the cache to force
      // the set of visible entries to be recalculcated.
      this.#lastVisibleEntries = null;
    }
  }

  #actionIsActive(action: UserTreeAction): boolean {
    return this.#activeActions.some(activeAction => {
      return action.entry === activeAction.entry && action.type === activeAction.type;
    });
  }

  /**
   * The set of entries that are visible given the set of applied actions. If
   * no actions are applied, this will return all entries in the thread.
   *
   * This method is cached, so it is safe to call multiple times.
   **/
  visibleEntries(): readonly Types.TraceEvents.TraceEventData[] {
    if (this.#activeActions.length === 0) {
      return this.#thread.entries;
    }
    return this.#calculateVisibleEntries();
  }

  #calculateVisibleEntries(): readonly Types.TraceEvents.TraceEventData[] {
    // When an action is added, we clear this cache. So if this cache is
    // present it means that the set of active actions has not changed, and so
    // we do not need to recalculate anything.
    if (this.#lastVisibleEntries) {
      return this.#lastVisibleEntries;
    }

    if (!this.#thread.tree) {
      // We need a tree to be able to calculate user actions, if we do not have
      // it, just return all the entries.
      return this.#thread.entries;
    }

    // We apply each user action in turn to the set of all entries, and mark
    // any that should be hidden by adding them to this set. We do this to
    // ensure we minimise the amount of passes through the list of all entries.
    // Another approach would be to use splice() to remove items from the
    // array, but doing this would be a mutation of the arry for every hidden
    // event. Instead, we add entries to this set, and at the very end loop
    // through the entries array once to filter out any that should be hidden.
    const entriesToHide = new Set<Types.TraceEvents.RendererEntry>();

    const entries = [...this.#thread.entries];
    for (const action of this.#activeActions) {
      switch (action.type) {
        case 'MERGE_FUNCTION': {
          // The entry that was clicked on is merged into its parent. All its
          // children remain visible, so we just have to hide the entry that was
          // selected.
          entriesToHide.add(action.entry);
          break;
        }

        case 'COLLAPSE_FUNCTION': {
          // The entry itself remains visible, but all of its ancestors are hidden.
          const entryNode = this.#entryToNode.get(action.entry);
          if (!entryNode) {
            // Invalid node was given, just ignore and move on.
            continue;
          }
          const allAncestors = this.#findAllAncestorsOfNode(this.#thread.tree, entryNode);
          allAncestors.forEach(ancestor => entriesToHide.add(ancestor));
          break;
        }
        default:
          Platform.assertNever(action.type, `Unknown TreeManipulator action: ${action.type}`);
      }
    }

    // Now we have applied all actions, loop through the list of entries and
    // remove any that are marked as hidden.
    // We cache this under lastVisibleEntries - if this function is called
    // again and the user actions have not changed, we can avoid recalculating
    // this and just return the last one. This cache is automatically cleared
    // when the user actions are changed.
    this.#lastVisibleEntries = entries.filter(entry => {
      return entriesToHide.has(entry) === false;
    });

    return this.#lastVisibleEntries;
  }

  #findAllAncestorsOfNode(
      tree: Handlers.ModelHandlers.Renderer.RendererTree,
      root: Handlers.ModelHandlers.Renderer.RendererEntryNode): Types.TraceEvents.RendererEntry[] {
    const ancestors: Types.TraceEvents.RendererEntry[] = [];

    // Walk through all the ancestors, starting at the root node.
    const childIds: Handlers.ModelHandlers.Renderer.RendererEntryNodeId[] = Array.from(root.childrenIds);
    while (childIds.length > 0) {
      const id = childIds.shift();
      if (!id) {
        break;
      }
      const childNode = tree.nodes.get(id);
      if (childNode) {
        ancestors.push(childNode.entry);
        const newChildIds = Array.from(childNode.childrenIds);
        childIds.push(...newChildIds);
      }
    }

    return ancestors;
  }
}
