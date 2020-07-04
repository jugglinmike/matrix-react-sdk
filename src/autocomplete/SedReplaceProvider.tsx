/*
Copyright 2020 New Vector Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React from 'react';
import { _t } from '../languageHandler';
import AutocompleteProvider from './AutocompleteProvider';
import * as sdk from '../index';
import {MatrixClientPeg} from '../MatrixClientPeg';
import { MatrixEvent } from 'matrix-js-sdk';

import Room from "matrix-js-sdk/src/models/room";
import {TextualCompletion} from './Components';
import {ICompletion, ISelectionRange} from "./Autocompleter";

const SED_REGEX = /^s\/([^/]*)(?:\/(.*))?$/g;

export default class SedReplaceProvider extends AutocompleteProvider {
    room: Room;

    constructor(room: Room) {
        super(SED_REGEX);
        this.room = room;
    }

    async getCompletions(query: string, selection: ISelectionRange, force= false): Promise<ICompletion[]> {
        const {command, range} = this.getCurrentCommand(query, selection);
        console.log(query, command);
        if (!query || !command) {
            return [];
        }
        const [, needle, haystack] = command;
        const events = this.room.getLiveTimeline().getEvents();
        const currentUserId = MatrixClientPeg.get().credentials.userId;
        let draft;

        for (let index = events.length - 1; index > -1; index -= 1) {
            const event = events[index];
            if (event.sender.userId === currentUserId && event.event.type === 'm.room.message') {
                draft = new MatrixEvent(event);
                break;
            }
        }

        if (!draft) {
            return [];
        }

        const MessageEvent = sdk.getComponent('messages.MessageEvent');
        draft.event = Object.assign({}, draft.event);
        draft.event.content = Object.assign({}, draft.event.content);
        if (typeof haystack === 'string') {
            draft.event.content.body = draft.event.content.body
                .replace(needle, haystack);
        }

        const component = (
              <MessageEvent mxEvent={draft} />
        );

        return [
            {
                completion: 'Foobar',
                component,
                range,
            }
        ];
    }

    getName() {
        return _t('Edit your most recent message with a regular expression');
    }

    renderCompletions(completions: React.ReactNode[]): React.ReactNode {
        return (
            <div
                className="mx_Autocomplete_Completion_container_block"
                role="listbox"
                aria-label={_t("DuckDuckGo Results")}
            >
                { completions }
            </div>
        );
    }
}
