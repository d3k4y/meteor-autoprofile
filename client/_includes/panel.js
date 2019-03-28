/* eslint-disable consistent-return */
import {Template} from "meteor/templating";
import {_} from "meteor/erasaur:meteor-lodash";
import {SimpleSchemaFunctions} from "meteor/d3k4y:meteor-simple-schema-functions";

import {getOptions, getTemplate} from "./_api";


Template.autoProfilePanel.helpers({
    cardOrPanel() {
        return 'card' || 'panel';
    },
    headerOrHeading() {
        return 'header' || 'heading';
    },
    panelTitle() {
        const profileOptions = getOptions(Template.instance());
        if (this.title) {
            return this.title;
        }
        if (this.field) {
            return _.get(SimpleSchemaFunctions.getFieldSchema(profileOptions.collection, this.field.id), 'label');
        }
    },
    getTemplate() {
        return getTemplate(Template.instance(), this);
    },
    doShowLoadingSpinner() {
        return Template.instance().data.showLoadingSpinner();
    }
});
